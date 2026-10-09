import type { HudSample, HudUsage } from '../types'

export const HISTORY_MAX = 96
// A flat reading still lands once in a while so the history keeps covering recent time.
const IDLE_SAMPLE_MS = 300_000

function percentsOf(usage: HudUsage | null): Record<string, number> {
  const percents: Record<string, number> = {}
  for (const gauge of usage?.gauges ?? []) percents[gauge.id] = gauge.percent

  return percents
}

function isSame(left: HudSample, right: HudSample): boolean {
  const keys = new Set([...Object.keys(left.percents), ...Object.keys(right.percents)])

  return left.cost === right.cost && [...keys].every(key => left.percents[key] === right.percents[key])
}

export function addSample(history: HudSample[], usage: HudUsage, nowMs: number): HudSample[] {
  const sample: HudSample = { t: nowMs, percents: percentsOf(usage), ...(usage.costUsd === null ? {} : { cost: usage.costUsd }) }
  const last = history[history.length - 1]
  if (last !== undefined && isSame(last, sample) && nowMs - last.t < IDLE_SAMPLE_MS) return history

  return [...history, sample].slice(-HISTORY_MAX)
}

export function seriesOf(history: HudSample[], id: string): number[] {
  return history.map(sample => sample.percents[id]).filter((value): value is number => value !== undefined)
}

export function costSeries(history: HudSample[]): number[] {
  return history.map(sample => sample.cost).filter((value): value is number => value !== undefined)
}

export function isHistory(value: unknown): value is HudSample[] {
  return Array.isArray(value) && value.every(item => typeof item === 'object' && item !== null && 'percents' in item && 't' in item)
}
