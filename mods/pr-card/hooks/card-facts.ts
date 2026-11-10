import { words } from './words'
import type { Checks, Merge, PrEntry, PrState, PrView, Review, SharedCi } from '../types'

// What a card says, in words and a status tone, for the desktop drawing and the terminal's text alike.

export type Tone = 'ok' | 'warn' | 'danger' | 'run' | 'read' | 'mid' | 'lo'
export type Fact = { label: string; value: string; tone: Tone }
const MINUTE_MS = 60_000

const REVIEW_TONE: Record<Review, Tone> = { approved: 'ok', changes: 'danger', required: 'warn', none: 'lo' }
const MERGE_TONE: Record<Merge, Tone> = { ready: 'ok', conflict: 'danger', blocked: 'warn', behind: 'warn', draft: 'lo', unknown: 'lo' }

export function stateOf(view: PrView | null): { text: string; tone: Tone } {
  const said = words()
  if (view === null) return { text: said.state.open, tone: 'lo' }
  if (view.state === 'merged') return { text: said.state.merged, tone: 'run' }
  if (view.state === 'closed') return { text: said.state.closed, tone: 'danger' }

  return view.isDraft ? { text: said.draft, tone: 'lo' } : { text: said.state.open, tone: 'ok' }
}

function checksFact(checks: Checks): Fact {
  const said = words()
  const counted = checks.passed + checks.failed + checks.pending
  const label = said.checksLabel
  if (checks.failed > 0) return { label, value: said.failed(checks.failed), tone: 'danger' }
  if (checks.pending > 0) return { label, value: said.running(checks.pending), tone: 'read' }
  if (counted === 0) return { label, value: said.noChecks, tone: 'lo' }

  return { label, value: said.passed(checks.passed, counted), tone: 'ok' }
}

export function factsOf(view: PrView): Fact[] {
  const said = words()
  // A PR that left the open state has no mergeability left to tell; its state says what happened.
  const merge: Fact = view.state === 'open'
    ? { label: said.mergeLabel, value: said.merge[view.merge], tone: MERGE_TONE[view.merge] }
    : { label: said.mergeLabel, value: '—', tone: 'lo' }

  return [checksFact(view.checks), { label: said.reviewLabel, value: said.review[view.review], tone: REVIEW_TONE[view.review] }, merge]
}

// The one line a card says about its data when it is not simply fresh; null when it is.
export function noteOf(entry: PrEntry, now: number): string | null {
  const said = words()
  if (entry.problem === 'no-gh') return said.noGh
  if (entry.problem === 'failed') {
    return entry.checkedAt === null ? said.failed1 : said.stale(said.ago(Math.floor((now - entry.checkedAt) / MINUTE_MS)))
  }

  return entry.view === null ? said.loading : null
}

export const shortName = (path: string): string => path.split('/').at(-1) ?? path

// The largest changes first: the ones a reader wants to see in a row that cannot hold them all.
export const biggestFirst = (view: PrView) =>
  [...view.files].sort((a, b) => b.additions + b.deletions - (a.additions + a.deletions))

const MAX_FAILING = 5
const LEFT: Record<string, PrState> = { merged: 'merged', closed: 'closed' }

// test-badge's CI watch answered later than pr-card's one read: its checks, and a PR it saw leave, are the newer.
export function withCi(entry: PrEntry, ci: SharedCi | null): PrEntry {
  const view = entry.view
  const isNewer = ci !== null && ci.url === entry.url && ci.checkedAt !== null && (entry.checkedAt === null || ci.checkedAt > entry.checkedAt)
  if (view === null || !isNewer) return entry
  const count = (state: SharedCi['checks'][number]['state']) => ci.checks.filter(check => check.state === state).length
  const failing = ci.checks.filter(check => check.state === 'fail').map(check => check.name).slice(0, MAX_FAILING)
  const checks: Checks = { passed: count('pass'), failed: count('fail'), pending: count('pending'), skipped: count('skipped'), failing }

  return { ...entry, view: { ...view, checks, state: LEFT[ci.phase] ?? view.state } }
}
