import { expect, test } from 'claude-code/testing'

import { FOCUS_SETTLE_MS } from '../hooks/focus'
import { BAND, PANE, setup, threeRunning } from './fixtures'

// The two desktop press races: a click that focuses the pane redraws it under the click, and a desktop
// that reattaches keeps a tree whose buttons the engine already released.

const STAMP = { key: 'render-stamp' }

async function stampOf(ui: any): Promise<string | undefined> {
  return (await ui.find(STAMP))?.text
}

// Whether the work finishes before the clock moves at all; it is let finish either way.
async function isImmediate(clock: any, work: Promise<unknown>): Promise<boolean> {
  let isDone = false
  const watched = work.then(() => {
    isDone = true
  })
  await clock.settle()
  const wasDone = isDone
  await clock.advance(FOCUS_SETTLE_MS)
  await watched

  return wasDone
}

test('a reattaching desktop gets the pane and the band drawn again', async ($: any, on: any) => {
  on('session.attach', (_: unknown, e: any) => ({ clientId: e.clientId }))
  await setup($, on)
  await threeRunning($)
  const pane = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const before = [await stampOf(pane), await stampOf(band)]
  expect(before[1]).toBeDefined()

  await $.session.attach({ surface: 'desktop', clientId: 'desktop-2' })

  expect(await stampOf(pane)).not.toBe(before[0])
  expect(await stampOf(band)).not.toBe(before[1])
})

test('a pane render whose focus flipped waits for the click; first and same-focus renders do not', async ($: any, on: any) => {
  const { clock } = await setup($, on)
  const mounting = $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await isImmediate(clock, mounting)).toBe(true)
  const pane = await mounting
  expect(await isImmediate(clock, pane.redraw(PANE.props))).toBe(true)

  let isDone = false
  const flip = pane.redraw({ ...PANE.props, isFocused: false }).then(() => {
    isDone = true
  })
  await clock.advance(FOCUS_SETTLE_MS - 1)
  expect(isDone).toBe(false)
  await clock.advance(1)
  await flip
  expect(isDone).toBe(true)
})
