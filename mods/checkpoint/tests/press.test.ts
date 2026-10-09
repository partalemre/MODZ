import { expect, test } from 'claude-code/testing'

import { FOCUS_SETTLE_MS } from '../hooks/focus'
import { newFake, paneOf, stub } from './stubs'

// The two desktop press races: a click that focuses the pane redraws it under the click, and a desktop
// that reattaches keeps a tree whose buttons the engine already released.

const PANE = paneOf('desktop')
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

test('a reattaching desktop gets the pane drawn again', async ($: any, on: any) => {
  stub(on, newFake())
  on('session.attach', (_: any, e: any) => ({ clientId: e.clientId }))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/w' })
  const pane = await $.ui.mount(PANE)
  const before = await stampOf(pane)

  await $.session.attach({ surface: 'desktop', clientId: 'desktop-2' })

  expect(await stampOf(pane)).not.toBe(before)
})

test('a pane render whose focus flipped waits for the click; first and same-focus renders do not', async ($: any, on: any) => {
  const clock = stub(on, newFake())
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/w' })
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
