import type { HudDay, HudLog } from '../types'

// Past usage from the session transcripts, day by day: one extracted line read back into a reply, and the days it
// adds to. The lines are external input: every field is checked here and a line that does not read is dropped.
// A reply counts once by its id, however many lines, files or rescans repeat it (a fork copies its parent's).

export type LogRow = { session: string; model: string; id: string; atMs: number; tokens: number; cache: number }

// The longest range the pane shows; older days are dropped.
export const DAYS_KEPT = 30
// 2: input + output counted apart from cache reads and writes. A log of another version is read afresh.
export const LOG_VERSION = 2
export const EMPTY_LOG: HudLog = { version: LOG_VERSION, at: 0, days: {}, files: {} }

// What the extractor prints per reply: the file, a tab, and a small JSON object of the reply's own model, id, usage
// and timestamp, each taken from the record wherever it stood (usage whole, whatever order its counts come in).
const MESSAGE_ID = /^msg_[A-Za-z0-9]+$/
// `<project>/<session>.jsonl`, or a subagent's `<project>/<session>/subagents/agent-<id>.jsonl`: its session's.
const SESSION = /\/([^/]+?)(?:\/subagents\/[^/]+)?\.jsonl$/
// Placeholder replies the engine writes itself (an interrupt, an error) carry no real usage.
const SYNTHETIC = '<synthetic>'
const PAD = 2
const FNV_OFFSET = 0x811c9dc5
const FNV_PRIME = 0x01000193
const BASE36 = 36

// A short stable hash for a reply or session id: FNV-1a, in base 36. Ids are compared within one day only.
export function hashOf(text: string): string {
  let hash = FNV_OFFSET
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), FNV_PRIME) >>> 0

  return hash.toString(BASE36)
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const count = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0)

function recordOf(json: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(json)

    return isRecord(value) ? value : null
  } catch {
    return null
  }
}

export function parseLine(line: string): LogRow | null {
  const tab = line.indexOf('\t')
  const session = SESSION.exec(line.slice(0, Math.max(0, tab)))?.[1]
  const record = tab < 0 ? null : recordOf(line.slice(tab + 1))
  const usage = record?.usage
  if (record === null || session === undefined || !isRecord(usage)) return null
  const { model, id } = record
  const atMs = Date.parse(typeof record.timestamp === 'string' ? record.timestamp : '')
  if (typeof model !== 'string' || typeof id !== 'string' || !MESSAGE_ID.test(id) || Number.isNaN(atMs)) return null
  const tokens = count(usage.input_tokens) + count(usage.output_tokens)
  const cache = count(usage.cache_creation_input_tokens) + count(usage.cache_read_input_tokens)
  if (model === SYNTHETIC || tokens + cache === 0) return null

  return { session, model, id, atMs, tokens, cache }
}

const pad = (value: number): string => String(value).padStart(PAD, '0')

// The local day a moment falls on, as `YYYY-MM-DD`.
export function dayKey(ms: number): string {
  const at = new Date(ms)

  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`
}

// Local midnight `back` days before the day of `ms`.
export function dayStart(ms: number, back: number): number {
  const at = new Date(ms)
  at.setHours(0, 0, 0, 0)
  at.setDate(at.getDate() - back)

  return at.getTime()
}

// The days as sets while rows are added; `closeLog` turns them back into plain data.
type OpenDay = { tokens: number; cache: number; models: Map<string, number>; sessions: Set<string>; seen: Set<string> }
export type OpenLog = Map<string, OpenDay>

export function openLog(days: HudLog['days']): OpenLog {
  const open: OpenLog = new Map()
  for (const [key, day] of Object.entries(days)) {
    open.set(key, { tokens: day.tokens, cache: day.cache, models: new Map(Object.entries(day.models)), sessions: new Set(day.sessions), seen: new Set(day.seen) })
  }

  return open
}

export function addRow(open: OpenLog, row: LogRow): void {
  const key = dayKey(row.atMs)
  const day = open.get(key) ?? { tokens: 0, cache: 0, models: new Map(), sessions: new Set(), seen: new Set() }
  open.set(key, day)
  const id = hashOf(row.id)
  if (day.seen.has(id)) return
  day.seen.add(id)
  day.tokens += row.tokens
  day.cache += row.cache
  day.models.set(row.model, (day.models.get(row.model) ?? 0) + 1)
  day.sessions.add(hashOf(row.session))
}

// Plain data again, without the days before `oldest` (a `YYYY-MM-DD` key: they sort as text).
export function closeLog(open: OpenLog, oldest: string): HudLog['days'] {
  const days: Record<string, HudDay> = {}
  for (const [key, day] of open) {
    if (key < oldest) continue
    days[key] = { tokens: day.tokens, cache: day.cache, models: Object.fromEntries(day.models), sessions: [...day.sessions], seen: [...day.seen] }
  }

  return days
}

const isDay = (day: unknown): boolean =>
  isRecord(day) && typeof day.tokens === 'number' && typeof day.cache === 'number' && isRecord(day.models) && Array.isArray(day.sessions) && Array.isArray(day.seen)

// A log as the store gives it back: the shape is checked, not trusted.
export function isLog(value: unknown): value is HudLog {
  if (!isRecord(value) || value.version !== LOG_VERSION || typeof value.at !== 'number' || !isRecord(value.files) || !isRecord(value.days)) return false

  return Object.values(value.days).every(isDay)
}
