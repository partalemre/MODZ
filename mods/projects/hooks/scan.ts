import type { FileSum, ModelSum } from '../types'

// Reading every session transcript under `<config>/projects`, the cheap way: awk adds up each file in place and hands
// back one short summary, and only the files whose size or mtime moved are read again. Read only.

export type ScanEntry = { name: string; kind: string; size: number; mtimeMs: number }
export type ScanStream = AsyncIterable<{ stream: string; text: string }> & { readonly result: Promise<{ code: number | null }> }
export type ScanIo = {
  list: (dir: string) => Promise<ScanEntry[]>
  spawn: (argv: readonly string[]) => ScanStream
  read: (path: string) => Promise<string>
}

type Stamp = { path: string; size: number; mtimeMs: number }

const JSONL = '.jsonl'
// Files per awk run: the argument list stays far below any system's limit.
const BATCH = 200
const TAB = '\t'
const SYNTHETIC = '<synthetic>'

// One F row per file and one U row per file and model. A reply is written once per content block with the same id,
// so per file the last usage of an id counts once. `split("", x)` empties an array in every awk.
export const AWK = String.raw`
function flush(   id, m, key) {
  if (file == "") return
  print "F\t" file "\t" cwd "\t" title "\t" first "\t" last "\t" tools
  for (id in model) { m = model[id]; n[m]++; a[m] += ui[id]; b[m] += uc[id]; c[m] += ur[id]; d[m] += uo[id] }
  for (m in n) print "U\t" file "\t" m "\t" a[m] "\t" b[m] "\t" c[m] "\t" d[m] "\t" n[m]
  split("", model); split("", ui); split("", uc); split("", ur); split("", uo); split("", n); split("", a); split("", b); split("", c); split("", d)
}
function grab(text, re, skip) { return match(text, re) ? substr(text, RSTART + skip, RLENGTH - skip - 1) : "" }
FNR == 1 { flush(); file = FILENAME; cwd = ""; title = ""; first = ""; last = ""; tools = 0 }
{
  if (cwd == "" && index($0, "\"cwd\":\"")) cwd = grab($0, "\"cwd\":\"[^\"]*\"", 7)
  p = index($0, "\"timestamp\":\"")
  if (p) { t = substr($0, p + 13, 24); if (first == "") first = t; last = t }
  if (index($0, "\"type\":\"custom-title\"")) title = grab($0, "\"customTitle\":\"[^\"]*\"", 15)
  else if (title == "" && index($0, "\"type\":\"ai-title\"")) title = grab($0, "\"aiTitle\":\"[^\"]*\"", 11)
  if (!index($0, "\"type\":\"assistant\"")) next
  if (index($0, "\"type\":\"tool_use\"")) tools++
  u = index($0, "\"usage\":{\"input_tokens\":"); if (u == 0) next
  if (!match($0, /"model":"[^"]*","id":"msg_[A-Za-z0-9]+"/)) next
  head = substr($0, RSTART + 9, RLENGTH - 9)
  split(head, parts, "\""); id = parts[5]
  rest = substr($0, u)
  if (!match(rest, /"usage":\{"input_tokens":[0-9]+,"cache_creation_input_tokens":[0-9]+,"cache_read_input_tokens":[0-9]+,"output_tokens":[0-9]+/)) next
  split(substr(rest, RSTART, RLENGTH), v, /[:,]/)
  model[id] = parts[1]; ui[id] = v[3]; uc[id] = v[5]; ur[id] = v[7]; uo[id] = v[9]
}
END { flush() }
`

const AGENT_FOLDER = '/subagents/'

export const isAgentFile = (path: string): boolean => path.includes(AGENT_FOLDER)

// `.../<session>/subagents/agent-x.jsonl` and `.../<session>.jsonl` both name `<session>`.
export function sessionOf(path: string): string {
  const parts = path.split('/')
  const name = parts.at(-1) ?? ''

  return isAgentFile(path) ? (parts.at(-3) ?? '') : name.slice(0, -JSONL.length)
}

