import { PERCENT } from './format'
import { weekdays } from './words'
import type { HudSample } from '../types'

// Two estimates, each drawn only with a basis (DESIGN.md §1, honest numbers): when a plan window
// fills at its recent burn rate, and how many turns the context has left at its average growth.

// A burn rate needs this many readings spread over at least this long, all from the last hour.
const PACE_MIN_SAMPLES = 3
const PACE_MIN_SPAN_MS = 10 * 60_000
const PACE_LOOKBACK_MS = 60 * 60_000
// The HUD line names a fill time only this close; the pane names any that falls before the reset.
export const FULL_WARN_MS = 60 * 60_000

// The context forecast reads the last turns' fill, needing this many since the last compaction.
export const TURNS_KEPT = 12
const TURNS_MIN_SAMPLES = 3
// The HUD line names the turns left only from this few.
export const TURNS_WARN = 5

type Point = { t: number; value: number }

const TWO_DIGITS = 2

export function pointsOf(history: readonly HudSample[], id: string): Point[] {
  return history.flatMap(sample => {
    const value = sample.percents[id]

    return value === undefined ? [] : [{ t: sample.t, value }]
  })
}

// The readings after the last fall: a window that reset, or a context that was compacted, starts over.
function sinceLastDrop<T>(items: readonly T[], valueOf: (item: T) => number): T[] {
  let start = 0
  for (let index = 1; index < items.length; index += 1) {
    const item = items[index]
    const before = items[index - 1]
    if (item !== undefined && before !== undefined && valueOf(item) < valueOf(before)) start = index
  }

  return items.slice(start)
}

// Least squares, so one late jump does not steer the whole estimate; percent points per ms.
function slopeOf(points: readonly Point[]): number {
  const meanT = points.reduce((sum, point) => sum + point.t, 0) / points.length
  const meanV = points.reduce((sum, point) => sum + point.value, 0) / points.length
  const top = points.reduce((sum, point) => sum + (point.t - meanT) * (point.value - meanV), 0)
  const bottom = points.reduce((sum, point) => sum + (point.t - meanT) ** 2, 0)

  return bottom === 0 ? 0 : top / bottom
}

export type FullSpec = { points: readonly Point[]; percent: number; resetsAt: string | null; nowMs: number }

// When the window reaches 100 % at the recent rate, from now; null without a basis or past the reset.
export function fullAtOf(spec: FullSpec): number | null {
  const resetMs = spec.resetsAt === null ? Number.NaN : Date.parse(spec.resetsAt)
  if (Number.isNaN(resetMs) || spec.percent >= PERCENT) return null
  const recent = sinceLastDrop(
    spec.points.filter(point => spec.nowMs - point.t <= PACE_LOOKBACK_MS),
    point => point.value,
  )
  const first = recent[0]
  const last = recent[recent.length - 1]
  if (first === undefined || last === undefined || recent.length < PACE_MIN_SAMPLES) return null
  if (last.t - first.t < PACE_MIN_SPAN_MS) return null
  const slope = slopeOf(recent)
  if (slope <= 0) return null
  const fullAt = spec.nowMs + (PERCENT - spec.percent) / slope

  return fullAt < resetMs ? Math.round(fullAt) : null
}

// Turns until the context reaches `limit` at its average growth per turn; null when flat, falling or unread.
export function turnsLeftOf(turns: readonly number[], limit: number): number | null {
  const recent = sinceLastDrop(turns, tokens => tokens)
  const first = recent[0]
  const last = recent[recent.length - 1]
  if (first === undefined || last === undefined || recent.length < TURNS_MIN_SAMPLES) return null
  const growth = (last - first) / (recent.length - 1)
  if (growth <= 0 || last >= limit) return null

  return Math.max(1, Math.floor((limit - last) / growth))
}

export const addTurn = (turns: readonly number[], tokens: number): number[] => [...turns, tokens].slice(-TURNS_KEPT)

const pad = (value: number): string => String(value).padStart(TWO_DIGITS, '0')

// A local clock time, "15:40", led by the weekday when it is not today: "Tue 15:40".
export function clockText(atMs: number, nowMs: number): string {
  const at = new Date(atMs)
  const time = `${pad(at.getHours())}:${pad(at.getMinutes())}`
  if (at.toDateString() === new Date(nowMs).toDateString()) return time

  return `${weekdays()[at.getDay()] ?? ''} ${time}`
}
