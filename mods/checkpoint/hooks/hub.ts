import { ago } from './pane'
import type { CheckpointEntry, HubTone } from '../types'

// The MODZ main panel's side of this mod (DESIGN.md §9): a one-line summary card it collects, and its
// "open" requests, which name a pane by key.

export const HUB_PANE = 'checkpoints'

export type HubShown = { detail: string; tone: HubTone }

// "12 nokta · son 3 dk önce"; nothing to say while no checkpoint exists.
export function hubOf(entries: CheckpointEntry[], now: number): HubShown {
  const newest = entries[0]
  if (newest === undefined) return { detail: '', tone: 'idle' }

  return { detail: `${entries.length} nokta · son ${ago(now - newest.at)}`, tone: 'ok' }
}

export function isOpenFor(value: unknown, pane: string): boolean {
  return typeof value === 'object' && value !== null && (value as { pane?: unknown }).pane === pane
}
