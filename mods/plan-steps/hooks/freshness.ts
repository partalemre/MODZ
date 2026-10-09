import type { Plan } from './match'
import { formatDuration } from './progress'

// How alive the plan in view is. A plan nobody has started, or one nothing has touched for half an
// hour, is not the work under way: the status line leaves it out and the pane says so quietly.

export const STALE_MS = 30 * 60_000

export type PlanState = 'none' | 'unstarted' | 'live' | 'stale' | 'done'

export function planState(plan: Plan | null, at: { now: number; touchedAt: number }): PlanState {
  if (plan === null || plan.steps.length === 0) return 'none'
  if (plan.steps.every(step => step.status === 'completed')) return 'done'
  if (plan.steps.every(step => step.status === 'pending')) return 'unstarted'

  return at.now - at.touchedAt >= STALE_MS ? 'stale' : 'live'
}

// Whether the status line carries the plan: only work under way, or a plan just finished.
export const isShown = (state: PlanState): boolean => state === 'live' || state === 'done'

// The quiet note a plan that is not under way carries: "başlamadı", "bekliyor · 45dk önce".
export function stateNote(state: PlanState, at: { now: number; touchedAt: number }): string {
  if (state === 'unstarted') return 'başlamadı'
  if (state === 'stale') return `bekliyor · ${formatDuration(at.now - at.touchedAt)} önce`

  return ''
}
