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

const twoDigits = (n: number): string => String(n).padStart(2, '0')

// When a session was last written, in local time: "Oct 12, 14:05"; '' when unknown.
export function dateText(at: number): string {
  if (!Number.isFinite(at) || at <= 0) return ''
  const day = new Date(at)
  const w = words()

  return w.date(w.months[day.getMonth()] ?? '', day.getDate(), `${twoDigits(day.getHours())}:${twoDigits(day.getMinutes())}`)
}
