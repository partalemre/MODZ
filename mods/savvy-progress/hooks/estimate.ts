import type { AgentRun } from '../types'
import { kindOf } from './history'
import { partialOf } from './job'

// How far each agent is, as a percent. A worker that reports its steps or keeps a task list is
// measured; any other running agent gets an estimate from its work so far, always marked `~`:
// tool calls fill an easing curve that never reaches the end, and the phase it reached (editing,
// then testing) lifts the floor. Only the answer makes 100%.

const CURVE_CAP = 0.9
const CURVE_CALLS = 8
const EDIT_FLOOR = 0.45
const TEST_FLOOR = 0.7
const START = 0.04
const TEST_WORDS = /\b(test|vitest|jest|pytest|lint|tsc|validate|check)\b/i

export type Progress = { value: number; isEstimate: boolean }

const floorOf = (a: AgentRun): number => {
  const history = a.history ?? []
  const hasTest = history.some(e => kindOf(e.tool) === 'run' && TEST_WORDS.test(e.target))
  if (hasTest) return TEST_FLOOR
  return history.some(e => kindOf(e.tool) === 'edit') ? EDIT_FLOOR : 0
}

const estimateOf = (a: AgentRun): number => {
  const calls = Math.max(a.toolCount || 0, a.history?.length ?? 0)
  const curve = CURVE_CAP * (1 - Math.exp(-calls / CURVE_CALLS))
  return Math.min(CURVE_CAP, Math.max(START, floorOf(a), curve))
}

export const agentProgress = (a: AgentRun): Progress => {
  if (a.status !== 'running') return { value: 1, isEstimate: false }
  const measured = partialOf(a)
  return measured === null ? { value: estimateOf(a), isEstimate: true } : { value: measured, isEstimate: false }
}
