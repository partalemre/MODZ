import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { why } from './explainer'
import { currentStep, planAfter, PLAN_TOOLS } from './plan'
import { EDIT_TOOLS, isAnswered, stepsFor } from './record'
import type { EditCall } from './record'
import type { ReplayStep } from '../types'

// The edits a turn makes and the task list they serve, recorded as the calls run; register.tsx makes the replay of
// them when the turn ends.

// The engine reads each module's use of the mod's values from that module's own source.
const pendingAtom = atom({ plugin: 'replay-theater', key: 'pending' } as const, [])
const planAtom = atom({ plugin: 'replay-theater', key: 'plan' } as const, [])

type On = Parameters<Register>[0]
type Call = EditCall & Record<string, unknown>
// The session's folder, for relative paths; register.tsx sets it when the session starts.
type Where = { cwd: string }

async function readBefore($: EngineInterface, path: string | undefined): Promise<{ text: string; isNew: boolean }> {
  try {
    if (path !== undefined && (await $.fs.exists(path))) return { text: await $.fs.read(path), isNew: false }
  } catch (error) {
    $.ui.log(`replay-theater: ${path} not readable, shown as new (${why(error)})`, { to: 'debug' })
  }

  return { text: '', isNew: true }
}

// An edit is read before it runs and kept only once it was answered; recording never stops the call.
async function recordEdit<R extends { deny?: unknown; isError?: unknown }>($: EngineInterface, call: { e: Call; where: Where }, run: () => Promise<R>): Promise<R> {
  const { e, where } = call
  let steps: ReplayStep[] = []
  try {
    steps = await stepsFor({ cwd: where.cwd, before: path => readBefore($, path) }, e)
  } catch (error) {
    $.ui.log(`replay-theater: could not read an edit (${why(error)})`, { to: 'debug' })
  }
  const result = await run()
  if (steps.length === 0 || !isAnswered(result)) return result
  const plan = currentStep(await read($, planAtom)) ?? undefined
  await update($, pendingAtom, pending => [...pending, ...steps.map(one => (plan === undefined ? one : { ...one, plan }))])

  return result
}

// The task list: TodoWrite is the main loop's own; TaskCreate / TaskUpdate share one list across loops.
async function trackPlan<R extends { deny?: unknown; isError?: unknown; result?: unknown }>($: EngineInterface, e: Call, run: () => Promise<R>): Promise<R> {
  const result = await run()
  if (!isAnswered(result) || (e.tool === 'TodoWrite' && e.agentId !== undefined)) return result
  await update($, planAtom, items => planAfter(items, e, result.result))

  return result
}

export function hookEdits(on: On, where: Where): void {
  on('tool.call', async ($, e, next) => {
    const call = e as unknown as Call
    if (EDIT_TOOLS.has(call.tool)) return recordEdit($, { e: call, where }, () => next(e))
    if ((PLAN_TOOLS as readonly string[]).includes(call.tool)) return trackPlan($, call, () => next(e))

    return next(e)
  }).catch(($, e, next) => next(e))
}
