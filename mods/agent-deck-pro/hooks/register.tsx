import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, Register, SessionMessage, ToolCallResult } from 'claude-code'

import { addUsage, parsePrices, priceOf } from './cost'
import type { Price } from './cost'
import { shortText } from './format'
import { deckTree } from './pane'
import type { DeckHandlers, DeckView } from './pane'
import { taskChange } from './result'
import { builtinTypes, isLive, linesOf, mergeList, mergeTypes, parseAgentFile, patchAgent, recordTool, sameJson } from './roster'
import { summarizeInput, themeOf, toolDone, withAgent } from './roster'
import { isCleanResult } from './spans'
import { AGENT_DIRS, ANSWER_MAX, BEAT_MS, COMMAND, DESCRIPTION_MAX, PANE, UI_START, flags } from './state'
import { afterCall, phaseOfCall } from './work'
import type { DeckAgent, DeckType, DeckUi } from '../types'

// The tool noun narrowed to this one call: checked against every tool's schema, the call is too deep for tsc.
type StopCall = { tool: 'TaskStop'; task_id: string }
type StopNoun = { tool: { call: (input: StopCall) => Promise<ToolCallResult> } }
type Call = { id: string; tool: string; input: Record<string, unknown>; callId: string | null }

const agentsAtom = atom({ plugin: 'agent-deck-pro', key: 'agents' } as const, [])
const typesAtom = atom({ plugin: 'agent-deck-pro', key: 'types' } as const, [])
const uiAtom = atom({ plugin: 'agent-deck-pro', key: 'ui' } as const, UI_START)

let created = 0

// Any change an agent's own work makes also counts as hearing from it.
async function change($: EngineInterface, id: string, fn: (agent: DeckAgent) => DeckAgent): Promise<void> {
  const nowMs = await $.clock.now()
  await update($, agentsAtom, agents => withAgent(agents, { id, nowMs }, agent => ({ ...fn(agent), lastActivityAt: nowMs })))
}

async function patchUi($: EngineInterface, patch: Partial<DeckUi>): Promise<void> {
  await update($, uiAtom, ui => ({ ...ui, ...patch }))
}

async function scanDir($: EngineInterface, dir: string): Promise<DeckType[]> {
  const found: DeckType[] = []
  try {
    for (const entry of await $.fs.list(dir)) {
      if (!entry.name.endsWith('.md')) continue
      const type = parseAgentFile(await $.fs.read(`${dir}/${entry.name}`), dir.startsWith('.claude') ? 'project' : 'user')
      if (type !== null) found.push(type)
    }
  } catch {
    $.ui.log(`agent-deck-pro: no agent files in ${dir}`, { to: 'debug' })
  }

  return found
}

async function scanTypes($: EngineInterface): Promise<DeckType[]> {
  const home = await $.env.get('HOME')
  const dirs = home === undefined ? AGENT_DIRS : [...AGENT_DIRS, `${home}/.claude/agents`]
  const lists = await Promise.all(dirs.map(dir => scanDir($, dir)))

  return lists.flat()
}

async function refreshLines($: EngineInterface, agentId: string): Promise<void> {
  try {
    const lines = linesOf((await $.session.messages({ agentId })) as SessionMessage[])
    if (!sameJson((await read($, uiAtom)).lines, lines)) await patchUi($, { lines })
  } catch {
    $.ui.log(`agent-deck-pro: no transcript for ${agentId} yet`, { to: 'debug' })
  }
}

async function syncRoster($: EngineInterface): Promise<void> {
  const nowMs = await $.clock.now()
  const current = await read($, agentsAtom)
  const merged = mergeList(current, await $.agent.list(), nowMs)
  if (!sameJson(current, merged)) await update($, agentsAtom, () => merged)
  flags.hasLive = merged.some(isLive)
  const ui = await read($, uiAtom)
  const open = merged.find(agent => agent.id === ui.selected)
  if (flags.isOpen && ui.drawer === 'log' && open !== undefined && isLive(open)) await refreshLines($, open.id)
}

// Pressing the selected row again folds its card.
async function select($: EngineInterface, id: string): Promise<void> {
  const isSame = (await read($, uiAtom)).selected === id
  await patchUi($, { selected: isSame ? null : id, drawer: 'none', lines: [] })
}

