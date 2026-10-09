import type { ThemeKey } from 'claude-code'

import type { AgentRun, ToolEvent } from '../types'
import { toolName, toolTarget } from './format'

// Each agent's work history: one entry per tool call, opened at the call and closed by its result.

const HISTORY_MAX = 60

export type Kind = 'read' | 'edit' | 'run' | 'agent' | 'other'

const READ = ['Read', 'Grep', 'Glob', 'LS', 'WebFetch', 'WebSearch', 'NotebookRead']
const EDIT = ['Edit', 'Write', 'MultiEdit', 'NotebookEdit']
const RUN = ['Bash', 'BashOutput', 'KillShell', 'Monitor']
const AGENT = ['Agent', 'Task', 'SendMessage']

export const kindOf = (tool: string): Kind => {
  if (READ.includes(tool)) return 'read'
  if (EDIT.includes(tool)) return 'edit'
  if (RUN.includes(tool)) return 'run'
  return AGENT.includes(tool) ? 'agent' : 'other'
}

export const KIND_KEY: Record<Kind, ThemeKey> = { read: 'suggestion', edit: 'claude', run: 'permission', agent: 'merged', other: 'subtle' }
export const KIND_GLYPH: Record<Kind, string> = { read: '◇', edit: '✎', run: '❯', agent: '◆', other: '•' }

export type CallFacts = { call: Record<string, unknown>; at: number; id?: string }

export const openEvent = (a: AgentRun, facts: CallFacts): AgentRun => {
  const event: ToolEvent = { id: facts.id, tool: toolName(String(facts.call.tool ?? '')), target: toolTarget(facts.call), at: facts.at }
  return { ...a, history: [...(a.history ?? []), event].slice(-HISTORY_MAX) }
}

export type ResultFacts = { id?: string; tool: string; at: number; isError: boolean }

// Closes the call by its id, else the latest still-open call of the same tool.
export const closeEvent = (a: AgentRun, facts: ResultFacts): AgentRun => {
  const list = a.history ?? []
  const name = toolName(facts.tool)
  const isOpen = (e: ToolEvent) => e.endAt === undefined && (facts.id ? e.id === facts.id : e.tool === name)
  const index = list.map(isOpen).lastIndexOf(true)
  if (index < 0) return a
  const closed = list.map((e, i) => (i === index ? { ...e, endAt: facts.at, isError: facts.isError } : e))
  return { ...a, history: closed }
}
