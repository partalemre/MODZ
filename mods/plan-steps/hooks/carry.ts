import type { Plan } from './match'
import { clip } from './progress'
import type { PlanTask, StoredPlan, StoredStep } from '../types'

// The plan kept on disk, one entry per project root, and the short system prompt section that brings an
// open one back into a conversation that no longer holds it (after a compaction, a /clear, a new session).

export const MAX_AGE_MS = 24 * 60 * 60_000
export const SECTION_MAX = 600
export const SECTION_ID = 'plan-steps:open-plan'
export const STORE_KEY = 'plans'
const STEP_TITLE_MAX = 80
const FNV_OFFSET = 0x811c9dc5
const FNV_PRIME = 0x01000193
const HEX = 16
const RESTORED = 'stored-'

export type Plans = Record<string, StoredPlan>
export type CarryCause = 'compact' | 'clear' | 'fresh'

const LEAD: Record<CarryCause, string> = {
  compact: 'The conversation was just compacted, so the plan it was following is no longer in view.',
  clear: 'The conversation was cleared while a plan in this project was still open.',
  fresh: 'A plan from an earlier session in this project is still open.',
}
const TAIL = 'Pick up from the first open step unless the person asks for something else, and keep the task list current.'

// Names a plan by its step titles, so a new read of the same plan is the same plan whatever its statuses.
export function signatureOf(steps: readonly { title: string }[]): string {
  let hash = FNV_OFFSET
  for (const char of steps.map(step => step.title.trim().toLowerCase()).join('\n')) {
    hash = Math.imul(hash ^ (char.codePointAt(0) ?? 0), FNV_PRIME) >>> 0
  }

  return hash.toString(HEX)
}

export const isOpen = (steps: readonly StoredStep[]): boolean => steps.some(step => step.status !== 'completed')

const stepsOf = (plan: Plan): StoredStep[] => plan.steps.map(step => ({ title: step.title, status: step.status }))

const sameSteps = (a: readonly StoredStep[], b: readonly StoredStep[]): boolean =>
  a.length === b.length && a.every((step, k) => step.title === b[k]?.title && step.status === b[k]?.status)

export const plansOf = (value: unknown): Plans => (typeof value === 'object' && value !== null ? (value as Plans) : {})

// The store once the person marked this project's plan done.
export function withoutPlan(plans: Plans, root: string): Plans {
  return Object.fromEntries(Object.entries(plans).filter(([at]) => at !== root))
}

function pruned(plans: Plans, now: number): Plans {
  return Object.fromEntries(Object.entries(plans).filter(([, kept]) => now - kept.at <= MAX_AGE_MS))
}

// The store after the plan in view changed: kept while open, dropped once done or marked done. An entry
// whose steps did not change keeps its time, so a plan carried from session to session still ages out.
export function keptPlans(plans: Plans, seen: { root: string; plan: Plan | null; dismissed: string | null; now: number }): Plans {
  const next = pruned(plans, seen.now)
  const { plan, root } = seen
  if (plan === null || plan.steps.length === 0) return next
  const steps = stepsOf(plan)
  const before = next[root]
  if (seen.dismissed === signatureOf(steps) || !isOpen(steps)) {
    delete next[root]

    return next
  }
  if (before !== undefined && sameSteps(before.steps, steps)) return next

  return { ...next, [root]: { title: plan.source, steps, at: seen.now } }
}

// An open plan of this project, young enough to bring back.
export function freshPlan(plans: Plans, at: { root: string; now: number }): StoredPlan | null {
  const kept = plans[at.root]
  if (kept === undefined || at.now - kept.at > MAX_AGE_MS || !isOpen(kept.steps)) return null

  return kept
}

function stepLine(step: StoredStep): string {
  return `\n- ${clip(step.title, STEP_TITLE_MAX)}${step.status === 'in_progress' ? ' (in progress)' : ''}`
}

// At most SECTION_MAX characters: as many open steps as fit, then how many more there are.
export function sectionText(plan: { title: string; steps: readonly StoredStep[] }, cause: CarryCause): string {
  const done = plan.steps.filter(step => step.status === 'completed').length
  const open = plan.steps.filter(step => step.status !== 'completed')
  const head = `${LEAD[cause]}\nPlan: ${clip(plan.title, STEP_TITLE_MAX)}, ${done} of ${plan.steps.length} steps done. Open steps:`
  const tail = `\n${TAIL}`
  const lines: string[] = []
  for (const [k, step] of open.entries()) {
    const more = `\n- and ${open.length - k - 1} more`
    const line = stepLine(step)
    const reserve = k === open.length - 1 ? 0 : more.length
    if (head.length + lines.join('').length + line.length + reserve + tail.length > SECTION_MAX) {
      lines.push(`\n- and ${open.length - k} more`)
      break
    }
    lines.push(line)
  }

  return head + lines.join('') + tail
}

// The kept steps as a task list, so the pane, the hub and the finish card know the plan again.
export function restoredTasks(plan: StoredPlan): PlanTask[] {
  return plan.steps.map((step, k) => ({ id: `${RESTORED}${k}`, subject: step.title, status: step.status }))
}

// A task list brought back from disk gives way to the first task the model creates.
export const withoutRestored = (tasks: PlanTask[]): PlanTask[] => tasks.filter(task => !task.id.startsWith(RESTORED))