// The awk output into summaries by path; a broken row is left out, never guessed at.
export function parseOutput(text: string): Map<string, Omit<FileSum, 'size' | 'mtimeMs' | 'agent'>> {
  const sums = new Map<string, Omit<FileSum, 'size' | 'mtimeMs' | 'agent'>>()
  for (const line of text.split('\n')) {
    const cells = line.split(TAB)
    if (cells[0] === 'F' && cells.length === 7) {
      const [, path = '', cwd = '', title = '', first = '', last = '', tools = '0'] = cells
      sums.set(path, { path, cwd, title, first, last, tools: Number(tools), models: {} })
    } else if (cells[0] === 'U' && cells.length === 8) {
      const [, path = '', model = '', ...counts] = cells
      const sum = sums.get(path)
      const [input, cacheWrite, cacheRead, output, replies] = counts.map(Number) as [number, number, number, number, number]
      if (sum !== undefined && model !== SYNTHETIC) sum.models[model] = { input, cacheWrite, cacheRead, output, replies } satisfies ModelSum
    }
  }

  return sums
}

async function allFiles(io: ScanIo, root: string): Promise<Stamp[]> {
  const files: Stamp[] = []
  const stamp = (dir: string, entry: ScanEntry) => files.push({ path: `${dir}/${entry.name}`, size: entry.size, mtimeMs: entry.mtimeMs })
  const isTranscript = (entry: ScanEntry) => entry.kind === 'file' && entry.name.endsWith(JSONL)
  for (const project of await io.list(root)) {
    if (project.kind !== 'dir') continue
    const dir = `${root}/${project.name}`
    const entries = await io.list(dir).catch((): ScanEntry[] => [])
    for (const entry of entries) {
      if (isTranscript(entry)) stamp(dir, entry)
      if (entry.kind !== 'dir') continue
      const agents = `${dir}/${entry.name}/subagents`
      // Most sessions started no subagent and have no such folder.
      for (const inside of await io.list(agents).catch((): ScanEntry[] => [])) if (isTranscript(inside)) stamp(agents, inside)
    }
  }

  return files
}

async function runAwk(io: ScanIo, paths: readonly string[]): Promise<{ text: string; isOk: boolean; said: string }> {
  const stream = io.spawn(['awk', AWK, ...paths])
  const out: string[] = []
  const errors: string[] = []
  for await (const chunk of stream) (chunk.stream === 'stdout' ? out : errors).push(chunk.text)
  const { code } = await stream.result

  return { text: out.join(''), isOk: code === 0, said: errors.join('').trim() }
}

// A transcript can vanish between listing and reading (a live session's temp file), and awk stops at the first it
// cannot open. So a failed batch is read one by one and only the unreadable file is left out; rejects only when none
// could be read, since then it is awk itself that fails.
async function readBatch(io: ScanIo, paths: readonly string[]): Promise<string> {
  const whole = await runAwk(io, paths)
  if (whole.isOk) return whole.text
  const singles = await Promise.all(paths.map(path => runAwk(io, [path])))
  const read = singles.filter(one => one.isOk)
  if (read.length === 0) throw new Error(`awk failed: ${whole.said}`)

  return read.map(one => one.text).join('')
}

// What the engine says about a subagent, next to its transcript; an older one has no such file.
async function agentOf(io: ScanIo, path: string): Promise<FileSum['agent']> {
  try {
    const meta = JSON.parse(await io.read(`${path.slice(0, -JSONL.length)}.meta.json`)) as { agentType?: unknown; description?: unknown }

    return { type: typeof meta.agentType === 'string' ? meta.agentType : '', description: typeof meta.description === 'string' ? meta.description : '' }
  } catch {
    return { type: '', description: '' }
  }
}

const isUnchanged = (kept: FileSum | undefined, file: Stamp): boolean => kept !== undefined && kept.size === file.size && kept.mtimeMs === file.mtimeMs

// The summaries brought up to date: the changed files read again, the gone ones dropped. Rejects when the transcripts
// cannot be listed or read, so the last good summaries stay.
export async function scanFiles(io: ScanIo, root: string, kept: Readonly<Record<string, FileSum>>): Promise<Record<string, FileSum>> {
  const files = await allFiles(io, root)
  const next: Record<string, FileSum> = {}
  const changed: Stamp[] = []
  for (const file of files) {
    const before = kept[file.path]
    if (before !== undefined && isUnchanged(before, file)) next[file.path] = before
    else changed.push(file)
  }
  for (let index = 0; index < changed.length; index += BATCH) {
    const batch = changed.slice(index, index + BATCH)
    const sums = parseOutput(await readBatch(io, batch.map(file => file.path)))
    for (const file of batch) {
      const sum = sums.get(file.path)
      if (sum === undefined) continue
      next[file.path] = { ...sum, size: file.size, mtimeMs: file.mtimeMs, ...(isAgentFile(file.path) ? { agent: await agentOf(io, file.path) } : {}) }
    }
  }

  return next
}