async function openDrawer($: EngineInterface, drawer: DeckUi['drawer']): Promise<void> {
  await patchUi($, { drawer })
  const selected = (await read($, uiAtom)).selected
  if (drawer === 'log' && selected !== null) await refreshLines($, selected)
}

async function send($: EngineInterface, view: DeckView, text: string): Promise<void> {
  if (view.selected === null || text.trim() === '') return
  const result = await $.session.send({ to: { agentId: view.selected }, text })
  $.ui.toast(result.isDelivered ? 'Mesaj iletildi' : `İletilemedi: ${result.reason}`)
  if (result.isDelivered) await patchUi($, { drawer: 'none' })
}

async function requestStop($: StopNoun, input: StopCall): Promise<boolean> {
  const ran = await $.tool.call(input)

  return ran.deny === undefined
}

async function stop($: EngineInterface, id: string): Promise<void> {
  try {
    const isStopped = await requestStop($ as unknown as StopNoun, { tool: 'TaskStop', task_id: id })
    $.ui.toast(isStopped ? 'Durdurma istendi' : 'Durdurma reddedildi')
    await syncRoster($)
  } catch {
    $.ui.toast('Bu ajan durdurulamadı')
  }
}

async function dispatch($: EngineInterface, view: DeckView, text: string): Promise<void> {
  const prompt = text.trim()
  if (prompt === '') return
  const result = await $.agent.spawn({ subagentType: view.draftType, prompt, description: shortText(prompt, DESCRIPTION_MAX) })
  if (result.deny !== undefined) {
    await patchUi($, { notice: `Reddedildi: ${result.deny}` })

    return
  }
  await patchUi($, { notice: null, tab: 'crew', drawer: 'none', selected: result.agentId ?? view.selected })
  $.ui.toast(`${view.draftType} işe koyuldu`)
}

function handlersFor($: EngineInterface, view: DeckView): DeckHandlers {
  return {
    onGiveTask: name => patchUi($, { draftType: name, notice: null, tab: 'dispatch' }),
    onTab: tab => patchUi($, { tab }),
    onSelect: id => select($, id),
    onStop: id => stop($, id),
    onType: value => patchUi($, { draftType: value }),
    onSend: text => send($, view, text),
    onDispatch: text => dispatch($, view, text),
    onDrawer: drawer => openDrawer($, drawer),
    onToggleDone: () => patchUi($, { isDoneOpen: !view.isDoneOpen }),
  }
}

async function trackTasks($: EngineInterface, spec: { id: string; input: Record<string, unknown>; ran: unknown }): Promise<void> {
  if (spec.input.tool === 'TaskCreate') created += 1
  const fn = taskChange(spec.input, { ran: spec.ran, localId: `local-${created}` })
  if (fn !== null) await change($, spec.id, fn)
}

async function viewOf($: EngineInterface, e: { props: { bodyColumns: number }; surface: string }): Promise<DeckView> {
  const [ui, agents, types, nowMs] = await Promise.all([read($, uiAtom), read($, agentsAtom), read($, typesAtom), $.clock.now()])

  return { ...ui, agents, types, nowMs, columns: e.props.bodyColumns, theme: flags.theme, surface: e.surface }
}

// One slow beat, only while the pane is open: sync the roster, and redraw while an agent lives so
// elapsed time, the spinner and the quiet check move. Nothing runs while the pane is closed.
function startBeat($: EngineInterface): void {
  $.clock.every(BEAT_MS, async () => {
    if (!flags.isOpen) return
    await syncRoster($)
    if (flags.hasLive) $.ui.invalidate('ui.render')
  })
}

async function onStart($: EngineInterface): Promise<void> {
  await update($, typesAtom, () => builtinTypes())
  const found = await scanTypes($)
  await update($, typesAtom, current => mergeTypes(current, found))
  flags.theme = themeOf((await $.config.list()).find(row => row.key === 'theme')?.value)
  startBeat($)
  await $.command.register({ name: COMMAND, description: 'Ajan güvertesi: ilerleme, takılanlar, maliyet; mesaj, durdur, görev ver', immediate: true })
}

async function toolStarted($: EngineInterface, call: Call): Promise<void> {
  const nowMs = await $.clock.now()
  const start = { id: call.id, tool: call.tool, detail: summarizeInput(call.input), phase: phaseOfCall(call.tool, call.input), callId: call.callId }
  await update($, agentsAtom, agents => recordTool(agents, start, nowMs))
}

