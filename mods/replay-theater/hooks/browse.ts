import { sessionFiles, sessionOf } from './archive'
import type { SessionFile } from './archive'
import { why } from './explainer'
import { editCount, stepsOfTurn, turnRows } from './history'
import type { PaneIo } from './pane-io'
import type { ReplaySession, ReplaySummary } from '../types'

// Loading what the pane browses into the session's values: the session list, one session's turns, one turn's
// replay. Reading happens here, never while drawing; each write redraws the pane.

export type TurnRef = { session: string; turn: number }

// The newest sessions listed; their list lines are kept in `$.store` (a few hundred bytes each).
const SESSIONS_MAX = 20

const isCount = (n: unknown): boolean => typeof n === 'number' && Number.isFinite(n)

function isSummary(value: unknown): value is ReplaySummary {
  const s = value as ReplaySummary | null

  return typeof s === 'object' && s !== null && isCount(s.size) && isCount(s.mtimeMs) && typeof s.title === 'string' && isCount(s.turns) && isCount(s.edits) && typeof s.isCut === 'boolean'
}

async function readKept(io: PaneIo): Promise<Record<string, ReplaySummary>> {
  const raw = await io.kept.get().catch((error: unknown) => {
    io.archive.log(`replay-theater: kept session lines not readable (${why(error)})`)

    return undefined
  })
  if (typeof raw !== 'object' || raw === null) return {}

  return Object.fromEntries(Object.entries(raw).filter(([, value]) => isSummary(value)))
}

function rowOf(file: SessionFile, summary: ReplaySummary | undefined, current: string): ReplaySession {
  const isFresh = summary !== undefined && summary.size === file.size && summary.mtimeMs === file.mtimeMs
  const base = { id: file.id, at: file.mtimeMs, isCurrent: file.id === current }
  if (!isFresh) return { ...base, title: '', turns: null, edits: null, isCut: false }

  return { ...base, title: summary.title, turns: summary.turns, edits: summary.edits, isCut: summary.isCut }
}

async function filesIn(io: PaneIo): Promise<SessionFile[] | null> {
  const dir = io.where().dir
  if (dir === '') return null
  try {
    return await sessionFiles(io.archive, dir)
  } catch (error) {
    io.archive.log(`replay-theater: transcripts not listable (${why(error)})`)

    return null
  }
}

async function summarize(io: PaneIo, file: SessionFile): Promise<ReplaySummary | null> {
  try {
    const session = await sessionOf(io.archive, file, io.where().dir)

    return { size: file.size, mtimeMs: file.mtimeMs, title: session.title, turns: session.prompts, edits: editCount(session), isCut: session.isCut }
  } catch (error) {
    io.archive.log(`replay-theater: ${file.path} not readable (${why(error)})`)

    return null
  }
}

// The newest sessions at once, from the kept lines; then each one not read before, one at a time.
export async function listSessions(io: PaneIo): Promise<void> {
  await io.sessions.set(current => ({ ...current, status: 'loading' }))
  const files = await filesIn(io)
  if (files === null) {
    await io.sessions.set(() => ({ status: 'unavailable', rows: [], older: 0 }))

    return
  }
  const current = io.where().current
  const listed = files.slice(0, SESSIONS_MAX)
  const kept = await readKept(io)
  const isKnown = (file: SessionFile) => rowOf(file, kept[file.id], current).turns !== null
  await io.sessions.set(() => ({ status: 'ready', rows: listed.map(file => rowOf(file, kept[file.id], current)), older: files.length - listed.length }))
  const fresh: Record<string, ReplaySummary> = {}
  for (const file of listed) {
    const summary = isKnown(file) ? (kept[file.id] as ReplaySummary) : await summarize(io, file)
    // An unreadable one is not kept, so the next listing tries it again.
    if (summary !== null) fresh[file.id] = summary
    const row = summary === null ? { ...rowOf(file, undefined, current), isUnreadable: true } : rowOf(file, summary, current)
    if (!isKnown(file)) await io.sessions.set(list => ({ ...list, rows: list.rows.map(one => (one.id === file.id ? row : one)) }))
  }
  await io.kept.set(fresh).catch((error: unknown) => io.archive.log(`replay-theater: session lines not kept (${why(error)})`))
}

async function readSession(io: PaneIo, id: string) {
  const file = (await filesIn(io))?.find(one => one.id === id)
  if (file === undefined) return null
  try {
    return await sessionOf(io.archive, file, io.where().dir)
  } catch (error) {
    io.archive.log(`replay-theater: session ${id} not readable (${why(error)})`)

    return null
  }
}

// One session's turns that edited files; a later request for another session wins.
export async function loadTurns(io: PaneIo, id: string): Promise<void> {
  const isCurrent = id === io.where().current
  await io.turns.set(() => ({ session: id, status: 'loading', title: '', isCurrent, isCut: false, prompts: 0, rows: [] }))
  const session = await readSession(io, id)
  await io.turns.set(turns => {
    if (turns?.session !== id) return turns
    if (session === null) return { ...turns, status: 'unavailable' }

    return { ...turns, status: 'ready', title: session.title, isCut: session.isCut, prompts: session.prompts, rows: turnRows(session) }
  })
}

// One turn's edits as the replay on screen; false when the transcript no longer has it.
export async function loadPast(io: PaneIo, ref: TurnRef): Promise<boolean> {
  const session = await readSession(io, ref.session)
  const turn = session?.turns.find(one => one.n === ref.turn)
  if (session === null || turn === undefined) return false
  const steps = await stepsOfTurn(turn, io.where().cwd)
  const origin = { session: ref.session, turn: ref.turn, title: session.title }
  await io.past.set(() => ({ id: `${ref.session}:${ref.turn}`, steps, explain: 'done', quote: '', ask: turn.ask, at: turn.at, origin }))
  await io.index.set(() => 0)

  return true
}
