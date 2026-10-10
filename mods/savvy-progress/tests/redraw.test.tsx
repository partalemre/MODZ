import { expect, test } from 'claude-code/testing'

import { measure, setup } from './fixtures'

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
