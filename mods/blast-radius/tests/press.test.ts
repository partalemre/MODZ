import { expect, test } from 'claude-code/testing'

import { FOCUS_SETTLE_MS } from '../hooks/focus'
import { BUILD_SCAN, PANE_PROPS, mountBand, mountPane, pass, stub, world } from './world'

// The two desktop press races: a click that focuses the pane redraws it under the click, and a desktop
// that reattaches keeps a tree whose buttons the engine already released.

const STAMP = { key: 'render-stamp' }
// Where the card is drawn: the pane when the surface places it, else the band above the prompt.
const PLACES = [
  { name: 'pane', isPlaced: true, mount: ($: any) => mountPane($, 'desktop') },
  { name: 'band', isPlaced: false, mount: ($: any) => mountBand($, 'desktop') },
] as const

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

for (const place of PLACES) {
  test(`a reattaching desktop gets the ${place.name} card drawn again`, async ($: any, on: any) => {
    const w = world({ isPlaced: place.isPlaced, answers: { files: BUILD_SCAN } })
    stub(on, w)
    on('ui.render', () => ({ type: 'Text', children: ['other mod row'] }))
    on('session.attach', (_: unknown, e: any) => ({ clientId: e.clientId }))
    const call = $.tool.call({ tool: 'Bash', command: 'rm -rf build' })
    await pass(w, 0)
    const card = await place.mount($)
    const before = await stampOf(card)
    expect(before).toBeDefined()

    await $.session.attach({ surface: 'desktop', clientId: 'desktop-2' })

    expect(await stampOf(card)).not.toBe(before)
    await card.press({ key: 'cancel' })
    await pass(w)
    expect((await call).deny).toBeDefined()
  })
}

test('a pane render whose focus flipped waits for the click; first and same-focus renders do not', async ($: any, on: any) => {
  const w = world({ answers: { files: BUILD_SCAN } })
  stub(on, w)
  const call = $.tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await pass(w, 0)
  const mounting = mountPane($, 'desktop')
  expect(await isImmediate(w.clock, mounting)).toBe(true)
  const pane = await mounting
  expect(await isImmediate(w.clock, pane.redraw(PANE_PROPS))).toBe(true)

  let isDone = false
  const flip = pane.redraw({ ...PANE_PROPS, isFocused: !PANE_PROPS.isFocused }).then(() => {
    isDone = true
  })
  await w.clock?.advance(FOCUS_SETTLE_MS - 1)
  expect(isDone).toBe(false)
  await w.clock?.advance(1)
  await flip
  expect(isDone).toBe(true)
  await pane.press({ key: 'cancel' })
  await pass(w)
  expect((await call).deny).toBeDefined()
})
