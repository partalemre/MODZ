import type { HubTone } from '../types'

// The MODZ main panel's side of this mod (DESIGN.md §9): a one-line summary card it collects, and its
// "open" requests, which name a pane by key.

export const HUB_PANE = 'plan'

export type HubShown = { detail: string; tone: HubTone }

export function hubOf(progress: { done: number; total: number } | null): HubShown {
  if (progress === null || progress.total === 0) return { detail: '', tone: 'idle' }
  if (progress.done >= progress.total) return { detail: `${progress.total}/${progress.total} bitti`, tone: 'ok' }

  return { detail: `${progress.done}/${progress.total} adım`, tone: 'live' }
}

export function isOpenFor(value: unknown, pane: string): boolean {
  return typeof value === 'object' && value !== null && (value as { pane?: unknown }).pane === pane
}
