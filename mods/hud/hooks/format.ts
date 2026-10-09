import type { HudTurn } from '../types'

const THOUSAND = 1_000
const MILLION = 1_000_000
const PERCENT = 100
const MS_PER_MINUTE = 60_000
const MINUTES_PER_HOUR = 60
const MINUTES_PER_DAY = 1_440

const LABELS: Record<string, string> = {
  five_hour: '5h',
  seven_day: '7d',
  spend_limit: 'spend',
  context: 'ctx',
}

export function labelOf(id: string): string {
  return LABELS[id] ?? id
}

export function compact(count: number): string {
  if (count >= MILLION) return `${(count / MILLION).toFixed(1)}M`
  if (count >= THOUSAND) return `${(count / THOUSAND).toFixed(1)}k`

  return String(Math.round(count))
}

export function cachePercent(turn: HudTurn): number {
  if (turn.input === 0) return 0

  return Math.round((turn.cacheRead / turn.input) * PERCENT)
}

export function untilReset(resetsAt: string | null, nowMs: number): string {
  if (resetsAt === null) return ''
  const resetMs = Date.parse(resetsAt)
  if (Number.isNaN(resetMs)) return ''

  const minutes = Math.max(0, Math.round((resetMs - nowMs) / MS_PER_MINUTE))
  const days = Math.floor(minutes / MINUTES_PER_DAY)
  const hours = Math.floor((minutes % MINUTES_PER_DAY) / MINUTES_PER_HOUR)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes % MINUTES_PER_HOUR}m`

  return `${minutes}m`
}

export function percentText(percent: number): string {
  return `${Math.round(percent)}%`
}
