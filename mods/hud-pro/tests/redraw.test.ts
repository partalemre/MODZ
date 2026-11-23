import { expect, test } from 'claude-code/testing'

import { BAND, invalidations, start, stubSession, USAGE } from './stubs'

const MINUTE_MS = 60_000
const MINUTES = 3
// Context alone: nothing on the line counts down, so the minute clock has nothing to move.
const NO_RESETS: any = { ...USAGE, rateLimits: [] }

// The minute refresh moves hud-pro's own `beat`, which the band reads, so only the band redraws.
function countBeats(on: any): { count: number } {
  const beats = { count: 0 }
  on('state.set', { plugin: 'hud-pro', key: 'beat' }, (_: unknown, e: any, next: any) => {
    beats.count++

    return next(e)
  })

  return beats
}

test('the minute clock redraws the band alone while a reset counts down', async ($, on) => {
  const clock = stubSession(on)
  const beats = countBeats(on)
  await start($, 'terminal')
  await $.ui.mount({ ...BAND, surface: 'terminal' })
  invalidations.count = 0
  beats.count = 0
  await clock.advance(MINUTES * MINUTE_MS)

  expect([beats.count, invalidations.count]).toEqual([MINUTES, 0])
})

test('a minute that moves nothing on the line redraws nothing', async ($, on) => {
  const clock = stubSession(on, NO_RESETS)
  const beats = countBeats(on)
  await start($, 'terminal')
  await $.ui.mount({ ...BAND, surface: 'terminal' })
  invalidations.count = 0
  beats.count = 0
  await clock.advance(MINUTES * MINUTE_MS)

  expect([beats.count, invalidations.count]).toEqual([0, 0])
})

test('a measure that brings the same usage writes no state, so nothing redraws', async ($, on) => {
  stubSession(on)
  const writes: unknown[] = []
  on('state.set', { plugin: 'hud-pro', key: 'usage' }, async (_: any, e: any, next: any) => (writes.push(e.value), next(e)))
  await start($, 'terminal')
  const measure: any = { ...USAGE, changed: ['rateLimits'] }
  await $.session.measure(measure)
  const afterFirst = writes.length
  await $.session.measure(measure)

  expect(writes.length).toBe(afterFirst)
  await $.session.measure({ ...measure, rateLimits: [] })
  expect(writes.length).toBe(afterFirst + 1)
})
