import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, Register } from 'claude-code'

import { settleFocus } from './focus'
import { isShown, planState, STALE_MS } from './freshness'
import { HUB_PANE, hubOf, isOpenFor } from './hub'
import type { HubShown } from './hub'
import { resolvePlan } from './match'
import type { Plan } from './match'
import { planPane } from './pane'
import { baseName } from './parse'
import { addAgent, addFile, currentIndex, observe, progressOf, settleAgents } from './progress'
import { approvedDoc, fileDoc, isReplacing, mayHoldPlan, statusText } from './plan'
import { createdId, createTask, fromTodos, updateTask } from './tasks'
import type { HubCard, PlanDoc, PlanTask, StepTrack } from '../types'
import { themeOf } from './ui/theme'
import type { Theme } from './ui/theme'

const PANE = 'plan-steps'
const PANE_TITLE = 'Plan'
const TICK_MS = 30_000
const DEFAULT_ROWS = 24
const DEFAULT_COLUMNS = 48
const EDIT_TOOLS = ['Edit', 'Write', 'MultiEdit', 'NotebookEdit']
const FILE_TOOLS = ['Read', ...EDIT_TOOLS]
const LIVE_AGENT = ['async_launched', 'teammate_spawned']

const tasksAtom = atom({ plugin: 'plan-steps', key: 'tasks' } as const, [])
const docAtom = atom({ plugin: 'plan-steps', key: 'doc' } as const, null)
const tracksAtom = atom({ plugin: 'plan-steps', key: 'tracks' } as const, {})
const tickAtom = atom({ plugin: 'plan-steps', key: 'tick' } as const, 0)
const hubRef = { plugin: 'plan-steps', key: 'hub' } as const

type Timer = { cancel: () => void }

// Session-local facts. `isSettled`: a finished plan's status line was cleared. `touchedAt`: the last
// time the plan or the step under way moved; `quiet` re-checks the status line once that goes stale.
const flags = { cwd: '', isSettled: false, ticker: null as Timer | null, theme: 'auto' as Theme, touchedAt: 0, quiet: null as Timer | null }

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
    await setTasks($, tasks => createTask(tasks, { id: createdId(ran.result, tasks), subject }))
  }
  if (call.tool === 'TaskUpdate') await setTasks($, tasks => updateTask(tasks, { taskId: call.taskId, subject: call.subject, status: call.status }))
}

async function startAgent($: EngineInterface, call: Call): Promise<void> {
  const description = String(call.description ?? call.subagent_type ?? 'alt ajan')
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

// The drawing follows Claude Code's theme setting; `auto` leaves it to the system's appearance.
async function refreshTheme($: EngineInterface): Promise<void> {
  try {
    flags.theme = themeOf((await $.config.list()).find(row => row.key === 'theme')?.value)
  } catch (error) {
    $.ui.log(`plan-steps: theme not readable (${error instanceof Error ? error.message : 'unknown'})`, { to: 'debug' })
  }
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

// The same pane whoever asks: /steps or the MODZ main panel; an open pane comes forward.
async function openPane($: EngineInterface): Promise<void> {
  await refreshTheme($)
  await $.ui.open({ id: PANE, title: PANE_TITLE, focus: true })
  startTicker($)
}

function startTicker($: EngineInterface): void {
  flags.ticker ??= $.clock.every(TICK_MS, () => void update($, tickAtom, tick => tick + 1))
}

function stopTicker(): void {
  flags.ticker?.cancel()
  flags.ticker = null
}

function lifecycle(on: On): void {
  on('session.start', async ($, e, next) => {
    flags.cwd = e.cwd.replace(/\/$/, '')
    await refreshTheme($)
    const plan = await currentPlan($)
    const state = planState(plan, { now: await $.clock.now(), touchedAt: flags.touchedAt })
    await writeHub($, hubOf(plan === null ? null : progressOf(plan), state))
    try {
      await $.command.register({ name: 'steps', description: 'Plandaki adımları ve işin nerede olduğunu gösteren paneli aç' })
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

// /steps or the MODZ main panel opens the pane, nothing else does.
function paneOpening(on: On): void {
  on('command.run', { command: 'steps' }, async $ => {
    await openPane($)

    return {}
  })

  // The MODZ main panel asks by pane key; this only opens, so a pane already open just comes forward.
  on('state.set', { plugin: 'modz', key: 'open' }, async ($, e, next) => {
    const done = await next(e)
    if (isOpenFor(e.value, HUB_PANE)) await openPane($)

    return done
  }).catch(($, e, next) => next(e))

  on('ui.close', { id: PANE }, ($, e, next) => {
    stopTicker()

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
}

// A desktop that comes back keeps showing the tree it had; the engine released that tree's buttons when it
// left, so its first click would be refused. Drawing again on attach hands it live buttons.
function onAttach(on: On): void {
  on('session.attach', async ($, e, next) => {
    const attached = await next(e)
    $.ui.invalidate('ui.render')

    return attached
  })
}

export const register: Register = on => {
  lifecycle(on)
  paneOpening(on)
  tracking(on)
  onAttach(on)

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    await settleFocus(e, ms => $.clock.sleep(ms))
    await read($, tickAtom)
    const view = { plan: await currentPlan($), tracks: await read($, tracksAtom), now: await $.clock.now(), theme: flags.theme, touchedAt: flags.touchedAt }
    const layout = { columns: e.props.bodyColumns || DEFAULT_COLUMNS, rows: e.props.scroll?.bodyRows || e.viewport?.rows || DEFAULT_ROWS, surface: e.surface }

    return planPane($.ui.resolve(e), view, layout)
  })
}
