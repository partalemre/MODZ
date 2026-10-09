import type { AgentRun } from '../types'
import { clip, norm, toolName, toolTarget } from './format'
import { costOf, tokensOf, windowOf } from './pricing'
import type { Usage } from './pricing'
import { MAX_RUNS } from './state'
import { applyTaskTool } from './tasks'

// Pure updates of the agent list; the hooks in events.ts feed them what the engine reports.

const BRIEF_MAX = 800
const ANSWER_MAX = 1500

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
  at: number
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
    status: 'running',
    startedAt: spawn.at,
    contextTokens: 0,
    contextMax: windowOf(spawn.model),
    tokens: 0,
    costUsd: 0,
    steps: 0,
    round: 1 + same.length,
    toolCount: 0,
  }
  return [...list.filter(a => a.id !== run.id), run].slice(-MAX_RUNS)
}

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
  costUsd: a.costUsd + costOf(facts.model, facts.usage),
  steps: a.steps + 1,
})

type EndFacts = { reason: string; at: number; answer?: string; usage?: Usage & { model?: string } }

export const endRun = (a: AgentRun, facts: EndFacts): AgentRun => {
  const isAnswered = facts.reason === 'answer'
  // A run whose steps went unseen still gets the turn's own sum.
  const usage = a.steps === 0 ? facts.usage : undefined
  const model = usage?.model || a.model
  return {
    ...a,
    status: isAnswered ? 'done' : 'failed',
    endReason: isAnswered ? undefined : facts.reason,
    endedAt: facts.at,
    answer: facts.answer?.trim() ? clip(facts.answer.trim(), ANSWER_MAX) : a.answer,
    ...(usage ? { model, tokens: tokensOf(usage), costUsd: costOf(model, usage) } : {}),
  }
}

// What the agent is doing now and how many tool calls it made.
export const toolActivity = (a: AgentRun, call: Record<string, unknown>): AgentRun => ({
  ...a,
  toolCount: (a.toolCount || 0) + 1,
  lastTool: toolName(String(call.tool ?? '')),
  lastTarget: toolTarget(call) || undefined,
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

export const isRunning = (a: AgentRun): boolean => a.status === 'running'

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
