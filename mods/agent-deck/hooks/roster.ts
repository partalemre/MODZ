import type { AgentInfo, SessionMessage } from 'claude-code'

import type { DeckAgent, DeckLine, DeckType } from '../types'

export type Counts = { running: number; done: number; failed: number }

const RUNNING = 'running'
const FAILED_STATUSES = ['failed', 'killed', 'error']
const MS_PER_SECOND = 1_000
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const THOUSAND = 1_000
const MAX_DETAIL = 56
const MAX_LINES = 14
const MAX_LINE_TEXT = 220
const MAX_TYPE_DESCRIPTION = 120
const SPINNER_FRAMES = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
const SPINNER_MS = 110

const BUILTIN_TYPES: DeckType[] = [
  { name: 'general-purpose', description: 'Research, search and multi-step work', source: 'built-in' },
  { name: 'Explore', description: 'Fast read-only codebase search', source: 'built-in' },
  { name: 'Plan', description: 'Designs an implementation plan', source: 'built-in' },
]

const INPUT_KEYS = ['file_path', 'path', 'pattern', 'command', 'query', 'url', 'description', 'prompt']

export function builtinTypes(): DeckType[] {
  return BUILTIN_TYPES
}

export function shortText(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim()

  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat
}

export function summarizeInput(input: Record<string, unknown>): string {
  for (const key of INPUT_KEYS) {
    const value = input[key]
    if (typeof value === 'string' && value !== '') return shortText(value, MAX_DETAIL)
  }

  return ''
}

export function isRunning(agent: DeckAgent): boolean {
  return agent.status === RUNNING
}

export function isFailed(agent: DeckAgent): boolean {
  return FAILED_STATUSES.includes(agent.status)
}

export function countsOf(agents: DeckAgent[]): Counts {
  return {
    running: agents.filter(isRunning).length,
    failed: agents.filter(isFailed).length,
    done: agents.filter(agent => !isRunning(agent) && !isFailed(agent)).length,
  }
}

export function elapsedText(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / MS_PER_SECOND))
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE)
  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  if (hours > 0) return `${hours}h ${String(minutes % MINUTES_PER_HOUR).padStart(2, '0')}m`
  if (minutes > 0) return `${minutes}m ${String(seconds % SECONDS_PER_MINUTE).padStart(2, '0')}s`

  return `${seconds}s`
}

export function compact(count: number): string {
  return count >= THOUSAND ? `${(count / THOUSAND).toFixed(1)}k` : String(Math.round(count))
}

export function spinnerAt(nowMs: number): string {
  return SPINNER_FRAMES[Math.floor(nowMs / SPINNER_MS) % SPINNER_FRAMES.length]
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
    steps: 0,
    tokens: 0,
    answer: null,
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
    const hasEnded = before !== undefined && before.status === RUNNING && info.status !== RUNNING
    merged = patchAgent(
      merged,
      {
        id: info.id,
        type: info.type,
        description: info.description,
        status: info.status,
        name: info.name ?? null,
        ...(hasEnded && before.endedAt === null ? { endedAt: nowMs } : {}),
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
  const field = (key: string) => new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(front[1])?.[1]?.trim()
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

export function recordTool(agents: DeckAgent[], spec: { id: string; tool: string; detail: string }, nowMs: number): DeckAgent[] {
  const base = agents.some(agent => agent.id === spec.id) ? agents : [...agents, blankAgent(spec.id, nowMs)]

  return base.map(agent =>
    agent.id === spec.id ? { ...agent, tool: spec.tool, detail: spec.detail, steps: agent.steps + 1, endedAt: null } : agent,
  )
}

export function addTokens(agents: DeckAgent[], spec: { id: string; tokens: number }, nowMs: number): DeckAgent[] {
  const base = agents.some(agent => agent.id === spec.id) ? agents : [...agents, blankAgent(spec.id, nowMs)]

  return base.map(agent => (agent.id === spec.id ? { ...agent, tokens: agent.tokens + spec.tokens } : agent))
}

export function themeOf(value: unknown): 'light' | 'dark' | 'auto' {
  const text = String(value ?? '').toLowerCase()
  if (text.includes('light')) return 'light'
  if (text.includes('dark')) return 'dark'

  return 'auto'
}
