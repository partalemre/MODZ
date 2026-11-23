import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Draft, Panel } from '../types'
import { BUILTIN_TYPES, DEFAULT_TYPE, TASK_TITLE_MAX, blankDraft, chosenOf } from './agent-types'
import { addRun, askedAgain } from './agents'
import { HomeButton } from './home'
import type { DraftView } from './dispatch'
import { clip } from './format'
import { t } from './i18n'
import { lookOf } from './identity'
import { restingCrab } from './mood'
import { paneDataOf } from './pane-data'
import type { PaneData } from './pane-data'
import { agentsTree, isDoneOpenIn, layoutOf } from './pane-tree'
import { pageActOf, runPageAct } from './page-act'
import type { Ui } from './rows'
import type { PaneHandlers } from './sections'
import { pinned } from './pin'
import { HUB_PANE, PANE } from './state'
import { shownOf } from './stage'
import { drawSafely, plainPane, reopenKeptTab } from './kit/pane-keep'
import { paneHeld } from './pane-held'
import { deliveryText } from './steer'
import type { StopNoun } from './steer'

// The Ajanlar panel: the header card, the toolbar ("Yeni görev", Daralt), the attention line, the
// form while it is open, the timeline, then the running, finished and planned agents as rows.

// State refs live in each file that reads them: the scan follows literals, not imports.
const agents = atom({ plugin: 'savvy-progress', key: 'agents' } as const, [])
const flow = atom({ plugin: 'savvy-progress', key: 'flow' } as const, null)
const job = atom({ plugin: 'savvy-progress', key: 'job' } as const, null)
const now = atom({ plugin: 'savvy-progress', key: 'now' } as const, 0)
const panel = atom({ plugin: 'savvy-progress', key: 'panel' } as const, { isCompact: false })
const tasks = atom({ plugin: 'savvy-progress', key: 'tasks' } as const, [])
const limit = atom({ plugin: 'savvy-progress', key: 'limit' } as const, null)
const types = atom({ plugin: 'savvy-progress', key: 'types' } as const, BUILTIN_TYPES)
const crab = atom({ plugin: 'savvy-progress', key: 'crab' } as const, restingCrab(0))
const chats = atom({ plugin: 'savvy-progress', key: 'chats' } as const, [])

type On = Parameters<Register>[0]

const MIN_COLS = 24
const DEFAULT_COLS = 40

// Asking an agent more from its card (a finished one picks up again), and stopping it through the
// engine's own TaskStop tool (the normal permission chain applies). A delivered question joins the
// card's conversation; only a refusal needs a toast, since the card itself shows the question.
async function sendTo($: EngineInterface, id: string, text: string): Promise<void> {
  const message = text.trim()
  if (!message) return
  const run = (await read($, agents)).find(a => a.id === id)
  const sent = await $.session.send({ to: { agentId: run?.agentId ?? id }, text: message })
  if (!sent.isDelivered) {
    $.ui.toast(deliveryText(sent))
    return
  }
  const at = await $.clock.now()
  await update($, agents, list => list.map(a => (a.id === id ? askedAgain(a, message, at) : a)))
}

async function requestStop($: StopNoun, agentId: string): Promise<boolean> {
  const ran = await $.tool.call({ tool: 'TaskStop', task_id: agentId })
  return ran.deny === undefined
}

async function stopAgent($: EngineInterface, agentId: string): Promise<void> {
  try {
    const isStopped = await requestStop($ as unknown as StopNoun, agentId)
    $.ui.toast(isStopped ? t().stopAsked : t().stopRefused)
  } catch (error) {
    $.ui.log(`savvy-progress: stop failed (${String(error)})`, { to: 'debug' })
    $.ui.toast(t().stopFailed)
  }
}

// Every value the panel draws from; each read subscribes the pane to it.
async function paneData($: EngineInterface): Promise<PaneData> {
  return paneDataOf({
    list: await read($, agents),
    flow: await read($, flow),
    job: await read($, job),
    tasks: await read($, tasks),
    now: await read($, now),
    panel: await read($, panel),
    limit: await read($, limit),
    types: await read($, types),
    crab: await read($, crab),
    chats: await read($, chats),
  })
}

