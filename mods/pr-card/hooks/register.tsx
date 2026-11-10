import { atom, read, update } from 'claude-code'
import type { EngineInterface, RenderElement, Register } from 'claude-code'

import { biggestFirst, factsOf, noteOf, shortName, stateOf, withCi } from './card-facts'
import { cardSvg } from './card-svg'
import { setLang } from './kit/lang'
import { pinned } from './kit/pin'
import { VIEW_FIELDS, isPrCall, outputText, prRefOf, viewOf } from './parse'
import type { PrRef } from './parse'
import { words } from './words'
import type { PrEntry, PrView, SharedCi } from '../types'

const prsAtom = atom({ plugin: 'pr-card', key: 'prs' } as const, {} as Record<string, PrEntry>)
const ciRef = { plugin: 'test-badge', key: 'ci' } as const

// One `gh pr view` when a PR is first seen, and again only on a press: test-badge's CI watch is the one poller of
// a PR's checks, and the terminal card reads its answers through $.state. The desktop card needs no checks at all.

const GH_ENV = { GH_PROMPT_DISABLED: '1', GH_NO_UPDATE_NOTIFIER: '1', NO_COLOR: '1' }
const GH_TIMEOUT_MS = 20_000

const live = { asking: new Set<string>() }

const debug = ($: EngineInterface, text: string) => $.ui.log(`pr-card: ${text}`, { to: 'debug' })

async function gh($: EngineInterface, selector: string[]) {
  const argv = ['gh', 'pr', 'view', ...selector, '--json', VIEW_FIELDS]

  return $.process.run(argv, { cwd: await $.session.cwd(), env: GH_ENV, timeoutMs: GH_TIMEOUT_MS }).catch(() => null)
}

async function ask($: EngineInterface, url: string): Promise<Pick<PrEntry, 'view' | 'problem'>> {
  const run = await gh($, [url])
  if (run === null) return { view: null, problem: 'no-gh' }
  const view = run.exitCode === 0 ? viewOf(run.stdout) : null

  return { view, problem: view === null ? 'failed' : null }
}

async function refresh($: EngineInterface, url: string): Promise<void> {
  if (live.asking.has(url)) return
  live.asking.add(url)
  try {
    const got = await ask($, url)
    const now = await $.clock.now()
    await update($, prsAtom, prs => {
      const entry = prs[url]
      if (entry === undefined) return prs

      return { ...prs, [url]: { ...entry, view: got.view ?? entry.view, problem: got.problem, checkedAt: got.view === null ? entry.checkedAt : now } }
    })
  } finally {
    live.asking.delete(url)
  }
}

async function track($: EngineInterface, ref: PrRef, callId: string | undefined): Promise<void> {
  const entry: PrEntry = { ...ref, callId: callId ?? null, view: null, problem: null, checkedAt: null }
  await update($, prsAtom, prs => (prs[ref.url] === undefined ? { ...prs, [ref.url]: entry } : prs))
  await refresh($, ref.url)
}

// The branch's open PR, at the start and on a resume: a run that opened it earlier draws its card again.
// Quiet where the folder is no repo, the branch has no PR, or gh is missing.
async function pickUp($: EngineInterface): Promise<void> {
  const run = await gh($, [])
  if (run === null || run.exitCode !== 0) return
  const view = viewOf(run.stdout)
  const ref = prRefOf(run.stdout)
  if (view === null || ref === null || view.state !== 'open') return
  const entry: PrEntry = { ...ref, callId: null, view, problem: null, checkedAt: await $.clock.now() }
  await update($, prsAtom, prs => (prs[ref.url] === undefined ? { ...prs, [ref.url]: entry } : prs))
}

const pickUpQuietly = ($: EngineInterface): void => void pickUp($).catch(error => debug($, `could not look for the branch's PR (${String(error)})`))

async function sharedCi($: EngineInterface): Promise<SharedCi | null> {
  try {
    return (await $.state.get(ciRef)).value ?? null
  } catch {
    // test-badge is not installed, or its value is unreadable: pr-card's own read stands.
    return null
  }
}

const CARD_MAX_PX = 560
const CARD_MIN_PX = 320
const PX_PER_COLUMN = 8
const TERMINAL_FILES = 5
type Site = { surface: string; viewport?: { columns?: number } }

// A hook above may have changed a call's output, so the PR's link is read back from what is drawn.
const urlsOf = (calls: readonly { tool: string; input: unknown; output?: unknown }[]): string[] =>
  calls.flatMap(call => {
    const ref = isPrCall(call.tool, call.input) ? prRefOf(outputText(call.output)) : null

    return ref === null ? [] : [ref.url]
  })

