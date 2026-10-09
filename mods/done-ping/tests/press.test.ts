import { expect, test } from 'claude-code/testing'

import { bandOf, setup, spyOf, turn } from './world'

// The desktop press race the band can meet: a desktop that reattaches keeps a tree whose buttons the
// engine already released. The band draws no Pane, so a focus flip never redraws it under a click.

const STAMP = { key: 'render-stamp' }
// Long enough to ping; without a notifier the ping falls back to the band row.
const LONG_TURN_MS = 75_000

test('a reattaching desktop gets the band drawn again', async ($, on) => {
  const spy = spyOf({ exitCode: 1, surface: 'desktop' })
  on('session.attach', (_: any, e: any) => ({ clientId: e.clientId }))
  await setup($, on, spy)
  await turn($, spy, LONG_TURN_MS)
  const band = await $.ui.mount(bandOf('desktop') as any)
  const before = (await band.find(STAMP))?.text
  expect(before).toBeDefined()
  expect(await band.find({ key: 'done-ping-dismiss' })).toBeDefined()

  await $.session.attach({ surface: 'desktop', clientId: 'desktop-2' } as any)

  expect((await band.find(STAMP))?.text).not.toBe(before)
})
