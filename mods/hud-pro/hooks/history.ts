import { CONTEXT } from './format'
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

// The account's limit windows alone, without this session's context and cost; null when it holds no limit.
function limitsOnly(sample: HudSample): HudSample | null {
  const percents = Object.fromEntries(Object.entries(sample.percents).filter(([id]) => id !== CONTEXT))

  return Object.keys(percents).length === 0 ? null : { t: sample.t, percents }
}

const limitsOf = (history: readonly HudSample[]): HudSample[] => history.map(limitsOnly).filter((sample): sample is HudSample => sample !== null)

// What a session starts from: the limits every session shares. Context and cost are each session's own, so another
// session's never reach this one's sparklines.
export const accountHistory = (saved: readonly HudSample[]): HudSample[] => limitsOf(saved)

// What is stored: the stored limits and this session's, one sample per moment, so two open sessions add to the
// history instead of the last save replacing the other's.
export function mergeHistory(stored: readonly HudSample[], mine: readonly HudSample[]): HudSample[] {
  const byTime = new Map<number, HudSample>()
  for (const sample of [...limitsOf(stored), ...limitsOf(mine)]) byTime.set(sample.t, sample)

  return [...byTime.values()].sort((a, b) => a.t - b.t).slice(-HISTORY_MAX)
}

// Whether a new sample moved a limit: only then is the store written, since every write rewrites the mod's whole file.
export function hasLimitsMoved(before: HudSample | undefined, after: HudSample | undefined): boolean {
  const left = before === undefined ? null : limitsOnly(before)
  const right = after === undefined ? null : limitsOnly(after)
  if (right === null) return false

  return left === null || !isSame(left, right)
}

export function isHistory(value: unknown): value is HudSample[] {
  return Array.isArray(value) && value.every(item => typeof item === 'object' && item !== null && 'percents' in item && 't' in item)
}
