import type { ReplayPlanItem, ReplayPlanStatus, ReplayPlanStep } from '../types'

export const PLAN_TOOLS = ['TodoWrite', 'TaskCreate', 'TaskUpdate', 'TaskList'] as const

type Fields = Record<string, unknown>

function asStatus(value: unknown): ReplayPlanStatus | null {
  return value === 'pending' || value === 'in_progress' || value === 'completed' ? value : null
}

function asItems(list: unknown, titleKey: string): ReplayPlanItem[] {
  if (!Array.isArray(list)) return []

  return list.flatMap((raw: Fields, index) => {
    const status = asStatus(raw?.status)
    const title = raw?.[titleKey]
    if (status === null || typeof title !== 'string') return []
    const id = typeof raw.id === 'string' ? raw.id : String(index + 1)

    return [{ id, title, status }]
  })
}

function created(items: ReplayPlanItem[], input: Fields, result: Fields | undefined): ReplayPlanItem[] {
  if (typeof input.subject !== 'string') return items
  const task = result?.task as Fields | undefined
  const id = typeof task?.id === 'string' ? task.id : String(items.length + 1)

  return [...items, { id, title: input.subject, status: 'pending' }]
}

function updated(items: ReplayPlanItem[], input: Fields): ReplayPlanItem[] {
  if (input.status === 'deleted') return items.filter(item => item.id !== input.taskId)

  return items.map(item => {
    if (item.id !== input.taskId) return item
    const title = typeof input.subject === 'string' ? input.subject : item.title

    return { ...item, title, status: asStatus(input.status) ?? item.status }
  })
}

// The task list after one answered call of a plan tool; other tools leave it as it was.
export function planAfter(items: ReplayPlanItem[], input: Fields, result: unknown): ReplayPlanItem[] {
  const fields = (result ?? undefined) as Fields | undefined
  switch (input.tool) {
    case 'TodoWrite':
      return asItems(input.todos, 'content')
    case 'TaskCreate':
      return created(items, input, fields)
    case 'TaskUpdate':
      return updated(items, input)
    case 'TaskList':
      return Array.isArray(fields?.tasks) ? asItems(fields.tasks, 'subject') : items
    default:
      return items
  }
}

// The item in progress, as its place in the list; null with no list or nothing started.
export function currentStep(items: ReplayPlanItem[]): ReplayPlanStep | null {
  const index = items.findIndex(item => item.status === 'in_progress')
  const item = items[index]

  return item === undefined ? null : { index: index + 1, total: items.length, title: item.title }
}
