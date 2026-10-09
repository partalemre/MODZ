// The swimlane's raw material: each tool call as a stretch of time of one kind, and the drawer's
// last few calls. Kept short so a long-lived agent never grows the state without bound.
import type { DeckAgent, DeckCall, DeckSpan, ToolKind } from '../types'

const READ_TOOLS = ['Read', 'Grep', 'Glob', 'LS', 'WebFetch', 'WebSearch', 'NotebookRead', 'ToolSearch']
const EDIT_TOOLS = ['Edit', 'Write', 'MultiEdit', 'NotebookEdit']
const SPANS_KEPT = 60
export const CALLS_KEPT = 5

const GLYPHS: Record<string, string> = {
  Read: 'R', NotebookRead: 'R', Edit: 'E', MultiEdit: 'E', NotebookEdit: 'E', Write: 'W', Bash: '$',
  Grep: 'S', Glob: 'S', LS: 'S', ToolSearch: 'S', WebFetch: 'G', WebSearch: 'G', Task: 'A', Agent: 'A',
}

export function kindOf(tool: string): ToolKind {
  if (READ_TOOLS.includes(tool)) return 'read'

  return EDIT_TOOLS.includes(tool) ? 'edit' : 'run'
}

// The one-letter monogram a tool's chip carries.
export function glyphOf(tool: string): string {
  if (tool.startsWith('mcp__')) return 'M'

  return GLYPHS[tool] ?? (tool.charAt(0).toUpperCase() || '?')
}

export type CallStart = { tool: string; detail: string; callId: string | null; nowMs: number }

export function openCall(agent: DeckAgent, start: CallStart): DeckAgent {
  const kind = kindOf(start.tool)
  const span: DeckSpan = { kind, start: start.nowMs, end: null, callId: start.callId }
  const call: DeckCall = { tool: start.tool, detail: start.detail, kind, at: start.nowMs, isOk: null, callId: start.callId }

  return { ...agent, spans: [...agent.spans, span].slice(-SPANS_KEPT), calls: [...agent.calls, call].slice(-CALLS_KEPT) }
}

// The call that just ended: the one with its id, else the newest still open.
function endedIndex<T extends { callId: string | null }>(list: T[], callId: string | null, isOpen: (item: T) => boolean): number {
  for (let index = list.length - 1; index >= 0; index -= 1) {
    const item = list[index]
    if (item === undefined || !isOpen(item)) continue
    if (callId === null || item.callId === null || item.callId === callId) return index
  }

  return -1
}

export function closeCall(agent: DeckAgent, end: { callId: string | null; nowMs: number; isOk: boolean }): DeckAgent {
  const spanAt = endedIndex(agent.spans, end.callId, span => span.end === null)
  const callAt = endedIndex(agent.calls, end.callId, call => call.isOk === null)
  const spans = agent.spans.map((span, index) => (index === spanAt ? { ...span, end: end.nowMs } : span))
  const calls = agent.calls.map((call, index) => (index === callAt ? { ...call, isOk: end.isOk } : call))

  return { ...agent, spans, calls }
}

export function isCleanResult(ran: unknown): boolean {
  return (ran as { isError?: unknown } | null)?.isError !== true
}
