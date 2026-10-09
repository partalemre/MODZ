import { expect, mock, test, tier } from 'claude-code/testing'

import { START, bandProps, run, session, world } from './world'

tier('user')

// A desktop that reattaches keeps a tree whose buttons the engine already released; the band is drawn again.

const STAMP = { key: 'render-stamp' }

test('a reattaching desktop gets the band drawn again', async ($, on) => {
  mock.clock(on, { now: START })
  world(on, [])
  on('session.attach', (_, e) => ({ clientId: e.clientId }))
  await $.session.start({ ...session, surface: 'desktop', isInteractive: true })
  await $.command.run(run('keepwarm', '90m'))
  const band = await $.ui.mount({ plugin: 'cache-tax', surface: 'desktop', component: 'AbovePrompt', props: bandProps })
  const before = (await band.find(STAMP))?.text
  expect(before).toBeDefined()

  await $.session.attach({ surface: 'desktop', clientId: 'desktop-2' })

  expect((await band.find(STAMP))?.text).not.toBe(before)
})
