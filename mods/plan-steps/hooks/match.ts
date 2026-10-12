import type { DocStep, PlanDoc, PlanTask, StepStatus } from '../types'
import { words } from './words'

export type Step = {
  key: string
  title: string
  status: StepStatus
  // Credit toward progress: 1 done, 0 not begun, between for a step under way.
  credit: number
  checksDone: number
  checksTotal: number
}

export type Plan = { steps: Step[]; source: string }

const IN_PROGRESS_CREDIT = 0.5
const MATCH_MIN = 0.6
const MIN_WORD = 3
const FOLD: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' }
const NUMBER_REF = /\b(?:task|step|adım|görev|phase|aşama)\s*(\d+)\b/i
const NUMBER_LEAD = /^\s*(\d+)[.):]\s/
const RANK: Record<StepStatus, number> = { pending: 0, in_progress: 1, completed: 2 }

export function normalize(text: string): string {
  return text
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşüâîû]/g, char => FOLD[char] ?? char)
    .replace(/\b(?:task|step|adim|gorev|phase|asama)\s*\d+\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function wordSet(text: string): Set<string> {
  return new Set(normalize(text).split(' ').filter(word => word.length >= MIN_WORD))
}

export function numberOf(text: string): number | null {
  const found = NUMBER_REF.exec(text) ?? NUMBER_LEAD.exec(text)

  return found === null ? null : Number(found[1])
}

// Overlap of the shorter title's words with the longer's: 1 when one title holds the other.
export function similarity(a: string, b: string): number {
  const left = wordSet(a)
  const right = wordSet(b)
  const smaller = Math.min(left.size, right.size)
  if (smaller === 0) return normalize(a) !== '' && normalize(a) === normalize(b) ? 1 : 0
  let shared = 0
  for (const word of left) if (right.has(word)) shared += 1

  return shared / smaller
}

function score(step: DocStep, task: PlanTask): number {
  const taskNumber = numberOf(task.subject)
  if (step.number !== null && taskNumber === step.number) return 1

  return similarity(step.title, task.subject)
}

// Greedy best-first pairing: each task speaks for at most one step.
export function matchTasks(steps: DocStep[], tasks: PlanTask[]): Map<number, PlanTask> {
  const pairs: { step: number; task: number; value: number }[] = []
  steps.forEach((step, stepIndex) =>
    tasks.forEach((task, taskIndex) => {
      const value = score(step, task)
      if (value >= MATCH_MIN) pairs.push({ step: stepIndex, task: taskIndex, value })
    }),
  )
  pairs.sort((a, b) => b.value - a.value)
  const matched = new Map<number, PlanTask>()
  const usedTasks = new Set<number>()
  for (const pair of pairs) {
    const task = tasks[pair.task]
    if (matched.has(pair.step) || usedTasks.has(pair.task) || task === undefined) continue
    matched.set(pair.step, task)
    usedTasks.add(pair.task)
  }

  return matched
}

// Keys keep a step's own number ("Adım 21"), unlike the matching words.
function slug(text: string): string {
  return text
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşüâîû]/g, char => FOLD[char] ?? char)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function uniqueKey(title: string, seen: Set<string>): string {
  const base = slug(title) || 'step'
  let key = base
  for (let index = 2; seen.has(key); index += 1) key = `${base}-${index}`
  seen.add(key)

  return key
}

function docStatus(step: DocStep): StepStatus {
  if (step.isChecked || (step.checksTotal > 0 && step.checksDone === step.checksTotal)) return 'completed'

  return step.checksDone > 0 ? 'in_progress' : 'pending'
}

function creditOf(status: StepStatus, step: { checksDone: number; checksTotal: number }): number {
  if (status === 'completed') return 1
  if (status === 'pending') return 0
  if (step.checksTotal > 0 && step.checksDone > 0) return step.checksDone / step.checksTotal

  return IN_PROGRESS_CREDIT
}

function fromTasks(tasks: PlanTask[]): Plan {
  const seen = new Set<string>()
  const steps = tasks.map(task => ({
    key: uniqueKey(task.subject, seen),
    title: task.subject,
    status: task.status,
    credit: creditOf(task.status, { checksDone: 0, checksTotal: 0 }),
    checksDone: 0,
    checksTotal: 0,
  }))

  return { steps, source: words().tasksLabel }
}

function fromDoc(doc: PlanDoc, matched: Map<number, PlanTask>): Step[] {
  const seen = new Set<string>()

  return doc.steps.map((step, index) => {
    const fromTask = matched.get(index)?.status ?? 'pending'
    const fromDocument = docStatus(step)
    const status = RANK[fromTask] >= RANK[fromDocument] ? fromTask : fromDocument
    const checks = { checksDone: step.checksDone, checksTotal: step.checksTotal }

    return { key: uniqueKey(step.title, seen), title: step.title, status, credit: creditOf(status, checks), ...checks }
  })
}

// The plan's own steps lead; the task list gives their status when it speaks for at least half of them.
// A step takes the further of the two states, so a ticked box is never undone by a stale task.
export function resolvePlan(tasks: PlanTask[], doc: PlanDoc | null): Plan | null {
  if (doc === null || doc.steps.length === 0) return tasks.length === 0 ? null : fromTasks(tasks)
  if (tasks.length === 0) return { steps: fromDoc(doc, new Map()), source: doc.label }
  const matched = matchTasks(doc.steps, tasks)
  const needed = Math.ceil(Math.min(doc.steps.length, tasks.length) / 2)
  if (matched.size < needed) return fromTasks(tasks)

  return { steps: fromDoc(doc, matched), source: `${doc.label} · ${words().tasksLabel}` }
}
