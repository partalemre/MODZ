import { expect, test } from 'claude-code/testing'

import { BAND, invalidations, start, stubSession, USAGE } from './stubs'

const MINUTE_MS = 60_000
const MINUTES = 3
// Context alone: nothing on the line counts down, so the minute clock has nothing to move.
const NO_RESETS: any = { ...USAGE, rateLimits: [] }

test('the minute clock redraws while a reset counts down', async ($, on) => {
  const clock = stubSession(on)
  await start($, 'terminal')
  await $.ui.mount({ ...BAND, surface: 'terminal' })
  invalidations.count = 0
  await clock.advance(MINUTES * MINUTE_MS)

  expect(invalidations.count).toBe(MINUTES)
})

test('a minute that moves nothing on the line redraws nothing', async ($, on) => {
  const clock = stubSession(on, NO_RESETS)
  await start($, 'terminal')
  await $.ui.mount({ ...BAND, surface: 'terminal' })
  invalidations.count = 0
  await clock.advance(MINUTES * MINUTE_MS)

  expect(invalidations.count).toBe(0)
})
