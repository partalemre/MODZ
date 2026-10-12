import type { Tone } from './theme'
import { longLabels, shortLabels, units } from './words'
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

export const labelOf = (id: string): string => shortLabels()[id] ?? id.replace(/_/g, ' ')
export const longLabelOf = (id: string): string => longLabels()[id] ?? id.replace(/_/g, ' ')

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

// Numbers in the interface language: Turkish puts a comma decimal and the percent sign first.
export const decimal = (value: number, digits: number): string => value.toFixed(digits).replace('.', units().decimalMark)

// One decimal at most, none when it is zero: 128k, 12.4k (12,4k in Turkish).
const short = (value: number): string => value.toFixed(1).replace(/\.0$/, '').replace('.', units().decimalMark)

export const percentText = (percent: number): string => units().percent(Math.round(percent))

// A gauge's value: a window that ran out reads "full", never past 100 (DESIGN.md §4, Ölçer).
export const isFull = (percent: number): boolean => percent >= PERCENT
export const valueText = (percent: number): string => (isFull(percent) ? units().full : percentText(percent))

// The glyph that marks a reset countdown, on both surfaces: "↻ 1h 20m".
export const RESET_MARK = '↻'
export const resetText = (reset: string): string => `${RESET_MARK} ${reset}`

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
  const unit = units()
  if (days > 0) return `${days}${unit.day} ${hours}${unit.hour}`
  if (hours > 0) return `${hours}${unit.hour} ${minutes % MINUTES_PER_HOUR}${unit.minute}`

  return `${minutes}${unit.minute}`
}
