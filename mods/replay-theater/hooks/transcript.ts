import { EDIT_TOOLS } from './record'
import { PLAN_TOOLS } from './plan'

// A session transcript (`<session>.jsonl`, one JSON record per line) read back into the few events a replay
// needs. The file is external input: every field is checked here and a line that does not parse is skipped.

export type Fields = Record<string, unknown>

// The main loop's agent key; a subagent's is its id.
export const MAIN = ''

export type TranscriptEvent =
  | { kind: 'prompt'; at: string; text: string }
  | { kind: 'said'; at: string; agent: string; text: string }
  | { kind: 'use'; at: string; agent: string; id: string; tool: string; input: Fields }
  | { kind: 'result'; at: string; id: string; isError: boolean; detail: Fields | undefined }

// One file's reading: whose loop it is, the tool calls whose results are worth parsing, the last time seen.
export type LineReader = { agent: string; wanted: Set<string>; lastAt: string; skipped: number }

// The calls that start a subagent: its edits belong to the turn they ran in.
export const AGENT_TOOLS = new Set(['Agent', 'Task'])
const KEPT_TOOLS = new Set<string>([...EDIT_TOOLS, ...PLAN_TOOLS, ...AGENT_TOOLS])
const ROLE = /"type":\s*"(user|assistant)"/
const RESULT_ID = /"tool_use_id":\s*"([^"]+)"/g
const COMMAND = /<command-name>([^<]*)<\/command-name>/
const COMMAND_ARGS = /<command-args>([^<]*)<\/command-args>/
const INTERRUPTED = '[Request interrupted'

export const newReader = (agent: string): LineReader => ({ agent, wanted: new Set(), lastAt: '', skipped: 0 })

const isFields = (value: unknown): value is Fields => typeof value === 'object' && value !== null && !Array.isArray(value)
const textOf = (value: unknown): string => (typeof value === 'string' ? value : '')

// The person's words, or '' for what the engine wrote in their place (reminders, command output, interrupts);
// a slash command reads as itself.
export function promptText(raw: string): string {
  const text = raw.trim()
  const command = text.match(COMMAND)
  if (command !== null) return [command[1], text.match(COMMAND_ARGS)?.[1] ?? ''].join(' ').trim()
  if (text.startsWith('<') || text.startsWith(INTERRUPTED)) return ''

  return text
}

// A tool result line is parsed only when it answers a call this reading keeps; the rest are mostly file bodies.
function isWorthParsing(line: string, reader: LineReader): boolean {
  const role = line.match(ROLE)?.[1]
  if (role === undefined) return false
  if (role === 'assistant' || !line.includes('"tool_use_id"')) return true

  return [...line.matchAll(RESULT_ID)].some(found => reader.wanted.has(found[1] as string))
}

// One parsed record and the time it is placed at.
type Placed = { record: Fields; at: string }

function assistantEvents({ record, at }: Placed, content: unknown[], reader: LineReader): TranscriptEvent[] {
  const agent = record.isSidechain === true && reader.agent === MAIN ? `side:${textOf(record.agentId)}` : reader.agent

  return content.flatMap((block): TranscriptEvent[] => {
    if (!isFields(block)) return []
    if (block.type === 'text' && textOf(block.text).trim() !== '') return [{ kind: 'said', at, agent, text: textOf(block.text) }]
    const id = textOf(block.id)
    const tool = textOf(block.name)
    if (block.type !== 'tool_use' || id === '' || !KEPT_TOOLS.has(tool) || !isFields(block.input)) return []
    reader.wanted.add(id)

    return [{ kind: 'use', at, agent, id, tool, input: block.input }]
  })
}

function userEvents({ record, at }: Placed, content: unknown, reader: LineReader): TranscriptEvent[] {
  const blocks = Array.isArray(content) ? content.filter(isFields) : []
  const results = blocks.filter(block => block.type === 'tool_result' && reader.wanted.has(textOf(block.tool_use_id)))
  // The record's own detail (a Write's earlier text) belongs to its result only when it holds one.
  const detail = results.length === 1 && isFields(record.toolUseResult) ? record.toolUseResult : undefined
  if (blocks.some(block => block.type === 'tool_result')) {
    return results.map(block => ({ kind: 'result', at, id: textOf(block.tool_use_id), isError: block.is_error === true, detail }))
  }
  if (record.isMeta === true || record.isSidechain === true || reader.agent !== MAIN) return []
  const raw = typeof content === 'string' ? content : blocks.map(block => (block.type === 'text' ? textOf(block.text) : '')).join('\n')
  const text = promptText(raw)

  return text === '' ? [] : [{ kind: 'prompt', at, text }]
}

function parsed(line: string, reader: LineReader): Fields | null {
  try {
    const record: unknown = JSON.parse(line)

    return isFields(record) ? record : null
  } catch {
    // A torn or foreign line: counted, and the reading goes on.
    reader.skipped += 1

    return null
  }
}

// The events one line holds; lines that are not messages, or do not parse, hold none.
export function eventsOfLine(line: string, reader: LineReader): TranscriptEvent[] {
  if (line.trim() === '' || !isWorthParsing(line, reader)) return []
  const record = parsed(line, reader)
  const message = record === null ? undefined : record.message
  if (record === null || !isFields(message)) return []
  const stamp = textOf(record.timestamp)
  // A line without its time keeps its place after the one before it.
  const at = stamp === '' ? reader.lastAt : stamp
  reader.lastAt = at
  if (record.type === 'assistant' && Array.isArray(message.content)) return assistantEvents({ record, at }, message.content, reader)

  return record.type === 'user' ? userEvents({ record, at }, message.content, reader) : []
}
