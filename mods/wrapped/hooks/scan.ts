// Reading a year of transcripts under `<config>/projects`. They run to gigabytes, so `awk` walks them once and
// prints only totals. Read only. A reply, tool call or prompt counts once by its id, however many forks copy it.

export type ScanEntry = { name: string; kind: string; size: number; mtimeMs: number }
export type ListDir = (dir: string) => Promise<readonly ScanEntry[]>

export type AgentTotal = { type: string; runs: number; tools: number; tokens: number }
export type Hardest = { type: string; tools: number; tokens: number; description: string }
export type MonthRow = { month: string; name: string; count: number }

export type Raw = {
  promptsByHour: Record<string, number>
  repliesByHour: Record<string, number>
  outputTokens: number
  tools: Record<string, number>
  files: Record<string, number>
  places: Record<string, number>
  chats: number[]
  agents: AgentTotal[]
  hardest: Hardest | null
  monthProjects: MonthRow[]
  monthAgents: MonthRow[]
  stops: number
  rightCount: number
  costUsd: number
  linesAdded: number
}

const JSONL = '.jsonl'
const META = '.meta.json'

// The script stays ASCII (`\304\261` is the Turkish dotless i), so no spawn can garble it. The paths come in on
// stdin, so their number meets no argument limit. Each record is one line; END prints the
// totals first and the file counts last, since a very long output is cut at its end.
export const AWK = String.raw`
function grab(re, line) { return match(line, re) ? substr(line, RSTART, RLENGTH) : "" }
function value(frag) { sub(/^"[^"]*":"?/, "", frag); sub(/"$/, "", frag); return frag }
function hour(line) { return substr(value(grab("\"timestamp\":\"[^\"]*\"", line)), 1, 13) }
function isStop(line) { return index(line, "\"text\":\"[Request interrupted by user") || index(line, "\"content\":\"[Request interrupted by user") }
function isRight(line) { return index(line, "absolutely right") || index(line, "You\047re right") || index(line, "akl\304\261s\304\261n") }
BEGIN { FS = "\n"; while ((getline path < "-") > 0) ARGV[ARGC++] = path }
FNR == 1 { inAgent = FILENAME ~ /\/subagents\// }
FILENAME ~ /\.meta\.json$/ {
  key = FILENAME; sub(/\.meta\.json$/, ".jsonl", key)
  typeOf[key] = value(grab("\"agentType\":\"[^\"]*\"", $0))
  d = grab("\"description\":\"([^\"\\\\]|\\\\.)*\"", $0); sub(/^"description":"/, "", d); sub(/"$/, "", d); descOf[key] = d
  next
}
index($0, "\"type\":\"cost-state\"") {
  start = value(grab("\"startTime\":[0-9]+", $0)); if (start == "") start = FILENAME
  cost = value(grab("\"totalCostUSD\":[0-9.]+", $0)) + 0; if (cost > costOf[start]) costOf[start] = cost
  add = value(grab("\"totalLinesAdded\":[0-9]+", $0)) + 0; if (add > addOf[start]) addOf[start] = add
  fileOf[start] = FILENAME
  next
}
index($0, "\"type\":\"user\"") {
  h = hour($0); if (substr(h, 1, 4) != YEAR) next
  if (inAgent) { if (!(FILENAME in runMonth)) runMonth[FILENAME] = substr(h, 1, 7); next }
  if (index($0, "\"isSidechain\":true") || index($0, "\"isMeta\":true")) next
  id = value(grab("\"uuid\":\"[^\"]*\"", $0)); if (id != "" && seen[id]++) next
  if (isStop($0)) { stops++; next }
  if (index($0, "\"toolUseResult\"") || index($0, "\"tool_result\"") || index($0, "\"promptSource\":\"system\"")) next
  if (index($0, "\"origin\":{\"kind\":\"") && !index($0, "\"origin\":{\"kind\":\"human\"")) next
  prompts[h]++; promptsOf[FILENAME]++
  c = value(grab("\"cwd\":\"[^\"]*\"", $0)); if (c != "") { sub(/\/\.claude\/worktrees\/.*/, "", c); place[c]++; monthPlace[substr(h, 1, 7) SUBSEP c]++ }
  next
}
index($0, "\"type\":\"assistant\"") {
  h = hour($0); if (substr(h, 1, 4) != YEAR) next
  isActive[FILENAME] = 1
  id = value(grab("\"id\":\"msg_[A-Za-z0-9]+\"", $0))
  if (id != "" && !seen[id]++) { replies[h]++; k = value(grab("\"output_tokens\":[0-9]+", $0)) + 0; out += k; if (inAgent) workTokens[FILENAME] += k }
  if (index($0, "\"content\":[{\"type\":\"text\",\"text\":\"") && isRight($0) && !said[id]++) right++
  rest = $0
  while (match(rest, /"type":"tool_use","id":"toolu_[A-Za-z0-9_-]+","name":"[^"]+"/)) {
    use = substr(rest, RSTART, RLENGTH); rest = substr(rest, RSTART + RLENGTH)
    t = use; sub(/^.*"id":"/, "", t); sub(/".*$/, "", t)
    if (seen[t]++) continue
    n = use; sub(/^.*"name":"/, "", n); sub(/"$/, "", n)
    tools[n]++
    if (inAgent) workTools[FILENAME]++
    if ((n == "Edit" || n == "Write" || n == "MultiEdit") && match(rest, /"file_path":"[^"]+"/) && RSTART < 60) files[value(substr(rest, RSTART, RLENGTH))]++
  }
}
END {
  for (s in costOf) if (isActive[fileOf[s]]) { cost += costOf[s]; added += addOf[s] }
  print "X\t" stops + 0 "\t" right + 0 "\t" cost + 0 "\t" added + 0 "\t" out + 0
  for (f in runMonth) {
    t = typeOf[f]; if (t == "") t = "agent"
    runs[t]++; typeTools[t] += workTools[f]; typeTokens[t] += workTokens[f]; monthRuns[runMonth[f] SUBSEP t]++
    if (best == "" || workTools[f] > workTools[best]) best = f
  }
  if (best != "") { t = typeOf[best]; if (t == "") t = "agent"; print "B\t" t "\t" workTools[best] + 0 "\t" workTokens[best] + 0 "\t" descOf[best] }
  for (t in runs) print "G\t" t "\t" runs[t] "\t" typeTools[t] + 0 "\t" typeTokens[t] + 0
  for (m in monthRuns) { split(m, part, SUBSEP); print "N\t" part[1] "\t" part[2] "\t" monthRuns[m] }
  for (m in monthPlace) { split(m, part, SUBSEP); print "M\t" part[1] "\t" part[2] "\t" monthPlace[m] }
  for (h in prompts) print "P\t" h "\t" prompts[h]
  for (h in replies) print "R\t" h "\t" replies[h]
  for (n in tools) print "T\t" n "\t" tools[n]
  for (c in place) print "C\t" c "\t" place[c]
  for (f in promptsOf) print "S\t" promptsOf[f]
  for (f in files) if (files[f] > 1) print "F\t" f "\t" files[f]
}
`

