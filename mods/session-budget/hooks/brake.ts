import type { BrakeAck, PacePoint } from '../types'
import { words } from './words'

// The spawn brake: before a subagent starts, a 5h window at the brake line, or one that would fill
// before it resets at the recent pace, asks first. The pace is hud-pro's forecast idea, kept small.

export type BrakeCommand = { kind: 'brake'; at: number | null } | { kind: 'brakeStatus' } | { kind: 'error'; text: string }

export const BRAKE_DEFAULT = 85
// "Continue" lets spawns through until the window has moved this many points more.
export const ACK_POINTS = 5
const MAX_PERCENT = 100
// A pace needs this many readings spread over at least this long, all from the last hour.
const PACE_MIN_SAMPLES = 3
const PACE_MIN_SPAN_MS = 10 * 60_000
const PACE_LOOKBACK_MS = 60 * 60_000
const TWO_DIGITS = 2

// `arg` arrives lowercased with its spaces taken out: "brake", "brakeoff", "brake85", "brake85%".
export function parseBrake(arg: string): BrakeCommand {
  if (arg === '') return { kind: 'brakeStatus' }
  if (arg === 'off') return { kind: 'brake', at: null }
  const match = /^(\d+(?:\.\d+)?)%?$/.exec(arg)
  const at = match === null ? Number.NaN : Number(match[1])

  return at > 0 && at <= MAX_PERCENT ? { kind: 'brake', at } : { kind: 'error', text: words().brakeUsage }
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
export function fullAtOf(points: readonly PacePoint[], resetsAt: string | null): number | null {
  const first = points[0]
  const last = points[points.length - 1]
  const resetMs = resetsAt === null ? Number.NaN : Date.parse(resetsAt)
  if (first === undefined || last === undefined || Number.isNaN(resetMs)) return null
  if (points.length < PACE_MIN_SAMPLES || last.t - first.t < PACE_MIN_SPAN_MS) return null
  const slope = slopeOf(points)
  if (slope <= 0) return null
  const fullAt = last.t + (MAX_PERCENT - last.value) / slope

  return fullAt < resetMs ? fullAt : null
}

export type BrakeSpec = { at: number | null; points: readonly PacePoint[]; resetsAt: string | null; ack: BrakeAck | null }

// Why this spawn is held ("5-hour window at 88%, resets 14:20"), or null to let it through.
export function brakeWhy(spec: BrakeSpec): string | null {
  const last = spec.points[spec.points.length - 1]
  if (spec.at === null || last === undefined) return null
  const { ack } = spec
  if (ack !== null && ack.window === spec.resetsAt && last.value < ack.percent + ACK_POINTS) return null
  const fullAt = fullAtOf(spec.points, spec.resetsAt)
  if (last.value < spec.at && fullAt === null) return null
  const says = words()
  const percent = says.percent(says.decimal(String(last.value)))
  const pace = fullAt === null ? '' : says.brakePace(clockOf(fullAt))
  const reset = spec.resetsAt === null ? '' : says.brakeReset(clockOf(Date.parse(spec.resetsAt)))

  return says.brakeWhy(percent, pace, reset)
}

const pad = (value: number): string => String(value).padStart(TWO_DIGITS, '0')

// A local clock time, "14:20": a 5h window resets within the next five hours.
export function clockOf(atMs: number): string {
  const at = new Date(atMs)

  return `${pad(at.getHours())}:${pad(at.getMinutes())}`
}
