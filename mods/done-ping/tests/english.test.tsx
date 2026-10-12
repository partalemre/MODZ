import { expect, test } from 'claude-code/testing'

import { bandOf, setup, spyOf, turn } from './world'
import type { Spy } from './world'

// Without MODZ_LANG every word the notifications, the band and the command show is English.

const TURKISH = /[çğıöşüİ]/
const LONG_TURN_MS = 75_000

const banners = (spy: Spy) => spy.runs.filter(argv => argv[0] === 'osascript')

test('English: the banner, the permission ping and the app notification', async ($, on) => {
  const spy = spyOf({ lang: null })
  await setup($, on, spy)
  await turn($, spy, LONG_TURN_MS)
  expect(banners(spy)[0]?.slice(-4)).toEqual(['tests passed · 2 files', 'Turn finished', 'eliti', 'Glass'])

  await spy.clock.advance(20_000)
  await $.tool.check({ tool: 'Bash', input: { command: 'npm publish' }, tool_use_id: 'u1' })
  await spy.clock.advance(5)
  expect(banners(spy)[1]?.slice(-4)).toEqual(['Bash command', 'Waiting for approval', 'eliti', 'Glass'])
})

test('English: the desktop app notification', async ($, on) => {
  const spy = spyOf({ lang: null, surface: 'desktop', push: { message: '', localSent: true } })
  await setup($, on, spy)
  await turn($, spy, LONG_TURN_MS)
  expect(spy.calls[0]).toMatchObject({ message: 'Turn finished · eliti\ntests passed · 2 files' })
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`English: the fallback band (${surface})`, async ($, on) => {
    const spy = spyOf({ lang: null, exitCode: 1, surface })
    await setup($, on, spy)
    await turn($, spy, LONG_TURN_MS)
    const ui = await $.ui.mount(bandOf(surface) as any)
    const drawn = JSON.stringify(await ui.drawn())
    expect(drawn).toMatch(/Turn finished · tests passed · 2 files changed · 1m 15s/)
    expect(drawn).not.toMatch(TURKISH)
  })
}

test('English: the command answers', async ($, on) => {
  const spy = spyOf({ lang: null })
  await setup($, on, spy)
  expect((await $.command.run({ command: 'done-ping', args: '90' } as any)).text).toBe('done-ping: pings after turns longer than 90s')
  expect((await $.command.run({ command: 'done-ping', args: 'soon' } as any)).text).toBe('Usage: /done-ping [seconds | 2m | test]')
  expect((await $.command.run({ command: 'done-ping', args: '' } as any)).text).toBe('done-ping off · threshold 90s')
  expect((await $.command.run({ command: 'done-ping', args: 'test' } as any)).text).toBe('done-ping: test notification sent')
})
