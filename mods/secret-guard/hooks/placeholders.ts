import { fileText, isFileTool } from './tools'
import { hasTokens, reveal, scrub, sessionVault } from './vault'

// Secret placeholders: a key pasted into a prompt reaches the model as `⟦secret:N⟧`, goes back in only where
// a Bash command runs, and any echo of it in a tool's output is turned back into the placeholder.
// Plain decisions only: register.tsx makes every call on `$`.

type Block = { type: string; [field: string]: unknown }
type Section = { id: string; text: string; scope: 'shared' | 'session' }

const SECTION_ID = 'secret-guard:placeholders'
// The rows a tool's output reaches the model by.
const TOOL_DOORS = new Set(['tool-result', 'tool-message'])

const NOTE = [
  'Some values in this conversation appear as ⟦secret:N⟧ placeholders. Each stands for a real secret the person shared; secret-guard keeps the value out of the chat.',
  'In a Bash command write the placeholder verbatim, quoted as you would quote the value: it is replaced with the real value just before the command runs, and output that echoes the value shows the placeholder again.',
  'Never ask the person for the value. Files get the placeholder as written, not the value: code should read the secret from the environment (.env).',
].join(' ')

export const TOKEN_NOTE = 'secret-guard: the file keeps each ⟦secret:N⟧ placeholder as written; real values are put in only for Bash commands.'

// The system prompt gets one short section while the session holds any placeholder.
export function withNote<S extends Section>(sections: readonly S[]): (S | Section)[] {
  const rest = sections.filter(section => section.id !== SECTION_ID)

  return sessionVault.byValue.size === 0 ? rest : [...rest, { id: SECTION_ID, text: NOTE, scope: 'session' }]
}

// A file write that passes keeps its placeholders, and Claude is told so in one line.
export function withTokenNote<R extends { deny?: unknown; context?: readonly string[] }>(input: Record<string, unknown>, ran: R): R {
  if (ran.deny !== undefined || !isFileTool(input) || !hasTokens(fileText(input))) return ran

  return { ...ran, context: [...(ran.context ?? []), TOKEN_NOTE] }
}

// A Bash command with the real values in; a deny when this session no longer holds one of them.
export function bashCommand(command: string): { command: string } | { deny: string } {
  const { text, missing } = reveal(sessionVault, command)
  if (missing.length === 0) return { command: text }

  return { deny: `secret-guard no longer holds ${missing.join(', ')} (the mod reloaded or the chat was cleared), so the command did not run. Ask the person to paste the secret again.` }
}

function scrubBlock(block: Block): Block {
  if (block.type === 'text' && typeof block.text === 'string') return { ...block, text: scrub(sessionVault, block.text) }
  if (block.type !== 'tool_result') return block
  const content = block.content
  if (typeof content === 'string') return { ...block, content: scrub(sessionVault, content) }

  return Array.isArray(content) ? { ...block, content: content.map(item => scrubBlock(item as Block)) } : block
}

// A tool's output row with every real value turned back into its placeholder; null when there is nothing to do.
export function scrubbedContent(row: { door: string; content: readonly unknown[] }): Block[] | null {
  if (sessionVault.byValue.size === 0 || !TOOL_DOORS.has(row.door)) return null

  return row.content.map(block => scrubBlock(block as Block))
}
