import type { ChatState, Heartbeat, OtherChat, SelfChat } from '../types'
import { clip } from './format'

// The other chats on this machine, their pure half. Each session keeps one small heartbeat in this
// plugin's store under its own key, so two sessions never write the same value; each reads the
// others' keys on its beat, drops the ones gone quiet, and draws who waits on the person.

const SECOND = 1000
const MINUTE = 60 * SECOND
/** How often a session writes its heartbeat while nothing changes, and reads the others'. */
export const HEARTBEAT_MS = 30 * SECOND
/** A heartbeat older than this belongs to a session that is gone (four missed beats): it is pruned. */
export const STALE_MS = 2 * MINUTE
export const KEY_PREFIX = 'sessions/'
export const TITLE_MAX = 40
// A word this long of letters and digits mixed reads like a key or a token: it never leaves the session.
const SECRET_LIKE = /\b(?=[A-Za-z0-9_\-]*\d)(?=[A-Za-z0-9_\-]*[A-Za-z])[A-Za-z0-9_\-]{20,}\b/g
const MASK = '•••'
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
  const line = text.split('\n').map(part => part.trim()).find(Boolean) ?? ''
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

export const beatOf = (self: SelfChat, at: number): Heartbeat => ({
  project: self.project,
  title: self.title,
  state: stateOf(self),
  since: self.since,
  at,
})

/** What a beat says, less when it was written: the part a change is measured on. */
export const bodyOf = (beat: Heartbeat): Omit<Heartbeat, 'at'> => ({ project: beat.project, title: beat.title, state: beat.state, since: beat.since })

/** Another session's value as the store hands it over: anything else is not a heartbeat. */
export const isHeartbeat = (value: unknown): value is Heartbeat => {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  const isText = typeof v.project === 'string' && typeof v.title === 'string'
  const isTime = Number.isFinite(v.since) && Number.isFinite(v.at)
  return isText && isTime && STATES.includes(v.state as ChatState)
}

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
    chats.push({ id: key.slice(KEY_PREFIX.length), project: value.project, title: value.title, state: value.state, minutes })
  }
  chats.sort((a, b) => RANK[a.state] - RANK[b.state] || b.minutes - a.minutes || a.id.localeCompare(b.id))
  return { chats, gone }
}

export const waitingOf = (chats: readonly OtherChat[]): OtherChat[] => chats.filter(chat => chat.state === 'waiting')

export const quietOf = (chats: readonly OtherChat[]): OtherChat[] => chats.filter(chat => chat.state !== 'waiting')
