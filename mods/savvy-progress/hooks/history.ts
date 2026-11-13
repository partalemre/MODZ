import type { AgentRun, ToolEvent } from '../types'
import { toolName, toolTarget } from './format'
import { plainLang } from './i18n'
import { plainCall, purposeOf, reasonOf } from './kit/plain'

// Each agent's work history: one entry per tool call, opened at the call and closed by its result.

const HISTORY_MAX = 150

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

export const KIND_GLYPH: Record<Kind, string> = { read: '◇', edit: '✎', run: '❯', agent: '◆', other: '•' }

export type CallFacts = { call: Record<string, unknown>; at: number; id?: string }

const pathOf = (call: Record<string, unknown>): string | undefined => {
  const value = call.file_path ?? call.notebook_path
  return typeof value === 'string' && value.startsWith('/') ? value : undefined
}

export const openEvent = (a: AgentRun, facts: CallFacts): AgentRun => {
  const tool = String(facts.call.tool ?? '')
  // A call of the step whose reason is kept takes it, and leaves one fewer to take it.
  const owed = a.reason !== undefined && a.reason.left > 0 ? a.reason : undefined
  const event: ToolEvent = { id: facts.id, tool: toolName(tool), target: toolTarget(facts.call), plain: plainCall(tool, facts.call, plainLang()), why: purposeOf(facts.call) || undefined, because: owed?.text, path: pathOf(facts.call), at: facts.at }
  return { ...a, reason: owed ? { ...owed, left: owed.left - 1 } : a.reason, history: [...(a.history ?? []), event].slice(-HISTORY_MAX) }
}

/** One model reply: what it wrote, how many tool calls it asked for, and when its request went out. */
export type StepFacts = { answer: string; calls: number; sentAt: number }

/**
 * Keeps what the agent wrote before a step's calls as their reason. A step's reply names its calls without their
 * ids, and a call may open while the reply still streams: the calls opened since the request went out take the
 * reason now, and it is kept for the ones still to open.
 */
export const withReason = (a: AgentRun, step: StepFacts): AgentRun => {
  const text = reasonOf(step.answer)
  if (text === '' || step.calls === 0) return a.reason ? { ...a, reason: undefined } : a
  const list = a.history ?? []
  const opened = list.filter(e => e.at >= step.sentAt).slice(-step.calls)
  const history = list.map(e => (opened.includes(e) ? { ...e, because: text } : e))
  return { ...a, history, reason: { text, left: step.calls - opened.length } }
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
