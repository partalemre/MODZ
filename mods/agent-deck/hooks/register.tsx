import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionMessage } from 'claude-code'

import { deckTree } from './pane'
import type { DeckHandlers, DeckView } from './pane'
import {
  addTokens,
  builtinTypes,
  isRunning,
  linesOf,
  mergeList,
  mergeTypes,
  parseAgentFile,
  patchAgent,
  recordTool,
  sameJson,
  shortText,
  summarizeInput,
  themeOf,
} from './roster'
import type { DeckType } from '../types'

const PANE = 'agent-deck'
const COMMAND = 'deck'
const BEAT_MS = 120
const SYNC_EVERY_BEATS = 8
const DESCRIPTION_MAX = 40
const ANSWER_MAX = 160
const AGENT_DIRS = ['.claude/agents']

const agentsAtom = atom({ plugin: 'agent-deck', key: 'agents' } as const, [])
const typesAtom = atom({ plugin: 'agent-deck', key: 'types' } as const, [])
const selectedAtom = atom({ plugin: 'agent-deck', key: 'selected' } as const, null)
const tabAtom = atom({ plugin: 'agent-deck', key: 'tab' } as const, 'crew')
const linesAtom = atom({ plugin: 'agent-deck', key: 'lines' } as const, [])
const noticeAtom = atom({ plugin: 'agent-deck', key: 'notice' } as const, null)
const draftTypeAtom = atom({ plugin: 'agent-deck', key: 'draftType' } as const, 'general-purpose')

const flags = { isOpen: false, hasRunning: false, theme: 'auto' as 'light' | 'dark' | 'auto' }

async function scanDir($: EngineInterface, dir: string): Promise<DeckType[]> {
  const found: DeckType[] = []
  try {
    for (const entry of await $.fs.list(dir)) {
      if (!entry.name.endsWith('.md')) continue
      const type = parseAgentFile(await $.fs.read(`${dir}/${entry.name}`), dir.startsWith('.claude') ? 'project' : 'user')
      if (type !== null) found.push(type)
    }
  } catch {
    $.ui.log(`agent-deck: no agent files in ${dir}`, { to: 'debug' })
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
    const messages = (await $.session.messages({ agentId })) as SessionMessage[]
    const lines = linesOf(messages)
    if (!sameJson(await read($, linesAtom), lines)) await update($, linesAtom, () => lines)
  } catch {
    $.ui.log(`agent-deck: no transcript for ${agentId} yet`, { to: 'debug' })
  }
}

async function syncRoster($: EngineInterface): Promise<void> {
  const nowMs = await $.clock.now()
  const current = await read($, agentsAtom)
  const merged = mergeList(current, await $.agent.list(), nowMs)
  if (!sameJson(current, merged)) await update($, agentsAtom, () => merged)
  flags.hasRunning = merged.some(isRunning)

  const selected = await read($, selectedAtom)
  const open = merged.find(agent => agent.id === selected)
  if (flags.isOpen && open !== undefined && isRunning(open)) await refreshLines($, open.id)
}

async function select($: EngineInterface, id: string): Promise<void> {
  await update($, selectedAtom, () => id)
  await update($, linesAtom, () => [])
  await refreshLines($, id)
}

async function send($: EngineInterface, view: DeckView, text: string): Promise<void> {
  if (view.selected === null || text.trim() === '') return
  const result = await $.session.send({ to: { agentId: view.selected }, text })
  $.ui.toast(result.isDelivered ? 'Message sent' : `Not delivered: ${result.reason}`)
}

async function dispatch($: EngineInterface, view: DeckView, text: string): Promise<void> {
  const prompt = text.trim()
  if (prompt === '') return
  const result = await $.agent.spawn({ subagentType: view.draftType, prompt, description: shortText(prompt, DESCRIPTION_MAX) })
  if (result.deny !== undefined) {
    await update($, noticeAtom, () => `Refused: ${result.deny}`)

    return
  }
  await update($, noticeAtom, () => null)
  await update($, tabAtom, () => 'crew')
  if (result.agentId !== undefined) await select($, result.agentId)
  $.ui.toast(`Dispatched to ${view.draftType}`)
}

