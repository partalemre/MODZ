import { ago, failuresOf } from './parse'
import type { Role } from './tidemark'
import type { CheckOutcome, Failure, Suite, SuiteFilter, TestBadge } from '../types'
import { words } from './words'

// What the band and the pane say about a run, as words and roles; drawing is elsewhere.

export type Tone = Role | 'neutral'
export type BadgePill = { tone: Tone; glyph?: 'check' | 'x' | 'pulse'; label: string }
export type Headline = { lead: string; tone: Tone; rest: string }
export type Chip = { filter: SuiteFilter; label: string; count: number }

const SECOND = 1000
const SUITE_ORDER: Suite[] = ['unit', 'e2e', 'typecheck', 'lint']
const CHIPS: SuiteFilter[] = ['all', 'unit', 'e2e', 'lint', 'typecheck']
export const suiteTag = (suite: Suite): string => words().suites[suite]

// How many tests failed, when the runner counted them. A failing run with none counted as failed
// (a coverage gate, a crash after the last test) has no count to show: it reads "kaldı" alone.
function failedOf(outcome: CheckOutcome): number | null {
  if (outcome.passed === null || outcome.total === null) return null
  const failed = outcome.total - outcome.passed

  return outcome.status === 'fail' && failed <= 0 ? null : failed
}

function testsPill(outcome: CheckOutcome): BadgePill {
  const says = words()
  if (outcome.status === 'timeout') return { tone: 'amber', glyph: 'x', label: says.testTimeout }
  if (outcome.status === 'error') return { tone: 'amber', glyph: 'x', label: says.testNotStarted }
  const failed = failedOf(outcome)
  if (outcome.status === 'pass') return { tone: 'moss', glyph: 'check', label: failed === null ? says.testPassed : says.passedOf(outcome.passed, outcome.total) }

  return { tone: 'flare', glyph: 'x', label: failed === null ? says.testFailed : says.failedOf(failed, outcome.total) }
}

function lintPill(outcome: CheckOutcome): BadgePill {
  const says = words()
  if (outcome.status === 'timeout') return { tone: 'amber', label: says.lintTimeout }
  if (outcome.status === 'error') return { tone: 'amber', label: says.lintNotStarted }
  if (outcome.status === 'pass') return { tone: 'neutral', label: says.lintClean }

  return { tone: 'amber', label: outcome.errors !== null && outcome.errors > 0 ? says.lintErrors(outcome.errors) : says.lintFailed }
}

// The band: one pill per check, then how long ago, in text.lo; while running, one Iris pill.
export function bandParts(badge: TestBadge, now: number): { pills: BadgePill[]; meta: string } {
  if (badge.isRunning) return { pills: [{ tone: 'iris', glyph: 'pulse', label: words().testRunning }], meta: '' }
  const pills: BadgePill[] = []
  if (badge.tests !== null) pills.push(testsPill(badge.tests))
  if (badge.lint !== null) pills.push(lintPill(badge.lint))

  return { pills, meta: badge.finishedAt === null ? '' : ago(now - badge.finishedAt) }
}

function lintLead(lint: CheckOutcome | null): Headline | null {
  const says = words()
  if (lint === null || lint.status === 'pass') return null
  if (lint.status === 'timeout') return { lead: says.leadLintTimeout, tone: 'amber', rest: '' }
  if (lint.status === 'error') return { lead: says.leadLintNotStarted, tone: 'amber', rest: '' }

  return { lead: lint.errors !== null && lint.errors > 0 ? says.leadLintErrors(lint.errors) : says.leadLintFailed, tone: 'amber', rest: '' }
}

function passedRest(tests: CheckOutcome | null): string {
  if (tests === null) return ''

  return tests.total === null ? words().restTestsPassed : words().restTotalPassed(tests.total)
}

// "3 başarısız · 39 geçti": the lead carries the outcome's color, the rest stays text.hi.
export function headlineOf(badge: TestBadge): Headline {
  const { tests, lint } = badge
  const says = words()
  if (badge.isRunning) return { lead: says.leadRunning, tone: 'iris', rest: '' }
  if (badge.finishedAt === null) return { lead: says.leadNotRun, tone: 'neutral', rest: '' }
  if (tests !== null && tests.status === 'timeout') return { lead: says.leadTimeout, tone: 'amber', rest: '' }
  if (tests !== null && tests.status === 'error') return { lead: says.leadNotStarted, tone: 'amber', rest: '' }
  if (tests !== null && tests.status === 'fail') {
    const failed = failedOf(tests)

    const rest = tests.passed === null ? '' : says.restPassed(tests.passed)

    return failed === null ? { lead: says.leadTestsFailed, tone: 'flare', rest } : { lead: says.leadFailed(failed), tone: 'flare', rest }
  }
  const linted = lintLead(lint)
  if (linted !== null) return { ...linted, rest: passedRest(tests) }

  return { lead: says.leadAllPassed, tone: 'moss', rest: `${passedRest(tests)}${lint === null ? '' : says.restLintClean}` }
}

// The eyebrow wears the headline's role: Flare only when tests failed, Amber for lint or a run that
// did not finish, Moss when all passed.
export function eyebrowRole(badge: TestBadge): Role {
  const tone = headlineOf(badge).tone

  return tone === 'neutral' ? 'tide' : tone
}

export function runMeta(badge: TestBadge, now: number): string {
  if (badge.isRunning || badge.finishedAt === null) return ''

  return `${ago(now - badge.finishedAt)} · ${words().took(Math.max(1, Math.round(badge.durationMs / SECOND)))}`
}

// The filter chips worth a press: "Hepsi", every suite that has failures, and the one in use.
export function chipsOf(badge: TestBadge, current: SuiteFilter = 'all'): Chip[] {
  const all = failuresOf(badge)
  const counted = CHIPS.map(filter => ({ filter, label: words().chips[filter], count: filter === 'all' ? all.length : all.filter(item => item.suite === filter).length }))

  return counted.filter(chip => chip.filter === 'all' || chip.filter === current || chip.count > 0)
}

// The failures the filter keeps, grouped by file: test suites first, files in order of appearance.
export function groupsOf(badge: TestBadge, filter: SuiteFilter): { file: string | null; failures: Failure[] }[] {
  const kept = failuresOf(badge).filter(item => filter === 'all' || item.suite === filter)
  const sorted = [...kept].sort((a, b) => SUITE_ORDER.indexOf(a.suite) - SUITE_ORDER.indexOf(b.suite))
  const files = [...new Set(sorted.map(item => item.file))]

  return files.map(file => ({ file, failures: sorted.filter(item => item.file === file) }))
}

export function durationText(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return ''

  if (ms < 1) return '<1 ms'

  return ms < SECOND ? `${Math.round(ms)} ms` : words().seconds(ms, SECOND)
}

// The failure's place as the row's highlight span shows it: the file's name and line.
export function spanOf(failure: Failure): string {
  const name = (failure.file ?? '').split('/').pop() ?? ''
  if (name === '') return failure.line === null ? '—' : `:${failure.line}`

  return failure.line === null ? name : `${name}:${failure.line}`
}
