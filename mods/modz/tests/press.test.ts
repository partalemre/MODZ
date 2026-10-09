import { expect, mock, test } from 'claude-code/testing'

import { FOCUS_SETTLE_MS } from '../hooks/kit/focus'
import { stubWorld } from './world'

// The two desktop press races: a click that focuses a pane redraws it under the click, and a desktop
// that reattaches keeps a tree whose buttons the engine already released.

const HUB = { plugin: 'modz', component: 'Pane', requestId: 'modz', viewport: { columns: 100, rows: 40 }, props: { bodyColumns: 50, isFocused: true } } as const
const PANES = [HUB, { ...HUB, requestId: 'modz-mods' }] as const
const STAMP = { key: 'render-stamp' }

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

test('a reattaching desktop gets both panes drawn again', async ($: any, on: any) => {
  stubWorld(on)
  on('session.attach', (_: unknown, e: any) => ({ clientId: e.clientId }))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  const panes = await Promise.all(PANES.map(pane => $.ui.mount({ ...pane, surface: 'desktop' })))
  const before = await Promise.all(panes.map(async pane => (await pane.find(STAMP))?.text))

  await $.session.attach({ surface: 'desktop', clientId: 'desktop-2' })

  const after = await Promise.all(panes.map(async pane => (await pane.find(STAMP))?.text))
  expect(after[0]).not.toBe(before[0])
  expect(after[1]).not.toBe(before[1])
})

for (const pane of PANES) {
  test(`a ${pane.requestId} render whose focus flipped waits for the click; first and same-focus ones do not`, async ($: any, on: any) => {
    const clock = mock.clock(on, { now: 1_000 })
    stubWorld(on, { hasOwnClock: true })
    await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
    const mounting = $.ui.mount({ ...pane, surface: 'desktop' })
    expect(await isImmediate(clock, mounting)).toBe(true)
    const ui = await mounting
    expect(await isImmediate(clock, ui.redraw(pane.props))).toBe(true)

    let isDone = false
    const flip = ui.redraw({ ...pane.props, isFocused: false }).then(() => {
      isDone = true
    })
    await clock.advance(FOCUS_SETTLE_MS - 1)
    expect(isDone).toBe(false)
    await clock.advance(1)
    await flip
    expect(isDone).toBe(true)
  })
}
