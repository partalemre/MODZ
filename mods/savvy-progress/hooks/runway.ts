import { t } from './i18n'

// How long a plan window lasts at the pace it has been used so far. The window's own start (its reset minus its
// length), its percent and the time now are enough, so no samples are kept: this is the window's average pace,
// not its last hour's. "Early" means it would reach 100 % before it refills.

const HOUR = 3_600_000
const DAY = 24 * HOUR
export const FIVE_HOUR = 'five_hour'
export const SEVEN_DAY = 'seven_day'
const SPAN_MS: Readonly<Record<string, number>> = { [FIVE_HOUR]: 5 * HOUR, [SEVEN_DAY]: 7 * DAY }
// Below these a pace is noise: a window that just opened, or one barely touched.
const MIN_ELAPSED = 0.05
const MIN_PERCENT = 3
const FULL = 100
const TWO_DIGITS = 2

export type Runway = { kind: string; percent: number; resetsAt: number | null; endsAt: number | null }

type Window = { kind: string; percentUsed: number; resetsAt?: string }

/** The window's use and, when its pace so far empties it before the reset, the moment it runs out. */
export function runwayOf(limit: Window, now: number): Runway | null {
  const span = SPAN_MS[limit.kind]
  if (span === undefined) return null
  const reset = limit.resetsAt === undefined ? Number.NaN : Date.parse(limit.resetsAt)
  if (Number.isNaN(reset)) return { kind: limit.kind, percent: limit.percentUsed, resetsAt: null, endsAt: null }
  const base = { kind: limit.kind, percent: limit.percentUsed, resetsAt: reset }
  if (limit.percentUsed >= FULL) return { ...base, endsAt: now }
  const elapsed = now - (reset - span)
  if (elapsed < span * MIN_ELAPSED || limit.percentUsed < MIN_PERCENT) return { ...base, endsAt: null }
  const endsAt = now + (elapsed * (FULL - limit.percentUsed)) / limit.percentUsed

  return { ...base, endsAt: endsAt < reset ? endsAt : null }
}

/** "14:30" for a moment today, "Per 14:30" for another day, in local time. */
export function whenText(at: number, now: number): string {
  const moment = new Date(at)
  const clock = `${String(moment.getHours()).padStart(TWO_DIGITS, '0')}:${String(moment.getMinutes()).padStart(TWO_DIGITS, '0')}`
  const isToday = moment.toDateString() === new Date(now).toDateString()

  return isToday ? clock : `${t().stripDays[moment.getDay()] ?? ''} ${clock}`.trim()
}
