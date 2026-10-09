import type { TaskStatus, TrackedTask } from '../types'

// The task list a loop keeps: TodoWrite replaces it whole, TaskCreate and TaskUpdate edit it.
export const TASK_TOOLS: readonly string[] = ['TodoWrite', 'TaskCreate', 'TaskUpdate']

const STATUSES: readonly TaskStatus[] = ['pending', 'in_progress', 'completed']

const statusOf = (s: unknown): TaskStatus => (STATUSES.includes(s as TaskStatus) ? (s as TaskStatus) : 'pending')

type Call = Record<string, unknown>

const fromTodos = (todos: unknown): TrackedTask[] => {
  if (!Array.isArray(todos)) return []
  return todos
    .filter(todo => typeof todo?.content === 'string' && todo.content.trim())
    .map((todo, i) => ({ id: `todo-${i + 1}`, title: String(todo.content).trim(), status: statusOf(todo.status) }))
}

const taskIdOf = (result: unknown): string => {
  const id = (result as { task?: { id?: unknown } } | undefined)?.task?.id
  return typeof id === 'string' ? id : ''
}

const createTask = (list: TrackedTask[], call: Call, result: unknown): TrackedTask[] => {
  const id = taskIdOf(result)
  if (!id) return list
  const title = typeof call.subject === 'string' && call.subject.trim() ? call.subject.trim() : id
  return [...list.filter(task => task.id !== id), { id, title, status: 'pending' }]
}

const updateTask = (list: TrackedTask[], call: Call): TrackedTask[] => {
  if (call.status === 'deleted') return list.filter(task => task.id !== call.taskId)
  return list.map(task => {
    if (task.id !== call.taskId) return task
    const title = typeof call.subject === 'string' && call.subject.trim() ? call.subject.trim() : task.title
    return { ...task, title, status: call.status ? statusOf(call.status) : task.status }
  })
}

/** One task-list call applied to `list`; `result` is the tool's answer (TaskCreate's names the new id). */
export function applyTaskTool(list: TrackedTask[], call: Call, result: unknown): TrackedTask[] {
  if (call.tool === 'TodoWrite') return fromTodos(call.todos)
  if (call.tool === 'TaskCreate') return createTask(list, call, result)
  if (call.tool === 'TaskUpdate') return updateTask(list, call)
  return list
}

export type TaskCount = { done: number; active: number; total: number }

export const countTasks = (list: readonly TrackedTask[]): TaskCount => ({
  done: list.filter(task => task.status === 'completed').length,
  active: list.filter(task => task.status === 'in_progress').length,
  total: list.length,
})

// A new request keeps the open tasks; the finished ones belonged to the last request.
export const openTasks = (list: readonly TrackedTask[]): TrackedTask[] => list.filter(task => task.status !== 'completed')
