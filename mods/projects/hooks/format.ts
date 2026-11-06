import { words } from './words'
import type { Percent } from '../types'

const K = 1000
const M = 1_000_000
const MIN_MS = 60_000
const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000

const trimmed = (value: number): string => (value >= 100 ? String(Math.round(value)) : String(Math.round(value * 10) / 10))

export function tokensText(count: number): string {
  if (count >= K * M) return `${trimmed(count / (K * M))}B`
  if (count >= M) return `${trimmed(count / M)}M`
  if (count >= K) return `${trimmed(count / K)}k`

  return String(count)
}

export function agoText(thenMs: number, nowMs: number): string {
  const { ago } = words()
  const gap = nowMs - thenMs
  if (thenMs === 0) return '—'
  if (gap < MIN_MS) return ago.now
  if (gap < HOUR_MS) return ago.min(Math.floor(gap / MIN_MS))
  if (gap < DAY_MS) return ago.hour(Math.floor(gap / HOUR_MS))

  return ago.day(Math.floor(gap / DAY_MS))
}

export function spanText(ms: number): string {
  if (ms < MIN_MS) return `${Math.round(ms / 1000)} s`
  if (ms < HOUR_MS) return `${Math.round(ms / MIN_MS)} min`

  return `${trimmed(ms / HOUR_MS)} h`
}

// `~` marks a number that is a judgment (DESIGN.md §1.2); a counted one has none, and no number is a dash.
export function percentText(percent: Percent): string {
  if (percent.value === null) return '—'

  return `${percent.kind === 'estimate' ? '~' : ''}${percent.value}%`
}
