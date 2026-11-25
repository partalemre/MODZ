import type { AgentRun, PlanStep, ThreadTurn } from '../types'
import { clip, norm, toolDetail, toolName, toolTarget } from './format'
import { plainLang } from './i18n'
import { nextLook } from './identity'
import { plainCall, purposeOf } from './kit/plain'
import { workKindOf } from './work-kind'
import { costOf, tokensOf, windowOf } from './pricing'
import type { Usage } from './pricing'
import { MAX_RUNS } from './state'
import { applyTaskTool } from './tasks'

// Pure updates of the agent list; the hooks in events.ts feed them what the engine reports.

const BRIEF_MAX = 800
const ANSWER_MAX = 1500
// The conversation keeps its latest turns; the task it was handed stays above them as `brief`.
const THREAD_MAX = 12

export type Spawn = {
  id: string
  agentId?: string
  toolUseId?: string
  parentId?: string
  type: string
  description: string
  model: string
  effort?: string
  brief?: string
  isAsked?: boolean
  planStep?: PlanStep
  at: number
}

/** The step under way in a plan as the plan-steps mod keeps it, or none: where an agent sent out now belongs. */
export function planStepOf(plan: unknown): PlanStep | undefined {
  const steps = Array.isArray(plan) ? (plan as { subject?: unknown; status?: unknown }[]) : []
  const at = steps.findIndex(step => step?.status === 'in_progress')
  const subject = steps[at]?.subject

  return typeof subject === 'string' ? { subject, at: at + 1, of: steps.length } : undefined
}

// Helpers the main loop sends out just before it moves the plan on (it often moves it in its next message) serve the
// step it moved to. Only a move within MOVE_GRACE_MS of the launch counts: a step ticked off later was the helper's own.
// The same list when nothing moves.
export const MOVE_GRACE_MS = 2 * 60_000

export function movedOn(list: AgentRun[], plan: unknown, now: number): AgentRun[] {
  const current = planStepOf(plan)
  const steps = Array.isArray(plan) ? (plan as { subject?: unknown; status?: unknown }[]) : []
  const isDone = (step: PlanStep): boolean => steps.some(one => one?.subject === step.subject && one?.status === 'completed')
  const isEarly = (run: AgentRun): boolean => run.status === 'running' && now - run.startedAt <= MOVE_GRACE_MS
  const isStale = (run: AgentRun): boolean => isEarly(run) && run.planStep !== undefined && isDone(run.planStep)
  if (current === undefined || !list.some(isStale)) return list

  return list.map(run => (isStale(run) ? { ...run, planStep: current } : run))
}

export function addRun(list: AgentRun[], spawn: Spawn): AgentRun[] {
  const same = list.filter(a => spawn.description && norm(a.description) === norm(spawn.description))
  const run: AgentRun = {
    id: spawn.id,
    agentId: spawn.agentId,
    toolUseId: spawn.toolUseId,
    parentId: spawn.parentId,
    type: spawn.type,
    description: spawn.description,
    model: spawn.model,
    effort: spawn.effort,
    brief: spawn.brief?.trim() ? clip(spawn.brief.trim(), BRIEF_MAX) : undefined,
    isAsked: spawn.isAsked,
    planStep: spawn.planStep,
    status: 'running',
    startedAt: spawn.at,
    contextTokens: 0,
    contextMax: windowOf(spawn.model),
    tokens: 0,
    costUsd: 0,
    steps: 0,
    round: 1 + same.length,
    // A run the roster met first keeps the look it arrived with.
    look: list.find(a => a.id === spawn.id)?.look ?? nextLook(list),
    toolCount: 0,
  }
  return [...list.filter(a => a.id !== run.id), run].slice(-MAX_RUNS)
}

const withTurn = (a: AgentRun, turn: ThreadTurn): AgentRun => ({ ...a, thread: [...(a.thread ?? []), turn].slice(-THREAD_MAX) })

/** A follow-up the person sent from the card: it waits under the conversation for the next answer. */
export const askedAgain = (a: AgentRun, text: string, at: number): AgentRun => withTurn(a, { from: 'you', text: clip(text.trim(), BRIEF_MAX), at })

export const patchRun = (list: AgentRun[], agentId: string, fn: (a: AgentRun) => AgentRun): AgentRun[] =>
  list.map(a => (a.agentId === agentId ? fn(a) : a))

type StepFacts = { model: string; effort: unknown; usage: Usage }

