import { why } from './explainer'
import { foldSession, inTimeOrder } from './history'
import type { PastSession } from './history'
import { eventsOfLine, MAIN, newReader } from './transcript'
import type { LineReader, TranscriptEvent } from './transcript'
import type { Where } from './pane-io'

// Reading this project's session transcripts: the folder Claude Code keeps them in (the one the session's own
// `transcript_path` names), each `<id>.jsonl` and its subagents' `<id>/subagents/agent-<agent>.jsonl`. Read only.

export type ArchiveEntry = { name: string; kind: string; size: number; mtimeMs: number }
export type SessionFile = { id: string; path: string; size: number; mtimeMs: number }
export type ReadSession = PastSession & { isCut: boolean }
type Kept = { size: number; mtimeMs: number; session: ReadSession }

// What reading needs from the engine, as closures the hooks module makes; `kept` holds the last sessions read.
export type ArchiveIo = {
  list: (dir: string) => Promise<ArchiveEntry[]>
  read: (path: string) => Promise<string>
  pieces: (argv: readonly string[]) => AsyncIterable<string>
  log: (line: string) => void
  kept: Map<string, Kept>
}

// The engine reads a file whole up to 4 MiB; a larger transcript streams through `dd` (`tail` writes in pieces
// small enough to be thirty times slower), at most READ_CAP_BLOCKS of its end, so a huge one costs a bounded
// read and its newest turns are the ones kept.
const MIB = 1024 * 1024
const FS_READ_MAX = 4 * MIB
const READ_CAP_BLOCKS = 48
const KEPT_MAX = 3
const SUBAGENTS_MAX = 64
const SESSION_FILE = /^(.+)\.jsonl$/
const AGENT_FILE = /^agent-(.+)\.jsonl$/

// A spawned child's standard output, piece by piece; a child that wrote only errors fails the read.
export async function* stdoutOf(stream: AsyncIterable<{ stream: string; text: string }>): AsyncGenerator<string> {
  let errors = ''
  let hasOutput = false
  for await (const chunk of stream) {
    if (chunk.stream === 'stdout') {
      hasOutput = true
      yield chunk.text
    } else errors += chunk.text
  }
  if (!hasOutput && errors.trim() !== '') throw new Error(errors.trim())
}