const widthOf = (site: Site): number =>
  Math.max(CARD_MIN_PX, Math.min(CARD_MAX_PX, (site.viewport?.columns ?? CARD_MAX_PX) * PX_PER_COLUMN))

function terminalCard(Text: any, Box: any, entry: PrEntry, now: number): RenderElement {
  const state = stateOf(entry.view)
  const view = entry.view
  const note = noteOf(entry, now)
  const files = view === null ? [] : biggestFirst(view).slice(0, TERMINAL_FILES).map(file => shortName(file.path))

  return (
    <Box key={`t-${entry.url}`} flexDirection="column">
      <Text bold>{state.text} {entry.repo} #{entry.number}{view === null ? '' : ` · ${view.title}`}</Text>
      {view === null ? null : <Text dimColor>{factsOf(view).map(fact => `${fact.label}: ${fact.value}`).join(' · ')}</Text>}
      {view === null || view.checks.failing.length === 0 ? null : <Text color="error">{words().failingLabel}: {view.checks.failing.join(' · ')}</Text>}
      {files.length === 0 || view === null ? null : <Text dimColor>{words().files(view.changedFiles)} +{view.additions} −{view.deletions}: {files.join(' · ')}</Text>}
      {note === null ? null : <Text dimColor>{note}</Text>}
    </Box>
  )
}

// The desktop app's own PR pane already shows state, checks, review and merge: there a card is drawn only once
// gh has told the files, the one thing that pane lacks.
async function entriesOf($: EngineInterface, urls: string[], isDesktop: boolean): Promise<PrEntry[]> {
  const prs = await read($, prsAtom)
  const ci = isDesktop ? null : await sharedCi($)
  const known = urls.flatMap(url => (prs[url] === undefined ? [] : [withCi(prs[url], ci)]))

  return isDesktop ? known.filter(entry => entry.view !== null) : known
}

function desktopCard(ui: any, $: EngineInterface, card: { entry: PrEntry & { view: PrView }; now: number; width: number }): RenderElement {
  const { Box, Button, Svg } = ui
  const { entry } = card

  return (
    <Box key={`c-${entry.url}`} flexDirection="column" gap={1}>
      <Svg key={`p-${entry.url}`} {...cardSvg(entry, { now: card.now, width: card.width })} />
      <Box flexDirection="row">
        <Button key={`r-${entry.url}`} label={words().refresh} plain dimColor onPress={() => void refresh($, entry.url)} />
      </Box>
    </Box>
  )
}

async function drawn($: any, e: any, urls: string[], under: RenderElement): Promise<RenderElement> {
  const isDesktop = e.surface === 'desktop'
  const entries = await entriesOf($, urls, isDesktop)
  if (entries.length === 0) return under
  const ui = $.ui.resolve(e)
  const now = await $.clock.now()
  const cards = entries.map(entry => (isDesktop && entry.view !== null
    ? desktopCard(ui, $, { entry: { ...entry, view: entry.view }, now, width: widthOf(e) })
    : terminalCard(ui.Text, ui.Box, entry, now)))

  return pinned(e, <ui.Box flexDirection="column" gap={1}>{under}{cards}</ui.Box>)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    setLang(await $.env.get('MODZ_LANG'))
    pickUpQuietly($)

    return result
  })

  on('classic.SessionStart', async ($, e, next) => {
    if (e.source === 'resume') pickUpQuietly($)

    return next(e)
  }).catch(($, e, next) => next(e))

  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    if (result.deny !== undefined || result.isError === true || !isPrCall(String(e.tool), e)) return result
    const ref = prRefOf(`${result.text ?? ''}\n${outputText(result.result)}`)
    if (ref !== null) void track($, ref, e.tool_use_id).catch(error => debug($, `could not read the PR (${String(error)})`))

    return result
  }).catch(($, e, next) => next(e))

  // Beside whatever the group draws beneath this hook (the engine's fold, a skin's row), never instead of it.
  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    const under = await next(e)
    const urls = urlsOf(e.props.calls)

    return urls.length === 0 ? under : drawn($, e, urls, under)
  })

  // A run of one call may stand alone, with no group around it.
  on('ui.render', { component: 'ToolResult' }, async ($, e, next) => {
    const under = await next(e)
    const prs = await read($, prsAtom)
    const url = Object.values(prs).find(entry => entry.callId !== null && entry.callId === e.props.tool_use_id)?.url

    return url === undefined ? under : drawn($, e, [url], under)
  })
}
