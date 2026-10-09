import type { AgentRun } from '../types'
import { t } from './i18n'
import { lookOf } from './identity'

// What the panel works out on its own, from what it already holds: who went quiet, whose one tool
// call has run long, who failed a moment ago. No model is asked.

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
// A running agent with no tool open and nothing heard for this long has gone quiet.
export const QUIET_MS = 2 * MINUTE
// One tool call open this long is worth a look, even if long builds are sometimes fine.
export const LONG_TOOL_MS = 15 * MINUTE
// A failure stays on the attention line this long after it happened.
const FAILURE_FRESH_MS = 10 * MINUTE

export type Stuck = { reason: string; since: number }

export type Attention = { agentId: string; name: string; title: string; reason: string; role: 'warn' | 'danger' }

/** "40 sn", "3 dk", "2 sa": a span read at a glance, rounded down. */
export const roughSpan = (ms: number): string => {
  const s = t()
  if (ms < MINUTE) return s.seconds(Math.floor(ms / SECOND))
  if (ms < HOUR) return s.minutes(Math.floor(ms / MINUTE))
  return s.hours(Math.floor(ms / HOUR))
}

/** Why a running agent looks stuck, or null while it looks fine: its oldest open call ran long, or it went quiet. */
export function stuckOf(a: AgentRun, at: number): Stuck | null {
  if (a.status !== 'running') return null
  const open = (a.history ?? []).find(e => e.endAt === undefined)
  if (open) return at - open.at >= LONG_TOOL_MS ? { reason: t().longTool(open.tool, roughSpan(at - open.at)), since: open.at } : null
  const heard = Math.max(a.heardAt ?? 0, a.startedAt)
  return at - heard >= QUIET_MS ? { reason: t().quiet(roughSpan(at - heard)), since: heard } : null
}

const attention = (a: AgentRun, reason: string, role: Attention['role']): Attention => ({
  agentId: a.id,
  name: lookOf(a).name,
  title: a.description || a.type,
  reason,
  role,
})

// A run that failed on its own (not one the person stopped) in the last few minutes.
const isFreshFailure = (a: AgentRun, at: number): boolean =>
  a.status === 'failed' && a.endReason !== 'aborted' && a.endedAt !== undefined && at - a.endedAt < FAILURE_FRESH_MS

/** The one agent that most needs a look: the longest stuck first, then the latest fresh failure. */
export function attentionOf(list: AgentRun[], at: number): Attention | null {
  const stuck = list
    .map(a => ({ a, why: stuckOf(a, at) }))
    .filter((x): x is { a: AgentRun; why: Stuck } => x.why !== null)
    .sort((x, y) => x.why.since - y.why.since)[0]
  if (stuck) return attention(stuck.a, stuck.why.reason, 'warn')
  const failed = list.filter(a => isFreshFailure(a, at)).sort((x, y) => (y.endedAt ?? 0) - (x.endedAt ?? 0))[0]
  return failed ? attention(failed, t().failedNow, 'danger') : null
}