// A project's sessions touched since the year began, and their subagents' transcripts.
async function projectFiles(list: ListDir, dir: string, sinceMs: number): Promise<string[]> {
  const entries = await list(dir)
  const paths: string[] = []
  for (const entry of entries) {
    if (entry.kind === 'file' && entry.name.endsWith(JSONL) && entry.mtimeMs >= sinceMs) paths.push(`${dir}/${entry.name}`)
    if (entry.kind !== 'dir') continue
    // Most sessions started no subagent and have no such folder.
    const inside = await list(`${dir}/${entry.name}/subagents`).catch((): readonly ScanEntry[] => [])
    for (const agent of inside) if ((agent.name.endsWith(JSONL) || agent.name.endsWith(META)) && agent.mtimeMs >= sinceMs) paths.push(`${dir}/${entry.name}/subagents/${agent.name}`)
  }

  return paths
}

export async function transcriptPaths(list: ListDir, root: string, sinceMs: number): Promise<string[]> {
  const paths: string[] = []
  for (const project of await list(root)) if (project.kind === 'dir') paths.push(...(await projectFiles(list, `${root}/${project.name}`, sinceMs)))

  // awk reads in this order, and an agent's type must be known before its transcript's totals are added up.
  return [...paths.filter(path => path.endsWith(META)), ...paths.filter(path => !path.endsWith(META))]
}

const count = (text: string | undefined): number => {
  const value = Number(text)

  return Number.isFinite(value) && value > 0 ? value : 0
}

function unescaped(text: string): string {
  try {
    return String(JSON.parse(`"${text}"`))
  } catch {
    return text
  }
}

type Parts = Array<string | undefined>

function readAgentLine(raw: Raw, [kind, first, second, third, fourth]: Parts): void {
  if (first === undefined || first === '') return
  if (kind === 'G') raw.agents.push({ type: first, runs: count(second), tools: count(third), tokens: count(fourth) })
  if (kind === 'B') raw.hardest = { type: first, tools: count(second), tokens: count(third), description: unescaped(fourth ?? '') }
  if (kind === 'N' && second !== undefined) raw.monthAgents.push({ month: first, name: second, count: count(third) })
  if (kind === 'M' && second !== undefined) raw.monthProjects.push({ month: first, name: second, count: count(third) })
}

// awk's output is the transcripts' text at one remove: a line that does not read is dropped.
export function parseOutput(output: string): Raw {
  const raw: Raw = { promptsByHour: {}, repliesByHour: {}, outputTokens: 0, tools: {}, files: {}, places: {}, chats: [], agents: [], hardest: null, monthProjects: [], monthAgents: [], stops: 0, rightCount: 0, costUsd: 0, linesAdded: 0 }
  const tables: Record<string, Record<string, number>> = { P: raw.promptsByHour, R: raw.repliesByHour, T: raw.tools, C: raw.places, F: raw.files }
  for (const line of output.split('\n')) {
    const [kind, first, second, third, fourth, fifth] = line.split('\t')
    if (kind === undefined) continue
    readAgentLine(raw, line.split('\t'))
    const table = tables[kind]
    if (table !== undefined && first !== undefined && first !== '') table[first] = count(second)
    if (kind === 'S') raw.chats.push(count(first))
    if (kind === 'X') Object.assign(raw, { stops: count(first), rightCount: count(second), costUsd: count(third), linesAdded: count(fourth), outputTokens: count(fifth) })
  }

  return raw
}

// `<config>/projects/<project>/<session>.jsonl` → `<config>/projects`; '' for no path.
export function rootOf(transcript: string): string {
  if (!transcript.endsWith(JSONL)) return ''
  const folder = transcript.slice(0, Math.max(0, transcript.lastIndexOf('/')))

  return folder.slice(0, Math.max(0, folder.lastIndexOf('/')))
}
