import type { AgentRun, Flow, Job, TrackedTask } from '../types'
import { plannedOf } from './flow'
import { norm } from './format'
import { t } from './i18n'
import { countTasks } from './tasks'

// What the band shows, derived only from what was observed: the orchestrator's own report,
// else the main loop's task list, else the agents it launched for this request.

const NEAR_DONE = 0.99
const PERCENT = 100

export type JobSource = 'report' | 'tasks' | 'agents'

export type JobView = {
  source: JobSource
  title: string
  /** The pill: phase and count. */
  label: string
  /** Share done, running agents' own reports included; null while nothing is measurable. */
  ratio: number | null
  /** The ratio leans on running agents' self-reports. */
  isEstimate: boolean
  /** Share handed out, done or not: where the faint layer ends. */
  launched: number
  /** Unit boundaries to tick on the track (tasks or agents). */
  units: number
  isFinished: boolean
  isWorking: boolean
  crew: number
  /** Agents of this request that ended without an answer. */
  failed: number
}

export type JobInput = { flow: Flow | null; agents: AgentRun[]; job: Job | null; tasks: TrackedTask[] }

type Credit = { sum: number; isEstimate: boolean }

// A running agent's own share of its work when it says so: its `step` reports, else its task list.
export const partialOf = (a: AgentRun): number | null => {
  if (a.status !== 'running') return null
  if (a.stepTotal) return Math.min(1, (a.stepDone ?? 0) / a.stepTotal)
  const own = countTasks(a.todos ?? [])
  return own.total ? own.done / own.total : null
}

const creditOf = (list: AgentRun[]): Credit => {
  const parts = list.map(partialOf).filter((p): p is number => p !== null && p > 0)
  return { sum: parts.reduce((sum, p) => sum + p, 0), isEstimate: parts.length > 0 }
}

const NO_CREDIT: Credit = { sum: 0, isEstimate: false }

// Nothing measurable reads as null ("—"), never as 0%; a running job never reaches 100% on credit.
const ratioOf = (done: number, credit: Credit, total: number, isFinished: boolean): number | null => {
  if (isFinished) return 1
  if (!total) return null
  const ratio = Math.min(NEAR_DONE, (done + credit.sum) / total)
  return ratio > 0 ? ratio : null
}

export const jobAgents = (input: JobInput): AgentRun[] => {
  const { job } = input
  if (!job || job.isHidden) return []
  return input.agents.filter(a => job.agentIds.includes(a.id))
}

const agentsTitle = (list: AgentRun[]): string => {
  const first = list[0]
  const name = first ? first.description || first.type : t().agents
  return list.length > 1 ? `${name} +${list.length - 1}` : name
}

const reportLabel = (f: Flow, running: number): string => {
  const s = t()
  if (f.isFinished) return s.done
  if (f.phase === 'plan') return s.plan
  if (f.phase === 'design') return s.design
  const word = f.phase === 'review' ? s.review : s.tasks
  if (f.total) return `${word} ${f.done}/${f.total}`
  return running ? `${word} · ${running} ${s.busy}` : word
}

function reportView(f: Flow, list: AgentRun[], input: JobInput): JobView {
  const running = list.filter(a => a.status === 'running')
  const credit = f.total ? creditOf(running) : NO_CREDIT
  const handed = new Set(list.map(a => norm(a.description))).size
  const launched = f.total ? Math.min(f.total, Math.max(f.done + running.length, handed)) / f.total : 0
  return {
    source: 'report',
    title: f.title,
    label: reportLabel(f, running.length),
    ratio: ratioOf(f.done, credit, f.total, f.isFinished),
    isEstimate: credit.isEstimate && !f.isFinished,
    launched: f.isFinished ? 1 : launched,
    units: f.total,
    isFinished: f.isFinished,
    isWorking: running.length > 0,
    crew: input.agents.length + plannedOf(f, input.agents).length,
    failed: 0,
  }
}

function tasksView(tasks: TrackedTask[], list: AgentRun[]): JobView {
  const count = countTasks(tasks)
  const running = list.filter(a => a.status === 'running').length
  const isFinished = count.done === count.total && running === 0
  return {
    source: 'tasks',
    title: agentsTitle(list),
    label: isFinished ? t().done : `${t().tasks} ${count.done}/${count.total}`,
    ratio: ratioOf(count.done, NO_CREDIT, count.total, isFinished),
    isEstimate: false,
    launched: isFinished ? 1 : (count.done + count.active) / count.total,
    units: count.total,
    isFinished,
    isWorking: running > 0,
    crew: list.length,
    failed: 0,
  }
}

function agentsView(list: AgentRun[]): JobView {
  const s = t()
  const running = list.filter(a => a.status === 'running')
  const ended = list.length - running.length
  const failed = list.filter(a => a.status === 'failed').length
  const isFinished = running.length === 0
  const credit = creditOf(running)
  const done = failed ? `${s.done} · ${s.errors(failed)}` : s.done
  return {
    source: 'agents',
    title: agentsTitle(list),
    label: isFinished ? done : `${s.agents} ${ended}/${list.length}`,
    ratio: ratioOf(ended, credit, list.length, isFinished),
    isEstimate: credit.isEstimate && !isFinished,
    launched: 1,
    units: list.length,
    isFinished,
    isWorking: !isFinished,
    crew: list.length,
    failed,
  }
}

export function deriveJob(input: JobInput): JobView | null {
  const list = jobAgents(input)
  if (input.flow) return reportView(input.flow, list, input)
  if (!list.length) return null
  return input.tasks.length ? tasksView(input.tasks, list) : agentsView(list)
}

/** "%50", "~%40" while it leans on self-reports, "—" while nothing is measurable. */
export const percentText = (view: JobView): string => {
  if (view.ratio === null) return '—'
  const n = Math.max(1, Math.round(view.ratio * PERCENT))
  return `${view.isEstimate ? '~' : ''}${t().pct(n)}`
}

// A launch from the main loop joins the request's job, or opens a new one after a new request.
export const joinJob = (prev: Job | null, id: string, at: number): Job => {
  if (!prev || prev.isSealed) return { agentIds: [id], startedAt: at, isSealed: false, isHidden: false }
  return { ...prev, agentIds: [...prev.agentIds.filter(other => other !== id), id] }
}

// A new request: a job with nothing left running is over and the next launch starts a new one,
// but its band stays up as the last result until ✕ or that new job replaces it.
export const sealJob = (prev: Job | null, list: AgentRun[]): Job | null => {
  if (!prev) return null
  const isBusy = list.some(a => prev.agentIds.includes(a.id) && a.status === 'running')
  return isBusy ? prev : { ...prev, isSealed: true }
}
