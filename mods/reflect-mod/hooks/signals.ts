// One chat's transcript (JSONL, one row a line) read down to the friction it holds: what the person typed,
// which tool calls were held or denied, and which shell commands failed. Pure, zero tokens.

export type Signals = { prompts: string[]; holds: string[]; failures: string[] }

type Block = { type?: unknown; text?: unknown; id?: unknown; name?: unknown; input?: unknown; tool_use_id?: unknown; is_error?: unknown; content?: unknown }
type Row = { type?: unknown; isMeta?: unknown; isSidechain?: unknown; message?: { content?: unknown } }
type Use = { tool: string; command?: string }

/** A held, denied or cancelled call: the engine's permission words, and the MODZ guards' own (blast-radius, secret-guard). */
const HELD = /requires approval|permission|denied|doesn'?t want to proceed|no one is here to approve|held this command|blocked|cancelled|rejected/i
const FAILED_EXIT = /^Exit code [1-9]\d*/
/** Rows that are the engine's, not the person's: command records, caveats, notices, other sessions, pasted images. */
const NOT_TYPED = /^(<|\[|Another Claude session)/
/** What is kept of a command to tell it apart: its start, digits folded, so `sleep 3` and `sleep 5` are one. */
export const COMMAND_KEY = 60

const blocksOf = (row: Row): Block[] => {
  const content = row.message?.content
  return Array.isArray(content) ? (content as Block[]) : []
}

const textOf = (content: unknown): string => {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return (content as Block[]).map(b => (typeof b.text === 'string' ? b.text : '')).join(' ')
}

export const commandKey = (command: string): string =>
  command.trim().replace(/\s+/g, ' ').replace(/\d+/g, 'N').slice(0, COMMAND_KEY)

function parseRow(line: string): Row | undefined {
  if (line.trim() === '') return undefined
  try {
    const row: unknown = JSON.parse(line)
    return typeof row === 'object' && row !== null ? (row as Row) : undefined
  } catch {
    // A torn last line (the chat was being written) or a foreign row: nothing to learn from it.
    return undefined
  }
}

function typedPrompt(row: Row): string | undefined {
  if (row.isMeta === true || row.isSidechain === true) return undefined
  const content = row.message?.content
  const text = typeof content === 'string' ? content : blocksOf(row).filter(b => b.type === 'text').map(b => String(b.text ?? '')).join(' ')
  const trimmed = text.trim()
  return trimmed === '' || NOT_TYPED.test(trimmed) ? undefined : trimmed
}

function noteUses(row: Row, uses: Map<string, Use>) {
  for (const b of blocksOf(row)) {
    if (b.type !== 'tool_use' || typeof b.id !== 'string' || typeof b.name !== 'string') continue
    const command = (b.input as { command?: unknown } | undefined)?.command
    uses.set(b.id, { tool: b.name, ...(typeof command === 'string' ? { command } : {}) })
  }
}

function noteErrors(row: Row, uses: Map<string, Use>, out: Signals) {
  for (const b of blocksOf(row)) {
    if (b.type !== 'tool_result' || b.is_error !== true) continue
    const use = typeof b.tool_use_id === 'string' ? uses.get(b.tool_use_id) : undefined
    const text = textOf(b.content)
    if (HELD.test(text)) out.holds.push(use?.tool ?? '?')
    else if (use?.command !== undefined && FAILED_EXIT.test(text)) out.failures.push(commandKey(use.command))
  }
}

export function signalsOf(jsonl: string): Signals {
  const out: Signals = { prompts: [], holds: [], failures: [] }
  const uses = new Map<string, Use>()
  for (const line of jsonl.split('\n')) {
    const row = parseRow(line)
    if (row?.type === 'assistant') noteUses(row, uses)
    if (row?.type !== 'user') continue
    noteErrors(row, uses, out)
    const prompt = typedPrompt(row)
    if (prompt !== undefined) out.prompts.push(prompt)
  }
  return out
}
