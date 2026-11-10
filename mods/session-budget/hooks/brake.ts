import type { BrakeAck, PacePoint } from '../types'
import { words } from './words'

// The spawn brake: before a subagent starts, a 5h window at the brake line, or one that would fill
// before it resets at the recent pace, asks first. The pace is hud-pro's forecast idea, kept small.

export type BrakeCommand = { kind: 'brake'; at: number | null } | { kind: 'brakeStatus' } | { kind: 'error'; text: string }

export const BRAKE_DEFAULT = 85
// "Continue" lets spawns through until the window has moved this many points more.
export const ACK_POINTS = 5
const MAX_PERCENT = 100
// Below this the pace alone never asks: early in a window a short burst projects a fill that rarely comes.
const PACE_FLOOR = 50
// A pace needs this many readings spread over at least this long, all from the last hour.
const PACE_MIN_SAMPLES = 3
const PACE_MIN_SPAN_MS = 10 * 60_000
const PACE_LOOKBACK_MS = 60 * 60_000
const DAY_MS = 24 * 60 * 60_000
const WEEK_MS = 7 * DAY_MS
const TWO_DIGITS = 2
// A reset time that moves less than this is the same window: the engine's text shifts by seconds.
const SAME_WINDOW_MS = 10 * 60_000

// `arg` arrives lowercased with its spaces taken out: "brake", "brakeoff", "brake85", "brake85%".
export function parseBrake(arg: string): BrakeCommand {
  if (arg === '') return { kind: 'brakeStatus' }
  if (arg === 'off') return { kind: 'brake', at: null }
  const match = /^(\d+(?:\.\d+)?)%?$/.exec(arg)
  const at = match === null ? Number.NaN : Number(match[1])

  return at > 0 && at <= MAX_PERCENT ? { kind: 'brake', at } : { kind: 'error', text: words().brakeUsage }
}

// A later window: its reset time moved forward past the tolerance (text compared when it is not a time).
export function isNewWindow(before: string | null, after: string | null): boolean {
  if (before === null || after === null) return false
  const delta = Date.parse(after) - Date.parse(before)

  return Number.isNaN(delta) ? before !== after : delta > SAME_WINDOW_MS
}

// The readings of this window from the last hour; a fall means the window reset, so counting starts over.
export function addPoint(points: readonly PacePoint[], point: PacePoint): PacePoint[] {
  const last = points[points.length - 1]
  const kept = last !== undefined && point.value < last.value ? [] : points.filter(p => point.t - p.t <= PACE_LOOKBACK_MS)

  return [...kept, point]
}

// Least squares, so one late jump does not steer the whole estimate; percent points per ms.
function slopeOf(points: readonly PacePoint[]): number {
  const meanT = points.reduce((sum, p) => sum + p.t, 0) / points.length
  const meanV = points.reduce((sum, p) => sum + p.value, 0) / points.length
  const top = points.reduce((sum, p) => sum + (p.t - meanT) * (p.value - meanV), 0)
  const bottom = points.reduce((sum, p) => sum + (p.t - meanT) ** 2, 0)

  return bottom === 0 ? 0 : top / bottom
}

// When the window reaches 100% at the recent pace; null without a basis, or when the reset comes first.
export function fullAtOf(points: readonly PacePoint[], resetsAt: string | null, isWeekly = false): number | null {
  const first = points[0]
  const last = points[points.length - 1]
  const resetMs = resetsAt === null ? Number.NaN : Date.parse(resetsAt)
  if (first === undefined || last === undefined || Number.isNaN(resetMs)) return null
  if (points.length < PACE_MIN_SAMPLES || last.t - first.t < PACE_MIN_SPAN_MS) return null
  const slope = slopeOf(points)
  if (slope <= 0) return null
  // Nobody works around the clock: the week's own average, idle hours included, caps the last hour's pace.
  const elapsed = last.t - (resetMs - WEEK_MS)
  const pace = isWeekly && elapsed > 0 ? Math.min(slope, last.value / elapsed) : slope
  const fullAt = last.t + (MAX_PERCENT - last.value) / pace

  return fullAt < resetMs ? fullAt : null
}

export type BrakeSpec = { at: number | null; points: readonly PacePoint[]; resetsAt: string | null; ack: BrakeAck | null; isWeekly?: boolean }

// Why this spawn is held ("5-hour window at 88%, resets 14:20"), or null to let it through.
export function brakeWhy(spec: BrakeSpec): string | null {
  const last = spec.points[spec.points.length - 1]
  if (spec.at === null || last === undefined) return null
  const { ack } = spec
  if (ack !== null && !isNewWindow(ack.window, spec.resetsAt) && last.value < ack.percent + ACK_POINTS) return null
  const fullAt = last.value < PACE_FLOOR ? null : fullAtOf(spec.points, spec.resetsAt, spec.isWeekly === true)
  if (last.value < spec.at && fullAt === null) return null
  const says = words()
  const percent = says.percent(says.decimal(String(last.value)))
  const pace = fullAt === null ? '' : says.brakePace(clockOf(fullAt, last.t))
  const reset = spec.resetsAt === null ? '' : says.brakeReset(clockOf(Date.parse(spec.resetsAt), last.t))

  return (spec.isWeekly === true ? says.brakeWhyWeekly : says.brakeWhy)(percent, pace, reset)
}

const pad = (value: number): string => String(value).padStart(TWO_DIGITS, '0')

// A local clock time, "14:20"; a weekly window's reset more than a day off adds the date, "14:20 12.11".
export function clockOf(atMs: number, nowMs = atMs): string {
  const at = new Date(atMs)
  const time = `${pad(at.getHours())}:${pad(at.getMinutes())}`

  return atMs - nowMs > DAY_MS ? `${time} ${pad(at.getDate())}.${pad(at.getMonth() + 1)}` : time
}
