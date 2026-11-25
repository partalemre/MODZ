import type { Plan } from './match'
import type { StepTrack } from '../types'
import { formatDuration } from './progress'
import { words } from './words'

// How alive the plan in view is. A plan nobody has started, or one nothing has touched for half an
// hour, is not the work under way: the status line leaves it out and the pane says so quietly.

export const STALE_MS = 30 * 60_000

export type PlanState = 'none' | 'unstarted' | 'live' | 'stale' | 'done'

// `touchedAt` below 0: this process has not seen the plan move (a restart), so how long it waited is unknown.
// `isBusy`: a helper still works on a step, so the plan is under way however long it has been quiet.
type Clock = { now: number; touchedAt: number; isBusy?: boolean }

export function planState(plan: Plan | null, at: Clock): PlanState {
  if (plan === null || plan.steps.length === 0) return 'none'
  if (plan.steps.every(step => step.status === 'completed')) return 'done'
  if (plan.steps.every(step => step.status === 'pending')) return 'unstarted'
  if (at.isBusy === true) return 'live'

  return at.now - at.touchedAt >= STALE_MS ? 'stale' : 'live'
}

export const hasRunningAgent = (tracks: Record<string, StepTrack>): boolean =>
  Object.values(tracks).some(track => track.agents.some(agent => agent.isRunning))

// Whether the status line carries the plan: only work under way, or a plan just finished.
export const isShown = (state: PlanState): boolean => state === 'live' || state === 'done'

// The quiet note a plan that is not under way carries: "başlamadı", "bekliyor · 45dk önce".
export function stateNote(state: PlanState, at: { now: number; touchedAt: number }): string {
  if (state === 'unstarted') return words().notStarted
  if (state === 'stale') return at.touchedAt < 0 ? words().waiting : words().waitingSince(formatDuration(at.now - at.touchedAt))

  return ''
}
