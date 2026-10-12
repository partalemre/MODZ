import type { PlanState } from './freshness'
import type { HubTone } from '../types'
import { words } from './words'

// The MODZ main panel's side of this mod (DESIGN.md §9): a one-line summary card it collects, and its
// "open" requests, which name a pane by key.

export const HUB_PANE = 'plan'

export type HubShown = { detail: string; tone: HubTone }

// Iris only while the plan is under way; a plan not started or gone quiet reads idle.
export function hubOf(progress: { done: number; total: number } | null, state: PlanState): HubShown {
  if (progress === null || progress.total === 0) return { detail: '', tone: 'idle' }
  const say = words()
  if (progress.done >= progress.total) return { detail: say.hubDone(progress.total), tone: 'ok' }
  if (state === 'unstarted') return { detail: say.hubUnstarted(progress.total), tone: 'idle' }
  if (state === 'stale') return { detail: say.hubWaiting(progress.done, progress.total), tone: 'idle' }

  return { detail: say.hubLive(progress.done, progress.total), tone: 'live' }
}

export function isOpenFor(value: unknown, pane: string): boolean {
  return typeof value === 'object' && value !== null && (value as { pane?: unknown }).pane === pane
}
