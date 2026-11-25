import type { AgentRun } from '../types'
import { partialOf } from './job'

// How far each agent is. A worker that reports its steps or keeps a task list is measured; any other
// running agent has no honest percent, so its bar stays an empty track with no figure (a full bar would read as done)
// and its meta line carries what is measured: steps taken and time spent. Only the answer makes 100%.

export type Progress = { value: number; isEstimate: boolean }

const AT_WORK: Progress = { value: 0, isEstimate: true }

export const agentProgress = (a: AgentRun): Progress => {
  if (a.status !== 'running') return { value: 1, isEstimate: false }
  const measured = partialOf(a)
  return measured === null ? AT_WORK : { value: measured, isEstimate: false }
}
