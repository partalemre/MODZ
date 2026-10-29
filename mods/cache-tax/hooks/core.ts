// The cache model: prices, the one-hour clock, the session's state and the number formats.

import type { ModelSwitch } from './model-switch'

export const MIN_MS = 60 * 1000
export const HOUR_MS = 60 * MIN_MS
export const TTL_MS = HOUR_MS
export const PING_AFTER_MS = 50 * MIN_MS
export const MIN_PING_MS = MIN_MS
export const AUTO_WARM_MS = 3 * HOUR_MS
export const DEFAULT_WINDOW_MS = 6 * HOUR_MS
/** The status row also shows a warm cache this close to going cold. */
export const SOON_MS = 10 * MIN_MS
export const BIG_TOKENS = 50000
export const PING_PROMPT = 'Reply with the single word: warm'

// $ per million tokens, [cache read, 1h cache write, output], list prices October 2026.
// More specific families first: a model id takes the first row it matches.
const PRICES: Array<[string | RegExp, number, number, number]> = [
  ['fable-5-1', 0.25, 20, 50],
  ['mythos-5-1', 0.25, 20, 50],
  ['fable-5', 1, 20, 50],
  ['mythos-5', 1, 20, 50],
  ['opus-5-5', 0.2, 8, 20],
  ['opus-5', 0.5, 10, 25],
  // Opus 4 and 4.1 in every spelling (claude-opus-4-1-20250805, claude-opus-4@20250514), never Opus 4.5 and later.
  [/opus-4(?:-[01])?(?:$|[^-\d]|-20\d{6})/, 1.5, 30, 75],
  ['opus-4', 0.5, 10, 25],
  ['sonnet-5-5', 0.1, 4, 10],
  ['sonnet-5', 0.2, 4, 10],
  ['sonnet', 0.3, 6, 15],
  ['haiku-5-5', 0.01, 0.2, 0.5],
  ['3-5-haiku', 0.08, 1.6, 4],
  ['haiku-3-5', 0.08, 1.6, 4],
  ['haiku', 0.1, 2, 5],
]

const LONG_PROMPT_TOKENS = 100000
// A request whose prompt, cache reads and writes included, is over 100k tokens pays these instead.
const LONG_PRICES: Array<[string, number, number, number]> = [
  ['haiku-5-5', 0.05, 1, 2.5],
]

export type Price = [number, number, number]
export type PingRecord = { at: number; read: number; write: number; usd: number | null; warm: boolean }
export type Miss = { at: number; tokens: number; usd: number | null }
export type GuardMode = 'refuse' | 'warn'
/** A prompt the guard dropped, waiting on the hold card; `switch` when a model change, not the clock, made it cold. */
export type Held = { text: string; at: number; switch: ModelSwitch | null }

export type State = {
  hasBand: boolean
  hasStatus: boolean
  sid: string
  deadline: number
  every: number
  always: boolean
  lastRequestAt: number
  lastModel: string | null
  /** The model of the main loop's last request: the one the cache now belongs to. */
  cacheModel: string | null
  ctx: number
  compacted: boolean
  guard: GuardMode
  ackedAt: number
  coldWritePending: boolean
  misses: Miss[]
  pending: { cancel: () => void } | null
  last: PingRecord | null
  stopped: string | null
  held: Held | null
  resend: string | null
  /** A restored window found no conversation to fork; it pings again only after this process's first turn. */
  waitForTurn: boolean
  /** Ping retries spent on a busy API since the last answered ping. */
  retries: number
}

export function freshState(): State {
  return {
    hasBand: false, hasStatus: false, sid: '', deadline: 0, every: PING_AFTER_MS, always: false, lastRequestAt: 0,
    lastModel: null, cacheModel: null, ctx: 0, compacted: false, guard: 'refuse', ackedAt: 0, coldWritePending: false, misses: [],
    pending: null, last: null, stopped: null, held: null, resend: null, waitForTurn: false, retries: 0,
  }
}

export function priceOf(model: string | null, promptTokens: number): Price | null {
  const m = (model ?? '').toLowerCase().replace(/[\s.]+/g, '-')
  const rows = promptTokens > LONG_PROMPT_TOKENS ? [...LONG_PRICES, ...PRICES] : PRICES
  for (const [family, read, write, output] of rows) {
    if (typeof family === 'string' ? m.includes(family) : family.test(m)) return [read, write, output]
  }
  return null
}

export function coldUsd(s: State, model = s.lastModel): number | null {
  const price = priceOf(model, s.ctx)
  return price ? s.ctx * price[1] / 1e6 : null
}

export function warmUsd(s: State, model = s.lastModel): number | null {
  const price = priceOf(model, s.ctx)
  return price ? s.ctx * price[0] / 1e6 : null
}

type ForkUsage = { input_tokens: number; output_tokens: number; cache_read_input_tokens: number; cache_creation_input_tokens: number }

/** Everything a fork bills: the cache read, any cache write, uncached input at the base rate (half the 1h write rate), and the output. */
export function pingUsd(u: ForkUsage, price: Price): number {
  return (u.cache_read_input_tokens * price[0] + u.cache_creation_input_tokens * price[1] + u.input_tokens * price[1] / 2 + u.output_tokens * price[2]) / 1e6
}

/** The read-only upper bound: pings at the cache-read rate that cost as much as one cold write of the same context. */
export function breakEvenPings(s: State): number | null {
  const price = priceOf(s.lastModel, s.ctx)
  if (!price || s.ctx <= 0) return null
  return Math.floor(price[1] / price[0])
}

export function isCold(s: State, now: number): boolean {
  return s.lastRequestAt > 0 && !s.compacted && now - s.lastRequestAt >= TTL_MS
}

/** A held send's card is up while its cause lasts: the clock's cold, or the model switch it was held for. */
export const isHoldShown = (s: State, now: number): boolean => s.held !== null && (s.held.switch !== null || isCold(s, now))

/** The model a held send is priced at: the one it would be sent to. */
export const heldModel = (s: State): string | null => s.held?.switch?.to ?? s.lastModel

/** Time left before a warm cache goes cold; null while nothing is known or it already is. */
export function untilCold(s: State, now: number): number | null {
  if (!s.lastRequestAt || s.compacted || isCold(s, now)) return null
  return s.lastRequestAt + TTL_MS - now
}

export function parseDuration(text: string): number | null {
  const m = /^(?:(\d+)h)?(?:(\d+)m)?$/.exec(text.trim())
  if (!m || (m[1] === undefined && m[2] === undefined)) return null
  return (Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0)) * MIN_MS
}

/** A turn whose cache write is at least this share of a sizeable previous context re-wrote it all. */
const FULL_SHARE = 0.5
const FULL_FLOOR = 20000

export const isFullMiss = (prev: number, write: number): boolean => prev > FULL_FLOOR && write >= FULL_SHARE * prev

export function disarm(s: State) {
  if (s.pending) s.pending.cancel()
  s.pending = null
}

/** /clear starts a new conversation in the same process; nothing priced before it still exists. */
export function resetForClear(s: State) {
  s.ctx = 0
  s.lastRequestAt = 0
  s.cacheModel = null
  s.compacted = false
  s.ackedAt = 0
  s.coldWritePending = false
  s.misses = []
  s.held = null
  s.resend = null
  s.waitForTurn = false
  disarm(s)
}
