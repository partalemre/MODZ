import type { HudDay, HudLog } from '../types'

// Past usage from the session transcripts, day by day: one extracted line read back into a reply, and the days it
// adds to. The lines are external input: every field is checked here and a line that does not read is dropped.
// A reply counts once by its id, however many lines, files or rescans repeat it (a fork copies its parent's).

export type LogRow = { session: string; model: string; id: string; atMs: number; tokens: number }

// The longest range the pane shows; older days are dropped.
export const DAYS_KEPT = 30
export const EMPTY_LOG: HudLog = { at: 0, days: {}, files: {} }

// What the extractor prints per reply, tab-separated: the file, then three fragments of the reply's own record.
const HEAD = /^"model":"([^"]+)","id":"(msg_[A-Za-z0-9]+)"$/
const USAGE = /^"usage":\{"input_tokens":(\d+),"cache_creation_input_tokens":(\d+),"cache_read_input_tokens":(\d+),"output_tokens":(\d+)$/
const STAMP = /^"timestamp":"([^"]+)"$/
// `<project>/<session>.jsonl`, or a subagent's `<project>/<session>/subagents/agent-<id>.jsonl`: its session's.
const SESSION = /\/([^/]+?)(?:\/subagents\/[^/]+)?\.jsonl$/
// Placeholder replies the engine writes itself (an interrupt, an error) carry no real usage.
const SYNTHETIC = '<synthetic>'
const FIELDS = 4
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

export function parseLine(line: string): LogRow | null {
  const parts = line.split('\t')
  if (parts.length !== FIELDS) return null
  const [path, head, usage, stamp] = parts as [string, string, string, string]
  const reply = HEAD.exec(head)
  const counts = USAGE.exec(usage)
  const atMs = Date.parse(STAMP.exec(stamp)?.[1] ?? '')
  const session = SESSION.exec(path)?.[1]
  if (reply === null || counts === null || Number.isNaN(atMs) || session === undefined) return null
  const tokens = counts.slice(1).reduce((sum, count) => sum + Number(count), 0)
  const model = reply[1] as string
  if (model === SYNTHETIC || tokens === 0) return null

  return { session, model, id: reply[2] as string, atMs, tokens }
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
type OpenDay = { tokens: number; models: Map<string, number>; sessions: Set<string>; seen: Set<string> }
export type OpenLog = Map<string, OpenDay>

export function openLog(days: HudLog['days']): OpenLog {
  const open: OpenLog = new Map()
  for (const [key, day] of Object.entries(days)) {
    open.set(key, { tokens: day.tokens, models: new Map(Object.entries(day.models)), sessions: new Set(day.sessions), seen: new Set(day.seen) })
  }

  return open
}

export function addRow(open: OpenLog, row: LogRow): void {
  const key = dayKey(row.atMs)
  const day = open.get(key) ?? { tokens: 0, models: new Map(), sessions: new Set(), seen: new Set() }
  open.set(key, day)
  const id = hashOf(row.id)
  if (day.seen.has(id)) return
  day.seen.add(id)
  day.tokens += row.tokens
  day.models.set(row.model, (day.models.get(row.model) ?? 0) + 1)
  day.sessions.add(hashOf(row.session))
}

// Plain data again, without the days before `oldest` (a `YYYY-MM-DD` key: they sort as text).
export function closeLog(open: OpenLog, oldest: string): HudLog['days'] {
  const days: Record<string, HudDay> = {}
  for (const [key, day] of open) {
    if (key < oldest) continue
    days[key] = { tokens: day.tokens, models: Object.fromEntries(day.models), sessions: [...day.sessions], seen: [...day.seen] }
  }

  return days
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

// A log as the store gives it back: the shape is checked, not trusted.
export function isLog(value: unknown): value is HudLog {
  if (!isRecord(value) || typeof value.at !== 'number' || !isRecord(value.files) || !isRecord(value.days)) return false

  return Object.values(value.days).every(day => isRecord(day) && typeof day.tokens === 'number' && isRecord(day.models) && Array.isArray(day.sessions) && Array.isArray(day.seen))
}
