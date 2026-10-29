import { dayKey, dayStart } from './past-log'
import type { HudCell, HudLog, HudPast, HudRange } from '../types'

// The history card's figures over the last 7 or 30 local days, today included: active days, sessions, tokens,
// the model that answered most replies, and a heatmap cell per day shaded against the range's busiest day.

export const RANGES: readonly HudRange[] = [7, 30]
// Shades above "none": the busiest day of the range is the top one.
export const LEVELS = 4

// `claude-opus-5-5` reads "Opus 5.5", `claude-haiku-4-5-20251001` "Haiku 4.5"; another shape keeps its id.
const MODEL = /^claude-([a-z]+)-(\d+(?:-\d{1,2})*)(?:-\d{8})?$/

export function modelName(id: string): string {
  const found = MODEL.exec(id)
  if (found === null) return id
  const family = found[1] as string

  return `${family.charAt(0).toUpperCase()}${family.slice(1)} ${(found[2] as string).replace(/-/g, '.')}`
}

// The range's days, oldest first.
const rangeDays = (range: HudRange, nowMs: number): number[] => Array.from({ length: range }, (_, index) => dayStart(nowMs, range - 1 - index))

const levelOf = (tokens: number, max: number): number => (tokens <= 0 || max <= 0 ? 0 : Math.max(1, Math.ceil((tokens / max) * LEVELS)))

function topModel(counts: Map<string, number>): string | null {
  const ranked = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  return ranked[0] === undefined ? null : modelName(ranked[0][0])
}

export function pastOf(days: HudLog['days'], spec: { range: HudRange; nowMs: number }): HudPast {
  const starts = rangeDays(spec.range, spec.nowMs)
  const found = starts.map(start => ({ start, key: dayKey(start), day: days[dayKey(start)] }))
  const max = Math.max(0, ...found.map(entry => entry.day?.tokens ?? 0))
  const sessions = new Set<string>()
  const models = new Map<string, number>()
  for (const { day } of found) {
    for (const session of day?.sessions ?? []) sessions.add(session)
    for (const [model, count] of Object.entries(day?.models ?? {})) models.set(model, (models.get(model) ?? 0) + count)
  }
  const cells: HudCell[] = found.map(({ start, key, day }) => ({ day: key, weekday: new Date(start).getDay(), tokens: day?.tokens ?? 0, level: levelOf(day?.tokens ?? 0, max) }))

  return {
    range: spec.range,
    activeDays: cells.filter(cell => cell.tokens > 0).length,
    sessions: sessions.size,
    tokens: cells.reduce((sum, cell) => sum + cell.tokens, 0),
    model: topModel(models),
    cells,
  }
}

export const pastsOf = (days: HudLog['days'], nowMs: number) => ({ week: pastOf(days, { range: 7, nowMs }), month: pastOf(days, { range: 30, nowMs }) })
