import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Draft, Panel } from '../types'
import { BUILTIN_TYPES, DEFAULT_TYPE, TASK_TITLE_MAX, blankDraft, chosenOf } from './agent-types'
import { addRun, askedAgain } from './agents'
import { quietTree, waitingTree } from './chats-tree'
import { draftTree } from './dispatch'
import { HomeButton } from './home'
import type { DraftView } from './dispatch'
import { clip } from './format'
import { t } from './i18n'
import { lookOf } from './identity'
import { restingCrab } from './mood'
import { paneDataOf } from './pane-data'
import type { PaneData } from './pane-data'
import { FRAME_COLS, FRAME_PX, agentRow, plannedRow } from './rows'
import type { RowContext, Ui } from './rows'
import { attentionTree, compactTree, emptyTree, headTree, sectionHead, timelineTree, toolbarTree } from './sections'
import type { Layout, PaneHandlers, PaneView } from './sections'
import { pinned } from './pin'
import { PANE } from './state'
import { deliveryText } from './steer'
import type { StopNoun } from './steer'

// The Ajanlar panel: the header card, the toolbar ("Yeni görev", Daralt), the attention line, the
// form while it is open, the timeline, then the running, finished and planned agents as cards.

// State refs live in each file that reads them: the scan follows literals, not imports.
const agents = atom({ plugin: 'savvy-progress', key: 'agents' } as const, [])
const flow = atom({ plugin: 'savvy-progress', key: 'flow' } as const, null)
const job = atom({ plugin: 'savvy-progress', key: 'job' } as const, null)
const now = atom({ plugin: 'savvy-progress', key: 'now' } as const, 0)
const panel = atom({ plugin: 'savvy-progress', key: 'panel' } as const, { isCompact: false, isDoneCollapsed: false })
const tasks = atom({ plugin: 'savvy-progress', key: 'tasks' } as const, [])
const limit = atom({ plugin: 'savvy-progress', key: 'limit' } as const, null)
const types = atom({ plugin: 'savvy-progress', key: 'types' } as const, BUILTIN_TYPES)
const crab = atom({ plugin: 'savvy-progress', key: 'crab' } as const, restingCrab(0))
const chats = atom({ plugin: 'savvy-progress', key: 'chats' } as const, [])

type On = Parameters<Register>[0]

const MIN_W = 240
const MAX_W = 900
// MODZ measures the desktop in 8 px cells (kit `PX_PER_CELL`).
const PX_PER_COL = 8
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
    onCompact: flip(prev => ({ ...prev, isCompact: !prev.isCompact })),
    onDone: flip(prev => ({ ...prev, isDoneCollapsed: !prev.isDoneCollapsed })),
    onTimeline: flip(prev => ({ ...prev, isTimelineHidden: prev.isTimelineHidden !== true })),
    onChats: flip(prev => ({ ...prev, isChatsOpen: prev.isChatsOpen !== true })),
    ...draftHandlers($, { draft: d.panel.draft, types: d.types }),
  }
}

function listTree(ui: Ui, view: PaneView) {
  const { Box } = ui
  const { d, layout, on } = view
  const s = t()
  const ctx: RowContext = { ...on, at: d.at, isDesktop: layout.isDesktop, inner: layout.inner, limit: d.limit, selected: d.panel.selected, briefOpen: d.panel.briefOpen }
  const isDoneOpen = !d.panel.isDoneCollapsed
  return (
    <Box key="list" flexDirection="column" rowGap={1}>
      {d.running.length > 0 && sectionHead(ui, layout, { id: 'running', label: `${s.running} · ${d.running.length}`, dot: 'run' })}
      {d.running.map(a => agentRow(ui, a, ctx))}
      {d.finished.length > 0 && sectionHead(ui, layout, { id: 'finished', label: `${s.finished} · ${d.finished.length}`, dot: 'ok', toggle: { key: 'done', isOpen: isDoneOpen, onPress: on.onDone } })}
      {isDoneOpen && d.finished.map(a => agentRow(ui, a, ctx))}
      {d.planned.length > 0 && sectionHead(ui, layout, { id: 'planned', label: `${s.planned} · ${d.planned.length}`, dot: 'idle' })}
      {d.planned.map(p => plannedRow(ui, p, ctx))}
    </Box>
  )
}

// Who else on this machine waits on the person comes first; the quiet rest folds at the foot.
function withChats(ui: Ui, view: PaneView) {
  const { Box } = ui
  const { d, layout, on } = view
  const quiet = quietTree(ui, { chats: d.chats, layout, isOpen: d.panel.isChatsOpen === true, onToggle: on.onChats })
  return (
    <Box flexDirection="column" rowGap={1}>
      {waitingTree(ui, d.chats, layout)}
      {paneTree(ui, view)}
      {quiet}
    </Box>
  )
}

function paneTree(ui: Ui, view: PaneView) {
  const { Box } = ui
  const { d, layout, on } = view
  const isDrafting = d.panel.draft?.isOpen === true
  const form = isDrafting && draftTree(ui, { draft: d.panel.draft, types: d.types, layout }, on)
  if (d.list.length === 0 && d.planned.length === 0) {
    return <Box flexDirection="column" rowGap={2}>{isDrafting ? form : emptyTree(ui, view)}</Box>
  }
  return (
    <Box flexDirection="column" rowGap={1}>
      {headTree(ui, d, layout)}
      {toolbarTree(ui, d, on)}
      {attentionTree(ui, view)}
      {form}
      {d.panel.isCompact ? compactTree(ui, d, layout) : timelineTree(ui, view)}
      {!d.panel.isCompact && listTree(ui, view)}
    </Box>
  )
}

// Asks the hub to come forward; the hub hears this mod's own `home` value. A failure only shows in the debug log.
async function goHome($: EngineInterface): Promise<void> {
  try {
    await $.state.set({ plugin: 'savvy-progress', key: 'home' }, { at: await $.clock.now() })
  } catch (error) {
    $.ui.log(`savvy-progress: home failed (${String(error)})`, { to: 'debug' })
  }
}

/** The pane's room: the desktop in px (a card's inside less its frame), the terminal in cells. */
export const layoutOf = (isDesktop: boolean, columns: number): Layout => {
  if (!isDesktop) return { isDesktop, W: 0, inner: columns, cols: columns }
  const W = Math.max(MIN_W, Math.min(MAX_W, columns * PX_PER_COL))
  return { isDesktop, W, inner: W - FRAME_PX, cols: columns - FRAME_COLS }
}

export function onPane(on: On): void {
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const table = $.ui.resolve(e)
    const ui = table as Ui
    const isDesktop = e.surface === 'desktop' && 'Svg' in ui
    const d = await paneData($)
    const layout = layoutOf(isDesktop, Math.max(MIN_COLS, e.props.bodyColumns || DEFAULT_COLS))
    const isHubOn = (await $.state.get({ plugin: 'modz', key: 'isOn' })).value === true
    const body = withChats(ui, { d, layout, on: handlersOf($, d) })
    if (!isHubOn) return pinned(e, body)
    const { Box } = ui
    return pinned(e, <Box flexDirection="column" rowGap={1}>{HomeButton(ui, () => void goHome($))}{body}</Box>)
  })
}
