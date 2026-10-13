import type { SessionCompactResult, SessionContextBreakdown } from 'claude-code'

import { contextView } from './breakdown'
import type { ContextView } from './breakdown'
import { turnsLeftOf } from './forecast'
import type { Forecasts } from './model'
import type { HudCompacted, HudSample, HudUsage } from '../types'

// The context card's data, kept apart from the engine calls (which register.tsx makes). The
// breakdown is the engine's local estimate (`summary`, never `full`, which would count with the
// token-count API); it costs some work, so the pane reads it at most once per BREAKDOWN_REFRESH_MS.

const BREAKDOWN_REFRESH_MS = 20_000

let cached: { at: number; view: ContextView | null } | null = null
// Where auto-compaction runs, once a breakdown has said; the turns forecast counts up to it.
let compactAt: number | null = null

// The kept view while it is fresh; undefined when it is time to read the breakdown again.
export function freshBreakdown(nowMs: number): ContextView | null | undefined {
  return cached !== null && nowMs - cached.at < BREAKDOWN_REFRESH_MS ? cached.view : undefined
}

// Keeps what a read brought: its view, or none when the engine had no breakdown to give.
export function keepBreakdown(nowMs: number, breakdown: SessionContextBreakdown | undefined): ContextView | null {
  const view = breakdown === undefined ? null : contextView(breakdown)
  cached = { at: nowMs, view }
  if (view !== null) compactAt = view.compactAt

  return view
}

// A failed read keeps the last view until the next try.
export function keepLast(nowMs: number): ContextView | null {
  cached = { at: nowMs, view: cached?.view ?? null }

  return cached.view
}

export type ForecastInput = { history: readonly HudSample[]; turns: readonly number[]; usage: HudUsage | null }

// The turns forecast counts up to the compaction point once known, else to the whole window.
export function forecastsFrom(input: ForecastInput): Forecasts {
  const limit = compactAt ?? input.usage?.context?.window ?? null

  return { history: input.history, turnsLeft: limit === null ? null : turnsLeftOf(input.turns, limit) }
}

// What a compaction came to; null when a hook vetoed it (the engine says why in its own line).
export function compactedOf(result: SessionCompactResult, at: number): HudCompacted | null {
  if (result.skip !== undefined) return null

  return { before: result.tokensBefore ?? null, after: result.tokensAfter ?? null, at }
}

export const reasonOf = (error: unknown): string => (error instanceof Error ? error.message : String(error))
