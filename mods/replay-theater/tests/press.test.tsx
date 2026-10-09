import { expect, test } from 'claude-code/testing'

import { FOCUS_SETTLE_MS } from '../hooks/focus'
import { bandOf, newWorld, paneOf, plannedTurn, setup } from './fixtures'

// The two desktop press races: a click that focuses the pane redraws it under the click, and a desktop
// that reattaches keeps a tree whose buttons the engine already released.

const PANE = paneOf('desktop')
const STAMP = { key: 'render-stamp' }

async function stampOf(site: any): Promise<string | undefined> {
  return (await site.find(STAMP))?.text
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

test('a reattaching desktop gets the pane and the offer band drawn again', async ($: any, on: any) => {
  const world = newWorld()
  on('session.attach', (_: any, e: any) => ({ clientId: e.clientId }))
  await setup($, on, world)
  await plannedTurn($, world)
  const pane = await $.ui.mount(PANE)
  const band = await $.ui.mount(bandOf('desktop'))
  const before = [await stampOf(pane), await stampOf(band)]
  expect(before[1]).toBeDefined()

  await $.session.attach({ surface: 'desktop', clientId: 'desktop-2' })

  expect(await stampOf(pane)).not.toBe(before[0])
  expect(await stampOf(band)).not.toBe(before[1])
})

test('a pane render whose focus flipped waits for the click; first and same-focus renders do not', async ($: any, on: any) => {
  const clock = await setup($, on, newWorld())
  const mounting = $.ui.mount(PANE)
  expect(await isImmediate(clock, mounting)).toBe(true)
  const pane = await mounting
  expect(await isImmediate(clock, pane.redraw(PANE.props))).toBe(true)

  let isDone = false
  const flip = pane.redraw({ ...PANE.props, isFocused: !PANE.props.isFocused }).then(() => {
    isDone = true
  })
  await clock.advance(FOCUS_SETTLE_MS - 1)
  expect(isDone).toBe(false)
  await clock.advance(1)
  await flip
  expect(isDone).toBe(true)
})
