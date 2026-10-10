import { offerFacts } from './offer'
import type { HubTone, Replay } from '../types'

// The MODZ main panel's side of this mod (DESIGN.md §9): the one-line card it collects, and its "open"
// requests, which name a pane by key.

export const HUB_PANE = 'replay'

export type HubShown = { detail: string; tone: HubTone }

// "4 düzenleme · 4 dosya" for the last turn with edits; nothing to say before one.
export function hubOf(replay: Replay | null): HubShown {
  if (replay === null || replay.steps.length === 0) return { detail: '', tone: 'idle' }

  return { detail: offerFacts(replay.steps).title, tone: 'ok' }
}

export function isOpenFor(value: unknown, pane: string): boolean {
  return typeof value === 'object' && value !== null && (value as { pane?: unknown }).pane === pane
}
