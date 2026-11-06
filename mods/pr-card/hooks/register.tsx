import { atom, read, update } from 'claude-code'
import type { EngineInterface, RenderElement, Register, Timer } from 'claude-code'

import { biggestFirst, factsOf, noteOf, shortName, stateOf } from './card-facts'
import { cardSvg } from './card-svg'
import { setLang } from './kit/lang'
import { pinned } from './kit/pin'
import { VIEW_FIELDS, isPrCreate, outputText, prRefOf, viewOf } from './parse'
import type { PrRef } from './parse'
import { words } from './words'
import type { PrEntry, PrView } from '../types'

const prsAtom = atom({ plugin: 'pr-card', key: 'prs' } as const, {} as Record<string, PrEntry>)

// One `gh pr view` per PR, and rarely: each minute only while its checks run or GitHub is still working out
// mergeability, otherwise every five. A merged or closed PR, or a machine without gh, is not asked again.

const GH_ENV = { GH_PROMPT_DISABLED: '1', GH_NO_UPDATE_NOTIFIER: '1', NO_COLOR: '1' }
const GH_TIMEOUT_MS = 20_000
const BUSY_MS = 60_000
const SETTLED_MS = 300_000
// shortcut: only the newest PRs refresh by themselves, older cards go still; a press still refreshes one.
const MAX_WATCHED = 3

const live = { timer: null as Timer | null, asking: new Set<string>() }

const isDone = (entry: PrEntry): boolean => entry.problem === 'no-gh' || (entry.view !== null && entry.view.state !== 'open')

function waitOf(view: PrView | null): number {
  const isBusy = view !== null && (view.checks.pending > 0 || view.merge === 'unknown')

  return isBusy ? BUSY_MS : SETTLED_MS
}

function stop(): void {
  live.timer?.cancel()
  live.timer = null
}

async function ask($: EngineInterface, url: string): Promise<Pick<PrEntry, 'view' | 'problem'>> {
  const run = await $.process.run(['gh', 'pr', 'view', url, '--json', VIEW_FIELDS], { cwd: await $.session.cwd(), env: GH_ENV, timeoutMs: GH_TIMEOUT_MS }).catch(() => null)
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
      const view = got.view ?? entry.view

      return { ...prs, [url]: { ...entry, view, problem: got.problem, checkedAt: got.view === null ? entry.checkedAt : now, nextAt: now + waitOf(view) } }
    })
  } finally {
    live.asking.delete(url)
  }
}

async function tick($: EngineInterface): Promise<void> {
  const now = await $.clock.now()
  const watched = Object.values(await read($, prsAtom)).filter(entry => !isDone(entry)).slice(-MAX_WATCHED)
  if (watched.length === 0) return stop()
  await Promise.all(watched.filter(entry => entry.nextAt <= now).map(entry => refresh($, entry.url)))
}

// The timer ticks each busy interval and asks only for the PRs that are due; a reload starts it again.
async function wake($: EngineInterface): Promise<void> {
  if (live.timer !== null) return
  const isWatching = Object.values(await read($, prsAtom)).some(entry => !isDone(entry))
  if (!isWatching) return
  live.timer = $.clock.every(BUSY_MS, () => void tick($).catch(error => $.ui.log(`pr-card: refresh failed (${String(error)})`, { to: 'debug' })))
}

async function track($: EngineInterface, ref: PrRef, callId: string | undefined): Promise<void> {
  const entry: PrEntry = { ...ref, callId: callId ?? null, view: null, problem: null, checkedAt: null, nextAt: 0 }
  await update($, prsAtom, prs => (prs[ref.url] === undefined ? { ...prs, [ref.url]: entry } : prs))
  await refresh($, ref.url)
  await wake($)
}

// A press asks at once, whatever the wait, and brings back a machine that has since got gh.
async function refreshNow($: EngineInterface, url: string): Promise<void> {
  await refresh($, url)
  await wake($)
}

const CARD_MAX_PX = 560
const CARD_MIN_PX = 320
const PX_PER_COLUMN = 8
const TERMINAL_FILES = 5
type Site = { surface: string; viewport?: { columns?: number } }

const commandOf = (input: unknown): string => String((input as { command?: unknown } | null | undefined)?.command ?? '')

// A hook above may have changed a call's output, so the PR's link is read back from what is drawn.
const urlsOf = (calls: readonly { tool: string; input: unknown; output?: unknown }[]): string[] =>
  calls.flatMap(call => {
    const ref = call.tool === 'Bash' && isPrCreate(commandOf(call.input)) ? prRefOf(outputText(call.output)) : null

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

async function drawn($: any, e: any, urls: string[], under: RenderElement): Promise<RenderElement> {
  const prs = await read($, prsAtom)
  const entries = urls.flatMap(url => (prs[url] === undefined ? [] : [prs[url]]))
  if (entries.length === 0) return under
  const { Box, Button, Svg, Text } = $.ui.resolve(e)
  const now = await $.clock.now()
  const isDesktop = e.surface === 'desktop'
  const cards = entries.map(entry => isDesktop
    ? (
      <Box key={`c-${entry.url}`} flexDirection="column" gap={1}>
        <Svg key={`p-${entry.url}`} {...cardSvg(entry, { now, width: widthOf(e) })} />
        <Box flexDirection="row">
          <Button key={`r-${entry.url}`} label={words().refresh} plain dimColor onPress={() => void refreshNow($, entry.url)} />
        </Box>
      </Box>
    )
    : terminalCard(Text, Box, entry, now))

  return pinned(e, <Box flexDirection="column" gap={1}>{under}{cards}</Box>)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    setLang(await $.env.get('MODZ_LANG'))
    await wake($)

    return result
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const result = await next(e)
    if (result.deny !== undefined || result.isError === true || !isPrCreate(commandOf(e))) return result
    const ref = prRefOf(`${result.text ?? ''}\n${outputText(result.result)}`)
    if (ref !== null) void track($, ref, e.tool_use_id).catch(error => $.ui.log(`pr-card: could not read the PR (${String(error)})`, { to: 'debug' }))

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
    if (e.props.tool !== 'Bash') return under
    const prs = await read($, prsAtom)
    const url = Object.values(prs).find(entry => entry.callId === e.props.tool_use_id)?.url

    return url === undefined ? under : drawn($, e, [url], under)
  })
}
