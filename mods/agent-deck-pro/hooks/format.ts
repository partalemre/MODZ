// Text shapes the pane draws: short Turkish units ("3 dk"), comma decimals, the design's spinner.

const MS_PER_SECOND = 1_000
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const THOUSAND = 1_000
const HUNDRED_THOUSAND = 100_000
const MILLION = 1_000_000
const CENT = 0.01
const SPINNER_FRAMES = ['◐', '◓', '◑', '◒']

export function shortText(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim()

  return flat.length > max ? `${flat.slice(0, Math.max(1, max - 1))}…` : flat
}

export function elapsedText(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / MS_PER_SECOND))
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE)
  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  if (hours > 0) return `${hours} sa ${String(minutes % MINUTES_PER_HOUR).padStart(2, '0')} dk`
  if (minutes > 0) return `${minutes} dk ${String(seconds % SECONDS_PER_MINUTE).padStart(2, '0')} sn`

  return `${seconds} sn`
}

// A coarse duration for summaries: seconds under a minute, whole minutes under an hour.
export function roughText(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / MS_PER_SECOND))
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE)
  if (minutes >= MINUTES_PER_HOUR) return elapsedText(ms)

  return minutes > 0 ? `${minutes} dk` : `${seconds} sn`
}

export function minutesOf(ms: number): number {
  return Math.floor(ms / (MS_PER_SECOND * SECONDS_PER_MINUTE))
}

// Turkish decimals: a comma, never a point.
function decimal(value: number, digits: number): string {
  return value.toFixed(digits).replace('.', ',')
}

// One decimal under a hundred thousand ("18,4k"), none above ("182k").
export function compact(count: number): string {
  if (count >= MILLION) return `${decimal(count / MILLION, 1)}M`
  if (count >= HUNDRED_THOUSAND) return `${Math.round(count / THOUSAND)}k`

  return count >= THOUSAND ? `${decimal(count / THOUSAND, 1)}k` : String(Math.round(count))
}

export function costText(usd: number): string {
  return `≈$${decimal(usd, usd < CENT ? 3 : 2)}`
}

// One frame a second: the pane's own one-second beat turns it, so no faster timer runs.
export function spinnerAt(nowMs: number): string {
  return SPINNER_FRAMES[Math.floor(nowMs / MS_PER_SECOND) % SPINNER_FRAMES.length] ?? '◐'
}

export function shortModel(model: string | null): string {
  if (model === null) return ''

  return model.replace(/^claude-/, '').replace(/-\d{8}$/, '')
}
