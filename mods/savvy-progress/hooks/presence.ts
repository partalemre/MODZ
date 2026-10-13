import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { HomeCrab, SelfChat } from '../types'
import { hubCardOf } from './hub'
import { HEARTBEAT_MS, beatOf, blankSelf, bodyOf, keyOf, projectOf, scanOf, settle, titleOf, withAsk, withoutAsk } from './chats'
import { TURNS_KEY, ended, rested, restingCrab, started, turnsFrom } from './mood'
import type { TurnEnd } from './mood'
import { isSame } from './same'
import { HUB_PANE } from './state'

// The session as the other chats on this machine and the home crab see it, the side where `$` is.
// This session's heartbeat goes to the store when what it says changes and on each slow beat, so
// the others know it is alive; their heartbeats come back into `chats` for the pane and the hub.
// Waiting on the person is what done-ping calls it: a permission ask (`tool.check` answered
// `ask`) or an open question. The main loop's turns move the crab; each answer adds to the count
// every session shares. A module hooks an event once without a matcher, and register.tsx and
// events.ts hold those for session.start, turn.complete and tool.call: here each has a matcher.

// State refs live in each file that reads them: the scan follows literals, not imports.
const self = atom({ plugin: 'savvy-progress', key: 'self' } as const, null)
const chats = atom({ plugin: 'savvy-progress', key: 'chats' } as const, [])
const crab = atom({ plugin: 'savvy-progress', key: 'crab' } as const, restingCrab(0))
const agents = atom({ plugin: 'savvy-progress', key: 'agents' } as const, [])
const flow = atom({ plugin: 'savvy-progress', key: 'flow' } as const, null)
const job = atom({ plugin: 'savvy-progress', key: 'job' } as const, null)
const tasks = atom({ plugin: 'savvy-progress', key: 'tasks' } as const, [])
const hub = atom({ plugin: 'savvy-progress', key: 'hub' } as const, { pane: HUB_PANE, detail: '', tone: 'idle', at: 0 })

type On = Parameters<Register>[0]

const QUESTION_TOOL = 'AskUserQuestion'
// Every way a turn ends and every session start: a matcher that admits them all (see above).
const ANY_END: TurnEnd[] = ['answer', 'aborted', 'refusal', 'error']
const ANY_SESSION = [true, false]
const ANY_TOOL = /./

const log = ($: EngineInterface, what: string, error: unknown): void =>
  $.ui.log(`savvy-progress: ${what} (${String(error)})`, { to: 'debug' })

// One change to this session's side, written only when it moved; `since` follows a change of state.
async function change($: EngineInterface, fn: (prev: SelfChat) => SelfChat): Promise<boolean> {
  const prev = await read($, self)
  if (!prev) return false
  const at = await $.clock.now()
  if (isSame(settle(prev, fn(prev), at), prev)) return false
  await update($, self, current => (current ? settle(current, fn(current), at) : current))
  return true
}

// The heartbeat goes out when what it says changed, or always on a beat. A new session id
// (after /clear) takes over from the old key; an ended one is never written again.
async function publish($: EngineInterface, isBeat: boolean): Promise<void> {
  const mine = await read($, self)
  if (!mine) return
  const id = await $.session.id()
  if (id === mine.endedId) return
  const beat = beatOf(mine, await $.clock.now())
  if (!isBeat && id === mine.id && isSame(bodyOf(beat), mine.sent)) return
  if (mine.id && mine.id !== id) await $.store.delete(keyOf(mine.id))
  await $.store.set(keyOf(id), beat)
  await update($, self, current => (current ? { ...current, id, sent: bodyOf(beat) } : current))
}

async function changeAndPublish($: EngineInterface, fn: (prev: SelfChat) => SelfChat): Promise<void> {
  try {
    if (await change($, fn)) await publish($, false)
  } catch (error) {
    log($, 'heartbeat not written', error)
  }
}

// The others' heartbeats, read back; the gone and the unreadable are pruned for everyone.
async function scan($: EngineInterface): Promise<void> {
  const own = keyOf(await $.session.id())
  const entries: [string, unknown][] = []
  for (const key of await $.store.keys()) if (key !== own) entries.push([key, await $.store.get(key)])
  const found = scanOf(entries, own, await $.clock.now())
  for (const key of found.gone) await $.store.delete(key)
  const prev = await read($, chats)
  if (isSame(found.chats, prev)) return
  await update($, chats, () => found.chats)
  await syncHub($)
}

// The hub card says when another chat waits. Written here, not from a state.set hook: a timer's
// writes come back under this plugin's own frame, where its own hooks are not run again.
async function syncHub($: EngineInterface): Promise<void> {
  const sources = { flow: await read($, flow), agents: await read($, agents), job: await read($, job), tasks: await read($, tasks) }
  const { detail, tone } = hubCardOf({ ...sources, chats: await read($, chats) })
  const prev = await read($, hub)
  if (prev.detail === detail && prev.tone === tone) return
  const at = await $.clock.now()
  await update($, hub, () => ({ pane: HUB_PANE, detail, tone, at }))
}

