import { CI_BACKOFF_AFTER_POLLS, CI_GRACE_POLLS, CI_MAX_WATCH_MS, CI_NO_CHECKS_POLLS, CI_POLL_MS, CI_SLOW_POLL_MS } from './limits'
import type { PrInfo, PrPoll } from './ci-parse'
import type { CiCheck, CiPhase, CiWatch } from '../types'

// The CI watch as a pure state machine: one poll's answers in, the next watch out, with whether to stop and
// whether a finish was heard (seen pending, then done), the only finish that earns a card or a notification.

export type Poll = { checks: CiCheck[] | null; pr: PrPoll | null; now: number }
export type Step = { watch: CiWatch; isDone: boolean; heard: 'pass' | 'fail' | null }
export type CiCounts = { passed: number; failing: number; pending: number; total: number }

export function newWatch(pr: PrInfo, spec: { now: number; isFreshRun: boolean }): CiWatch {
  return {
    number: pr.number, url: pr.url, title: pr.title, checks: [], phase: 'watching', talkAtStart: 0, talk: 0,
    startedAt: spec.now, checkedAt: null, polls: 0, isFreshRun: spec.isFreshRun, hasSeenPending: false,
  }
}

// Skipped checks are left out of the total: "CI 3/3" when a fourth was skipped.
export function countsOf(checks: CiCheck[]): CiCounts {
  const count = (state: CiCheck['state']) => checks.filter(check => check.state === state).length
  const passed = count('pass')
  const failing = count('fail')
  const pending = count('pending')

  return { passed, failing, pending, total: passed + failing + pending }
}

export const intervalOf = (polls: number): number => (polls < CI_BACKOFF_AFTER_POLLS ? CI_POLL_MS : CI_SLOW_POLL_MS)
export const isBackoffPoll = (polls: number): boolean => polls === CI_BACKOFF_AFTER_POLLS

const done = (watch: CiWatch, phase: CiPhase, heard: Step['heard'] = null): Step => ({ watch: { ...watch, phase }, isDone: true, heard })

function finished(watch: CiWatch): Step | null {
  const counts = countsOf(watch.checks)
  if (watch.checks.length === 0 || counts.pending > 0) return null
  const canFinish = watch.hasSeenPending || !watch.isFreshRun || watch.polls >= CI_GRACE_POLLS
  if (!canFinish) return null
  const outcome = counts.failing > 0 ? 'fail' : 'pass'

  return done(watch, outcome === 'fail' ? 'failed' : 'passed', watch.hasSeenPending ? outcome : null)
}

export function stepOf(watch: CiWatch, poll: Poll): Step {
  const checks = poll.checks ?? watch.checks
  const isFirst = watch.checkedAt === null
  const talk = poll.pr?.talk ?? watch.talk
  const next: CiWatch = {
    ...watch, checks, polls: watch.polls + 1, checkedAt: poll.now, talk,
    talkAtStart: isFirst ? talk : watch.talkAtStart,
    title: poll.pr !== null && poll.pr.title !== '' ? poll.pr.title : watch.title,
    hasSeenPending: watch.hasSeenPending || checks.some(check => check.state === 'pending'),
  }
  if (poll.pr?.state === 'merged' || poll.pr?.state === 'closed') return done(next, poll.pr.state)
  const finish = finished(next)
  if (finish !== null) return finish
  if (checks.length === 0 && next.polls >= CI_NO_CHECKS_POLLS) return done(next, 'none')
  if (poll.now - watch.startedAt >= CI_MAX_WATCH_MS) return done(next, 'ended')

  return { watch: { ...next, phase: 'watching' }, isDone: false, heard: null }
}

// Reviews and comments that came in after the watch began.
export const newTalkOf = (watch: CiWatch): number => Math.max(0, watch.talk - watch.talkAtStart)
