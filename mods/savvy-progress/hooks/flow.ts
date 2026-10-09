import type { AgentRun, Flow, Phase, PlannedTask } from '../types'
import { norm } from './format'

export const PHASES: readonly Phase[] = ['plan', 'design', 'delegate', 'review', 'close']

export type ProgressInput = {
  title?: string
  total?: number
  done?: number
  phase?: Phase
  finished?: boolean
  tasks?: { title?: string; tier?: string; after?: number[] }[]
}

export type Planned = PlannedTask & { n: number }

export const blankFlow = (): Flow => ({
  title: 'savvy-flow',
  total: 0,
  done: 0,
  phase: 'plan',
  isFinished: false,
  tasks: [],
})

export const isNewFlow = (prev: Flow | null, input: ProgressInput): boolean =>
  !prev || prev.isFinished || (input.title !== undefined && input.title.trim() !== prev.title)

const cleanTasks = (tasks: ProgressInput['tasks']): PlannedTask[] | undefined =>
  tasks
    ?.filter(task => task.title?.trim())
    .map(task => ({
      title: (task.title ?? '').trim(),
      tier: (task.tier ?? '').replace(/^savvy-/, '').trim().toLowerCase(),
      after: (task.after ?? []).filter(n => Number.isInteger(n) && n > 0),
    }))

export const mergeFlow = (prev: Flow | null, input: ProgressInput): Flow => {
  // A new title means a new flow: never carry counters over from an earlier one.
  const base = isNewFlow(prev, input) || !prev ? blankFlow() : { ...blankFlow(), ...prev }
  const tasks = cleanTasks(input.tasks) ?? base.tasks
  const total = Math.max(0, Math.round(input.total ?? (input.tasks ? tasks.length : base.total)))
  const done = Math.min(total || Infinity, Math.max(0, Math.round(input.done ?? base.done)))
  const phase = input.phase && PHASES.includes(input.phase) ? input.phase : base.phase
  return {
    title: input.title?.trim() || base.title,
    total,
    done,
    phase: input.finished ? 'close' : phase,
    isFinished: input.finished === true,
    tasks,
  }
}

// Planned tasks no run has picked up yet: a run is matched to its task by its description.
export const plannedOf = (f: Flow | null, list: AgentRun[]): Planned[] => {
  if (!f || f.isFinished) return []
  const started = new Set(list.map(a => norm(a.description)))
  return (f.tasks ?? []).map((task, i) => ({ ...task, n: i + 1 })).filter(task => !started.has(norm(task.title)))
}
