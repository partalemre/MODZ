// On a subscription a cold write costs a share of the limit window, not dollars. The share is estimated from this
// session's own readings: how far the window moved per list-price dollar the session spent since the window's first
// reading. Other sessions spending meanwhile move the window too, so the estimate leans high, never low.

import type { SessionRateLimit } from 'claude-code'

import type { Rate } from './core'

const FIVE_HOUR = 'five_hour'
const SEVEN_DAY = 'seven_day'
// Below this much spend, or this much movement, the ratio is noise.
const MIN_USD = 0.5
const MIN_POINTS = 1

/** The 5h window, or the weekly one where the account reports no 5h window. */
const windowOf = (limits: readonly SessionRateLimit[]): SessionRateLimit | undefined =>
  limits.find(limit => limit.kind === FIVE_HOUR) ?? limits.find(limit => limit.kind === SEVEN_DAY)

/** Folds one reading in; a window that fell (it reset) or changed kind starts the count over. */
export function trackRate(rate: Rate | null, limits: readonly SessionRateLimit[], usd: number | undefined): Rate | null {
  const window = windowOf(limits)
  if (window === undefined || usd === undefined) return rate
  const reading = { kind: window.kind, percent: window.percentUsed, usd }
  const isFresh = rate === null || rate.kind !== window.kind || window.percentUsed < rate.percent || usd < rate.usd
  if (isFresh) return { ...reading, firstPercent: reading.percent, firstUsd: usd }
  return { ...rate, percent: reading.percent, usd }
}

export type Share = { percent: number; isWeekly: boolean }

/** The limit share `usd` of list price would take at this session's pace; null without an honest basis. */
export function shareOf(rate: Rate | null, usd: number | null): Share | null {
  if (rate === null || usd === null) return null
  const spent = rate.usd - rate.firstUsd
  const moved = rate.percent - rate.firstPercent
  if (spent < MIN_USD || moved < MIN_POINTS) return null
  return { percent: (usd * moved) / spent, isWeekly: rate.kind === SEVEN_DAY }
}
