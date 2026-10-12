import { words } from './words'

// How long ago a replayed turn ended, in the pane's own words: "just now", "3m ago", "2h ago".
const MINUTE_MS = 60_000
const HOUR_MINUTES = 60
const DAY_HOURS = 24

export function ageText(at: number | undefined, now: number): string {
  if (at === undefined || !Number.isFinite(at) || now < at) return ''
  const minutes = Math.floor((now - at) / MINUTE_MS)
  const w = words()
  if (minutes < 1) return w.justNow
  if (minutes < HOUR_MINUTES) return w.minutesAgo(minutes)
  const hours = Math.floor(minutes / HOUR_MINUTES)

  return hours < DAY_HOURS ? w.hoursAgo(hours) : w.daysAgo(Math.floor(hours / DAY_HOURS))
}
