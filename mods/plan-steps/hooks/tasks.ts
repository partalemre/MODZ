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

// The desktop Code tab keeps its own task list (mcp__ccd_turn__update_plan) in place of TodoWrite: the whole
// list with `items`, else `advance` (finish the step under way, start the next) or 1-based `done`/`start`.
type DeskPlan = { items?: unknown; advance?: unknown; done?: unknown; start?: unknown }

function steps(value: unknown): Set<number> {
  return new Set(Array.isArray(value) ? value.filter(Number.isInteger).map(n => (n as number) - 1) : [])
}

function advanced(tasks: PlanTask[]): PlanTask[] {
  const current = tasks.findIndex(task => task.status === 'in_progress')
  const next = tasks.findIndex((task, index) => index > current && task.status === 'pending')

  return tasks.map((task, index) => {
    if (index === current) return { ...task, status: 'completed' }

    return index === next ? { ...task, status: 'in_progress' } : task
  })
}

export function fromDeskPlan(tasks: PlanTask[], plan: DeskPlan): PlanTask[] {
  if (Array.isArray(plan.items)) return fromTodos(plan.items)
  if (plan.advance === true) return advanced(tasks)
  const done = steps(plan.done)
  const start = Number.isInteger(plan.start) ? (plan.start as number) - 1 : -1

  return tasks.map((task, index) => {
    if (done.has(index)) return { ...task, status: 'completed' }
    if (index === start) return { ...task, status: 'in_progress' }

    return start !== -1 && task.status === 'in_progress' ? { ...task, status: 'pending' } : task
  })
}

// The desktop's wrap-up checks the whole list off.
export function finished(tasks: PlanTask[]): PlanTask[] {
  return tasks.map(task => ({ ...task, status: 'completed' }))
}
