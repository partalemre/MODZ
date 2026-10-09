import type { PlanTask, StepStatus } from '../types'

const STATUSES: StepStatus[] = ['pending', 'in_progress', 'completed']

type Todo = { content?: unknown; status?: unknown }
type TaskPatch = { taskId?: unknown; subject?: unknown; status?: unknown }

function statusOf(value: unknown): StepStatus | null {
  return STATUSES.includes(value as StepStatus) ? (value as StepStatus) : null
}

// TodoWrite sends the whole list each time; ids are its positions.
export function fromTodos(todos: unknown): PlanTask[] {
  if (!Array.isArray(todos)) return []

  return (todos as Todo[]).flatMap((todo, index) => {
    const status = statusOf(todo.status)
    const subject = typeof todo.content === 'string' ? todo.content.trim() : ''

    return status === null || subject === '' ? [] : [{ id: `todo-${index}`, subject, status }]
  })
}

export function createTask(tasks: PlanTask[], task: { id: string; subject: string }): PlanTask[] {
  return [...tasks.filter(one => one.id !== task.id), { id: task.id, subject: task.subject.trim(), status: 'pending' }]
}

export function updateTask(tasks: PlanTask[], patch: TaskPatch): PlanTask[] {
  const id = String(patch.taskId ?? '')
  if (patch.status === 'deleted') return tasks.filter(task => task.id !== id)
  const status = statusOf(patch.status)
  const subject = typeof patch.subject === 'string' && patch.subject.trim() !== '' ? patch.subject.trim() : null

  return tasks.map(task =>
    task.id === id ? { ...task, status: status ?? task.status, subject: subject ?? task.subject } : task,
  )
}

// The id the tool gave the new task, else the next number, as the tool counts them.
export function createdId(result: unknown, tasks: PlanTask[]): string {
  const id = (result as { task?: { id?: unknown } } | undefined)?.task?.id
  if (typeof id === 'string' || typeof id === 'number') return String(id)

  return String(tasks.length + 1)
}
