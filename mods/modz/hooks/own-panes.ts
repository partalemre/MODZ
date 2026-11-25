// The hub's own panes in the one panel (DESIGN.md §9): the hub, its catalog and its two side panes take turns, the
// one asked for shown and the rest closed. Apart from register.tsx so upkeep.tsx can lead back to the hub too.
import type { EngineInterface } from 'claude-code'

import type { Drawing } from './draw'
import { MODS_PANE, SIDE_PANES } from './hub'
import { HUB_PANE, paneOf } from './kit/stage'
import { stableDrawings } from './kit/stable'
import { catalogWords } from './words'

const TITLE = 'modz'
// State refs live in each file that reads them: the engine follows literals, not imports.
const STAGE = { plugin: 'modz', key: 'stage' } as const

// The hub's and the catalog's drawings, kept per what they show (stable.ts); forgotten when the pane opens again.
export const hubDrawings = stableDrawings<Drawing>()
export const catalogDrawings = stableDrawings<Drawing>()

// Whether this engine has put a pane of the hub's in the panel. A draw asked for the hub before that is a tab the
// desktop kept from before the engine restarted (register.tsx: paneHooks).
export const hubKept = { isHeld: false }

// A pane that will not close is logged, never thrown: the one being shown is already up.
export const closeQuietly = ($: EngineInterface, id: string) =>
  $.ui.close({ id }).catch(cause => $.ui.log(`modz: ${id} could not be closed: ${String(cause)}`, { to: 'debug' }))

// Puts one of the hub's own pages (the hub, its catalog, a side page) in the one pane: the stage names it first, so
// the pane's first draw is already the right page, then the pane comes up. Nothing else opens, so the panel never
// lists two panes; a separate pane of the hub's own still up (a tab kept from an older engine) closes.
// The footer toggle opens it without the keyboard (footer.tsx): the composer keeps it.
export async function show($: EngineInterface, pane: string, isFocused = true): Promise<void> {
  hubKept.isHeld = true
  if (pane === HUB_PANE) hubDrawings.reset()
  if (pane === MODS_PANE) catalogDrawings.reset()
  // Written only when it moves: a kept tab is reopened from a timer a draw started, where a write is denied, and
  // there the stage already says the hub (or nothing, which draws the hub).
  const staged = paneOf((await $.state.get(STAGE)).value)
  if (staged !== pane && !(pane === HUB_PANE && staged === null)) await $.state.set(STAGE, { pane, at: Date.now() })
  await $.ui.open(isFocused ? { id: HUB_PANE, title: TITLE, focus: true } : { id: HUB_PANE, title: TITLE })
  // A pane that cannot be listed has none to close.
  const up = new Set((await $.ui.panes().catch(() => [])).map(each => each.id))
  for (const own of [MODS_PANE, ...SIDE_PANES]) if (up.has(own)) await closeQuietly($, own)
}

export const openHub = ($: EngineInterface) => show($, HUB_PANE)

// A line onto the clipboard of the surface that was pressed; a toast says whether it took.
export async function copy($: EngineInterface, text: string, press: unknown): Promise<void> {
  const surface = (press as { surface?: 'desktop' | 'terminal' } | undefined)?.surface
  const words = catalogWords()
  try {
    $.ui.toast((await $.ui.copy(surface === undefined ? { text } : { text, surface })).isCopied ? words.copied : words.notCopied)
  } catch (cause) {
    $.ui.log(`modz: the line could not be copied: ${String(cause)}`, { to: 'debug' })
  }
}
