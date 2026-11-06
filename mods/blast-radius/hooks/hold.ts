// Holding one call while the person answers its card: a risky command, an edit another chat
// just made, a command a house rule asks about. One at a time; the card itself is drawn by
// register's ui.render hooks from `current()`.
//
// The card lives in the band above the prompt, never in a pane: a pane is a tab that opens by itself, takes the focus
// and can outlive its card as a blank tab.
//
// A hook has 10 s of its own time, but time spent inside a `$` call is free. So the hold loop
// waits on a short process (`pause`) until a button's onPress sets the decision.
// The engine follows `$` only within one file, so each hooks module hands in its own `HoldIo`.

import type { CardProps } from './card'
import type { View } from './view'

export type Decision = 'proceed' | 'cancel' | 'timeout' | 'interrupted' | 'error'

export type Held = {
  command: string
  // What the card shows, once it is ready to draw; null while it is being measured.
  view: ((isExpanded: boolean) => View) | null
  decision: Decision | null
  phase: CardProps['phase']
  isExpanded: boolean
  // Only a delete strikes its rows before it runs.
  canStrike: boolean
}

// The hold loop's calls on `$`, as closures from the hooks module.
export type HoldIo = {
  // `$.process.run(argv, { timeoutMs: SLEEP_TIMEOUT_MS })`
  run: (argv: readonly string[]) => Promise<unknown>
  now: () => Promise<number>
  redraw: () => void
}

// `$.ui` calls on the tab an older copy of this mod left, as closures from the hooks module.
export type StaleTab = {
  isListed: () => Promise<boolean>
  open: (rows: number) => Promise<unknown>
  close: () => Promise<void>
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
const STALE_TAB_ROWS = 9

// The call being held, or null. One at a time: a second call waits for the first answer.
let held: Held | null = null

export const current = (): Held | null => held

let hasNoSleep = false
let canReopen = true

/** `sleep` where there is one. Windows has none: ping's second reply comes a second after its first. */
async function pause(io: HoldIo, seconds: string): Promise<void> {
  if (!hasNoSleep) {
    try {
      await io.run(['sleep', seconds])

      return
    } catch {
      hasNoSleep = true
    }
  }
  await io.run(['ping', '-n', '2', '127.0.0.1'])
}

/** Waits for any earlier card to be answered, then claims the hold; null when the turn was interrupted meanwhile. */
export async function take(io: HoldIo, input: { command: string; signal: AbortSignal; canStrike: boolean }): Promise<Held | null> {
  while (held !== null) {
    if (input.signal.aborted) return null
    await pause(io, POLL_SECONDS)
  }
  // Claimed with no await between the check and the claim, so two waiting calls can't both get through.
  const mine: Held = { command: input.command, view: null, decision: null, phase: 'asking', isExpanded: false, canStrike: input.canStrike }
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
      await pause(io, POLL_SECONDS)
    }
  }
}

/** Shows the card, waits for the answer and lets the hold go, whatever happens. */
export async function hold(io: HoldIo, mine: Held, options: HoldOptions): Promise<void> {
  try {
    if (!(await options.prepare())) {
      mine.decision = 'proceed'

      return
    }
    io.redraw()
    await waitForDecision(io, mine, options.signal)
    if (mine.decision === 'proceed' && mine.canStrike) {
      // The rows it is about to delete get struck through, then the card goes.
      mine.phase = 'striking'
      io.redraw()
      await pause(io, STRIKE_SECONDS)
    }
  } catch {
    mine.decision = 'error'
  } finally {
    if (held === mine) held = null
    io.redraw()
  }
}

/**
 * A tab from an older copy of this mod, the only way this pane is ever drawn. A pane the engine still lists just closes.
 * A desktop keeps a tab across an engine restart though the new engine lists no such pane, and only a change to the
 * list reaches it: so open, then close, once.
 */
export async function dropStaleTab(tab: StaleTab): Promise<void> {
  if (!(await tab.isListed())) {
    if (!canReopen) return
    canReopen = false
    await tab.open(STALE_TAB_ROWS)
  }
  await tab.close()
}
