// How long ago a replayed turn ended, in the pane's own words: "az önce", "3 dk önce", "2 sa önce".
const MINUTE_MS = 60_000
const HOUR_MINUTES = 60
const DAY_HOURS = 24

export function ageText(at: number | undefined, now: number): string {
  if (at === undefined || !Number.isFinite(at) || now < at) return ''
  const minutes = Math.floor((now - at) / MINUTE_MS)
  if (minutes < 1) return 'az önce'
  if (minutes < HOUR_MINUTES) return `${minutes} dk önce`
  const hours = Math.floor(minutes / HOUR_MINUTES)

  return hours < DAY_HOURS ? `${hours} sa önce` : `${Math.floor(hours / DAY_HOURS)} gün önce`
}
