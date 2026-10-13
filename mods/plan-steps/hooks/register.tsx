import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, Register } from 'claude-code'

import { isShown, planState, STALE_MS } from './freshness'
import { withoutRestored } from './carry'
import { wireCarry } from './carry-hooks'
import { wireFinish } from './finish-hooks'
import { HUB_PANE, hubOf } from './hub'
import type { HubShown } from './hub'
import { resolvePlan } from './match'
import type { Plan } from './match'
import { wirePane } from './pane-hook'
import { baseName } from './parse'
import { addAgent, addFile, currentIndex, observe, progressOf, settleAgents } from './progress'
import { approvedDoc, fileDoc, isReplacing, mayHoldPlan, statusText } from './plan'
import { createdId, createTask, fromTodos, updateTask } from './tasks'
import type { HubCard, PlanDoc, PlanTask, StepTrack } from '../types'
import { setLang } from './kit/lang'
import { words } from './words'

// The engine reads each module's use of the mod's values from that module's own source.
const docAtom = atom({ plugin: 'plan-steps', key: 'doc' } as const, null)
const tasksAtom = atom({ plugin: 'plan-steps', key: 'tasks' } as const, [])
const tracksAtom = atom({ plugin: 'plan-steps', key: 'tracks' } as const, {})

const EDIT_TOOLS = ['Edit', 'Write', 'MultiEdit', 'NotebookEdit']
const FILE_TOOLS = ['Read', ...EDIT_TOOLS]
const LIVE_AGENT = ['async_launched', 'teammate_spawned']
const hubRef = { plugin: 'plan-steps', key: 'hub' } as const

type Timer = { cancel: () => void }

// Session-local facts. `isSettled`: a finished plan's status line was cleared. `touchedAt`: the last
// time the plan or the step under way moved; `quiet` re-checks the status line once that goes stale.
const flags = { cwd: '', isSettled: false, touchedAt: 0, quiet: null as Timer | null }

type Ran = { deny?: unknown; isError?: unknown; result?: unknown }
type Call = { tool: string; tool_use_id: string; agentId?: string } & Record<string, unknown>

function isOk(ran: Ran): boolean {
  return ran.deny === undefined && ran.isError !== true
}

function relative(path: string): string {
  return flags.cwd !== '' && path.startsWith(`${flags.cwd}/`) ? path.slice(flags.cwd.length + 1) : path
}

async function currentPlan($: EngineInterface): Promise<Plan | null> {
  return resolvePlan(await read($, tasksAtom), await read($, docAtom))
}

// The MODZ main panel's card (DESIGN.md §9), written only when what it shows changes.
async function writeHub($: EngineInterface, shown: HubShown): Promise<void> {
  const { value } = await $.state.get(hubRef)
  if (value !== undefined && value.detail === shown.detail && value.tone === shown.tone) return
  const card: HubCard = { pane: HUB_PANE, ...shown, at: await $.clock.now() }
  await $.state.set(hubRef, card)
}

// Re-reads the plan, stamps status changes with the time, and refreshes the status line: only a
// plan under way (or just finished) is on it; one not started or gone stale stays in the pane.
async function sync($: EngineInterface): Promise<void> {
  const plan = await currentPlan($)
  const now = await $.clock.now()
  const tracks = await update($, tracksAtom, before => (plan === null ? before : observe(before, plan.steps, now)))
  const progress = plan === null ? null : progressOf(plan)
  const state = planState(plan, { now, touchedAt: flags.touchedAt })
  if (progress === null || progress.done < progress.total) flags.isSettled = false
  $.ui.status(flags.isSettled || !isShown(state) ? undefined : statusText(plan, tracks))
  await writeHub($, hubOf(progress, state))
}

// The plan moved: it is fresh again, and goes quiet if nothing moves it for STALE_MS.
async function touch($: EngineInterface): Promise<void> {
  flags.touchedAt = await $.clock.now()
  flags.quiet?.cancel()
  flags.quiet = $.clock.after(STALE_MS, () => void sync($))
}

async function setTasks($: EngineInterface, change: (tasks: PlanTask[]) => PlanTask[]): Promise<void> {
  await update($, tasksAtom, change)
  await touch($)
  await sync($)
}

async function offerDoc($: EngineInterface, doc: PlanDoc | null): Promise<void> {
  if (doc === null || !isReplacing(await read($, docAtom), doc)) return
  await update($, docAtom, () => doc)
  await touch($)
  await sync($)
}

// Edits and agents count toward the step under way, if one is.
async function onCurrent($: EngineInterface, change: (track: StepTrack) => StepTrack): Promise<void> {
  const plan = await currentPlan($)
  if (plan === null) return
  let isMoved = false
  await update($, tracksAtom, tracks => {
    const step = plan.steps[currentIndex(plan.steps, tracks)]
    const track = step === undefined ? undefined : tracks[step.key]
    if (step === undefined || track === undefined) return tracks
    isMoved = true

    return { ...tracks, [step.key]: change(track) }
  })
  if (isMoved) await revive($)
}

// Work on the step under way keeps the plan fresh; a plan that had gone stale comes back.
async function revive($: EngineInterface): Promise<void> {
  const wasStale = (await $.clock.now()) - flags.touchedAt >= STALE_MS
  await touch($)
  if (wasStale) await sync($)
}

