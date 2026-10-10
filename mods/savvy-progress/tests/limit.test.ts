import { expect, test } from 'claude-code/testing'

import { readingOf, shareNumber, shareOf, trackLimit } from '../hooks/limit'

const at = (percent: number, usd: number, resetsAt = 'r1') => ({ percent, usd, resetsAt })

test('no share until the window moved half a point on real spend', () => {
  const track = trackLimit(trackLimit(null, at(20, 0)), at(20.3, 0.4))
  expect(shareOf(0.2, track)).toBe(null)
})

test('an agent gets the session rate times its own dollars', () => {
  const track = trackLimit(trackLimit(null, at(20, 0)), at(23.5, 1))
  expect(shareOf(0.56, track)?.toFixed(2)).toBe('1.96')
})

test('a reset window starts a new base and keeps the rate it learned', () => {
  let track = trackLimit(null, at(20, 0))
  track = trackLimit(track, at(24, 2))
  track = trackLimit(track, at(1, 2.1, 'r2'))
  expect(track.basePercent).toBe(1)
  expect(shareOf(1, track)?.toFixed(2)).toBe('2.00')
})

test('only the five_hour window with a dollar figure makes a reading', () => {
  expect(readingOf([{ kind: 'seven_day', percentUsed: 9 }], 1)).toBe(null)
  expect(readingOf([{ kind: 'five_hour', percentUsed: 9 }], undefined)).toBe(null)
  expect(readingOf([{ kind: 'five_hour', percentUsed: 9, resetsAt: 'r' }], 1)).toEqual({ percent: 9, usd: 1, resetsAt: 'r' })
})

test('shares read as <0.1, one decimal under 10, whole points above', () => {
  expect(shareNumber(0.04)).toBe('<0,1')
  expect(shareNumber(3.44)).toBe('3,4')
  expect(shareNumber(12.6)).toBe('13')
})
