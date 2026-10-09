import type { Tone } from './theme'
import type { HudGauge, HudTurn } from '../types'

const THOUSAND = 1_000
const MILLION = 1_000_000
export const PERCENT = 100
const MS_PER_MINUTE = 60_000
const MINUTES_PER_HOUR = 60
const MINUTES_PER_DAY = 1_440
const MS_PER_HOUR = 3_600_000
const HOURS_PER_DAY = 24

// Neutral until a value runs this many points ahead of its pace, Flare from DANGER.
export const AHEAD_POINTS = 10
export const DANGER_PERCENT = 95
// With no pace to compare to: context warns where compacting starts to pay, other limits at 80.
export const CONTEXT_WARN = 70
const NO_PACE_WARN = 80

export const CONTEXT = 'context'
export const FIVE_HOUR = 'five_hour'

// How long each plan window runs, for its pace; a window not named here has none.
const WINDOW_MS: Readonly<Record<string, number>> = {
  five_hour: 5 * MS_PER_HOUR,
  seven_day: 7 * HOURS_PER_DAY * MS_PER_HOUR,
}

const SHORT: Readonly<Record<string, string>> = { five_hour: '5s', seven_day: '7g', spend_limit: 'harcama', context: 'bağlam' }
const LONG: Readonly<Record<string, string>> = { five_hour: '5 saat', seven_day: '7 gün', spend_limit: 'harcama limiti', context: 'bağlam' }

export const labelOf = (id: string): string => SHORT[id] ?? id.replace(/_/g, ' ')
export const longLabelOf = (id: string): string => LONG[id] ?? id.replace(/_/g, ' ')

// Where the value would be if spent evenly across its window, in percent; null without a window.
export function paceOf(gauge: Pick<HudGauge, 'id' | 'resetsAt'>, nowMs: number): number | null {
  const windowMs = WINDOW_MS[gauge.id]
  if (windowMs === undefined || gauge.resetsAt === null) return null
  const resetMs = Date.parse(gauge.resetsAt)
  if (Number.isNaN(resetMs)) return null
  const elapsed = windowMs - Math.max(0, resetMs - nowMs)

  return Math.max(0, Math.min(PERCENT, (elapsed / windowMs) * PERCENT))
}

export function toneOf(spec: { id: string; percent: number; pace: number | null }): Tone {
  if (spec.percent >= DANGER_PERCENT) return 'danger'
  if (spec.pace !== null) return spec.percent >= spec.pace + AHEAD_POINTS ? 'warn' : 'neutral'

  return spec.percent >= (spec.id === CONTEXT ? CONTEXT_WARN : NO_PACE_WARN) ? 'warn' : 'neutral'
}

// Turkish numbers: comma decimals, the percent sign first.
export const decimal = (value: number, digits: number): string => value.toFixed(digits).replace('.', ',')

// One decimal at most, none when it is zero: 128k, 12,4k.
const short = (value: number): string => decimal(value, 1).replace(/,0$/, '')

export const percentText = (percent: number): string => `%${Math.round(percent)}`

export const costText = (usd: number): string => `≈$${decimal(usd, 2)}`

export function compact(count: number): string {
  if (count >= MILLION) return `${short(count / MILLION)}M`
  if (count >= THOUSAND) return `${short(count / THOUSAND)}k`

  return String(Math.round(count))
}

export function cachePercent(turn: HudTurn): number {
  if (turn.input === 0) return 0

  return Math.round((turn.cacheRead / turn.input) * PERCENT)
}

// Filled cells of a bar `width` wide, rounded so a non-zero value shows at least one cell.
export function filledCells(percent: number, width: number): number {
  const clamped = Math.max(0, Math.min(PERCENT, percent))
  if (clamped === 0) return 0

  return Math.max(1, Math.round((clamped / PERCENT) * width))
}

export function untilReset(resetsAt: string | null, nowMs: number): string {
  if (resetsAt === null) return ''
  const resetMs = Date.parse(resetsAt)
  if (Number.isNaN(resetMs)) return ''

  const minutes = Math.max(0, Math.round((resetMs - nowMs) / MS_PER_MINUTE))
  const days = Math.floor(minutes / MINUTES_PER_DAY)
  const hours = Math.floor((minutes % MINUTES_PER_DAY) / MINUTES_PER_HOUR)
  if (days > 0) return `${days}g ${hours}sa`
  if (hours > 0) return `${hours}sa ${minutes % MINUTES_PER_HOUR}dk`

  return `${minutes}dk`
}
