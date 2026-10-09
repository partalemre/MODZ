import { expect, test } from 'claude-code/testing'

import { PANE, SURFACES, measure, setup, threeRunning } from './fixtures'

for (const surface of SURFACES) {
  test(`${surface}: every drawing of the pane carries a new hidden stamp, so a press lands on the first click`, async ($: any, on: any) => {
    await setup($, on)
    await threeRunning($)
    const ui = await $.ui.mount({ ...PANE, surface })
    const first = await ui.find({ key: 'render-stamp' })
    await ui.redraw()
    const second = await ui.find({ key: 'render-stamp' })

    expect(first?.props.display).toBe('none')
    expect(second?.text).not.toBe(first?.text)
  })
}

test('a measure that moves nothing writes no limit, so the band and pane do not redraw for it', async ($: any, on: any) => {
  const writes: unknown[] = []
  on('state.set', { plugin: 'savvy-progress', key: 'limit' }, (_: unknown, e: any, next: any) => {
    writes.push(e.value)
    return next(e)
  })
  await setup($, on)
  const seeded = writes.length
  await measure($, 20, 0)
  await measure($, 20, 0)
  expect(writes).toHaveLength(seeded)

  await measure($, 30, 1)
  expect(writes).toHaveLength(seeded + 1)
})