async function giveTask($: EngineInterface, name: string): Promise<void> {
  await update($, draftTypeAtom, () => name)
  await update($, noticeAtom, () => null)
  await update($, tabAtom, () => 'dispatch')
}

function handlersFor($: EngineInterface, view: DeckView): DeckHandlers {
  return {
    onGiveTask: name => giveTask($, name),
    onTab: tab => update($, tabAtom, () => tab),
    onSelect: id => select($, id),
    onType: value => update($, draftTypeAtom, () => value),
    onSend: text => send($, view, text),
    onDispatch: text => dispatch($, view, text),
  }
}

export const register: Register = on => {
  let beat = 0

  on('session.start', async ($, e, next) => {
    await update($, typesAtom, () => builtinTypes())
    const found = await scanTypes($)
    await update($, typesAtom, current => mergeTypes(current, found))
    flags.theme = themeOf((await $.config.list()).find(row => row.key === 'theme')?.value)
    $.clock.every(BEAT_MS, () => {
      beat += 1
      if (beat % SYNC_EVERY_BEATS === 0) void syncRoster($)
      if (flags.isOpen && flags.hasRunning) $.ui.invalidate('ui.render')
    })
    await $.command.register({ name: COMMAND, description: 'Open the agent deck: watch, message and dispatch agents', immediate: true })

    return next(e)
  })

  on('command.run', { command: COMMAND }, async $ => {
    await $.ui.open({ id: PANE, title: 'Agents', focus: true, closeOnEscape: true })
    flags.isOpen = true
    await syncRoster($)

    return {}
  })

  on('ui.close', { id: PANE }, async ($, e, next) => {
    flags.isOpen = false

    return next(e)
  })

  on('agent.offer', async ($, e, next) => {
    const known = await read($, typesAtom)
    if (!known.some(type => type.name === e.agent)) {
      const type = { name: e.agent, description: shortText(e.description, ANSWER_MAX), source: e.source }
      await update($, typesAtom, current => mergeTypes(current, [type]))
    }

    return next(e)
  })

  on('agent.spawn', async ($, e, next) => {
    const result = await next(e)
    if (result.agentId !== undefined) {
      const id = result.agentId
      const nowMs = await $.clock.now()
      await update($, agentsAtom, agents => patchAgent(agents, { id, type: e.subagentType, description: e.description }, nowMs))
    }

    return result
  })

  on('tool.call', async ($, e, next) => {
    const id = e.agentId
    if (id !== undefined) {
      const nowMs = await $.clock.now()
      const detail = summarizeInput(e as unknown as Record<string, unknown>)
      await update($, agentsAtom, agents => recordTool(agents, { id, tool: e.tool, detail }, nowMs))
    }

    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    const id = e.agentId
    if (id !== undefined && result.usage !== null) {
      const usage = result.usage
      const tokens = usage.input_tokens + usage.cache_creation_input_tokens + usage.output_tokens
      const nowMs = await $.clock.now()
      await update($, agentsAtom, agents => addTokens(agents, { id, tokens }, nowMs))
    }

    return result
  })

  on('turn.complete', async ($, e, next) => {
    const id = e.agentId
    if (id !== undefined) {
      const nowMs = await $.clock.now()
      const answer = shortText(e.answer, ANSWER_MAX)
      await update($, agentsAtom, agents => patchAgent(agents, { id, answer, endedAt: nowMs }, nowMs))
      const type = (await read($, agentsAtom)).find(agent => agent.id === id)?.type ?? 'agent'
      $.ui.toast(`${type} finished`)
    }

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    flags.isOpen = true
    const view: DeckView = {
      agents: await read($, agentsAtom),
      types: await read($, typesAtom),
      selected: await read($, selectedAtom),
      tab: await read($, tabAtom),
      lines: await read($, linesAtom),
      notice: await read($, noticeAtom),
      draftType: await read($, draftTypeAtom),
      nowMs: await $.clock.now(),
      columns: e.props.bodyColumns,
      theme: flags.theme,
      surface: e.surface,
    }
    flags.hasRunning = view.agents.some(isRunning)

    return deckTree($.ui.resolve(e), view, handlersFor($, view))
  })
}
