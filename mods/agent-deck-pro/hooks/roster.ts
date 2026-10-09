import type { AgentInfo, SessionMessage } from 'claude-code'

import { shortText } from './format'
import { closeCall, openCall } from './spans'
import type { DeckAgent, DeckLine, DeckType, WorkPhase } from '../types'

export type Counts = { running: number; waiting: number; done: number; failed: number }

const RUNNING = 'running'
const FINISHED_STATUSES = ['completed', 'failed', 'killed', 'error']
const FAILED_STATUSES = ['failed', 'killed', 'error']
const MAX_DETAIL = 56
const MAX_LINES = 14
const MAX_LINE_TEXT = 220
const MAX_TYPE_DESCRIPTION = 120

const BUILTIN_TYPES: DeckType[] = [
  { name: 'general-purpose', description: 'Araştırma, arama ve çok adımlı iş', source: 'built-in' },
  { name: 'Explore', description: 'Hızlı, salt-okunur kod araması', source: 'built-in' },
  { name: 'Plan', description: 'Uygulama planı çıkarır', source: 'built-in' },
]

const INPUT_KEYS = ['file_path', 'notebook_path', 'path', 'pattern', 'command', 'query', 'url', 'description', 'prompt']
const PATH_KEYS = ['file_path', 'notebook_path', 'path']
// Task-list bookkeeping counts as a call but says nothing about what the agent is doing.
const BOOKKEEPING_TOOLS = ['TodoWrite', 'TaskCreate', 'TaskUpdate', 'TaskList', 'TaskGet']
// A path keeps its last segments: the file and its folder say more than the root.
const PATH_SEGMENTS = 2

export function builtinTypes(): DeckType[] {
  return BUILTIN_TYPES
}

function shortPath(path: string): string {
  return path.split('/').filter(part => part !== '').slice(-PATH_SEGMENTS).join('/')
}

export function summarizeInput(input: Record<string, unknown>): string {
  for (const key of INPUT_KEYS) {
    const value = input[key]
    if (typeof value !== 'string' || value === '') continue

    return shortText(PATH_KEYS.includes(key) ? shortPath(value) : value, MAX_DETAIL)
  }

  return ''
}

export function isRunning(agent: DeckAgent): boolean {
  return agent.status === RUNNING
}

// Still in the session's hands: running, queued, held or between a teammate's turns.
export function isLive(agent: DeckAgent): boolean {
  return !FINISHED_STATUSES.includes(agent.status)
}

export function isFailed(agent: DeckAgent): boolean {
  return FAILED_STATUSES.includes(agent.status)
}

export function countsOf(agents: DeckAgent[]): Counts {
  const live = agents.filter(isLive)

  return {
    running: live.filter(isRunning).length,
    waiting: live.length - live.filter(isRunning).length,
    failed: agents.filter(isFailed).length,
    done: agents.filter(agent => !isLive(agent) && !isFailed(agent)).length,
  }
}

export function blankAgent(id: string, nowMs: number): DeckAgent {
  return {
    id,
    type: 'agent',
    description: '',
    status: RUNNING,
    name: null,
    startedAt: nowMs,
    endedAt: null,
    tool: null,
    detail: null,
    toolSince: null,
    lastActivityAt: nowMs,
    steps: 0,
    tokens: 0,
    answer: null,
    model: null,
    costUsd: 0,
    tasks: {},
    subjects: {},
    todos: null,
    phase: null,
    files: [],
    hasFailingTest: false,
    effort: null,
    spans: [],
    calls: [],
  }
}

export function patchAgent(agents: DeckAgent[], patch: Partial<DeckAgent> & { id: string }, nowMs: number): DeckAgent[] {
  const known = agents.some(agent => agent.id === patch.id)
  const base = known ? agents : [...agents, blankAgent(patch.id, nowMs)]

  return base.map(agent => (agent.id === patch.id ? { ...agent, ...patch } : agent))
}

export function mergeList(agents: DeckAgent[], list: AgentInfo[], nowMs: number): DeckAgent[] {
  let merged = agents
  for (const info of list) {
    const before = merged.find(agent => agent.id === info.id)
    // One first seen already finished gets a zero span: its real duration was never seen, so none is drawn.
    const isFinished = FINISHED_STATUSES.includes(info.status)
    const hasEnded = isFinished && (before === undefined || (isLive(before) && before.endedAt === null))
    merged = patchAgent(
      merged,
      {
        id: info.id,
        type: info.type,
        description: info.description,
        status: info.status,
        name: info.name ?? null,
        ...(hasEnded ? { endedAt: nowMs } : {}),
      },
      nowMs,
    )
  }

  return merged
}

export function linesOf(messages: SessionMessage[]): DeckLine[] {
  const lines: DeckLine[] = []
  messages.forEach((message, index) => {
    if (message.role === 'user' && index === 0 && message.text !== '') {
      lines.push({ kind: 'task', text: shortText(message.text, MAX_LINE_TEXT) })
    }
    if (message.role !== 'assistant') return
    if (message.text !== '') lines.push({ kind: 'say', text: shortText(message.text, MAX_LINE_TEXT) })
    for (const use of message.toolUses) {
      lines.push({ kind: 'tool', text: `${use.tool} ${summarizeInput(use.input)}`.trim() })
    }
  })

  return lines.slice(-MAX_LINES)
}

export function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function parseAgentFile(text: string, source: string): DeckType | null {
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (front === null) return null
  const field = (key: string) => new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(front[1] ?? '')?.[1]?.trim()
  const name = field('name')
  if (name === undefined || name === '') return null

  return { name, description: shortText(field('description') ?? '', MAX_TYPE_DESCRIPTION), source }
}

export function mergeTypes(current: DeckType[], found: DeckType[]): DeckType[] {
  const merged = [...current]
  for (const type of found) {
    if (!merged.some(entry => entry.name === type.name)) merged.push(type)
  }

  return merged
}

export type ToolStart = { id: string; tool: string; detail: string; phase: WorkPhase | null; callId: string | null }

export function recordTool(agents: DeckAgent[], spec: ToolStart, nowMs: number): DeckAgent[] {
  const isBookkeeping = BOOKKEEPING_TOOLS.includes(spec.tool)

  return withAgent(agents, { id: spec.id, nowMs }, agent => ({
    ...(isBookkeeping ? agent : openCall(agent, { tool: spec.tool, detail: spec.detail, callId: spec.callId, nowMs })),
    ...(isBookkeeping ? {} : { tool: spec.tool, detail: spec.detail }),
    phase: spec.phase ?? agent.phase,
    steps: agent.steps + 1,
    toolSince: nowMs,
    lastActivityAt: nowMs,
    endedAt: null,
  }))
}

export type ToolEnd = { id: string; nowMs: number; callId: string | null; isOk: boolean }

export function toolDone(agents: DeckAgent[], spec: ToolEnd): DeckAgent[] {
  return withAgent(agents, spec, agent => ({ ...closeCall(agent, spec), toolSince: null, lastActivityAt: spec.nowMs }))
}

export function withAgent(agents: DeckAgent[], spec: { id: string; nowMs: number }, change: (agent: DeckAgent) => DeckAgent): DeckAgent[] {
  const base = agents.some(agent => agent.id === spec.id) ? agents : [...agents, blankAgent(spec.id, spec.nowMs)]

  return base.map(agent => (agent.id === spec.id ? change(agent) : agent))
}

export function themeOf(value: unknown): 'light' | 'dark' | 'auto' {
  const text = String(value ?? '').toLowerCase()
  if (text.includes('light')) return 'light'
  if (text.includes('dark')) return 'dark'

  return 'auto'
}
