import { expect, test } from 'claude-code/testing'

import { textWidth } from '../hooks/format'
import { mergeFlow } from '../hooks/flow'
import { plannedTierOf, tierOf } from '../hooks/tiers'

const round = (n: number): number => Number(n.toFixed(6))

test('a prototype key as a tier is dropped, a known one is kept', () => {
  const tasks = [{ title: 'A', tier: '__proto__' }, { title: 'B', tier: 'constructor' }, { title: 'C', tier: 'savvy-Heavy' }]
  expect(mergeFlow(null, { tasks }).tasks.map(t => t.tier)).toEqual(['', '', 'heavy'])
  expect(plannedTierOf('__proto__')).toBe('other')
  expect(tierOf({ type: 'savvy-constructor', effort: 'constructor' })).toBe('other')
})

test('a progress call cannot ask for more than 200 tasks, 20 waits or a 120-character title', () => {
  const tasks = Array.from({ length: 500 }, (_, i) => ({ title: `T${i}`, tier: 'light', after: Array.from({ length: 50 }, (_, n) => n + 1) }))
  const f = mergeFlow(null, { title: 'x'.repeat(500), tasks, total: 1e7 })
  expect(f.tasks.length).toBe(200)
  expect(f.tasks[0]?.after.length).toBe(20)
  expect(f.total).toBe(200)
  expect(f.title.length).toBe(120)
  // The same long title again is the same flow: its counters carry over.
  expect(mergeFlow({ ...f, done: 3 }, { title: 'x'.repeat(500) }).done).toBe(3)
})

test('a CJK title is sized at 1em a character', () => {
  expect(textWidth('进度条', 10)).toBe(30)
  expect(round(textWidth('abc', 10))).toBe(16.8)
})