const draftOf = (draft: Draft | undefined): Draft => draft ?? blankDraft()

// Changes the "Yeni görev" form and leaves the rest of the panel as it was.
const patchDraft = ($: EngineInterface, patch: Partial<Draft>) =>
  update($, panel, prev => ({ ...prev, draft: { ...draftOf(prev.draft), ...patch } }))

// Starts the task; a refusal stays on the form, a start closes it and opens the new agent's card.
async function startTask($: EngineInterface, type: string, text: string): Promise<void> {
  const prompt = text.trim()
  if (!prompt) return
  try {
    const description = clip(prompt.split('\n')[0] ?? prompt, TASK_TITLE_MAX)
    const started = await $.agent.spawn({ subagentType: type, prompt, description })
    if (started.deny !== undefined) {
      await patchDraft($, { notice: t().denied(started.deny) })
      return
    }
    const id = started.agentId
    // Our own spawn hook does not see a spawn this plugin made: the card is added here, at once.
    const at = await $.clock.now()
    const spawn = { id: id ?? `task-${at}`, agentId: id, type, description, brief: prompt, model: started.model, isAsked: true, at }
    const isKnown = (a: { agentId?: string }) => a.agentId !== undefined && a.agentId === id
    const list = await update($, agents, prev => (prev.some(isKnown) ? prev.map(a => (isKnown(a) ? { ...a, isAsked: true } : a)) : addRun(prev, spawn)))
    await update($, panel, prev => ({ ...prev, selected: spawn.id, draft: { ...draftOf(prev.draft), isOpen: false, notice: undefined } }))
    const run = list.find(a => a.id === spawn.id)
    $.ui.toast(t().launched(run ? lookOf(run).name : type))
  } catch (error) {
    $.ui.log(`savvy-progress: spawn failed (${String(error)})`, { to: 'debug' })
    await patchDraft($, { notice: t().spawnFailed })
  }
}

const draftHandlers = ($: EngineInterface, view: Omit<DraftView, 'layout'>): Pick<PaneHandlers, 'onNewTask' | 'onCancelTask' | 'onPickType' | 'onStartTask'> => ({
  onNewTask: () => void patchDraft($, { isOpen: !draftOf(view.draft).isOpen, notice: undefined }),
  onCancelTask: () => void patchDraft($, { isOpen: false, notice: undefined }),
  onPickType: name => void patchDraft($, { type: name, notice: undefined }),
  onStartTask: text => void startTask($, chosenOf(view.types, view.draft)?.name ?? DEFAULT_TYPE, text),
})

function handlersOf($: EngineInterface, d: PaneData): PaneHandlers {
  const flip = (fn: (prev: Panel) => Panel) => () => void update($, panel, fn)
  return {
    onToggle: id => void update($, panel, prev => ({ ...prev, selected: prev.selected === id ? undefined : id })),
    onLook: id => void update($, panel, prev => ({ ...prev, selected: id, isCompact: false })),
    onBrief: id => void update($, panel, prev => ({ ...prev, briefOpen: prev.briefOpen === id ? undefined : id })),
    onSend: (id, text) => void sendTo($, id, text),
    onStop: id => void stopAgent($, id),
    onLog: id => void update($, panel, prev => ({ ...prev, logOpen: prev.logOpen === id ? undefined : id })),
    onCompact: flip(prev => ({ ...prev, isCompact: !prev.isCompact })),
    onDone: flip(prev => ({ ...prev, isDoneOpen: !isDoneOpenIn(prev, d) })),
    onTimeline: flip(prev => ({ ...prev, isTimelineHidden: prev.isTimelineHidden !== true })),
    onChats: flip(prev => ({ ...prev, isChatsOpen: prev.isChatsOpen !== true })),
    ...draftHandlers($, { draft: d.panel.draft, types: d.types }),
  }
}

