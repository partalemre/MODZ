import { setTask, setTodos } from './work'
import type { DeckAgent, TaskStatus } from '../types'

type Change = (agent: DeckAgent) => DeckAgent

// The id TaskCreate's result names, or a local one when the result carries none.
export function taskIdOf(ran: unknown, fallback: string): string {
  const result = (ran as { result?: { task?: { id?: unknown } } } | null)?.result
  const id = result?.task?.id

  return typeof id === 'string' && id !== '' ? id : fallback
}

function textOf(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

// How a finished task-list call moves its agent's step; null for any other tool.
export function taskChange(input: Record<string, unknown>, spec: { ran: unknown; localId: string }): Change | null {
  if (input.tool === 'TaskCreate') {
    const taskId = taskIdOf(spec.ran, spec.localId)
    const subject = textOf(input.activeForm) ?? textOf(input.subject)

    return agent => setTask(agent, taskId, { status: 'pending', subject })
  }
  if (input.tool === 'TaskUpdate') {
    const status = typeof input.status === 'string' ? (input.status as TaskStatus) : undefined
    const subject = textOf(input.activeForm) ?? textOf(input.subject)
    if (status === undefined && subject === undefined) return null

    return agent => setTask(agent, String(input.taskId), { status, subject })
  }
  if (input.tool === 'TodoWrite' && Array.isArray(input.todos)) {
    const todos = input.todos as { status: string }[]

    return agent => setTodos(agent, todos)
  }

  return null
}
