import { expect, test } from 'claude-code/testing'

import { bandOf, setup, spyOf, turn } from './world'
import type { Spy } from './world'

const NOTIFIER = '/opt/homebrew/bin/terminal-notifier'

const banners = (spy: Spy) => spy.runs.filter(argv => argv[0] === 'osascript' || argv[0] === NOTIFIER)

test('on the desktop a long turn that went fine adds nothing to the app notice', async ($, on) => {
  const spy = spyOf({ surface: 'desktop', files: new Set([NOTIFIER]), push: { message: '', localSent: true } })
  await setup($, on, spy)

  await turn($, spy, 75_000)
  const ui = await $.ui.mount(bandOf('desktop') as any)

  expect(spy.calls).toHaveLength(0)
  expect(banners(spy)).toHaveLength(0)
  expect(await ui.find({ key: 'done-ping-dismiss' })).toBeUndefined()
})

test('on the desktop a long turn whose tests failed still rings: the app notice does not say it', async ($, on) => {
  const spy = spyOf({ surface: 'desktop', push: { message: '', localSent: true }, isTestFailing: true })
  await setup($, on, spy)

  await turn($, spy, 75_000)

  expect(spy.calls).toHaveLength(1)
})

test('a turn that dies on an API error is not announced as finished', async ($, on) => {
  const spy = spyOf({ lang: null })
  await setup($, on, spy)

  await turn($, spy, 75_000, { reason: 'error', answer: 'API Error: rate limit reached' })

  const argv = banners(spy)[0] ?? []
  expect(argv).not.toContain('Turn finished')
  expect(argv).toContain('Stopped on an error')
  expect(argv.join(' ')).toContain('rate limit reached')
})

test('on the desktop an error turn rings even though the app sends its own notice', async ($, on) => {
  const spy = spyOf({ surface: 'desktop', push: { message: '', localSent: true } })
  await setup($, on, spy)

  await turn($, spy, 75_000, { reason: 'error', answer: 'API Error: 529 overloaded' })

  expect(spy.calls).toHaveLength(1)
})

test('a ping kept quiet does not swallow the next real one', async ($, on) => {
  const spy = spyOf({ host: 'com.apple.Terminal', front: 'com.apple.Terminal' })
  await setup($, on, spy)

  await turn($, spy, 75_000)
  expect(banners(spy)).toHaveLength(0)

  spy.front = 'com.apple.Safari'
  await $.tool.check({ tool: 'Bash', input: { command: 'ls' }, tool_use_id: 'u1' })
  await spy.clock.advance(5)

  expect(banners(spy)).toHaveLength(1)
})

test('terminal-notifier with banners off falls back to osascript and says so once', async ($, on) => {
  const spy = spyOf({ lang: null, files: new Set([NOTIFIER]), notifierExit: 1 })
  await setup($, on, spy)

  await turn($, spy, 75_000)
  await spy.clock.advance(20_000)
  await turn($, spy, 75_000)

  expect(spy.runs.filter(argv => argv[0] === 'osascript')).toHaveLength(2)
  expect(spy.logs.filter(line => line.includes('terminal-notifier'))).toHaveLength(1)
})
