// The hub's own panes in the one panel (DESIGN.md §9): the hub, its catalog and its two side panes take turns, the
// one asked for shown and the rest closed. Apart from register.tsx so upkeep.tsx can lead back to the hub too.
import type { EngineInterface } from 'claude-code'

import type { Drawing } from './draw'
import { MODS_PANE, SIDE_PANES } from './hub'
import { HUB_PANE } from './kit/stage'
import { stableDrawings } from './kit/stable'
import { catalogWords, paneWords } from './words'

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

// Puts one of the hub's own panes in the panel and closes its others; every mod's open pane closes too.
// The footer toggle opens it without the keyboard (footer.tsx): the composer keeps it.
export async function show($: EngineInterface, pane: string, isFocused = true): Promise<void> {
  const title = pane === HUB_PANE ? TITLE : paneWords(pane).title
  hubKept.isHeld = true
  if (pane === HUB_PANE) hubDrawings.reset()
  if (pane === MODS_PANE) catalogDrawings.reset()
  await $.ui.open(isFocused ? { id: pane, title, focus: true } : { id: pane, title })
  await $.state.set(STAGE, { pane, at: Date.now() })
  for (const other of [HUB_PANE, MODS_PANE]) if (other !== pane) await closeQuietly($, other)
  // A side pane is closed only when it is up: it rarely is. A panel that cannot be listed has none to close.
  const up = new Set((await $.ui.panes().catch(() => [])).map(each => each.id))
  for (const side of SIDE_PANES) if (side !== pane && up.has(side)) await closeQuietly($, side)
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
