import { signatureOf } from './carry'
import type { Plan } from './match'
import type { FinishNotice, HeldFinish } from '../types'

// The finish guard: an answer that ends a turn which worked on the plan, while steps are still open,
// gets a card (or, in strict mode, prompts to go on: up to MAX_AUTO_CONTINUES in a row without a step done, then the card).

export const MAX_AUTO_CONTINUES = 2

export type FinishCall = 'none' | 'card' | 'continue'

export type FinishFacts = {
  plan: Plan | null
  // The plan moved (a status, a plan edit, a file edit or an agent on its current step) during this turn.
  isTouched: boolean
  dismissed: string | null
  held: HeldFinish | null
  isStrict: boolean
}

const openSteps = (plan: Plan) => plan.steps.filter(step => step.status !== 'completed')

// A plan nobody has started is still being laid out (or waits for a yes), so it is left alone.
function isGuarded(facts: FinishFacts): facts is FinishFacts & { plan: Plan } {
  const { plan } = facts
  if (plan === null || !facts.isTouched || openSteps(plan).length === 0) return false
  if (plan.steps.every(step => step.status === 'pending')) return false

  return facts.dismissed !== signatureOf(plan.steps)
}

// Counted per plan and steps done, so each finished step earns fresh pushes; a stuck plan still stops.
export const heldKey = (plan: Plan) => `${signatureOf(plan.steps)}:${plan.steps.length - openSteps(plan).length}`

export function heldCount(held: HeldFinish | null, signature: string): number {
  return held !== null && held.signature === signature ? held.count : 0
}

export function finishCall(facts: FinishFacts): FinishCall {
  if (!isGuarded(facts)) return 'none'
  if (!facts.isStrict) return 'card'

  return heldCount(facts.held, heldKey(facts.plan)) < MAX_AUTO_CONTINUES ? 'continue' : 'card'
}

// An agent that still works or waits on work of its own: the main loop hears from it later.
const LIVE_AGENT = ['pending', 'running', 'waiting']
export const isAgentLive = (status: unknown): boolean => LIVE_AGENT.includes(String(status))

// The task ids a turn's opening text reports on: a background task's notification names the task that ended.
export const notifiedIds = (text: unknown): string[] =>
  typeof text === 'string' ? [...text.matchAll(/<task-id>\s*([^<\s]+)\s*<\/task-id>/g)].map(found => found[1] ?? '') : []

// How long a background command counts as running when no notification says it ended: its own timeout, else the
// engine's default for one (30 minutes).
const SHELL_DEFAULT_MS = 30 * 60 * 1000
export const shellBudget = (timeout: unknown): number => (typeof timeout === 'number' && timeout > 0 ? timeout : SHELL_DEFAULT_MS)

// The step to go on with: the one under way, else the first not begun.
export function nextStep(plan: Plan): string {
  const open = openSteps(plan)

  return (open.find(step => step.status === 'in_progress') ?? open[0])?.title ?? ''
}

export function noticeOf(plan: Plan, at: number): FinishNotice {
  return {
    signature: signatureOf(plan.steps),
    done: plan.steps.length - openSteps(plan).length,
    total: plan.steps.length,
    marks: plan.steps.map(step => (step.status === 'completed' ? 'done' : 'open')),
    next: nextStep(plan),
    source: plan.source,
    at,
  }
}