// One model request of a subagent: its context now, its tokens and cost so far.
export const stepUsage = (a: AgentRun, facts: StepFacts): AgentRun => ({
  ...a,
  model: facts.model,
  effort: typeof facts.effort === 'string' ? facts.effort : a.effort,
  status: 'running',
  endedAt: undefined,
  endReason: undefined,
  contextTokens: tokensOf(facts.usage),
  contextMax: windowOf(facts.model),
  tokens: a.tokens + tokensOf(facts.usage),
  costUsd: a.costUsd + (costOf(facts.model, facts.usage, true) ?? 0),
  steps: a.steps + 1,
})

type EndFacts = { reason: string; at: number; answer?: string; usage?: Usage & { model?: string } }

export const endRun = (a: AgentRun, facts: EndFacts): AgentRun => {
  const isAnswered = facts.reason === 'answer'
  // A run whose steps went unseen still gets the turn's own sum.
  const usage = a.steps === 0 ? facts.usage : undefined
  const model = usage?.model || a.model
  const answer = facts.answer?.trim() ? clip(facts.answer.trim(), ANSWER_MAX) : undefined
  const told = isAnswered && answer ? withTurn(a, { from: 'agent', text: answer, at: facts.at }) : a
  return {
    ...told,
    status: isAnswered ? 'done' : 'failed',
    endReason: isAnswered ? undefined : facts.reason,
    endedAt: facts.at,
    answer: answer ?? a.answer,
    ...(usage ? { model, tokens: tokensOf(usage), costUsd: costOf(model, usage, false) ?? 0 } : {}),
  }
}

// What the agent is doing now and how many tool calls it made.
export const toolActivity = (a: AgentRun, call: Record<string, unknown>): AgentRun => ({
  ...a,
  toolCount: (a.toolCount || 0) + 1,
  lastTool: toolName(String(call.tool ?? '')),
  lastKind: workKindOf(String(call.tool ?? ''), call),
  lastTarget: toolTarget(call) || undefined,
  lastDetail: toolDetail(call) || undefined,
  // The agent's own words for the call lead; the rule-made sentence stands in when it wrote none.
  lastPlain: purposeOf(call) || plainCall(String(call.tool ?? ''), call, plainLang()),
})

export const ownTasks = (a: AgentRun, call: Record<string, unknown>, result: unknown): AgentRun => ({
  ...a,
  todos: applyTaskTool(a.todos ?? [], call, result),
})

export type StepInput = { done?: number; total?: number; note?: string }

// The worker's own report through the `step` tool.
export const stepReport = (a: AgentRun, input: StepInput): AgentRun => {
  const total = Math.max(0, Math.round(input.total ?? a.stepTotal ?? 0))
  const done = Math.max(0, Math.round(input.done ?? a.stepDone ?? 0))
  return { ...a, stepTotal: total, stepDone: total ? Math.min(total, done) : done, stepNote: input.note?.trim() || undefined }
}

/** Anything an agent's own loop reports counts as hearing from it: the quiet check reads this. */
export const heard = (a: AgentRun, at: number): AgentRun => ({ ...a, heardAt: Math.max(a.heardAt ?? 0, at) })

export const isRunning = (a: AgentRun): boolean => a.status === 'running'

// Long enough to tell apart messages that close with the same sentence (two status notes, each ending "nothing is
// needed from you"): a short message is named by all of it.
const KEY_TAIL = 240
const KEY_MARK = 'text:'

/**
 * A name for a piece of the main loop's writing, by how it ends: the event that says it was written and the row
 * that draws it carry no id in common, so its last words stand for it. Empty for nothing written.
 */
export function textKey(text: string): string {
  const words = text.replace(/\s+/g, ' ').trim()

  return words === '' ? '' : `${KEY_MARK}${words.slice(-KEY_TAIL)}`
}

/**
 * Whether a row's words are the newest written. A row may hold only the last block of what was written, so the
 * newest need only end with the row's words.
 */
export const isNewestWords = (row: string, newest: string): boolean =>
  row !== '' && newest.startsWith(KEY_MARK) && newest.endsWith(row.slice(KEY_MARK.length))

export const elapsed = (a: AgentRun, at: number): number => (a.endedAt ?? Math.max(at, a.startedAt)) - a.startedAt

export const ctxOf = (a: AgentRun): number =>
  a.contextMax ? Math.min(100, Math.round((a.contextTokens / a.contextMax) * 100)) : 0

export type Totals = { cost: number; tokens: number; time: number }

export const totals = (list: AgentRun[], at: number): Totals => {
  if (!list.length) return { cost: 0, tokens: 0, time: 0 }
  const start = Math.min(...list.map(a => a.startedAt))
  const end = Math.max(...list.map(a => a.endedAt ?? Math.max(at, a.startedAt)))
  return {
    cost: list.reduce((sum, a) => sum + a.costUsd, 0),
    tokens: list.reduce((sum, a) => sum + a.tokens, 0),
    time: end - start,
  }
}
