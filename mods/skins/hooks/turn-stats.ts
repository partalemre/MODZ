import type { TurnStats } from '../types'

const KEPT_TURNS = 40

export const NO_STATS: TurnStats = { tools: 0, added: 0, removed: 0 }

// One more call on the main loop, with the lines it changed.
export const addCall = (stats: TurnStats, diff: { added: number; removed: number } | null): TurnStats => ({
  tools: stats.tools + 1,
  added: stats.added + (diff?.added ?? 0),
  removed: stats.removed + (diff?.removed ?? 0),
})

// The footer finds a turn by its duration, the one figure its row carries.
export const withTurn = (turns: Readonly<Record<string, TurnStats>>, durationMs: number, stats: TurnStats): Record<string, TurnStats> =>
  Object.fromEntries([...Object.entries(turns), [String(durationMs), stats]].slice(-KEPT_TURNS))