// Asks the hub to come forward; the hub hears this mod's own `home` value. A failure only shows in the debug log.
async function goHome($: EngineInterface): Promise<void> {
  try {
    await $.state.set({ plugin: 'savvy-progress', key: 'home' }, { at: await $.clock.now() })
  } catch (error) {
    $.ui.log(`savvy-progress: home failed (${String(error)})`, { to: 'debug' })
  }
}

type Room = { isDesktop: boolean; columns: number }

// Everything the pane draws. A throw anywhere in it costs the plain list, never the tab (kit/pane-keep.tsx): an
// unanswered pane shows the app's "Nothing to show yet".
async function drawnPane($: EngineInterface, ui: Ui, room: Room) {
  const { Box } = ui
  const home = (await $.state.get({ plugin: 'modz', key: 'isOn' })).value === true && HomeButton(ui, () => void goHome($))
  const d = await paneData($)
  const body = agentsTree(ui, { d, layout: layoutOf(room.isDesktop, room.columns), on: handlersOf($, d) })
  return <Box flexDirection="column" rowGap={1}>{home}{body}</Box>
}

// The plain list: the running agents first, each by its task; with no list to read, the notice alone.
async function plainOf($: EngineInterface, ui: Ui) {
  const list = await read($, agents).catch(() => [])
  const lines = [...list].sort((a, b) => Number(b.status === 'running') - Number(a.status === 'running'))
  return plainPane(ui, { notice: t().paneFailed, lines: lines.map(a => `${a.status === 'running' ? '● ' : ''}${a.description || a.type}`) })
}

const logOf = ($: EngineInterface) => (text: string) => $.ui.log(`savvy-progress: ${text}`, { to: 'debug' })

// Opens the pane again for a tab the desktop kept from before a restart, and tells the hub. Asked by
// kit/pane-keep.tsx once the render is over: no open or state write runs while a hook draws.
async function reopenPane($: EngineInterface): Promise<void> {
  const opened = await $.ui.open({ id: PANE, title: t().pane })
  if (!opened.isPlaced || (await $.state.get({ plugin: 'modz', key: 'isOn' })).value !== true) return
  await $.state.set({ plugin: 'savvy-progress', key: 'shown' }, shownOf(HUB_PANE, await $.clock.now()))
}

async function handOn($: EngineInterface, press: { action: string; arg?: string }): Promise<void> {
  if (!runPageAct(handlersOf($, await paneData($)), press.action, press.arg)) $.ui.log(`savvy-progress: unknown hub press ${press.action}`, { to: 'debug' })
}

export function onPane(on: On): void {
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e) as Ui
    reopenKeptTab(paneHeld, {
      isListed: async () => (await $.ui.panes()).some(p => p.id === PANE),
      reopen: () => reopenPane($),
      soon: work => $.clock.after(0, work),
      log: logOf($),
    })
    const room = { isDesktop: e.surface === 'desktop' && 'Svg' in ui, columns: Math.max(MIN_COLS, e.props.bodyColumns || DEFAULT_COLS) }
    return pinned(e, await drawSafely(paneHeld, { draw: () => drawnPane($, ui, room), plain: () => plainOf($, ui), log: logOf($) }))
  }).catch(async ($, e, next) => {
    // The hook threw past its own guard or ran out of time: still a list, and a redraw on the next look.
    if (next.error.kind === 're-entry') return next(e)
    paneHeld.needsDraw = true
    return pinned(e, await plainOf($, $.ui.resolve(e) as Ui))
  })
  // A press on the Agents page the MODZ hub draws (modz/hooks/pages/agents.tsx): it does what this pane's button does.
  // Run once the hub's write has settled, so the writes it makes are heard as if pressed here.
  on('state.set', { plugin: 'modz', key: 'act' }, async ($, e, next) => {
    const done = await next(e)
    const press = pageActOf(e.value)
    if (press !== null) {
      $.clock.after(0, () => void handOn($, press).catch(cause => $.ui.log(`savvy-progress: the hub's ${press.action} press failed: ${String(cause)}`, { to: 'debug' })))
    }
    return done
  }).catch(($, e, next) => next(e))
}