async function toolEnded($: EngineInterface, call: Call & { ran: unknown }): Promise<void> {
  const nowMs = await $.clock.now()
  await update($, agentsAtom, agents => toolDone(agents, { id: call.id, nowMs, callId: call.callId, isOk: isCleanResult(call.ran) }))
  await change($, call.id, agent => afterCall(agent, call))
  await trackTasks($, { id: call.id, input: call.input, ran: call.ran })
}

async function onFinish($: EngineInterface, e: { agentId?: string; answer: string }): Promise<void> {
  const id = e.agentId
  if (id === undefined) return
  const nowMs = await $.clock.now()
  const answer = shortText(e.answer, ANSWER_MAX)
  await update($, agentsAtom, agents => patchAgent(agents, { id, answer, endedAt: nowMs, toolSince: null }, nowMs))
  // An open pane already shows it; a toast is for when the deck is closed.
  if (flags.isOpen) return
  const agent = (await read($, agentsAtom)).find(entry => entry.id === id)
  $.ui.toast(`${agent?.description || agent?.type || 'ajan'} bitti`)
}

// The pane's own life: start, open, close and draw.
function hookPane(on: On): void {
  on('session.start', async ($, e, next) => {
    await onStart($)

    return next(e)
  }).catch(($, e, next) => next(e))

  on('command.run', { command: COMMAND }, async $ => {
    await $.ui.open({ id: PANE, title: 'Ajanlar', focus: true, closeOnEscape: true })
    flags.isOpen = true
    await syncRoster($)

    return {}
  }).catch(() => ({}))

  on('ui.close', { id: PANE }, async ($, e, next) => {
    flags.isOpen = false

    return next(e)
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    flags.isOpen = true
    const view = await viewOf($, e)
    flags.hasLive = view.agents.some(isLive)

    return deckTree($.ui.resolve(e), view, handlersFor($, view))
  })
}

// Who is on the roster: types offered, agents spawned, agents finished.
function hookRoster(on: On): void {
  on('agent.offer', async ($, e, next) => {
    if (!(await read($, typesAtom)).some(type => type.name === e.agent)) {
      const type = { name: e.agent, description: shortText(e.description, ANSWER_MAX), source: e.source }
      await update($, typesAtom, current => mergeTypes(current, [type]))
    }

    return next(e)
  }).catch(($, e, next) => next(e))

  on('agent.spawn', async ($, e, next) => {
    const result = await next(e)
    const id = result.agentId
    if (id !== undefined) {
      const nowMs = await $.clock.now()
      await update($, agentsAtom, agents => patchAgent(agents, { id, type: e.subagentType, description: e.description }, nowMs))
    }

    return result
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    await onFinish($, e)

    return next(e)
  }).catch(($, e, next) => next(e))
}

// What each agent does: its tool calls and its model steps. A tracking failure never costs the call:
// the catch hands it on, or replays what it settled to.
function hookWork(on: On, prices: Record<string, Price>): void {
  on('tool.call', async ($, e, next) => {
    const id = e.agentId
    if (id === undefined) return next(e)
    const callId = typeof e.tool_use_id === 'string' ? e.tool_use_id : null
    const call = { id, tool: String(e.tool), input: e as unknown as Record<string, unknown>, callId }
    await toolStarted($, call)
    const ran = await next(e)
    await toolEnded($, { ...call, ran })

    return ran
  }).catch(($, e, next) => next(e))

  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    const id = e.agentId
    if (id === undefined) return result
    const { usage } = result
    // A step that calls no tool is the agent writing its answer: the report phase.
    const isReport = result.toolUses.length === 0 && result.answer !== ''
    const effort = typeof e.effort === 'string' ? e.effort : null
    await change($, id, agent => {
      const used = usage === null ? agent : addUsage(agent, { usage, model: e.model, price: priceOf(e.model, prices) })
      const tracked = { ...used, effort: effort ?? used.effort }

      return isReport ? { ...tracked, phase: 'report' } : tracked
    })

    return result
  })
}

export const register: Register = (on, options) => {
  hookPane(on)
  hookRoster(on)
  hookWork(on, parsePrices(String(options.prices ?? '')))
}
