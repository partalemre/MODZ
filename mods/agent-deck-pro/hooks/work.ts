// What an agent's own tool calls say about its work: the step of its task list, or else a coarse
// phase, the files it touched and whether its last test run failed. Read from calls the engine
// already routes through the plugin; nothing is asked of a model.
import type { DeckAgent, TaskStatus, WorkPhase } from '../types'

export type Step = { position: number; total: number; current: string | null }

type Todo = { status: string; content?: unknown; activeForm?: unknown }

const EXPLORE_TOOLS = ['Read', 'Grep', 'Glob', 'LS', 'WebFetch', 'WebSearch', 'NotebookRead', 'ToolSearch']
const EDIT_TOOLS = ['Edit', 'Write', 'MultiEdit', 'NotebookEdit']
const PATH_KEYS = ['file_path', 'notebook_path', 'path']
const TEST_WORDS = /\b(test|tests|spec|validate|vitest|jest|pytest|mocha|tsc|lint|eslint|check)\b/i
const FAIL_COUNT = /\b[1-9]\d* (fail|failed|failing|failures?)\b/i
const PHASE_ORDER: WorkPhase[] = ['explore', 'edit', 'test', 'report']
const PHASE_NAMES: Record<WorkPhase, string> = { explore: 'keşif', edit: 'düzenleme', test: 'test', report: 'rapor' }

function textOf(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function isTestCommand(tool: string, input: Record<string, unknown>): boolean {
  return tool === 'Bash' && TEST_WORDS.test(textOf(input.command))
}

// The phase one call shows, or null for a call that says nothing about it (a plain shell command).
export function phaseOfCall(tool: string, input: Record<string, unknown>): WorkPhase | null {
  if (EXPLORE_TOOLS.includes(tool)) return 'explore'
  if (EDIT_TOOLS.includes(tool)) return 'edit'

  return isTestCommand(tool, input) ? 'test' : null
}

export function editedPath(tool: string, input: Record<string, unknown>): string | null {
  if (!EDIT_TOOLS.includes(tool)) return null
  const key = PATH_KEYS.find(name => textOf(input[name]) !== '')

  return key === undefined ? null : textOf(input[key])
}

export function hasTestFailed(ran: unknown): boolean {
  const result = ran as { isError?: unknown; text?: unknown } | null
  if (result?.isError === true) return true

  return FAIL_COUNT.test(textOf(result?.text))
}

// A finished call's lasting marks: a file it edited, and the verdict of a test run.
export function afterCall(agent: DeckAgent, call: { tool: string; input: Record<string, unknown>; ran: unknown }): DeckAgent {
  const path = editedPath(call.tool, call.input)
  const files = path !== null && !agent.files.includes(path) ? [...agent.files, path] : agent.files
  const hasFailingTest = isTestCommand(call.tool, call.input) ? hasTestFailed(call.ran) : agent.hasFailingTest

  return { ...agent, files, hasFailingTest }
}

export function setTask(agent: DeckAgent, id: string, change: { status?: TaskStatus; subject?: string }): DeckAgent {
  const tasks = change.status === undefined ? agent.tasks : { ...agent.tasks, [id]: change.status }
  const subjects = change.subject === undefined || change.subject === '' ? agent.subjects : { ...agent.subjects, [id]: change.subject }

  return { ...agent, tasks, subjects }
}

export function setTodos(agent: DeckAgent, todos: Todo[]): DeckAgent {
  const done = todos.filter(todo => todo.status === 'completed').length
  const active = todos.find(todo => todo.status === 'in_progress')
  const current = active === undefined ? null : textOf(active.activeForm) || textOf(active.content) || null

  return { ...agent, todos: { done, total: todos.length, current } }
}

function taskStep(agent: DeckAgent): { done: number; total: number; current: string | null } | null {
  if (agent.todos !== null && agent.todos.total > 0) return agent.todos
  const ids = Object.keys(agent.tasks).filter(id => agent.tasks[id] !== 'deleted')
  if (ids.length === 0) return null
  const active = ids.find(id => agent.tasks[id] === 'in_progress')

  return {
    done: ids.filter(id => agent.tasks[id] === 'completed').length,
    total: ids.length,
    current: active === undefined ? null : (agent.subjects[active] ?? null),
  }
}

// The step it is on by its own task list: the one after those done, never past the last.
export function stepOf(agent: DeckAgent): Step | null {
  const list = taskStep(agent)
  if (list === null) return null

  return { position: Math.min(list.total, list.done + 1), total: list.total, current: list.current }
}

export function phaseName(phase: WorkPhase): string {
  return PHASE_NAMES[phase]
}

// The phase as a four-dot stepper: honest about position, silent about percent.
export function phaseDots(phase: WorkPhase): string {
  const reached = PHASE_ORDER.indexOf(phase) + 1

  return '●'.repeat(reached) + '○'.repeat(PHASE_ORDER.length - reached)
}
