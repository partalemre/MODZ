// Number and time formats, Turkish style: `6s 38dk`, `51.929`, `$0.52`.

import { MIN_MS } from './core'

/** Turkish short form: `6s 38dk`, `3s`, `45dk`, `2g 4s` (saat, dakika, gün). */
export function fmtDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / MIN_MS))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h >= 48) return `${Math.floor(h / 24)}g ${h % 24}s`
  if (h === 0) return `${m}dk`
  return m === 0 ? `${h}s` : `${h}s ${m}dk`
}

export function fmtUsd(usd: number | null): string {
  return usd == null ? '—' : '$' + (usd >= 100 ? usd.toFixed(0) : usd.toFixed(2))
}

/** Turkish digit grouping: 51.929. */
export function fmtInt(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function fmtTok(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + 'M'
  return n >= 1000 ? Math.round(n / 1000) + 'k' : String(n)
}
