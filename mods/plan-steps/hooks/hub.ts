import type { PlanState } from './freshness'
import { clip } from './progress'
import type { HubLive, HubTone } from '../types'
import { words } from './words'

// The MODZ main panel's side of this mod (DESIGN.md §9): a one-line summary card it collects, and its
// "open" requests, which name a pane by key.

export const HUB_PANE = 'plan'

export type HubShown = { detail: string; tone: HubTone; live?: HubLive }

// The step under way, as the hub shows it under the plan's line: its words and when it began.
export type CurrentStep = { title: string; startedAt: number | null }

const STEP_MAX = 60

// Iris only while the plan is under way; a plan not started or gone quiet reads idle. A plan under way also says
// its current step, which the hub draws on its own face (DESIGN.md §9); the hub tells the step's time itself.
export function hubOf(progress: { done: number; total: number } | null, state: PlanState, current: CurrentStep | null = null): HubShown {
  if (progress === null || progress.total === 0) return { detail: '', tone: 'idle' }
  const say = words()
  if (progress.done >= progress.total) return { detail: say.hubDone(progress.total), tone: 'ok' }
  if (state === 'unstarted') return { detail: say.hubUnstarted(progress.total), tone: 'idle' }
  if (state === 'stale') return { detail: say.hubWaiting(progress.done, progress.total), tone: 'idle' }
  const shown: HubShown = { detail: say.hubLive(progress.done, progress.total), tone: 'live' }
  if (current === null) return shown
  const line = { label: clip(current.title, STEP_MAX), ...(current.startedAt === null ? {} : { since: current.startedAt }) }

  return { ...shown, live: { lines: [line] } }
}

// Whether a stored card already shows this, so it is not written again.
export const isShowing = (card: HubShown | undefined, shown: HubShown): boolean =>
  card !== undefined && card.detail === shown.detail && card.tone === shown.tone && JSON.stringify(card.live) === JSON.stringify(shown.live)

export function isOpenFor(value: unknown, pane: string): boolean {
  return typeof value === 'object' && value !== null && (value as { pane?: unknown }).pane === pane
}
