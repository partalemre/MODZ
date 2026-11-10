import { expect, test } from 'claude-code/testing'

import { rowPic } from '../hooks/svg-rows'
import { words } from '../hooks/words'
import type { Project } from '../types'

// An old judgment must not read like a new one, and pressing for many must say what it costs.
const NOW = Date.parse('2026-11-10T12:00:00Z')
const DAY_MS = 86_400_000

const projectOf = (estimatedAt: number): Project => ({
  root: '/w/app', name: 'app', isGit: true, isLive: false, lastAt: new Date(NOW - DAY_MS).toISOString(), sessions: 1,
  tokens: { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 }, byModel: {}, week: 0, git: null, plans: [],
  percent: { kind: 'estimate', value: 62, at: estimatedAt, isStale: false, basis: '' }, estimate: null,
  leftOff: null, kinds: [], runs: [],
}) as Project

const percentClass = (source: string): string => /class="([^"]*)"[^>]*>~62%</.exec(source)?.[1] ?? ''

test('an estimate weeks old is faded and says its age; a fresh one is not', () => {
  const old = rowPic(projectOf(NOW - 30 * DAY_MS), { width: 414, nowMs: NOW })
  const fresh = rowPic(projectOf(NOW - 3_600_000), { width: 414, nowMs: NOW })

  expect(percentClass(old.source)).toContain('f-lo')
  expect(percentClass(fresh.source)).toContain('f-hi')
  expect(old.alt).toContain('30')
})

test('Estimate all says how many model calls it makes before it starts', () => {
  expect(words().estimateAll(4)).toContain('4 model calls')
})
