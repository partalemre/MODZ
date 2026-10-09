import { expect, test } from 'claude-code/testing'

import { FOCUS_SETTLE_MS } from '../hooks/focus'
import { PANE, browser, newWorld, shown, start } from './world'

// The two desktop press races: a click that focuses the pane redraws it under the click, and a desktop
// that reattaches keeps a tree whose buttons the engine already released.

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

// Closing forgets the address without drawing the pane again, so the old address stays on it:
// the start page showing up proves the attach drew it again.
test('a reattach draws the pane again', async ($: any, on: any) => {
  on('session.attach', (_: unknown, e: any) => ({ clientId: e.clientId }))
  await start($, on, { world: newWorld(), surface: 'terminal' })
  await browser($, 'example.com')
  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await browser($, 'close')
  expect(await shown(pane)).toContain('https://example.com')

  await $.session.attach({ surface: 'desktop', clientId: 'desktop-2' })

  expect(await shown(pane)).not.toContain('https://example.com')
  expect(await shown(pane)).toContain('Başlangıç sayfası')
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`a ${surface} pane render whose focus flipped waits for the click; first and same-focus ones do not`, async ($: any, on: any) => {
    const clock = await start($, on, { world: newWorld(), surface })
    const mounting = $.ui.mount({ ...PANE, surface })
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
}
