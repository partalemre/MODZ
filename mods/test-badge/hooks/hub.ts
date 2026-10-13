import type { CheckOutcome, CiWatch, HubCard, HubTone, TestBadge } from '../types'
import { ciLine, ciTone } from './ci-text'
import { words } from './words'

// The MODZ main panel's side of this mod (DESIGN.md §9): the one-line card it collects ("41/42 geçti · lint 2 hata"),
// and its open requests, which name a pane by key.

export const HUB_PANE = 'tests'

export type HubShown = { detail: string; tone: HubTone }

function testsPart(tests: CheckOutcome): string {
  const says = words()
  if (tests.status === 'timeout') return says.testTimeout
  if (tests.status === 'error') return says.testNotStarted
  // A failing run with every counted test passed (a coverage gate, a late crash) has no honest count.
  const isCounted = tests.passed !== null && tests.total !== null && !(tests.status === 'fail' && tests.passed >= tests.total)
  if (isCounted) return says.passedOf(tests.passed, tests.total)

  return tests.status === 'pass' ? says.testsPassed : says.testsFailed
}

function lintPart(lint: CheckOutcome): string {
  const says = words()
  if (lint.status === 'pass') return ''
  if (lint.status === 'timeout') return says.lintTimeout
  if (lint.status === 'error') return says.lintNotStarted

  return lint.errors !== null && lint.errors > 0 ? says.lintErrors(lint.errors) : says.lintFailed
}

// Red for a failing check; Amber for a check that could not say (timed out, never started).
function toneOf(badge: TestBadge): HubTone {
  const outcomes = [badge.tests, badge.lint].filter((one): one is CheckOutcome => one !== null)
  if (outcomes.some(one => one.status === 'fail')) return 'bad'

  return outcomes.some(one => one.status !== 'pass') ? 'warn' : 'ok'
}

export function hubOf(badge: TestBadge): HubShown {
  if (badge.isRunning) return { detail: words().running, tone: 'live' }
  if (badge.finishedAt === null) return { detail: '', tone: 'idle' }
  const parts = [badge.tests === null ? '' : testsPart(badge.tests), badge.lint === null ? '' : lintPart(badge.lint)]
  const detail = parts.filter(part => part !== '').join(' · ')

  return { detail: detail === '' ? words().lintClean : detail, tone: toneOf(badge) }
}

// The card holds ≤40 characters: the local checks and CI side by side when both fit, else CI alone,
// the newer news; the tone is the worse of the two.
const DETAIL_MAX = 40
const SEP = ' · '
const TONE_RANK: Record<HubTone, number> = { idle: 0, ok: 1, live: 2, warn: 3, bad: 4 }

export function hubWith(badge: TestBadge, ci: CiWatch | null): HubShown {
  const local = hubOf(badge)
  const line = ci === null ? '' : ciLine(ci)
  if (ci === null || line === '') return local
  const both = local.detail === '' ? line : `${local.detail}${SEP}${line}`
  const tone = TONE_RANK[ciTone(ci)] > TONE_RANK[local.tone] ? ciTone(ci) : local.tone

  return { detail: both.length <= DETAIL_MAX ? both : line, tone }
}

// The card to write, or null while the standing one already shows the same: it is written only on a change.
export function hubCardOf(spec: { badge: TestBadge; ci: CiWatch | null; standing: HubCard | undefined; at: number }): HubCard | null {
  const shown = hubWith(spec.badge, spec.ci)
  const { standing } = spec
  if (standing !== undefined && standing.detail === shown.detail && standing.tone === shown.tone) return null

  return { pane: HUB_PANE, ...shown, at: spec.at }
}

export function isOpenFor(value: unknown, pane: string): boolean {
  return typeof value === 'object' && value !== null && (value as { pane?: unknown }).pane === pane
}
