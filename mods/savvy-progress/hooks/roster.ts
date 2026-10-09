import type { AgentInfo } from 'claude-code'

import type { AgentRun } from '../types'
import { windowOf } from './pricing'
import { nextLook } from './identity'
import { MAX_RUNS } from './state'

// The engine's own agent list is the truth about who exists and who ended. Events fill in the
// detail, but an agent spawned before this mod loaded, or one whose end event never came, would
// otherwise be missing or stuck: the roster adds the first and closes the second.

const ENDED = ['completed', 'failed', 'killed']

export const isEnded = (info: Pick<AgentInfo, 'status'>): boolean => ENDED.includes(info.status)

const arrival = (info: AgentInfo, list: AgentRun[], at: number): AgentRun => ({
  id: info.id,
  agentId: info.id,
  parentId: info.parentId,
  type: info.type,
  description: info.description,
  model: '',
  status: 'running',
  startedAt: at,
  contextTokens: 0,
  contextMax: windowOf(''),
  tokens: 0,
  costUsd: 0,
  steps: 0,
  round: 1,
  look: nextLook(list),
  toolCount: 0,
})

// An ended agent never seen before is not added: its card would show a duration nobody observed.
const settled = (a: AgentRun, info: AgentInfo, at: number): AgentRun => ({
  ...a,
  status: info.status === 'completed' ? 'done' : 'failed',
  endReason: info.status === 'killed' ? 'aborted' : a.endReason,
  endedAt: a.endedAt ?? at,
})

// A run whose spawn named no agent id waits under its tool call; the roster's entry with the same
// words is that agent, and from then on its own events find it.
const sameWords = (a: AgentRun, info: AgentInfo): boolean =>
  a.agentId === undefined && a.status === 'running' && a.description === info.description && a.type === info.type

const adopt = (a: AgentRun, info: AgentInfo): AgentRun => ({ ...a, agentId: info.id, parentId: a.parentId ?? info.parentId })

/** The list with the roster folded in; the same array when nothing moved. */
export function reconcile(list: AgentRun[], roster: AgentInfo[], at: number): AgentRun[] {
  let next = list
  for (const info of roster) {
    const known = next.find(a => a.agentId === info.id || a.id === info.id)
    const waiting = known ? undefined : next.find(a => sameWords(a, info))
    if (waiting) next = next.map(a => (a === waiting ? adopt(a, info) : a))
    else if (!known && !isEnded(info)) next = [...next, arrival(info, next, at)].slice(-MAX_RUNS)
    else if (known?.status === 'running' && isEnded(info)) next = next.map(a => (a === known ? settled(a, info, at) : a))
  }
  return next
}
