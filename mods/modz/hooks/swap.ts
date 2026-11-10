// How a press on the hub swaps the one panel (DESIGN.md §9): a row asks its mod for its pane and the hub steps
// aside once that pane is up; a mod that does not answer leaves the hub where it is. No `$` here: the engine follows
// `$` only into the file that got it, so register.tsx hands in the few calls these need (`Swap`).
import type { UiPane } from 'claude-code'

import { isHubShown } from './footer'
import { HOLD_PANE, MODS_PANE } from './hub'
import { HUB_PANE, paneOf } from './kit/stage'

export type Swap = {
  panes: () => Promise<readonly UiPane[]>
  // Puts one of the hub's own panes in the panel and closes the other (register.tsx: show).
  show: (pane: typeof HUB_PANE | typeof MODS_PANE, isFocused?: boolean) => Promise<void>
  // Opens the blank stand-in that holds the panel while a click still holds the hub.
  hold: () => Promise<unknown>
  // Closes a pane; one that will not close is logged there, never thrown.
  close: (id: string) => Promise<unknown>
  stage: { read: () => Promise<unknown>; write: (pane: string) => Promise<unknown> }
  // Writes `modz.open`: the mod that owns the pane opens it.
  ask: (pane: string) => Promise<unknown>
  unanswered: { read: () => Promise<string | null>; write: (pane: string | null) => Promise<unknown> }
  later: (ms: number, work: () => void) => unknown
  log: (text: string) => void
}

// How long a mod has to put its pane up after a row press before the hub says it did not answer.
const ANSWER_MS = 1_500

// The pane a mod said it opened while the hub's own write was still running; read once that write settles.
let answered: string | null = null
// The row pressed last: a later press takes the watchdog over.
let asked: { pane: string } | null = null

// From the `shown` hook's re-entry branch, where `$` is closed: the pane is noted for `openPane` to act on.
export function noteAnswer(pane: string | null): void {
  answered = pane ?? answered
}

const clearUnanswered = async (io: Swap): Promise<void> => {
  if ((await io.unanswered.read()) !== null) await io.unanswered.write(null)
}

// A mod's pane holds the panel: the hub's panes close and every other mod's pane follows (kit/stage.ts).
export async function stepAside(io: Swap, pane: string): Promise<void> {
  answered = null
  await io.stage.write(pane)
  await io.close(HUB_PANE)
  await io.close(MODS_PANE)
  await clearUnanswered(io)
}

// The watchdog. Most mods answer inside the ask itself; one that answers a moment later takes the stage through its
// `shown`. After ANSWER_MS with the hub still on stage, nobody did: the hub stays (and comes back if it went) and
// the row says its pane did not answer, so a press never just vanishes.
async function watchAnswer(io: Swap, ask: { pane: string }): Promise<void> {
  if (asked !== ask || paneOf(await io.stage.read()) !== HUB_PANE) return
  await io.unanswered.write(ask.pane)
  if (!isHubShown(await io.panes())) await io.show(HUB_PANE, false)
}

// A row press puts that pane in the panel: the catalog is this mod's own pane; any other is its
// mod's to open, asked through `modz.open`. The hub steps aside once the mod's pane is up, so a mod that does not
// answer leaves the hub where it is rather than an empty panel.
export async function openPane(io: Swap, pane: string): Promise<void> {
  if (pane === MODS_PANE) return io.show(MODS_PANE)
  const ask = { pane }
  asked = ask
  await clearUnanswered(io)
  // A pane already open behind a tab does not come forward on another open: the asked one opens anew, last.
  await io.stage.write(HUB_PANE)
  // A click into a pane gives it the keyboard, and the engine shows no new pane over the one a person holds, focus
  // or no focus. Closing the held pane shows the last one open: the mod's if it answered, else this stand-in.
  const isHeld = (await io.panes()).some(up => up.id === HUB_PANE && up.isFocused)
  if (isHeld) await io.hold()
  answered = null
  await io.ask(pane)
  if (isHeld) await io.close(HUB_PANE)
  // The mod answered inside this write, where the hub's own hooks hear nothing: engines up to 2.1.296 ran its
  // `.catch` (re-entry), 2.1.309 skips that too. So the panel itself tells: a mod pane that took it leaves the hub
  // no longer shown.
  if (answered !== null || !isHubShown(await io.panes())) await stepAside(io, answered ?? pane)
  else {
    if (isHeld) await io.show(HUB_PANE)
    io.later(ANSWER_MS, () => void watchAnswer(io, ask).catch(cause => io.log(`the watch on ${pane} failed: ${String(cause)}`)))
  }
  if (isHeld) await io.close(HOLD_PANE)
}

// The footer toggle (footer.tsx): the hub's panes away when one is shown, else the hub on stage without the keyboard.
export async function toggleHub(io: Swap): Promise<void> {
  if (!isHubShown(await io.panes())) return io.show(HUB_PANE, false)
  await io.close(HUB_PANE)
  await io.close(MODS_PANE)
}
