import { atom, read, update } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import { freshPlan, keptPlans, plansOf, restoredTasks, SECTION_ID, sectionText, signatureOf, STORE_KEY } from './carry'
import type { CarryCause, Plans } from './carry'
import { isSame } from './kit/same'
import { resolvePlan } from './match'
import type { Plan } from './match'
import type { PlanDoc, PlanTask, StoredStep } from '../types'

// The engine reads each module's use of the mod's values from that module's own source.
const carriedAtom = atom({ plugin: 'plan-steps', key: 'carried' } as const, null)
const dismissedAtom = atom({ plugin: 'plan-steps', key: 'dismissed' } as const, null)
const docAtom = atom({ plugin: 'plan-steps', key: 'doc' } as const, null)
const tasksAtom = atom({ plugin: 'plan-steps', key: 'tasks' } as const, [])

// The plan outliving the conversation (carry.ts is the pure half): kept in $.store whenever it changes,
// brought back into a conversation that starts empty, and carried by one short system prompt section after
// a compaction, a /clear or a new session. This file talks to the rest of the mod through $.state alone.

const reason = (error: unknown): string => (error instanceof Error ? error.message : 'unknown')

const isOpenPlan = (plan: Plan | null): plan is Plan => plan !== null && plan.steps.some(step => step.status !== 'completed')

async function currentPlan($: EngineInterface): Promise<Plan | null> {
  return resolvePlan(await read($, tasksAtom), await read($, docAtom))
}

// The project root, not the repository's: a worktree has its own plan, and parallel worktrees would
// otherwise overwrite each other's.
async function rootOf($: EngineInterface): Promise<string | null> {
  try {
    return await $.session.root()
  } catch (error) {
    $.ui.log(`plan-steps: no project root (${reason(error)})`, { to: 'debug' })

    return null
  }
}

async function readPlans($: EngineInterface): Promise<Plans> {
  return plansOf(await $.store.get(STORE_KEY))
}

// The values a state.set hook was handed win over a read, which sees its dispatch's moment.
type Written = { tasks?: PlanTask[]; doc?: PlanDoc | null }

// Writes only when the kept plans changed. A failing store costs the carrying alone.
async function keepPlan($: EngineInterface, written: Written): Promise<void> {
  const root = await rootOf($)
  if (root === null) return
  try {
    const before = await readPlans($)
    const plan = resolvePlan(written.tasks ?? (await read($, tasksAtom)), written.doc === undefined ? await read($, docAtom) : written.doc)
    const next = keptPlans(before, { root, plan, dismissed: await read($, dismissedAtom), now: await $.clock.now() })
    if (!isSame(before, next)) await $.store.set(STORE_KEY, next)
  } catch (error) {
    $.ui.log(`plan-steps: could not keep the plan (${reason(error)})`, { to: 'debug' })
  }
}

// Freezes the section once per event: the same text on every request after, so the prompt cache holds.
async function arm($: EngineInterface, plan: { title: string; steps: readonly StoredStep[] }, cause: CarryCause): Promise<void> {
  const signature = signatureOf(plan.steps)
  if ((await read($, dismissedAtom)) === signature) return
  const carried = { text: sectionText(plan, cause), signature, at: await $.clock.now() }
  await update($, carriedAtom, () => carried)
}

// An empty conversation gets this project's open plan back, as the task list and as the section. The
// `carried` write tells the register file to bring the pane, the status line and the hub up to date.
async function restore($: EngineInterface, cause: CarryCause): Promise<void> {
  const root = await rootOf($)
  if (root === null) return
  try {
    const kept = freshPlan(await readPlans($), { root, now: await $.clock.now() })
    if (kept === null || (await read($, dismissedAtom)) === signatureOf(kept.steps)) return
    await update($, tasksAtom, () => restoredTasks(kept))
    await arm($, kept, cause)
  } catch (error) {
    $.ui.log(`plan-steps: could not bring the plan back (${reason(error)})`, { to: 'debug' })
  }
}

// A new process with nothing said yet; a resumed session, or a reload, already holds its plan.
async function isEmptyConversation($: EngineInterface): Promise<boolean> {
  try {
    return (await $.session.turns()) === 0 && (await currentPlan($)) === null
  } catch (error) {
    $.ui.log(`plan-steps: turns not readable (${reason(error)})`, { to: 'debug' })

    return false
  }
}

function keeping(on: On): void {
  // Every change of the task list or the plan document, whoever made it.
  on('state.set', { plugin: 'plan-steps', key: 'tasks' }, async ($, e, next) => {
    const done = await next(e)
    await keepPlan($, { tasks: e.value })

    return done
  }).catch(($, e, next) => next(e))

  on('state.set', { plugin: 'plan-steps', key: 'doc' }, async ($, e, next) => {
    const done = await next(e)
    await keepPlan($, { doc: e.value })

    return done
  }).catch(($, e, next) => next(e))
}

function bringingBack(on: On): void {
  // The register file's own session.start hook takes every start; this one only a person's session.
  on('session.start', { isInteractive: true }, async ($, e, next) => {
    const done = await next(e)
    if (await isEmptyConversation($)) await restore($, 'fresh')

    return done
  }).catch(($, e, next) => next(e))

  // After the register file's reset (it runs before `next`), whichever way round the two hooks sit.
  on('session.end', { reason: 'clear' }, async ($, e, next) => {
    const done = await next(e)
    await restore($, 'clear')

    return done
  }).catch(($, e, next) => next(e))

  on('session.compact', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId !== undefined || e.trigger === 'precompute' || result.messages === undefined) return result
    const plan = await currentPlan($)
    if (isOpenPlan(plan)) await arm($, { title: plan.source, steps: plan.steps }, 'compact')

    return result
  }).catch(($, e, next) => next(e))
}

export function wireCarry(on: On): void {
  keeping(on)
  bringingBack(on)

  // The section rides every request until the plan is done, marked done or replaced by another one.
  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    const carried = await read($, carriedAtom)
    if (carried === null) return composed
    const plan = await currentPlan($)
    if (!isOpenPlan(plan) || signatureOf(plan.steps) !== carried.signature) return composed
    if ((await read($, dismissedAtom)) === carried.signature) return composed

    return { sections: [...composed.sections, { id: SECTION_ID, text: carried.text, scope: 'session' as const }] }
  }).catch(($, e, next) => next(e))
}
