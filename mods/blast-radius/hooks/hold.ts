// Holding one call while the person answers its card: a risky command, an edit another chat
// just made, a command a house rule asks about. One at a time; the card itself is drawn by
// register's ui.render hooks from `current()`.
//
// A hook has 10 s of its own time, but time spent inside a `$` call is free. So the hold loop
// waits on a short `$.process.run(["sleep", ...])` until a button's onPress sets the decision.
// The engine follows `$` only within one file, so each hooks module hands in its own `HoldIo`.

import type { CardProps } from './card'
import type { View } from './view'

export type Decision = 'proceed' | 'cancel' | 'closed' | 'timeout' | 'interrupted' | 'error'

export type Held = {
  command: string
  // What the card shows, once it is ready to draw; null while it is being measured.
  view: ((isExpanded: boolean) => View) | null
  decision: Decision | null
  where: 'pane' | 'band'
  phase: CardProps['phase']
  isExpanded: boolean
  // Only a delete strikes its rows before it runs.
  canStrike: boolean
}

// The hold loop's calls on `$`, as closures from the hooks module.
export type HoldIo = {
  // `$.process.run(['sleep', seconds], { timeoutMs: SLEEP_TIMEOUT_MS })`
  sleep: (seconds: string) => Promise<unknown>
  now: () => Promise<number>
  // `$.ui.open` of PANE_ID with these rows: whether a surface placed it.
  open: (rows: number) => Promise<boolean>
  close: () => Promise<void>
  redraw: () => void
}

export type HoldOptions = {
  signal: AbortSignal
  // Measures and sets `view`; false when there is nothing to ask, and the call goes ahead.
  prepare: () => Promise<boolean>
}

export const PANE_ID = 'blast-radius'
const POLL_SECONDS = '0.25'
const STRIKE_SECONDS = '0.9'
export const SLEEP_TIMEOUT_MS = 5000
const HOLD_LIMIT_MS = 10 * 60 * 1000
const PANE_ROWS_MAX = 24
const PANE_ROWS_CHROME = 9

// The call being held, or null. One at a time: a second call waits for the first answer.
let held: Held | null = null

export const current = (): Held | null => held

/** Waits for any earlier card to be answered, then claims the hold; null when the turn was interrupted meanwhile. */
export async function take(io: HoldIo, input: { command: string; signal: AbortSignal; canStrike: boolean }): Promise<Held | null> {
  while (held !== null) {
    if (input.signal.aborted) return null
    await io.sleep(POLL_SECONDS)
  }
  // Claimed with no await between the check and the claim, so two waiting calls can't both get through.
  const mine: Held = { command: input.command, view: null, decision: null, where: 'pane', phase: 'asking', isExpanded: false, canStrike: input.canStrike }
  held = mine

  return mine
}

async function waitForDecision(io: HoldIo, mine: Held, signal: AbortSignal): Promise<void> {
  const startedAt = await io.now()
  while (mine.decision === null) {
    if (signal.aborted) {
      mine.decision = 'interrupted'
    } else if ((await io.now()) - startedAt > HOLD_LIMIT_MS) {
      mine.decision = 'timeout'
    } else {
      await io.sleep(POLL_SECONDS)
    }
  }
}

function paneRows(mine: Held): number {
  const rows = mine.view === null ? 0 : mine.view(false).rows.length

  return Math.min(PANE_ROWS_MAX, PANE_ROWS_CHROME + rows)
}

/** Opens the card, waits for the answer and lets the hold go, whatever happens. */
export async function hold(io: HoldIo, mine: Held, options: HoldOptions): Promise<void> {
  let isPlaced = false
  try {
    if (!(await options.prepare())) {
      mine.decision = 'proceed'

      return
    }
    isPlaced = await io.open(paneRows(mine))
    if (!isPlaced) mine.where = 'band'
    io.redraw()
    await waitForDecision(io, mine, options.signal)
    if (mine.decision === 'proceed' && mine.canStrike) {
      // The rows it is about to delete get struck through, then the pane goes.
      mine.phase = 'striking'
      io.redraw()
      await io.sleep(STRIKE_SECONDS)
    }
  } catch {
    mine.decision = 'error'
  } finally {
    // Close this call's pane before releasing the hold, so the next call's pane can't be the one closed.
    if (isPlaced) await io.close().catch(() => undefined)
    if (held === mine) held = null
    io.redraw()
  }
}

/** Closing the pane (Esc, its close mark) answers as the safe button does. */
export function closeHeld(): void {
  if (held !== null && held.decision === null) held.decision = 'closed'
}