async function moveCrab($: EngineInterface, fn: (prev: HomeCrab) => HomeCrab): Promise<void> {
  const prev = await read($, crab)
  if (!isSame(fn(prev), prev)) await update($, crab, fn)
}

// One slow beat: say this session is alive, read who else is, let a rested crab nap.
async function beat($: EngineInterface): Promise<void> {
  try {
    await publish($, true)
    await scan($)
    const now = await $.clock.now()
    await moveCrab($, prev => rested(prev, now))
  } catch (error) {
    log($, 'no chat heartbeat this beat', error)
  }
}

async function projectName($: EngineInterface, cwd: string): Promise<string> {
  try {
    const repo = await $.session.repo()
    return projectOf(repo?.root ?? cwd)
  } catch (error) {
    log($, 'no repository, naming the folder', error)
    return projectOf(cwd)
  }
}

// A reload keeps what the session and the crab were doing; a fresh session starts idle and asleep.
async function start($: EngineInterface, cwd: string): Promise<void> {
  try {
    const turns = turnsFrom(await $.store.get(TURNS_KEY))
    await moveCrab($, prev => (prev.mood === 'working' ? { ...prev, turns } : { ...prev, mood: 'sleeping', turns }))
    const at = await $.clock.now()
    const project = await projectName($, cwd)
    const prev = await read($, self)
    await update($, self, () => (prev ? { ...prev, project, endedId: undefined } : { ...blankSelf(at), project }))
  } catch (error) {
    log($, 'other chats and the crab wait for the next beat', error)
  }
  await beat($)
  $.clock.every(HEARTBEAT_MS, () => void beat($))
}

// The store's count first, so two sessions answering one after another both count.
async function countTurn($: EngineInterface): Promise<number> {
  const turns = turnsFrom(await $.store.get(TURNS_KEY)) + 1
  await $.store.set(TURNS_KEY, turns)
  return turns
}

async function crabEnded($: EngineInterface, reason: TurnEnd): Promise<void> {
  try {
    const at = await $.clock.now()
    const turns = reason === 'answer' ? await countTurn($) : (await read($, crab)).turns
    await moveCrab($, prev => ({ ...ended(prev, { reason, at }), turns }))
  } catch (error) {
    log($, 'the crab missed a turn', error)
  }
}

// A tool call resolved (run or refused): a permission ask or a question it opened waits no more.
async function askClosed($: EngineInterface, id: unknown): Promise<void> {
  if (typeof id !== 'string' || !(await read($, self))?.asks.includes(id)) return
  await changeAndPublish($, prev => withoutAsk(prev, id))
}

function onSession(on: On): void {
  on('session.start', { isInteractive: ANY_SESSION }, async ($, e, next) => {
    const result = await next(e)
    await start($, result.cwd)
    return result
  }).catch(($, e, next) => next(e))

  // The session's key goes with it; after a /clear the next write takes the new id.
  on('session.end', async ($, e, next) => {
    try {
      await $.store.delete(keyOf(e.sessionId))
      const at = await $.clock.now()
      await update($, self, prev => ({ ...blankSelf(at), project: prev?.project ?? '', endedId: e.sessionId }))
    } catch (error) {
      log($, 'heartbeat not removed', error)
    }
    return next(e)
  }).catch(($, e, next) => next(e))
}

// Only the main loop moves the chat and the crab; a subagent's run is its own crab's business.
function onTurns(on: On): void {
  on('turn.start', async ($, e, next) => {
    const result = await next(e)
    await changeAndPublish($, prev => ({ ...prev, isWorking: true, title: prev.title || titleOf(e.text) }))
    await moveCrab($, started).catch(error => log($, 'the crab missed a turn', error))
    return result
  }).catch(($, e, next) => next(e))

  // Nothing waits once the turn is over: a dialog does not outlive its turn.
  on('turn.complete', { reason: ANY_END }, async ($, e, next) => {
    const result = await next(e)
    if (e.agentId !== undefined) return result
    await changeAndPublish($, prev => ({ ...prev, isWorking: false, asks: [] }))
    await crabEnded($, e.reason)
    return result
  }).catch(($, e, next) => next(e))
}

// A permission ask waits from its `ask` verdict until its call resolves; a question while it is open.
function onAsks(on: On): void {
  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)
    const id = e.tool_use_id
    if (verdict.decision === 'ask' && id !== undefined) await changeAndPublish($, prev => withAsk(prev, id))
    return verdict
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: ANY_TOOL }, async ($, e, next) => {
    const id = (e as { tool_use_id?: unknown }).tool_use_id
    if (typeof id === 'string' && e.tool === QUESTION_TOOL) await changeAndPublish($, prev => withAsk(prev, id))
    try {
      return await next(e)
    } finally {
      await askClosed($, id)
    }
  }).catch(($, e, next) => next(e))
}

export function onPresence(on: On): void {
  onSession(on)
  onTurns(on)
  onAsks(on)
}
