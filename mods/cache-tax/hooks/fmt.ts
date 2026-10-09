// Number and time formats, Turkish style: `6 sa 38 dk`, `51.929`, `$0,52` (the decimal comma, as every MODZ mod).

import { MIN_MS } from './core'

const MIN_PER_HOUR = 60
const HOURS_PER_DAY = 24
const DAYS_FROM_HOURS = 48
const WHOLE_DOLLARS_FROM = 100

/** Turkish short form: `6 sa 38 dk`, `3 sa`, `45 dk`, `2 gün 4 sa`. `sa`, never `s`, which reads as seconds. */
export function fmtDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / MIN_MS))
  const h = Math.floor(total / MIN_PER_HOUR)
  const m = total % MIN_PER_HOUR
  if (h >= DAYS_FROM_HOURS) return `${Math.floor(h / HOURS_PER_DAY)} gün ${h % HOURS_PER_DAY} sa`
  if (h === 0) return `${m} dk`
  return m === 0 ? `${h} sa` : `${h} sa ${m} dk`
}

/** A decimal with the Turkish comma: 18.75 → `18,75`. */
export const trDecimal = (n: number): string => String(n).replace('.', ',')

export function fmtUsd(usd: number | null): string {
  return usd == null ? '—' : '$' + (usd >= WHOLE_DOLLARS_FROM ? usd.toFixed(0) : usd.toFixed(2).replace('.', ','))
}

/** Turkish digit grouping: 51.929. */
export function fmtInt(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function fmtTok(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + 'M'
  return n >= 1000 ? Math.round(n / 1000) + 'k' : String(n)
}