async function afterFile($: EngineInterface, call: Call): Promise<void> {
  const path = call.file_path ?? call.notebook_path
  if (typeof path !== 'string') return
  if (EDIT_TOOLS.includes(call.tool)) await onCurrent($, track => addFile(track, relative(path)))
  if (!mayHoldPlan(path)) return
  try {
    await offerDoc($, fileDoc(path, await $.fs.read(path)))
  } catch (error) {
    $.ui.log(`plan-steps: could not read ${baseName(path)} (${error instanceof Error ? error.message : 'unknown'})`, { to: 'debug' })
  }
}

// The task list is the main loop's own (TodoWrite); TaskCreate/TaskUpdate share one list across loops.
async function afterTasks($: EngineInterface, call: Call, ran: Ran): Promise<void> {
  if (call.tool === 'TodoWrite' && call.agentId === undefined) await setTasks($, () => fromTodos(call.todos))
  if (call.tool === 'TaskCreate') {
    const subject = String(call.subject ?? '')
    await setTasks($, tasks => createTask(withoutRestored(tasks), { id: createdId(ran.result, withoutRestored(tasks)), subject }))
  }
  if (call.tool === 'TaskUpdate') await setTasks($, tasks => updateTask(tasks, { taskId: call.taskId, subject: call.subject, status: call.status }))
}

async function startAgent($: EngineInterface, call: Call): Promise<void> {
  const description = String(call.description ?? call.subagent_type ?? words().subagent)
  await onCurrent($, track => addAgent(track, { key: call.tool_use_id, description, isRunning: true, agentId: null }))
}

// A background agent runs on after its call returns; its loop's turn.complete ends it.
async function endAgent($: EngineInterface, call: Call, ran: Ran): Promise<void> {
  const record = ran.result as { agentId?: unknown; agent_id?: unknown; status?: unknown } | undefined
  const id = record?.agentId ?? record?.agent_id
  const isLive = isOk(ran) && LIVE_AGENT.includes(String(record?.status))
  const patch = { isRunning: isLive, agentId: typeof id === 'string' ? id : null }
  await update($, tracksAtom, tracks => settleAgents(tracks, agent => agent.key === call.tool_use_id, patch))
}

async function onToolCall<R extends Ran>($: EngineInterface, call: Call, run: () => Promise<R>): Promise<R> {
  if (call.tool === 'Agent') await startAgent($, call)
  const ran = await run()
  if (call.tool === 'Agent') await endAgent($, call, ran)
  if (!isOk(ran)) return ran
  if (FILE_TOOLS.includes(call.tool)) await afterFile($, call)
  else if (call.tool === 'ExitPlanMode') await offerDoc($, approvedDoc(ran.result))
  else await afterTasks($, call, ran)

  return ran
}

async function reset($: EngineInterface): Promise<void> {
  await update($, tasksAtom, () => [])
  await update($, docAtom, () => null)
  await update($, tracksAtom, () => ({}))
  flags.isSettled = false
  flags.quiet?.cancel()
  flags.quiet = null
  $.ui.status(undefined)
  await writeHub($, hubOf(null, 'none'))
}

function lifecycle(on: On): void {
  on('session.start', async ($, e, next) => {
    // The interface language (kit/lang.ts). Spelled out: the engine admits an env read by a literal name only.
    setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
    flags.cwd = e.cwd.replace(/\/$/, '')
    const plan = await currentPlan($)
    const state = planState(plan, { now: await $.clock.now(), touchedAt: flags.touchedAt })
    await writeHub($, hubOf(plan === null ? null : progressOf(plan), state))
    try {
      await $.command.register({ name: 'steps', description: words().command })
    } catch {
      $.ui.log('plan-steps: could not register /steps', { to: 'debug' })
    }

    return next(e)
  })

  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') await reset($)

    return next(e)
  }).catch(($, e, next) => next(e))
}

function tracking(on: On): void {
  on('tool.call', ($, e, next) => onToolCall($, e as unknown as Call, () => next(e))).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const agentId = e.agentId
    if (agentId !== undefined) {
      await update($, tracksAtom, tracks => settleAgents(tracks, agent => agent.agentId === agentId, { isRunning: false }))
    }

    return next(e)
  }).catch(($, e, next) => next(e))

  // A finished plan keeps its line until the person moves on.
  on('prompt.submit', async ($, e, next) => {
    flags.isSettled = (await currentPlan($))?.steps.every(step => step.status === 'completed') ?? false
    if (flags.isSettled) await sync($)

    return next(e)
  }).catch(($, e, next) => next(e))

  // A plan brought back from disk (carry-hooks.ts) is the plan again: its steps, line and hub card.
  on('state.set', { plugin: 'plan-steps', key: 'carried' }, async ($, e, next) => {
    const done = await next(e)
    if (e.value !== null) await sync($)

    return done
  }).catch(($, e, next) => next(e))
}

export const register: Register = (on, options) => {
  lifecycle(on)
  tracking(on)
  wireCarry(on)
  wireFinish(on, { touchedAt: () => flags.touchedAt, isStrict: options.holdFinish === true })
  wirePane(on, { touchedAt: () => flags.touchedAt })
}
