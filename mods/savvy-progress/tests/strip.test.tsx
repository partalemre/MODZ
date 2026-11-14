import { expect } from 'claude-code/testing'

import { test, BAND, setup } from './fixtures'

test('strip: every chip is one pressable button; the agent-time chip opens the Agents pane', async ($, on) => {
  const { world } = await setup($, on)
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  for (const id of ['cost', 'tokens', 'time']) expect(await ui.find({ key: `savvy-chip-press-${id}` })).toBeDefined()
  // The way to the hub is offered only while the hub runs.
  expect(await ui.find({ key: 'savvy-chip-press-modz' })).toBeUndefined()
  await ui.press({ key: 'savvy-chip-press-time' })
  expect(world.opened).toEqual(['savvy-agents'])
})
