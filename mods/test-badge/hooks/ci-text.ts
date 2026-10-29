import { countsOf } from './ci-state'
import type { Role } from './tidemark'
import { words } from './words'
import type { CiCard, CiCheck, CiPhase, CiWatch, HubTone } from '../types'

// What the CI watch says, as words and roles: the one line the hub and the pane share, the band card's
// headline, the notification and the prompt "Ask Claude to fix" sends. Drawing is elsewhere.

// The card names this many failing checks, then "+N".
const NAMED = 2
const TONE: Record<CiPhase, HubTone> = { watching: 'live', passed: 'ok', failed: 'bad', merged: 'ok', closed: 'idle', ended: 'warn', none: 'idle' }
export const CHECK_ROLE: Record<CiCheck['state'], Role | 'lo'> = { pending: 'kiln', pass: 'moss', fail: 'flare', skipped: 'lo' }

// "CI 3/4 · 1 failing", "CI 2/4 · 2 running", "CI 4/4 passed", "PR #12 merged"; empty when there is no CI to tell.
export function ciLine(watch: CiWatch): string {
  const says = words().ci
  if (watch.phase === 'merged') return says.merged(watch.number)
  if (watch.phase === 'closed') return says.closed(watch.number)
  if (watch.phase === 'none') return ''
  const { passed, failing, pending, total } = countsOf(watch.checks)
  if (total === 0) return watch.phase === 'watching' ? says.waiting : ''
  if (failing > 0) return says.failing(passed, total, failing)
  if (watch.phase === 'ended') return says.ended(passed, total)

  return pending > 0 ? says.running(passed, total, pending) : says.allPassed(passed, total)
}

export const ciTone = (watch: CiWatch): HubTone => TONE[watch.phase]

export function namesOf(failing: CiCheck[]): string {
  const named = failing.slice(0, NAMED).map(check => check.name).join(', ')
  const rest = failing.length - NAMED

  return rest > 0 ? `${named} ${words().ci.more(rest)}` : named
}

export const cardHeadline = (card: CiCard): string => words().ci.cardHeadline(namesOf(card.failing))

export function notifyText(watch: CiWatch, heard: 'pass' | 'fail'): string {
  const says = words().ci
  if (heard === 'fail') return says.notifyFailed(watch.number, namesOf(watch.checks.filter(check => check.state === 'fail')))
  const { passed, total } = countsOf(watch.checks)

  return says.notifyPassed(watch.number, passed, total)
}

// What "Ask Claude to fix" sends: the PR, and each failing check with its link where gh gave one.
export function fixPrompt(card: CiCard): string {
  const lines = card.failing.map(check => (check.link === null ? `- ${check.name}` : `- ${check.name}: ${check.link}`)).join('\n')

  return words().ci.fixPrompt(card.number, card.url, lines)
}
