// Number and time formats in the person's language. Turkish: `6 sa 38 dk`, `51.929`, `$0,52` (the decimal comma,
// as every MODZ mod). English: `6h 38m`, `51,929`, `$0.52`.

import { MIN_MS } from './core'
import { pick } from './lang'

const MIN_PER_HOUR = 60
const HOURS_PER_DAY = 24
const DAYS_FROM_HOURS = 48
const WHOLE_DOLLARS_FROM = 100

// Turkish says `sa`, never `s`, which reads as seconds; the unit carries its own space where the language has one.
const UNITS = {
  en: { day: 'd', hour: 'h', min: 'm', point: '.', group: ',' },
  tr: { day: ' gün', hour: ' sa', min: ' dk', point: ',', group: '.' },
}

/** Short form: `6 sa 38 dk` / `6h 38m`, `3 sa`, `45 dk`, `2 gün 4 sa` / `2d 4h`. */
export function fmtDuration(ms: number): string {
  const u = pick(UNITS)
  const total = Math.max(0, Math.round(ms / MIN_MS))
  const h = Math.floor(total / MIN_PER_HOUR)
  const m = total % MIN_PER_HOUR
  if (h >= DAYS_FROM_HOURS) return `${Math.floor(h / HOURS_PER_DAY)}${u.day} ${h % HOURS_PER_DAY}${u.hour}`
  if (h === 0) return `${m}${u.min}`
  return m === 0 ? `${h}${u.hour}` : `${h}${u.hour} ${m}${u.min}`
}

/** A decimal with the language's point: 18.75 → `18,75` in Turkish. */
export const decimal = (n: number | string): string => String(n).replace('.', pick(UNITS).point)

export function fmtUsd(usd: number | null): string {
  return usd == null ? '—' : '$' + (usd >= WHOLE_DOLLARS_FROM ? usd.toFixed(0) : decimal(usd.toFixed(2)))
}

/** Digit grouping: 51.929 in Turkish, 51,929 in English. */
export function fmtInt(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, pick(UNITS).group)
}

export function fmtTok(n: number): string {
  if (n >= 1e6) return decimal((n / 1e6).toFixed(1)) + 'M'
  return n >= 1000 ? Math.round(n / 1000) + 'k' : String(n)
}
