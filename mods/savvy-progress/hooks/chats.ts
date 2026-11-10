import type { AgentRun, ChatState, Heartbeat, OtherAgent, OtherChat, SelfChat, SharedAgent } from '../types'
import { isRunning } from './agents'
import { clip } from './format'
import { lookOf } from './identity'

// The other chats on this machine, their pure half. Each session keeps one small heartbeat in this
// plugin's store under its own key, so two sessions never write the same value; each reads the
// others' keys on its beat, drops the ones gone quiet, and draws who waits on the person.

const SECOND = 1000
const MINUTE = 60 * SECOND
/** How often a session writes its heartbeat while nothing changes, and reads the others'. */
export const HEARTBEAT_MS = 30 * SECOND
/** How often a session says a change in its agents and reads the others': an agent shows elsewhere within this. */
export const SCAN_MS = 5 * SECOND
/** A heartbeat older than this belongs to a session that is gone (four missed beats): it is pruned. */
export const STALE_MS = 2 * MINUTE
export const KEY_PREFIX = 'sessions/'
export const TITLE_MAX = 40
// A word this long of letters and digits mixed reads like a key or a token: it never leaves the session.
const SECRET_LIKE = /\b(?=[A-Za-z0-9_\-]*\d)(?=[A-Za-z0-9_\-]*[A-Za-z])[A-Za-z0-9_\-]{20,}\b/g
const MASK = '•••'
// What the app wraps around a prompt (`<system-reminder>…</system-reminder>`), and any tag left over.
const WRAPPED = /<([a-z][\w-]*)[^>]*>[\s\S]*?<\/\1>/gi
const TAG = /<\/?[a-z][\w-]*[^>]*>/gi
const STATES: readonly ChatState[] = ['working', 'waiting', 'idle']
// Waiting first, the longest wait on top; then working, then idle.
const RANK: Record<ChatState, number> = { waiting: 0, working: 1, idle: 2 }

export const keyOf = (id: string): string => `${KEY_PREFIX}${id}`

export const stateOf = (self: Pick<SelfChat, 'asks' | 'isWorking'>): ChatState => {
  if (self.asks.length > 0) return 'waiting'
  return self.isWorking ? 'working' : 'idle'
}

/** The chat's name for the others: its first prompt's first line, anything key-like masked, cut short. */
export const titleOf = (text: string): string => {
  const said = text.replace(WRAPPED, ' ').replace(TAG, ' ')
  const line = said.split('\n').map(part => part.trim()).find(Boolean) ?? ''
  return clip(line.replace(/\s+/g, ' ').replace(SECRET_LIKE, MASK), TITLE_MAX)
}

/** The last part of a path: the repository's or the folder's name. */
export const projectOf = (path: string): string => path.replace(/\/+$/, '').split('/').at(-1) || path

export const blankSelf = (at: number): SelfChat => ({ id: '', project: '', title: '', isWorking: false, asks: [], since: at })

/** `next` with `since` moved to `at` when what the chat is doing changed. */
export const settle = (prev: SelfChat, next: SelfChat, at: number): SelfChat =>
  stateOf(prev) === stateOf(next) ? next : { ...next, since: at }

export const withAsk = (self: SelfChat, id: string): SelfChat =>
  self.asks.includes(id) ? self : { ...self, asks: [...self.asks, id] }

export const withoutAsk = (self: SelfChat, id: string): SelfChat =>
  self.asks.includes(id) ? { ...self, asks: self.asks.filter(ask => ask !== id) } : self

/** This session's running agents as the others are told; a title goes through the same mask as the chat's. */
export const sharedOf = (list: readonly AgentRun[]): SharedAgent[] =>
  list.filter(isRunning).map(a => ({ id: a.id, name: lookOf(a).name, title: titleOf(a.description || a.type), startedAt: a.startedAt, costUsd: a.costUsd }))

