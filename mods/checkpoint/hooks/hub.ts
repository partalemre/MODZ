import type { CheckpointEntry, HubTone } from '../types'
import { words } from './words'

// The MODZ main panel's side of this mod (DESIGN.md §9): a one-line summary card it collects, and its
// "open" requests, which name a pane by key.

export const HUB_PANE = 'checkpoints'

export type HubShown = { detail: string; tone: HubTone }

// "12 saved"; no "3m ago", since the card is written once per checkpoint and an age would go stale.
export function hubOf(entries: CheckpointEntry[]): HubShown {
  if (entries.length === 0) return { detail: '', tone: 'idle' }

  return { detail: words().hubDetail(entries.length), tone: 'ok' }
}

export function isOpenFor(value: unknown, pane: string): boolean {
  return typeof value === 'object' && value !== null && (value as { pane?: unknown }).pane === pane
}
