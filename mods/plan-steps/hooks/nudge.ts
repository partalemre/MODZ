import { atom, read } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import { resolvePlan } from './match'
import type { Plan } from './match'

// The plan is only as true as the main loop keeps it: in a week of sessions it often sat on step 1 while the work
// went on, then jumped several steps at once or was ticked off whole by the wrap-up. After a run of tool calls with
// no move, the next tool result carries one short reminder; any move of the plan resets the count.

export const NUDGE_CALLS = 15
const DESK_PLAN = 'mcp__ccd_turn__update_plan'

// The engine reads each module's use of the mod's values from that module's own source.
const docAtom = atom({ plugin: 'plan-steps', key: 'doc' } as const, null)
const tasksAtom = atom({ plugin: 'plan-steps', key: 'tasks' } as const, [])

let calls = 0

async function currentPlan($: EngineInterface): Promise<Plan | null> {
  return resolvePlan(await read($, tasksAtom), await read($, docAtom))
}

export const resetNudge = (): void => {
  calls = 0
}

export const NUDGE_TEXT =
  `Plan check: ${NUDGE_CALLS} tool calls since your task list last moved. If a step is finished, tick it now ` +
  '(update_plan with advance, or done/start), one step at a time, so the person sees the plan as it really stands.'

/** Whether this call is the one that crosses the line; counts it. */
export function countCall(isMainLoop: boolean, isOpenPlan: boolean): boolean {
  if (!isMainLoop || !isOpenPlan) return false
  calls += 1

  return calls === NUDGE_CALLS
}

export function wireNudge(on: On): void {
  on('classic.PostToolUse', async ($, e, next) => {
    const result = await next(e)
    const fields = e as unknown as { tool_name?: unknown; agent_id?: unknown }
    if (fields.tool_name === DESK_PLAN) return result
    const plan = await currentPlan($).catch(() => null)
    const isOpen = plan !== null && plan.steps.some(step => step.status !== 'completed')
    if (!countCall(fields.agent_id === undefined, isOpen)) return result

    return { ...result, additionalContext: [...(result.additionalContext ?? []), NUDGE_TEXT] }
  }).catch(($, e, next) => next(e))
}
