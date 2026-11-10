import { burnOf, fullAtOf, pointsOf, recentOf } from './forecast'
import { FIVE_HOUR } from './format'
import type { HudGauge, HudSample, HudUsage, TurnShare } from '../types'

// The pace of the limit window that exists (the 5-hour one, else the weekly one): each recent turn's share of it,
// its burn rate, and when it fills at that rate. Pure.

export const SEVEN_DAY = 'seven_day'
const HOUR_MS = 3_600_000
const DAY_HOURS = 24
// A week is read over a day of readings, since an hour of work says little about seven days.
const LOOKBACK_MS: Readonly<Record<string, number>> = { [FIVE_HOUR]: HOUR_MS, [SEVEN_DAY]: DAY_HOURS * HOUR_MS }
// A share worth a line above the prompt: ten such turns empty a 5-hour window; three points of a week are about
// five hours of its even pace (100 % over 168 h is 0.6 points an hour).
export const NOTABLE_SHARE: Readonly<Record<string, number>> = { [FIVE_HOUR]: 10, [SEVEN_DAY]: 3 }
export const SHARES_KEPT = 5

export type Pace = { gauge: HudGauge; readings: number; perHour: number | null; fullAt: number | null }

export function paceWindow(usage: HudUsage | null): HudGauge | null {
  const gauges = usage?.gauges ?? []

  return gauges.find(gauge => gauge.id === FIVE_HOUR) ?? gauges.find(gauge => gauge.id === SEVEN_DAY) ?? null
}

// A turn's share: the points the window rose while it ran; all of the new reading when the window reset meanwhile.
export function shareOf(before: HudGauge | null, after: HudGauge): number {
  const isSameWindow = before !== null && before.id === after.id && before.resetsAt === after.resetsAt

  return Math.max(0, isSameWindow ? after.percent - before.percent : after.percent)
}

export const isNotable = (share: TurnShare): boolean => share.share >= (NOTABLE_SHARE[share.window] ?? Number.POSITIVE_INFINITY)

export const addShare = (shares: readonly TurnShare[], share: TurnShare): TurnShare[] => [...shares, share].slice(-SHARES_KEPT)

export function paceOf(spec: { usage: HudUsage | null; history: readonly HudSample[]; nowMs: number }): Pace | null {
  const gauge = paceWindow(spec.usage)
  if (gauge === null) return null
  const burn = { points: pointsOf(spec.history, gauge.id), nowMs: spec.nowMs, lookbackMs: LOOKBACK_MS[gauge.id] ?? HOUR_MS }
  const slope = burnOf(burn)

  return {
    gauge,
    readings: recentOf(burn).length,
    perHour: slope === null ? null : slope * HOUR_MS,
    fullAt: fullAtOf({ ...burn, percent: gauge.percent, resetsAt: gauge.resetsAt }),
  }
}
