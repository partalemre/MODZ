import { addRow, closeLog, dayKey, dayStart, DAYS_KEPT, LOG_VERSION, openLog, parseLine } from './past-log'
import type { LogRow } from './past-log'
import type { HudLog } from '../types'

// Reading the session transcripts under `<config>/projects`, the cheap way: only files touched within the range,
// only those changed since the last read (size or mtime), and through `awk`, which hands back a short JSON object
// per reply instead of the reply's whole record (a month of transcripts runs to gigabytes). Read only.

export type ScanEntry = { name: string; kind: string; size: number; mtimeMs: number }
export type ScanStream = AsyncIterable<{ stream: string; text: string }> & { readonly result: Promise<{ code: number | null }> }

// What reading needs from the engine, as closures the hooks module makes.
export type ScanIo = {
  list: (dir: string) => Promise<ScanEntry[]>
  spawn: (argv: readonly string[]) => ScanStream
}

type Stamp = { path: string; size: number; mtimeMs: number }

const JSONL = '.jsonl'
// Files per awk run: the argument list stays far below any system's limit.
const BATCH = 200
// An assistant record cut to a small JSON object that parseLine reads as JSON: the message's model and id (its
// first keys), its whole usage object whatever order the counts come in, and the record's timestamp. The usage and
// timestamp are the last of their keys in the line: the reply's content comes before them and a tool call's input
// in it may hold the same keys. A line of gigabytes of transcripts is never handed over whole.
export const AWK = [
  'function last(s, key,   at, i) { at = 0; while ((i = index(substr(s, at + 1), key)) > 0) at += i; return at }',
  'index($0, "\\"type\\":\\"assistant\\"") {',
  '  if (!match($0, /"message":\\{"model":"[^"]*","id":"msg_[A-Za-z0-9]+"/)) next; head = substr($0, RSTART + 11, RLENGTH - 11)',
  '  u = last($0, "\\"usage\\":{"); t = last($0, "\\"timestamp\\":\\""); if (u == 0 || t == 0) next',
  '  rest = substr($0, u + 8); depth = 0; n = length(rest)',
  '  for (i = 1; i <= n; i++) { c = substr(rest, i, 1); if (c == "{") depth++; else if (c == "}" && --depth == 0) break }',
  '  if (depth != 0 || !match(substr($0, t), /^"timestamp":"[^"]*"/)) next',
  '  print FILENAME "\\t{" head "," substr($0, t, RLENGTH) ",\\"usage\\":" substr(rest, 1, i) "}"',
  '}',
].join('\n')

const isRecent = (entry: ScanEntry, sinceMs: number): boolean => entry.kind === 'file' && entry.name.endsWith(JSONL) && entry.mtimeMs >= sinceMs
const stampOf = (dir: string, entry: ScanEntry): Stamp => ({ path: `${dir}/${entry.name}`, size: entry.size, mtimeMs: entry.mtimeMs })

// A project's recent sessions and their subagents' transcripts (`<session>/subagents/agent-<id>.jsonl`).
async function projectFiles(io: ScanIo, dir: string, sinceMs: number): Promise<Stamp[]> {
  const entries = await io.list(dir)
  const folders = new Set(entries.filter(entry => entry.kind === 'dir').map(entry => entry.name))
  const sessions = entries.filter(entry => isRecent(entry, sinceMs))
  const files = sessions.map(entry => stampOf(dir, entry))
  for (const session of sessions) {
    const id = session.name.slice(0, -JSONL.length)
    if (!folders.has(id)) continue
    const agents = `${dir}/${id}/subagents`
    // Most sessions started no subagent and have no such folder.
    const inside = await io.list(agents).catch((): ScanEntry[] => [])
    files.push(...inside.filter(entry => isRecent(entry, sinceMs)).map(entry => stampOf(agents, entry)))
  }

  return files
}

// Every recent transcript; rejects when the folder itself cannot be listed.
export async function transcriptFiles(io: ScanIo, root: string, sinceMs: number): Promise<Stamp[]> {
  const projects = (await io.list(root)).filter(entry => entry.kind === 'dir')
  const files: Stamp[] = []
  for (const project of projects) files.push(...(await projectFiles(io, `${root}/${project.name}`, sinceMs)))

  return files
}

// One awk run over some files, each reply it prints handed on; rejects unless awk read them all.
async function extract(io: ScanIo, paths: readonly string[], onRow: (row: LogRow) => void): Promise<void> {
  const stream = io.spawn(['awk', AWK, ...paths])
  let rest = ''
  const take = (line: string) => {
    const row = parseLine(line)
    if (row !== null) onRow(row)
  }
  for await (const chunk of stream) {
    if (chunk.stream !== 'stdout') continue
    const lines = (rest + chunk.text).split('\n')
    rest = lines.pop() ?? ''
    lines.forEach(take)
  }
  if (rest !== '') take(rest)
  const { code } = await stream.result
  if (code !== 0) throw new Error(`awk ended with ${code ?? 'a signal'}`)
}

const isSame = (kept: readonly number[] | undefined, file: Stamp): boolean => kept !== undefined && kept[0] === file.size && kept[1] === file.mtimeMs

// The log brought up to date: the changed files read again (a reply already counted counts once), the days past
// the range dropped. Rejects when the transcripts cannot be listed or a file cannot be read, so the last log stays.
export async function scanLog(io: ScanIo, spec: { root: string; log: HudLog; nowMs: number }): Promise<HudLog> {
  const sinceMs = dayStart(spec.nowMs, DAYS_KEPT - 1)
  const files = await transcriptFiles(io, spec.root, sinceMs)
  const changed = files.filter(file => !isSame(spec.log.files[file.path], file))
  const open = openLog(spec.log.days)
  for (let index = 0; index < changed.length; index += BATCH) {
    await extract(io, changed.slice(index, index + BATCH).map(file => file.path), row => addRow(open, row))
  }

  return { version: LOG_VERSION, at: spec.nowMs, days: closeLog(open, dayKey(sinceMs)), files: Object.fromEntries(files.map(file => [file.path, [file.size, file.mtimeMs]])) }
}
