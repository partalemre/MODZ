import type { LimitTrack } from '../types'

// Each agent's share of the 5h limit. The engine reports the window's percent and the session's
// dollars, never a per-agent split, so the session's own rate (points of the window per dollar
// since it started) turns each agent's ≈$ into ≈points. Below a point of movement the rate is
// noise, so nothing is shown rather than a made-up number.

export const FIVE_HOUR = 'five_hour'
const MIN_POINTS = 0.5
const MIN_USD = 0.05
const TENTH = 0.1
const ONE_DECIMAL_BELOW = 10

export type LimitReading = { percent: number; usd: number; resetsAt?: string }

type RateLimitLike = { kind: string; percentUsed: number; resetsAt?: string }

export const readingOf = (rateLimits: readonly RateLimitLike[], usd: number | undefined): LimitReading | null => {
  const window = rateLimits.find(limit => limit.kind === FIVE_HOUR)
  if (!window || usd === undefined) return null
  return { percent: window.percentUsed, usd, resetsAt: window.resetsAt }
}

const rateBetween = (track: LimitTrack): number | null => {
  const points = track.percent - track.basePercent
  const usd = track.usd - track.baseUsd
  return points >= MIN_POINTS && usd >= MIN_USD ? points / usd : null
}

// A window that reset starts a new base; the rate learned before it carries over.
export const trackLimit = (prev: LimitTrack | null, reading: LimitReading): LimitTrack => {
  if (!prev) return { basePercent: reading.percent, baseUsd: reading.usd, percent: reading.percent, usd: reading.usd, resetsAt: reading.resetsAt }
  const hasReset = reading.resetsAt !== undefined && prev.resetsAt !== undefined && reading.resetsAt !== prev.resetsAt
  if (!hasReset) return { ...prev, percent: reading.percent, usd: reading.usd, resetsAt: reading.resetsAt ?? prev.resetsAt }
  const carried = rateBetween(prev) ?? prev.carriedRate
  return { basePercent: reading.percent, baseUsd: reading.usd, percent: reading.percent, usd: reading.usd, resetsAt: reading.resetsAt, carriedRate: carried }
}

export const rateOf = (track: LimitTrack | null): number | null => (track ? rateBetween(track) ?? track.carriedRate ?? null : null)

export const shareOf = (costUsd: number, track: LimitTrack | null): number | null => {
  const rate = rateOf(track)
  return rate === null ? null : costUsd * rate
}

// "<0.1", "3.4" or "12": a tenth of a point is the finest the window reports.
export const shareNumber = (points: number): string => {
  if (points < TENTH) return `<${TENTH}`
  return points < ONE_DECIMAL_BELOW ? points.toFixed(1) : String(Math.round(points))
}
