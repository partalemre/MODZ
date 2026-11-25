import { atom, read } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import { resolvePlan } from './match'
import type { Plan } from './match'

// The plan is only as true as the main loop keeps it: in a week of sessions it often sat on step 1 while the work
// went on, then jumped several steps at once or was ticked off whole by the wrap-up. After a run of tool calls with
// no move, the next tool result carries one short reminder, again after each further run; a move resets the count.

export const NUDGE_CALLS = 15
const DESK_PLAN = 'mcp__ccd_turn__update_plan'

// The engine reads each module's use of the mod's values from that module's own source.
const docAtom = atom({ plugin: 'plan-steps', key: 'doc' } as const, null)
const tasksAtom = atom({ plugin: 'plan-steps', key: 'tasks' } as const, [])

let calls = 0
// The main-loop call that crossed the line: its result, and only its, carries the reminder. The classic event names
// a helper's call unreliably, so counting happens on tool.call (register.tsx), where `agentId` is sure.
let dueId: string | null = null

async function currentPlan($: EngineInterface): Promise<Plan | null> {
  return resolvePlan(await read($, tasksAtom), await read($, docAtom))
}

export const resetNudge = (): void => {
  calls = 0
  dueId = null
}

/** Counts a call the main loop made while a plan is open; the one that crosses the line is due a reminder. */
export async function noteCall($: EngineInterface, call: { tool: string; agentId?: string; tool_use_id?: unknown }): Promise<void> {
  if (call.tool === DESK_PLAN || typeof call.tool_use_id !== 'string') return
  const plan = await currentPlan($).catch(() => null)
  const isOpen = plan !== null && plan.steps.some(step => step.status !== 'completed')
  if (countCall(call.agentId === undefined, isOpen)) dueId = call.tool_use_id
}

export const NUDGE_TEXT =
  `Plan check: ${NUDGE_CALLS} tool calls since your task list last moved. If a step is finished, tick it now ` +
  '(update_plan with advance, or done/start), one step at a time, so the person sees the plan as it really stands.'

/** Whether this call is the one that crosses the line; counts it. */
export function countCall(isMainLoop: boolean, isOpenPlan: boolean): boolean {
  if (!isMainLoop || !isOpenPlan) return false
  calls += 1

  // Again every NUDGE_CALLS calls, so a reminder lost with a failed call comes back.
  return calls % NUDGE_CALLS === 0
}

export function wireNudge(on: On): void {
  on('classic.PostToolUse', async ($, e, next) => {
    const result = await next(e)
    if (dueId === null || (e as unknown as { tool_use_id?: unknown }).tool_use_id !== dueId) return result
    dueId = null

    return { ...result, additionalContext: [...(result.additionalContext ?? []), NUDGE_TEXT] }
  }).catch(($, e, next) => next(e))
}
