import type { AgentRun, ToolEvent } from '../types'
import { kindOf } from './history'
import type { Kind } from './history'
import { t } from './i18n'
import { roughSpan } from './insight'

// "What is it doing": the open card's first answer, worked out from the latest call alone. A call
// still open is what it does now; one already closed while the agent runs means it is thinking.

const SECOND = 1000
const PATH = /^[~.]?\//

export type NowState = 'call' | 'thinking' | 'starting' | 'done' | 'failed'

export type NowView = {
  state: NowState
  /** The latest call's kind, which colours the card; `other` when there is none. */
  kind: Kind
  /** "Komut çalıştırıyor", "Düşünüyor", "Son adım". */
  verb: string
  tool: string
  target: string
  /** The target is a path: a narrow card cuts it from the start, so the file's name stays. */
  isPath: boolean
  /** How long the open call has run, or how long ago the latest one began. */
  span: string
}

/** "şimdi" under a second, else "12 sn önce". */
export const agoOf = (ms: number): string => (ms < SECOND ? t().now : t().ago(roughSpan(ms)))

const stateOf = (a: AgentRun, last: ToolEvent | undefined): NowState => {
  if (a.status !== 'running') return a.status
  if (!last) return 'starting'
  return last.endAt === undefined ? 'call' : 'thinking'
}

// An ended run's eyebrow says how it ended; a run the person stopped says so, not that it failed.
const verbOf = (a: AgentRun, state: NowState, kind: Kind): string => {
  const s = t()
  if (state === 'call') return s.doing[kind]
  if (state === 'thinking') return s.thinking
  if (state === 'starting') return s.starting
  if (state === 'done') return s.completed
  return a.endReason === 'aborted' ? s.aborted : s.failedNow
}

export function nowOf(a: AgentRun, at: number): NowView {
  const last = a.history?.at(-1)
  const state = stateOf(a, last)
  const kind = last ? kindOf(last.tool) : 'other'
  // The full aim was kept for the latest call only; older history keeps its short target.
  const isLatest = last !== undefined && last.tool === a.lastTool
  const target = (isLatest ? a.lastDetail : undefined) ?? last?.target ?? ''
  const verb = verbOf(a, state, kind)
  if (!last) return { state, kind, verb, tool: '', target: '', isPath: false, span: '' }
  const span = state === 'call' ? roughSpan(at - last.at) : agoOf(at - last.at)
  return { state, kind, verb, tool: last.tool, target, isPath: PATH.test(target), span }
}
