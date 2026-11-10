// The hub's "Now" area: what fails or waits, what runs, and the usage, read without leaving the hub. Each is a
// mod's own row lifted to the top, with the lines of its live payload (HubLive) under it. Pure: no `$`.
import type { HubCard } from '../types'
import type { HubRow } from './hub'
import { hubWords } from './words'

// Usage is always worth a glance, so its row stands in the area whenever its mod reports.
export const USAGE_PANE = 'usage'

export type NowLine = { label: string; value: string }

// A row in the area, its live lines and how many more its mod has than the lines say.
export type NowRow = { row: HubRow; lines: NowLine[]; more: number }

const SECOND = 1_000
const MINUTE_S = 60
const HOUR_M = 60
// Under a minute the time is said in steps this long, so the hub redraws for it a few times, not every second.
const STEP_S = 10

// How long something has run, as short as a glance needs: "now", "40s", "4m", "1h 05m".
export function elapsedText(ms: number): string {
  const ago = hubWords().ago
  const seconds = Math.max(0, Math.floor(ms / SECOND))
  if (seconds < STEP_S) return ago.now
  if (seconds < MINUTE_S) return ago.seconds(Math.floor(seconds / STEP_S) * STEP_S)
  const minutes = Math.floor(seconds / MINUTE_S)

  return minutes < HOUR_M ? ago.minutes(minutes) : ago.hours(Math.floor(minutes / HOUR_M), minutes % HOUR_M)
}

// What leads: a failure, then a warning (a held command, a limit near), then running work, then the usage.
const RANK_BAD = 4
const RANK_WARN = 3
const RANK_LIVE = 2
const RANK_USAGE = 1

function rankOf(card: HubCard): number {
  if (card.tone === 'bad') return RANK_BAD
  if (card.tone === 'warn') return RANK_WARN
  if (card.live !== undefined) return RANK_LIVE

  return card.pane === USAGE_PANE ? RANK_USAGE : 0
}

const isNow = (card: HubCard | null): card is HubCard => card !== null && (card.detail !== '' || card.live !== undefined) && rankOf(card) > 0

function linesOf(card: HubCard, now: number): NowLine[] {
  return (card.live?.lines ?? []).map(line => {
    const ran = line.since === undefined ? undefined : elapsedText(now - line.since)

    return { label: line.label, value: [ran, line.value].filter(Boolean).join(' · ') }
  })
}

// The area's rows, the most pressing first; rows of one rank keep the hub's own order.
export function nowOf(rows: HubRow[], now: number): NowRow[] {
  return rows
    .flatMap(row => (isNow(row.card) ? [{ row, lines: linesOf(row.card, now), more: row.card.live?.more ?? 0, rank: rankOf(row.card) }] : []))
    .sort((a, b) => b.rank - a.rank)
    .map(({ row, lines, more }) => ({ row, lines, more }))
}

// Whether any card shows a time that runs: only then does the hub redraw on its own beat.
export const hasRunningClock = (cards: Record<string, HubCard>): boolean =>
  Object.values(cards).some(card => card.live?.lines.some(line => line.since !== undefined) === true)