const folderOf = (path: string): string => path.slice(0, Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')))

// The transcripts' folder and this session's id, from its own transcript's path ('' for none).
export function whereOf(transcript: string, cwd: string): Where {
  const dir = transcript === '' ? '' : folderOf(transcript)

  return { dir, current: transcript.slice(dir.length + 1).replace(SESSION_FILE, '$1'), cwd }
}

// The session transcripts in a folder, newest first.
export async function sessionFiles(io: ArchiveIo, dir: string): Promise<SessionFile[]> {
  const entries = await io.list(dir)

  return entries
    .flatMap(entry => {
      const found = entry.kind === 'file' ? entry.name.match(SESSION_FILE) : null

      return found === null ? [] : [{ id: found[1] as string, path: `${dir}/${entry.name}`, size: entry.size, mtimeMs: entry.mtimeMs }]
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
}

async function streamLines(io: ArchiveIo, file: { path: string; size: number }, onLine: (line: string) => void): Promise<boolean> {
  const skip = Math.max(0, Math.ceil(file.size / MIB) - READ_CAP_BLOCKS)
  const isCut = skip > 0
  // A cut read starts inside a record: its first line is dropped.
  let isHead = isCut
  let rest = ''
  for await (const piece of io.pieces(['dd', `if=${file.path}`, `bs=${MIB}`, `skip=${skip}`])) {
    const parts = (rest + piece).split('\n')
    rest = parts.pop() ?? ''
    for (const line of parts) {
      if (isHead) isHead = false
      else onLine(line)
    }
  }
  if (rest !== '' && !isHead) onLine(rest)

  return isCut
}

// Every line of a transcript, in order; true when only its end was read.
async function eachLine(io: ArchiveIo, file: { path: string; size: number }, onLine: (line: string) => void): Promise<boolean> {
  if (file.size <= FS_READ_MAX) {
    // A running session's file may pass the limit after it was listed; the stream below reads it then.
    const text = await io.read(file.path).catch((error: unknown) => {
      io.log(`replay-theater: ${file.path} read whole failed, streaming it (${why(error)})`)

      return null
    })
    if (text !== null) {
      for (const line of text.split('\n')) onLine(line)

      return false
    }
  }

  return streamLines(io, file, onLine)
}

async function ownerOf(io: ArchiveIo, path: string): Promise<string | undefined> {
  try {
    const meta: unknown = JSON.parse(await io.read(path))
    const owner = typeof meta === 'object' && meta !== null ? (meta as { toolUseId?: unknown }).toolUseId : undefined

    return typeof owner === 'string' ? owner : undefined
  } catch (error) {
    io.log(`replay-theater: ${path} not readable (${why(error)})`)

    return undefined
  }
}

type SubagentFile = { agent: string; path: string; size: number; owner?: string }

async function subagentFiles(io: ArchiveIo, dir: string, id: string): Promise<SubagentFile[]> {
  const folder = `${dir}/${id}/subagents`
  // Most sessions started no subagent and have no such folder.
  const entries = await io.list(folder).catch((): ArchiveEntry[] => [])
  const names = new Set(entries.map(entry => entry.name))
  const files = entries.flatMap(entry => {
    const found = entry.kind === 'file' ? entry.name.match(AGENT_FILE) : null

    return found === null ? [] : [{ agent: found[1] as string, path: `${folder}/${entry.name}`, size: entry.size }]
  })
  const out: SubagentFile[] = []
  for (const file of files.slice(0, SUBAGENTS_MAX)) {
    const meta = `agent-${file.agent}.meta.json`
    const owner = names.has(meta) ? await ownerOf(io, `${folder}/${meta}`) : undefined
    out.push(owner === undefined ? file : { ...file, owner })
  }

  return out
}

async function readEvents(io: ArchiveIo, file: { path: string; size: number }, reader: LineReader): Promise<{ events: TranscriptEvent[]; isCut: boolean }> {
  const events: TranscriptEvent[] = []
  const isCut = await eachLine(io, file, line => {
    for (const event of eventsOfLine(line, reader)) events.push(event)
  })
  if (reader.skipped > 0) io.log(`replay-theater: ${reader.skipped} unreadable lines skipped in ${file.path}`)

  return { events, isCut }
}

async function readSession(io: ArchiveIo, file: SessionFile, dir: string): Promise<ReadSession> {
  const { events, isCut } = await readEvents(io, file, newReader(MAIN))
  const owners = new Map<string, string>()
  for (const sub of await subagentFiles(io, dir, file.id)) {
    try {
      events.push(...(await readEvents(io, sub, newReader(sub.agent))).events)
      if (sub.owner !== undefined) owners.set(sub.agent, sub.owner)
    } catch (error) {
      io.log(`replay-theater: subagent ${sub.agent} not readable (${why(error)})`)
    }
  }

  return { ...foldSession(inTimeOrder(events), owners), isCut }
}

// A session read whole, from the last few kept while its transcript has not changed.
export async function sessionOf(io: ArchiveIo, file: SessionFile, dir: string): Promise<ReadSession> {
  const hit = io.kept.get(file.id)
  if (hit !== undefined && hit.size === file.size && hit.mtimeMs === file.mtimeMs) return hit.session
  const session = await readSession(io, file, dir)
  io.kept.delete(file.id)
  io.kept.set(file.id, { size: file.size, mtimeMs: file.mtimeMs, session })
  const oldest = io.kept.keys().next().value
  if (io.kept.size > KEPT_MAX && oldest !== undefined) io.kept.delete(oldest)

  return session
}
