import type { CheckOutcome, HubTone, TestBadge } from '../types'

// The MODZ main panel's side of this mod (DESIGN.md §9): the one-line card it collects ("41/42 geçti · lint 2"),
// and its open requests, which name a pane by key.

export const HUB_PANE = 'tests'

export type HubShown = { detail: string; tone: HubTone }

function testsPart(tests: CheckOutcome): string {
  if (tests.status === 'timeout') return 'test zaman aşımı'
  if (tests.status === 'error') return 'test başlamadı'
  if (tests.passed !== null && tests.total !== null) return `${tests.passed}/${tests.total} geçti`

  return tests.status === 'pass' ? 'testler geçti' : 'testler kaldı'
}

function lintPart(lint: CheckOutcome): string {
  if (lint.status === 'pass') return ''
  if (lint.status === 'timeout') return 'lint zaman aşımı'
  if (lint.status === 'error') return 'lint başlamadı'

  return lint.errors !== null && lint.errors > 0 ? `lint ${lint.errors}` : 'lint kaldı'
}

// Red for a failing check; Amber for a check that could not say (timed out, never started).
function toneOf(badge: TestBadge): HubTone {
  const outcomes = [badge.tests, badge.lint].filter((one): one is CheckOutcome => one !== null)
  if (outcomes.some(one => one.status === 'fail')) return 'bad'

  return outcomes.some(one => one.status !== 'pass') ? 'warn' : 'ok'
}

export function hubOf(badge: TestBadge): HubShown {
  if (badge.isRunning) return { detail: 'çalışıyor', tone: 'live' }
  if (badge.finishedAt === null) return { detail: '', tone: 'idle' }
  const parts = [badge.tests === null ? '' : testsPart(badge.tests), badge.lint === null ? '' : lintPart(badge.lint)]
  const detail = parts.filter(part => part !== '').join(' · ')

  return { detail: detail === '' ? 'lint temiz' : detail, tone: toneOf(badge) }
}

export function isOpenFor(value: unknown, pane: string): boolean {
  return typeof value === 'object' && value !== null && (value as { pane?: unknown }).pane === pane
}
