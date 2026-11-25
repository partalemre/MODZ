import { t } from './i18n'

// What the session strip counts on its own (events.ts fills it at each turn's end) and how a span of time reads.
// The strip itself is drawn in strip.tsx: its scene (strip-scene.ts) and its chips (strip-chips.ts).

export type Tally = { tokens: number; busyMs: number; turns: number; lastCost: number; costBefore: number; turnAt?: number }
export const NO_TALLY: Tally = { tokens: 0, busyMs: 0, turns: 0, lastCost: 0, costBefore: 0 }

const SECOND = 1000
const MINUTE = 60
const HOUR = 60 * MINUTE

// "12dk 57sn"-style time in the interface language, never a clock face.
export const spanText = (ms: number): string => {
  const s = Math.round(ms / SECOND)
  const words = t()
  if (s >= HOUR) return `${words.hours(Math.floor(s / HOUR))} ${words.minutes(Math.floor((s % HOUR) / MINUTE))}`
  if (s >= MINUTE) return `${words.minutes(Math.floor(s / MINUTE))} ${words.seconds(s % MINUTE)}`

  return words.seconds(s)
}
