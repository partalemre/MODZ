import { expect, test } from 'claude-code/testing'

import { countCall, NUDGE_CALLS, resetNudge } from '../hooks/nudge'

test('a long run of main-loop calls with no plan move is nudged once per run; a move starts the count again', () => {
  resetNudge()
  const crossed = Array.from({ length: NUDGE_CALLS * 2 + 1 }, () => countCall(true, true)).filter(Boolean)
  expect(crossed.length).toBe(2)
  resetNudge()
  expect(Array.from({ length: NUDGE_CALLS }, () => countCall(true, true)).at(-1)).toBe(true)
})

test('helpers, and a session with no open plan, never count', () => {
  resetNudge()
  expect(Array.from({ length: NUDGE_CALLS * 2 }, () => countCall(false, true) || countCall(true, false)).some(Boolean)).toBe(false)
})
