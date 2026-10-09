import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { StepInput } from './agents'
import { addRun, endRun, heard, isRunning, ownTasks, patchRun, stepReport, stepUsage, toolActivity } from './agents'
import { isNewFlow, mergeFlow } from './flow'
import { closeEvent, openEvent } from './history'
import { readingOf, trackLimit } from './limit'
import type { LimitReading } from './limit'
import type { ProgressInput } from './flow'
import { deriveJob, joinJob, sealJob } from './job'
import { STEP_TOOL, TOOL } from './state'
import { TASK_TOOLS, applyTaskTool, openTasks } from './tasks'

// State refs live in each file that reads them: the scan follows literals, not imports.
const agents = atom({ plugin: 'savvy-progress', key: 'agents' } as const, [])
const flow = atom({ plugin: 'savvy-progress', key: 'flow' } as const, null)
const job = atom({ plugin: 'savvy-progress', key: 'job' } as const, null)
const now = atom({ plugin: 'savvy-progress', key: 'now' } as const, 0)
const tasks = atom({ plugin: 'savvy-progress', key: 'tasks' } as const, [])
const limit = atom({ plugin: 'savvy-progress', key: 'limit' } as const, null)

type On = Parameters<Register>[0]

// The effort an Agent call asked for, held from the call until its spawn picks it up.
// Lost on a reload, harmlessly: the first model request reports the effort again.
const launchEffort = new Map<string, string>()

async function stamp($: EngineInterface): Promise<number> {
  const at = await $.clock.now()
  await update($, now, () => at)
  return at
}

// The orchestrator's report and the workers' own steps.
function onReports(on: On): void {
  on('tool.call', { tool: TOOL }, async ($, e) => {
    const input = e as unknown as ProgressInput
    const prev = await read($, flow)
    // A new flow starts with a clean list; agents still running stay.
    if (isNewFlow(prev, input) && input.title !== undefined) await update($, agents, list => list.filter(isRunning))
    const next = await update($, flow, p => mergeFlow(p, input))
    const view = deriveJob({ flow: next, agents: [], job: null, tasks: [] })
    return { result: `ok: ${view?.label ?? ''}` }
  })

  // A worker's own progress: the call runs in the worker's loop, so agentId names it.
  on('tool.call', { tool: STEP_TOOL }, async ($, e) => {
    const agentId = e.agentId
    if (!agentId) return { result: 'ignored: only subagents report steps' }
    const input = e as unknown as StepInput
    const at = await $.clock.now()
    await update($, agents, list => patchRun(list, agentId, a => heard(stepReport(a, input), at)))
    return { result: 'ok' }
  })
}

// Launches: the Agent call's effort, the spawn itself, and where one request ends.
function onLaunches(on: On): void {
  on('tool.call', { tool: 'Agent' }, async ($, e, next) => {
    if (typeof e.effort === 'string' && e.tool_use_id) launchEffort.set(e.tool_use_id, e.effort)
    try {
      return await next(e)
    } finally {
      launchEffort.delete(e.tool_use_id ?? '')
    }
  })

  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    if (started.deny !== undefined) return started
    const at = await stamp($)
    const id = started.agentId ?? e.tool_use_id
    const spawn = { id, agentId: started.agentId, toolUseId: e.tool_use_id, parentId: e.parentAgentId, at }
    const who = { type: e.subagentType, description: e.description, brief: e.prompt, model: started.model, effort: launchEffort.get(e.tool_use_id) }
    await update($, agents, list => addRun(list, { ...spawn, ...who }))
    // Only the main loop's launches make up the request's job; nested ones show in the panel.
    if (!e.parentAgentId) await update($, job, prev => joinJob(prev, id, at))
    return started
  })

  // A new request (anything but a background task's notice) closes a job with nothing running.
  on('prompt.submit', async ($, e, next) => {
    const result = await next(e)
    if (e.origin.kind === 'task-notification') return result
    const list = await read($, agents)
    const kept = await update($, job, prev => sealJob(prev, list))
    if (!kept || kept.isSealed) await update($, tasks, openTasks)
    await update($, flow, f => (f?.isFinished ? null : f))
    return result
  })
}

// What each loop is doing: its tool calls and task lists.
function onActivity(on: On): void {
  on('tool.call', async ($, e, next) => {
    const call = e as unknown as Record<string, unknown>
    const name = String(e.tool)
    const agentId = e.agentId
    const id = typeof call.tool_use_id === 'string' ? call.tool_use_id : undefined
    const isTracked = name !== STEP_TOOL
    if (agentId && isTracked) {
      const at = await $.clock.now()
      await update($, agents, list => patchRun(list, agentId, a => heard(openEvent(toolActivity(a, call), { call, at, id }), at)))
    }
    const result = await next(e)
    if (agentId && isTracked) {
      const facts = { id, tool: name, at: await $.clock.now(), isError: result.deny !== undefined || result.isError === true }
      await update($, agents, list => patchRun(list, agentId, a => heard(closeEvent(a, facts), facts.at)))
    }
    if (!TASK_TOOLS.includes(name) || result.deny !== undefined || result.isError) return result
    if (agentId) await update($, agents, list => patchRun(list, agentId, a => ownTasks(a, call, result.result)))
    else await update($, tasks, list => applyTaskTool(list, call, result.result))
    return result
  })
}

// Each loop's model requests and its end.
function onSteps(on: On): void {
  // Each model request of a subagent: live context, tokens and cost.
  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    const agentId = e.agentId
    const usage = result.usage
    if (!agentId || !usage) return result
    const facts = { model: usage.model || e.model, effort: e.effort, usage }
    const at = await $.clock.now()
    await update($, agents, list => patchRun(list, agentId, a => heard(stepUsage(a, facts), at)))
    return result
  })

  on('turn.complete', async ($, e, next) => {
    const agentId = e.agentId
    if (agentId) {
      const at = await stamp($)
      await update($, agents, list => patchRun(list, agentId, a => endRun(a, { reason: e.reason, at, answer: e.answer, usage: e.usage })))
    }
    return next(e)
  })
}

const follow = ($: EngineInterface, reading: LimitReading | null) =>
  reading ? update($, limit, prev => trackLimit(prev, reading)) : Promise.resolve()

// Each measure moves the 5h window and the session's dollars, for each agent's share of the limit.
function onLimit(on: On): void {
  on('session.measure', async ($, e, next) => {
    await follow($, readingOf(e.rateLimits, e.cost?.usd))
    return next(e)
  })
}

export function onEvents(on: On): void {
  onLimit(on)
  onReports(on)
  onLaunches(on)
  onActivity(on)
  onSteps(on)
}
