// The hub's two side panes, read where `$` is: Connections (which outside tools answer) and Dead weight (what is
// installed and unused). Each keeps its row's card under its own pane id in the hub's cards, as a mod's would be.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { HubCard, Links, Weights } from '../types'
import { LINKS_PANE, WEIGHT_PANE } from './hub'
import { setLang } from './kit/lang'
import { pinned } from './kit/pin'
import { HUB_PANE } from './kit/stage'
import { isSame } from './kit/same'
import { hasLinks, linksCard, linksOf } from './links'
import { copy, openHub } from './own-panes'
import { linksTree, weightTree } from './upkeep-pane'
import { weightCard, weightsOf } from './weight'

// State refs live in each file that reads them: the engine follows literals, not imports.
const cardsAtom = atom({ plugin: 'modz', key: 'cards' } as const, {} as Record<string, HubCard>)
const linksAtom = atom({ plugin: 'modz', key: 'links' } as const, null as Links | null)
const weightsAtom = atom({ plugin: 'modz', key: 'weights' } as const, null as Weights | null)

const FILL_GAP_MS = 60_000
let filledAt = 0
// A query no tool matches: the reply still names the servers that failed, and nothing is loaded for the model.
const NO_MATCH = 'zzqqxxjj'

type On = Parameters<Register>[0]

const log = ($: EngineInterface, what: string) => (cause: unknown) => $.ui.log(`modz: ${what} failed: ${String(cause)}`, { to: 'debug' })

// Claude Code's own folder and its `.claude.json`, which sits inside a named config folder and beside the default one.
async function placesOf($: EngineInterface): Promise<{ dir: string; json: string } | null> {
  const named = await $.env.get('CLAUDE_CONFIG_DIR').catch(() => undefined)
  if (named) return { dir: named, json: `${named}/.claude.json` }
  const home = (await $.env.get('HOME').catch(() => undefined)) || (await $.env.get('USERPROFILE').catch(() => undefined))

  return home ? { dir: `${home}/.claude`, json: `${home}/.claude.json` } : null
}

async function jsonAt($: EngineInterface, path: string | undefined): Promise<unknown> {
  if (path === undefined) return undefined
  try {
    return JSON.parse(String(await $.fs.read(path)))
  } catch {
    return undefined
  }
}

// The context as /context breaks it down, estimated locally: no request is sent.
async function breakdownOf($: EngineInterface) {
  return (await $.session.usage({ breakdown: 'summary' }).catch(() => undefined))?.context.breakdown
}

// A row's card, kept only when its words changed: a fresh `at` alone would redraw the hub.
async function keepCard($: EngineInterface, card: HubCard): Promise<void> {
  const kept = (await read($, cardsAtom))[card.pane]
  if (kept?.detail === card.detail && kept.tone === card.tone) return
  await update($, cardsAtom, cards => ({ ...cards, [card.pane]: card }))
}

// `isAsking` also asks the engine which servers failed. That is a real tool call every mod's tool hooks see, so it
// is made only when the person opens the pane or presses "Look again", never on a timer.
async function refreshLinks($: EngineInterface, isAsking: boolean): Promise<void> {
  const places = await placesOf($)
  const servers = ((await breakdownOf($))?.mcpTools ?? []).map(tool => tool.serverName)
  const search = isAsking ? await $.tool.call({ tool: 'ToolSearch', query: NO_MATCH, max_results: 1 }).catch(() => undefined) : undefined
  const now = await $.clock.now().catch(() => Date.now())
  const links = linksOf({ servers, authCache: await jsonAt($, places === null ? undefined : `${places.dir}/mcp-needs-auth-cache.json`), search, now })
  // A session with no outside tool at all gets no row, and nothing is written for it.
  if (isSame(await read($, linksAtom), links) || (!hasLinks(links) && (await read($, linksAtom)) === null)) return
  await update($, linksAtom, () => links)
  await keepCard($, linksCard(links, now))
}

// False when there was nothing to weigh by yet.
async function refreshWeights($: EngineInterface): Promise<boolean> {
  const config = (await jsonAt($, (await placesOf($))?.json)) as { skillUsage?: unknown } | undefined
  const enabled = (await $.settings.read().catch(() => ({} as Record<string, unknown>))).enabledPlugins
  const now = await $.clock.now().catch(() => Date.now())
  const weights = weightsOf({
    skills: (await breakdownOf($))?.skills?.skillFrontmatter ?? [],
    usage: config?.skillUsage,
    enabled: typeof enabled === 'object' && enabled !== null ? (enabled as Record<string, unknown>) : {},
    now,
  })
  // Use counts that could not be read leave the row out: there is nothing true to say on it.
  if (weights === null) return false
  if (isSame(await read($, weightsAtom), weights)) return true
  await update($, weightsAtom, () => weights)
  await keepCard($, weightCard(weights, now))

  return true
}

// One of the hub's own panes was put in the panel: what it shows is read anew.
export function refreshSide($: EngineInterface, pane: string): void {
  if (pane === HUB_PANE) fillSideRows($)
  if (pane === LINKS_PANE) void refreshLinks($, true).catch(log($, 'reading the connections'))
  if (pane === WEIGHT_PANE) void refreshWeights($).catch(log($, 'weighing the plugins'))
}

// Both rows read anew, a minute apart at most: as the session starts, when a mod reports and when the hub comes
// forward. No timer, so a quiet session reads nothing; never from a drawing, where the engine refuses a write.
// A mod can report before session.start has read the language, so it is read here too.
async function fill($: EngineInterface): Promise<void> {
  setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
  await refreshLinks($, false)
  // A session still listing its skills is weighed at the next call, not a minute on.
  if (!(await refreshWeights($))) filledAt = 0
}

export function fillSideRows($: EngineInterface): void {
  const now = Date.now()
  if (now - filledAt < FILL_GAP_MS) return
  filledAt = now
  void fill($).catch(log($, 'filling the side rows'))
}

export function wireUpkeep(on: On): void {
  on('ui.render', { component: 'Pane', requestId: LINKS_PANE }, async ($, e) => {
    const onHome = () => void openHub($).catch(log($, 'opening the hub'))
    const onCheck = () => void refreshLinks($, true).catch(log($, 'reading the connections'))

    return pinned(e, linksTree($.ui.resolve(e), { links: await read($, linksAtom), onHome, onCheck }))
  })

  on('ui.render', { component: 'Pane', requestId: WEIGHT_PANE }, async ($, e) => {
    const onHome = () => void openHub($).catch(log($, 'opening the hub'))
    return pinned(e, weightTree($.ui.resolve(e), { weights: await read($, weightsAtom), now: await $.clock.now().catch(() => Date.now()), onHome, onCopy: (text, press) => copy($, text, press) }))
  })
}
