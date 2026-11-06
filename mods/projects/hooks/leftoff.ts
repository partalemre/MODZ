import type { LeftOff, TaskItem, TaskStatus } from '../types'

// Where a session stopped, from the end of its transcript: the last thing asked, the last thing said, the closing
// recap when there is one, and its task list as the calls left it.

const MAX_PROMPT = 400
const MAX_REPLY = 600
const LIST_TOOLS = { desk: 'mcp__ccd_turn__update_plan', todo: 'TodoWrite', create: 'TaskCreate', update: 'TaskUpdate', wrap: 'mcp__ccd_turn__wrap_up' }

type Block = { type?: string; text?: string; name?: string; input?: Record<string, unknown> }
type Row = { type?: string; isMeta?: boolean; isSidechain?: boolean; timestamp?: string; message?: { content?: string | Block[] } }

const clip = (text: string, max: number): string => {
  const flat = text.replace(/\s+/g, ' ').trim()

  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat
}

// A reply is flattened to one line, where markdown marks only read as noise.
export const plainOf = (text: string): string => text
  .replace(/^\s{0,3}#{1,6}\s+/gm, '')
  .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/\*\*|__|`/g, '')
  .replace(/^\s*[-*]\s+/gm, '')

const statusOf = (value: unknown): TaskStatus => (value === 'completed' || value === 'in_progress' ? value : 'pending')

function deskPlan(tasks: TaskItem[], input: Record<string, unknown>): TaskItem[] {
  if (Array.isArray(input.items)) return (input.items as { content?: unknown; status?: unknown }[]).map(item => ({ subject: String(item.content ?? ''), status: statusOf(item.status) }))
  const next = tasks.map(task => ({ ...task }))
  const finish = (index: number) => { if (next[index]) next[index].status = 'completed' }
  const begin = (index: number) => { if (next[index]) next[index].status = 'in_progress' }
  if (input.advance === true) {
    const at = next.findIndex(task => task.status === 'in_progress')
    if (at >= 0) finish(at)
    const pending = next.findIndex(task => task.status === 'pending')
    if (pending >= 0) begin(pending)
  }
  if (Array.isArray(input.done)) for (const one of input.done as number[]) finish(one - 1)
  if (typeof input.start === 'number') begin(input.start - 1)

  return next
}

function applyTool(tasks: TaskItem[], block: Block): TaskItem[] {
  const input = block.input ?? {}
  if (block.name === LIST_TOOLS.desk) return deskPlan(tasks, input)
  if (block.name === LIST_TOOLS.todo && Array.isArray(input.todos)) return (input.todos as { content?: unknown; status?: unknown }[]).map(todo => ({ subject: String(todo.content ?? ''), status: statusOf(todo.status) }))
  if (block.name === LIST_TOOLS.create) return [...tasks, { subject: String(input.subject ?? ''), status: 'pending' }]
  if (block.name === LIST_TOOLS.update) {
    const at = Number(input.taskId) - 1

    return tasks.map((task, index) => (index === at && input.status !== undefined ? { ...task, status: statusOf(input.status) } : task))
  }

  return tasks
}

const isOwnPrompt = (text: string): boolean => {
  const start = text.trimStart()

  return start !== '' && !start.startsWith('<') && !start.startsWith('[Request interrupted')
}

// A cut first line and foreign lines are skipped.
export function leftOffOf(text: string, title: string): LeftOff {
  const out: LeftOff = { title, prompt: '', reply: '', recap: '', tasks: [], at: '' }
  for (const line of text.split('\n')) {
    if (line === '') continue
    let row: Row
    try { row = JSON.parse(line) as Row } catch { continue }
    if (row.isSidechain === true || row.isMeta === true) continue
    const content = row.message?.content
    if (row.type === 'user') {
      const said = typeof content === 'string' ? content : (content ?? []).filter(block => block.type === 'text').map(block => block.text ?? '').join(' ')
      if (isOwnPrompt(said)) { out.prompt = clip(said, MAX_PROMPT); out.at = row.timestamp ?? out.at }
    }
    if (row.type !== 'assistant' || !Array.isArray(content)) continue
    out.at = row.timestamp ?? out.at
    for (const block of content) {
      if (block.type === 'text' && (block.text ?? '').trim() !== '') out.reply = clip(plainOf(block.text ?? ''), MAX_REPLY)
      if (block.type !== 'tool_use') continue
      out.tasks = applyTool(out.tasks, block)
      if (block.name === LIST_TOOLS.wrap && typeof block.input?.recap === 'string') out.recap = clip(plainOf(block.input.recap), MAX_REPLY)
    }
  }

  return out
}
