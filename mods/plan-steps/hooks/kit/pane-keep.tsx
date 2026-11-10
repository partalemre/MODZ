// MODZ kit — a pane that does not stay blank. The desktop shows "Nothing to show yet" for a pane whose render hook
// threw, ran out of time, or belongs to a tab it kept from before the engine restarted. So: a drawing that fails
// costs a plain list, never the pane (`drawSafely`, `plainPane`); a pane that was open comes back when a desktop
// attaches (`restorePane`) or asks a tab the engine no longer lists to draw (`reopenKeptTab`); and while the engine
// lists the pane, a look on the mod's own timer asks for a redraw after a failed or missing draw (`watchPane`).
// No `$` here: the engine follows `$` only into the file that got it, so a mod hands in closures (`PaneNouns`).
import type { RenderElement } from 'claude-code'

type Ui = Record<string, any>

// What this engine knows of the pane: whether it opened, closed or saw it (a draw asked for a pane it never saw is
// a tab from before a restart), and whether the pane still waits for a good draw.
export type PaneKept = { isHeld: boolean; needsDraw: boolean }

export const paneKept = (): PaneKept => ({ isHeld: false, needsDraw: true })

// The store's note that the pane was open, so it outlives the engine: when it was last seen open, in ms.
export const NOTE_PREFIX = 'pane-open/'
export const noteKey = (sessionId: string): string => `${NOTE_PREFIX}${sessionId}`
const DAY_MS = 24 * 60 * 60 * 1000
// A note is written again once a day while the pane stays open, and dropped a week after the last time.
const NOTE_FRESH_MS = DAY_MS
export const NOTE_TTL_MS = 7 * DAY_MS

export type PaneNouns = {
  // Whether `$.ui.panes()` lists the pane.
  isListed: () => Promise<boolean>
  // Opens the pane without the keyboard and tells the hub it is shown.
  reopen: () => Promise<unknown>
  // `$.ui.invalidate('ui.render')`.
  redraw: () => void
  // `$.clock.after(0, work)`: out of the hook that asks (no open or state write runs under a render).
  soon: (work: () => void) => unknown
  note: { read: () => Promise<unknown>; write: (at: number | undefined) => Promise<unknown> }
  now: () => Promise<number>
  log: (text: string) => void
}

// `true` is what the note was before it carried a time.
const isNoted = (value: unknown): boolean => value === true || typeof value === 'number'

export type SafeDraw<T> = { draw: () => Promise<T>; plain: (cause: unknown) => T | Promise<T>; log: (text: string) => void }

// The drawing, or the plain one when it throws; a failed draw leaves the pane waiting for a redraw (`watchPane`).
export async function drawSafely<T>(kept: PaneKept, o: SafeDraw<T>): Promise<T> {
  try {
    const drawn = await o.draw()
    kept.needsDraw = false

    return drawn
  } catch (cause) {
    kept.needsDraw = true
    o.log(`the pane fell back to its plain list (${String(cause)})`)

    return o.plain(cause)
  }
}

// How many lines the plain pane lists before "…".
const PLAIN_MAX = 20

// The plain pane: a quiet line saying the drawing failed, then what there is to list, one line each.
export function plainPane(ui: Ui, o: { notice: string; lines: readonly string[]; head?: unknown }): RenderElement {
  const { Box, Text } = ui
  const shown = o.lines.slice(0, PLAIN_MAX)

  return (
    <Box flexDirection="column">
      {o.head}
      <Text dimColor>{o.notice}</Text>
      {shown.map((line, i) => <Text key={`plain-${i}`} wrap="truncate-end">{line}</Text>)}
      {o.lines.length > shown.length && <Text dimColor>…</Text>}
    </Box>
  )
}

// From the pane's render hook: a draw asked for a pane the engine does not list is a tab the desktop kept from
// before a restart. It opens again, once per engine and after the render, unless this engine already held it (a
// tab the person closed or the hub swapped stays as it is).
export function reopenKeptTab(kept: PaneKept, nouns: Pick<PaneNouns, 'isListed' | 'reopen' | 'soon' | 'log'>): void {
  if (kept.isHeld) return
  kept.isHeld = true
  nouns.soon(() => {
    void (async () => {
      if (!(await nouns.isListed())) await nouns.reopen()
    })().catch(cause => nouns.log(`could not reopen the pane (${String(cause)})`))
  })
}

// From `session.attach` on a desktop: a pane the note says was open opens again, and is drawn again either way
// (the desktop that comes back may hold a tree from before).
export async function restorePane(kept: PaneKept, nouns: Pick<PaneNouns, 'isListed' | 'reopen' | 'redraw' | 'note' | 'log'>): Promise<void> {
  try {
    if (isNoted(await nouns.note.read())) {
      kept.isHeld = true
      if (!(await nouns.isListed())) await nouns.reopen()
    }
  } catch (cause) {
    nouns.log(`could not restore the pane (${String(cause)})`)
  }
  nouns.redraw()
}

// One look at the pane on the mod's own timer. Watched rather than noted at each open and close: a person's click
// on the tab's cross raises no hook. While the engine lists the pane, a draw that failed or never came is asked
// for again, and on a `isBeat` look always (a redraw nobody heard leaves no other trigger).
export async function watchPane(kept: PaneKept, nouns: Pick<PaneNouns, 'isListed' | 'redraw' | 'note' | 'now' | 'log'>, isBeat = false): Promise<void> {
  try {
    const isOpen = await nouns.isListed()
    kept.isHeld ||= isOpen
    if (!isOpen) kept.needsDraw = true
    const noted = await nouns.note.read()
    const now = await nouns.now()
    const isFresh = typeof noted === 'number' && now - noted < NOTE_FRESH_MS
    if (isOpen && !isFresh) await nouns.note.write(now)
    if (!isOpen && isNoted(noted)) await nouns.note.write(undefined)
    if (isOpen && (kept.needsDraw || isBeat)) nouns.redraw()
  } catch (cause) {
    nouns.log(`could not look at the pane (${String(cause)})`)
  }
}

// The notes of sessions long gone, to drop: older than NOTE_TTL_MS, or from before a note carried its time. The
// session's own note is never among them.
export function staleNotes(entries: readonly (readonly [key: string, value: unknown])[], o: { own: string; now: number }): string[] {
  return entries
    .filter(([key, value]) => key.startsWith(NOTE_PREFIX) && key !== o.own && !(typeof value === 'number' && o.now - value < NOTE_TTL_MS))
    .map(([key]) => key)
}