export const beatOf = (self: SelfChat, at: number, agents: SharedAgent[] = []): Heartbeat => ({
  project: self.project,
  title: self.title,
  state: stateOf(self),
  since: self.since,
  at,
  ...(agents.length > 0 ? { agents } : {}),
})

/** What a beat says, less when it was written and what agents cost: the part a change is measured on. */
export const bodyOf = (beat: Heartbeat): Omit<Heartbeat, 'at'> => ({
  project: beat.project,
  title: beat.title,
  state: beat.state,
  since: beat.since,
  ...(beat.agents ? { agents: beat.agents.map(({ costUsd: _cost, ...who }) => who) } : {}),
})

/** Another session's value as the store hands it over: anything else is not a heartbeat. */
export const isHeartbeat = (value: unknown): value is Heartbeat => {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  const isText = typeof v.project === 'string' && typeof v.title === 'string'
  const isTime = Number.isFinite(v.since) && Number.isFinite(v.at)
  return isText && isTime && STATES.includes(v.state as ChatState)
}

const isShared = (value: unknown): value is SharedAgent => {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.id === 'string' && typeof v.name === 'string' && typeof v.title === 'string' && Number.isFinite(v.startedAt)
}

// Another session's word for its agents: an older session says nothing, anything malformed is left out.
const agentsIn = (value: unknown, now: number): OtherAgent[] =>
  (Array.isArray(value) ? value.filter(isShared) : []).map(a => ({
    id: a.id,
    name: a.name,
    title: a.title,
    minutes: Math.max(0, Math.floor((now - a.startedAt) / MINUTE)),
    costUsd: Number.isFinite(a.costUsd) ? Number(a.costUsd) : 0,
  }))

export const isStale = (beat: Heartbeat, now: number): boolean => now - beat.at > STALE_MS

export type Scan = { chats: OtherChat[]; gone: string[] }

/** The others' heartbeats as rows, waiting first; the keys of the gone and the unreadable, to prune. */
export function scanOf(entries: readonly [key: string, value: unknown][], own: string, now: number): Scan {
  const chats: OtherChat[] = []
  const gone: string[] = []
  for (const [key, value] of entries) {
    if (!key.startsWith(KEY_PREFIX) || key === own) continue
    if (!isHeartbeat(value) || isStale(value, now)) {
      gone.push(key)
      continue
    }
    const minutes = Math.max(0, Math.floor((now - value.since) / MINUTE))
    const agents = agentsIn(value.agents, now)
    chats.push({ id: key.slice(KEY_PREFIX.length), project: value.project, title: value.title, state: value.state, minutes, ...(agents.length > 0 ? { agents } : {}) })
  }
  chats.sort((a, b) => RANK[a.state] - RANK[b.state] || b.minutes - a.minutes || a.id.localeCompare(b.id))
  return { chats, gone }
}

export const waitingOf = (chats: readonly OtherChat[]): OtherChat[] => chats.filter(chat => chat.state === 'waiting')

/** The chats with an agent running: the desktop keeps a session's agents to it, so the panel shows the rest here. */
export const crewedOf = (chats: readonly OtherChat[]): OtherChat[] => chats.filter(chat => (chat.agents?.length ?? 0) > 0)

export const quietOf = (chats: readonly OtherChat[]): OtherChat[] => chats.filter(chat => chat.state !== 'waiting')

const CHATS_MAX = 8
const CHAT_AGENTS_MAX = 6

/** The chats the pane lists at most, and the agents under each: a crowded machine costs a "+N more", never the pane
 * (the engine draws no tree past its size). */
export function listedChats(chats: readonly OtherChat[]): { chats: OtherChat[]; more: number } {
  const listed = chats.slice(0, CHATS_MAX).map(chat => (chat.agents && chat.agents.length > CHAT_AGENTS_MAX ? { ...chat, agents: chat.agents.slice(0, CHAT_AGENTS_MAX) } : chat))

  return { chats: listed, more: chats.length - listed.length }
}
