// keepwarm: a bounded window of cheap fork pings that keep the one-hour cache read, not re-written.

import type { ModelForkResult } from 'claude-code'

import { PING_AFTER_MS, PING_PROMPT, TTL_MS, disarm, isCold, pingUsd, priceOf } from './core'
import type { State } from './core'
import { fmtTok, fmtUsd } from './fmt'
import { bandWords } from './ui-words'
import { statusText } from './words'

const KEY_DEADLINE = 'deadline'
const KEY_EVERY = 'every'
export const KEY_GUARD = 'guard'
export const KEY_ALWAYS = 'always'
const MIN_DELAY_MS = 1000
/** A warm ping writes only its own message; a write of this share of the read or more means the prefix broke. */
const BROKEN_SHARE = 0.1

/** What keepwarm needs from the engine, bound in register.ts (the one file that holds `$`). */
export type Io = {
  now: () => Promise<number>
  after: (ms: number, fn: () => void) => { cancel: () => void }
  fork: (prompt: string) => Promise<ModelForkResult | null>
  get: (key: string) => Promise<unknown>
  set: (key: string, value: unknown) => Promise<unknown>
  del: (key: string) => Promise<unknown>
  redraw: () => void
  status: (text: string | undefined) => void
}

// The window and its ping period belong to the session that armed them, so a
// second session, or one resumed from another transcript, never inherits them
// and cannot turn them off. The always switch and the guard mode stay global.
export const deadlineKey = (s: State): string => `${KEY_DEADLINE}:${s.sid}`
export const everyKey = (s: State): string => `${KEY_EVERY}:${s.sid}`

/** Redraws the band, or on a surface without one pins the keepwarm line; never clears a line it did not set. */
export function updateStatus(io: Io, s: State, now: number) {
  if (s.hasBand) return io.redraw()
  const text = statusText(s, now)
  if (text === undefined && !s.hasStatus) return
  s.hasStatus = text !== undefined
  io.status(text)
}

/** Clears this session's own dead window and the bare keys a store written before 2.1.1 still holds. Other sessions' keys are never touched: a read followed by a delete cannot be made atomic against their renewal. */
export async function prune(io: Io, s: State, now: number) {
  for (const key of [KEY_DEADLINE, deadlineKey(s)]) {
    const deadline = await io.get(key)
    if (deadline === undefined) continue
    if (typeof deadline === 'number' && deadline > now) continue
    await io.del(key)
    await io.del(KEY_EVERY + key.slice(KEY_DEADLINE.length))
  }
}

async function halt(io: Io, s: State, end: { why: string | null; isForgettingAlways: boolean }) {
  s.deadline = 0
  s.every = PING_AFTER_MS
  s.stopped = end.why
  disarm(s)
  await io.del(deadlineKey(s))
  await io.del(everyKey(s))
  if (end.isForgettingAlways) {
    s.always = false
    await io.del(KEY_ALWAYS)
  }
  updateStatus(io, s, await io.now())
}

export const stop = (io: Io, s: State, why: string | null): Promise<void> => halt(io, s, { why, isForgettingAlways: false })
/** keepwarm off: the window ends and so does always, for every later session too. */
export const stopForGood = (io: Io, s: State): Promise<void> => halt(io, s, { why: null, isForgettingAlways: true })

export async function arm(io: Io, s: State) {
  disarm(s)
  if (!s.deadline) return
  const now = await io.now()
  if (now >= s.deadline) return stop(io, s, null)
  // A cold window still needs expiry cleanup, but must not send a model request.
  if (s.lastRequestAt && !s.compacted && !isCold(s, now)) {
    const untilCold = s.lastRequestAt + TTL_MS - now
    const delay = Math.min(s.deadline - now, untilCold, Math.max(MIN_DELAY_MS, s.lastRequestAt + s.every - now))
    s.pending = io.after(delay, () => { void ping(io, s) })
  } else {
    s.pending = io.after(s.deadline - now, () => { void arm(io, s) })
  }
  updateStatus(io, s, now)
}

type ForkReply = ModelForkResult | null

function failureText(reply: ForkReply): string | null {
  if (reply === null) return bandWords().noPing
  if (reply.isAnswered !== false) return null
  if (reply.reason === 'nothing-to-fork') return bandWords().nothingToFork
  if (reply.reason === 'api-error') return bandWords().apiError(reply.status === null ? '' : ` (${reply.status})`)
  return reply.reason === 'aborted' ? bandWords().aborted : bandWords().noText
}

async function ping(io: Io, s: State) {
  s.pending = null
  if (!s.deadline) return
  const now = await io.now()
  if (now >= s.deadline) return arm(io, s)
  // A turn in the meantime re-armed the timer; this callback is stale.
  if (isCold(s, now)) return arm(io, s)
  if (now - s.lastRequestAt < s.every - MIN_DELAY_MS) return
  let reply: ForkReply
  try {
    reply = await io.fork(PING_PROMPT)
  } catch (err) {
    return stop(io, s, bandWords().pingFailed(err instanceof Error ? err.message : String(err)))
  }
  const failure = failureText(reply)
  if (failure !== null || reply === null || reply.isAnswered === false) return stop(io, s, failure)
  const u = reply.usage
  const price = priceOf(s.lastModel)
  const warm = u.cache_read_input_tokens > 0 && u.cache_creation_input_tokens < BROKEN_SHARE * u.cache_read_input_tokens
  const usd = price ? pingUsd(u, price) : null
  s.last = { at: now, read: u.cache_read_input_tokens, write: u.cache_creation_input_tokens, usd, warm }
  if (!warm) {
    return stop(io, s, bandWords().gone({ read: fmtTok(u.cache_read_input_tokens), wrote: fmtTok(u.cache_creation_input_tokens), usd: fmtUsd(usd) }))
  }
  s.lastRequestAt = now
  await arm(io, s)
}

export async function startWindow(io: Io, s: State, span: { windowMs: number; every: number }) {
  const { windowMs, every } = span
  const now = await io.now()
  s.every = every
  if (every === PING_AFTER_MS) await io.del(everyKey(s))
  else await io.set(everyKey(s), every)
  s.deadline = now + windowMs
  s.stopped = null
  await io.set(deadlineKey(s), s.deadline)
  await arm(io, s)
}
