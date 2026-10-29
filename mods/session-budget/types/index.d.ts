export type BudgetKind = 'percent' | 'usd'

export type Budget = {
  kind: BudgetKind
  // Percent of the 5h window, or US dollars.
  limit: number
  // The reading when the budget was set (or 0 after the 5h window reset); null until the first reading.
  base: number | null
  // Spend counted in earlier 5h windows, for a session that outlives a reset.
  carried: number
  // The last reading seen, and the window it belongs to (its reset time).
  last: number | null
  window: string | null
  hasWarned: boolean
  isAccepted: boolean
  // Epoch ms the budget was set, for "bu hızla ~25 dk".
  setAt?: number
}

export type BudgetReading = { percent: number | null; resetsAt: string | null; usd: number | null }

export type BudgetNotice = {
  id: number
  // `warn` at 80% draws from the live budget; `stopped` after "Dur".
  kind: 'warn' | 'stopped'
  text: string
  isAlert: boolean
  // Shared notice line, top wins: cache-tax 4, you-should-know 3, reflect 2, session-budget 1.
  priority: number
  // Epoch ms after which the line clears itself.
  expiresAt: number
}

// A 5h reading for the spawn brake's pace: epoch ms and percent used.
export type PacePoint = { t: number; value: number }

// "Continue" at the spawn brake: spawns go through until the window passes `percent` + 5 in that window.
export type BrakeAck = { percent: number; window: string | null }

declare module 'claude-code' {
  interface PluginState {
    'session-budget': {
      budget: Budget | null
      reading: BudgetReading
      notice: BudgetNotice | null
      isEnabled: boolean
      // The spawn brake's line in percent of the 5h window; null when off.
      brakeAt: number | null
      brakeAck: BrakeAck | null
      pace: { points: PacePoint[]; resetsAt: string | null }
    }
  }
}
