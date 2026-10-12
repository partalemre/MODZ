import type { CheckOutcome, Failure, TestBadge } from '../types'
import { testFailures } from './failures'
import { lintFailures } from './lint'
import { clean } from './text'
import type { ParseContext } from './text'
import { words } from './words'

type Counts = { passed: number; failed: number }
type Extract = (text: string) => Counts | null

const TAIL_LINES = 6
const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE

const num = (text: string, re: RegExp): number => Number(re.exec(text)?.[1] ?? 0)

const cargo: Extract = text => {
  const lines = [...text.matchAll(/test result: \w+\. (\d+) passed; (\d+) failed/g)]
  if (lines.length === 0) return null

  return lines.reduce((sum, m) => ({ passed: sum.passed + Number(m[1]), failed: sum.failed + Number(m[2]) }), { passed: 0, failed: 0 })
}

// jest "Tests: 1 failed, 41 passed, 42 total", vitest "Tests  1 failed | 41 passed (42)"
const jestLike: Extract = text => {
  const line = text.split('\n').reverse().find(row => /^\s*Tests:?\s/.test(row) && /\d+ (passed|failed)/.test(row))

  return line === undefined ? null : { passed: num(line, /(\d+) passed/), failed: num(line, /(\d+) failed/) }
}

// pytest "41 passed, 1 failed in 0.12s", with or without the === frame
const pytest: Extract = text => {
  const line = text.split('\n').reverse().find(row => /\d+ (passed|failed)/.test(row) && /\bin \d+(\.\d+)?s\b/.test(row))

  return line === undefined ? null : { passed: num(line, /(\d+) passed/), failed: num(line, /(\d+) failed/) + num(line, /(\d+) errors?/) }
}

const mocha: Extract = text => (/\d+ passing/.test(text) ? { passed: num(text, /(\d+) passing/), failed: num(text, /(\d+) failing/) } : null)

// node:test "# pass 42" / "ℹ pass 42", bun "42 pass" on its own line
const tap: Extract = text => {
  const pass = /^(?:#|ℹ)\s*pass (\d+)$|^\s*(\d+) pass$/m.exec(text)
  if (pass === null) return null
  const fail = /^(?:#|ℹ)\s*fail (\d+)$|^\s*(\d+) fail$/m.exec(text)

  return { passed: Number(pass[1] ?? pass[2]), failed: Number(fail?.[1] ?? fail?.[2] ?? 0) }
}

const phpunit: Extract = text => {
  const ok = /OK \((\d+) tests?/.exec(text)
  if (ok !== null) return { passed: Number(ok[1]), failed: 0 }
  const line = /Tests: (\d+),.*$/m.exec(text)
  if (line === null) return null
  const failed = num(line[0], /Failures: (\d+)/) + num(line[0], /Errors: (\d+)/)

  return { passed: Number(line[1]) - failed, failed }
}

// go test counts packages: "ok  pkg 0.1s" and "FAIL\tpkg\t0.1s"
const goPackages: Extract = text => {
  const passed = (text.match(/^ok\s+\S+/gm) ?? []).length
  const failed = (text.match(/^FAIL\s+\S+/gm) ?? []).length

  return passed + failed === 0 ? null : { passed, failed }
}

// flutter test / dart test: the last "00:03 +41 -1:" progress line holds the totals.
const dart: Extract = text => {
  const line = [...text.matchAll(/^\d+:\d+ \+(\d+)(?: ~\d+)?(?: -(\d+))?:/gm)].at(-1)

  return line === undefined ? null : { passed: Number(line[1]), failed: Number(line[2] ?? 0) }
}

const EXTRACTORS = [cargo, jestLike, pytest, dart, mocha, tap, phpunit, goPackages]

// The last lines worth reading, for a failure no parser could place.
function tailOf(text: string, isFailing: boolean, failures: Failure[]): string[] {
  if (!isFailing || failures.length > 0) return []

  return text.split('\n').map(line => line.trimEnd()).filter(line => line.trim() !== '').slice(-TAIL_LINES)
}

export function parseTests(output: string, exitCode: number, ctx: ParseContext): CheckOutcome {
  const text = clean(output)
  const counts = EXTRACTORS.reduce<Counts | null>((found, extract) => found ?? extract(text), null)
  const status = exitCode === 0 ? 'pass' : 'fail'
  const failures = status === 'fail' ? testFailures(text, ctx) : []
  const tail = tailOf(text, status === 'fail', failures)
  if (counts === null) return { status, passed: null, total: null, errors: null, failures, tail }

  return { status, passed: counts.passed, total: counts.passed + counts.failed, errors: null, failures, tail }
}

// No count printed: a clean exit means none, a failing one leaves the count unknown.
function countOf(match: RegExpExecArray | null, exitCode: number): number | null {
  if (match !== null) return Number(match[1])

  return exitCode === 0 ? 0 : null
}

// eslint "✖ 3 problems (2 errors, 1 warning)", tsc "Found 2 errors", phpstan "[ERROR] Found 2 errors"
export function parseLint(output: string, exitCode: number, ctx: ParseContext): CheckOutcome {
  const text = clean(output)
  const failures = lintFailures(text, ctx)
  const match = /\((\d+) errors?/.exec(text) ?? /Found (\d+) errors?/.exec(text) ?? /^(\d+) errors?\b/m.exec(text)
  const counted = countOf(match, exitCode)
  const errors = failures.length > 0 ? Math.max(failures.length, counted ?? 0) : counted
  const status = exitCode === 0 && (errors ?? 0) === 0 ? 'pass' : 'fail'

  return { status, passed: null, total: null, errors, failures, tail: tailOf(text, status === 'fail', failures) }
}

export function ago(ms: number): string {
  const { ago: says } = words()
  if (ms < MINUTE) return says.s(Math.max(0, Math.round(ms / SECOND)))
  if (ms < HOUR) return says.m(Math.round(ms / MINUTE))

  return says.h(Math.round(ms / HOUR))
}

function testsText(outcome: CheckOutcome): string {
  const says = words()
  if (outcome.status === 'timeout') return says.testsTimeout
  if (outcome.status === 'error') return says.testsNotStarted
  if (outcome.total !== null) return says.testsCount(outcome.passed, outcome.total)

  return outcome.status === 'pass' ? says.testsPassed : says.testsFailed
}

function lintText(outcome: CheckOutcome): string {
  const says = words()
  if (outcome.status === 'timeout') return says.lintTimeout
  if (outcome.status === 'error') return says.lintNotStarted
  if (outcome.status === 'pass') return says.lintClean

  return outcome.errors !== null && outcome.errors > 0 ? says.lintErrors(outcome.errors) : says.lintFailed
}

export function badgeText(badge: TestBadge, now: number): string | undefined {
  const parts: string[] = []
  if (badge.tests !== null) parts.push(testsText(badge.tests))
  if (badge.lint !== null) parts.push(lintText(badge.lint))
  if (badge.isRunning) return parts.length === 0 ? words().testsRunning : `${parts.join(' · ')} · ${words().runningTail}`
  if (parts.length === 0 || badge.finishedAt === null) return undefined

  return `${parts.join(' · ')} · ${ago(now - badge.finishedAt)}`
}

export function isFailing(badge: TestBadge): boolean {
  return [badge.tests, badge.lint].some(outcome => outcome !== null && outcome.status !== 'pass')
}

export function failuresOf(badge: TestBadge): Failure[] {
  return [...(badge.tests?.failures ?? []), ...(badge.lint?.failures ?? [])]
}
