import { expect, test } from 'claude-code/testing'

import { bandOf, setup, spyOf, turn } from './world'
import type { Spy } from './world'

const NOTIFIER = '/opt/homebrew/bin/terminal-notifier'
const CLAUDE_APP = 'com.anthropic.claudefordesktop'

const banners = (spy: Spy) => spy.runs.filter(argv => argv[0] === 'osascript' || argv[0] === NOTIFIER)

test('a long turn shows a banner: outcome title, project subtitle, files and tests in the body', async ($, on) => {
  const spy = spyOf()
  await setup($, on, spy)

  await turn($, spy, 75_000)

  const argv = banners(spy)[0] ?? []
  expect(argv.slice(-4)).toEqual(['testler geçti · 2 dosya', 'Tur bitti', 'eliti', 'Glass'])
  expect(spy.runs.some(run => run[0] === 'afplay')).toBe(false)
})

test('a short turn stays quiet, and the threshold is configurable', async ($, on) => {
  const spy = spyOf()
  await setup($, on, spy)

  await turn($, spy, 20_000)
  expect(banners(spy)).toHaveLength(0)

  const answer = await $.command.run({ command: 'done-ping', args: '10' } as any)
  await turn($, spy, 20_000)
  expect(answer.text).toBe('done-ping: 10sn üstü turlarda bildirir')
  expect(banners(spy)).toHaveLength(1)
})

test('/done-ping turns it off', async ($, on) => {
  const spy = spyOf()
  await setup($, on, spy)

  const answer = await $.command.run({ command: 'done-ping', args: '' } as any)
  await turn($, spy, 90_000)

  expect(answer.text).toBe('done-ping kapalı · eşik 60sn')
  expect(banners(spy)).toHaveLength(0)
})

test('a permission ask pings once per burst and never shows the command', async ($, on) => {
  const spy = spyOf()
  await setup($, on, spy)

  await $.tool.check({ tool: 'Bash', input: { command: 'npm publish' }, tool_use_id: 'u1' })
  await $.tool.check({ tool: 'Bash', input: { command: 'pwd' }, tool_use_id: 'u2' })
  await spy.clock.advance(5)

  expect(banners(spy)).toHaveLength(1)
  expect(banners(spy)[0]?.slice(-4)).toEqual(['Bash komutu', 'Onay bekliyor', 'eliti', 'Glass'])
})

test('on the desktop a permission ask sends nothing: the app notifies on its own', async ($, on) => {
  const spy = spyOf({ surface: 'desktop', files: new Set([NOTIFIER]), push: { message: '', localSent: true } })
  await setup($, on, spy)

  await $.tool.check({ tool: 'Bash', input: { command: 'ls' }, tool_use_id: 'u1' })
  await spy.clock.advance(5)

  expect(spy.calls).toHaveLength(0)
  expect(banners(spy)).toHaveLength(0)
})

test('an older engine that names no surface is still told apart by the Claude bundle', async ($, on) => {
  const spy = spyOf({ host: CLAUDE_APP, surface: 'unknown' as any })
  await setup($, on, spy)

  await turn($, spy, 75_000)

  expect(spy.runs.some(run => run[0] === 'osascript')).toBe(false)
})

test('claude in a terminal opened inside the desktop app still pings like a terminal', async ($, on) => {
  const spy = spyOf({ host: CLAUDE_APP })
  await setup($, on, spy)

  await $.tool.check({ tool: 'Bash', input: { command: 'ls' }, tool_use_id: 'u1' })
  await spy.clock.advance(5)

  expect(spy.runs.some(run => run[0] === 'osascript')).toBe(true)
})

test('no banner while the app the session runs in is in front; /done-ping test still rings', async ($, on) => {
  const spy = spyOf({ host: 'com.apple.Terminal', front: 'com.apple.Terminal' })
  await setup($, on, spy)

  await turn($, spy, 75_000)
  expect(spy.runs.some(argv => argv[0] === 'lsappinfo')).toBe(true)
  expect(banners(spy)).toHaveLength(0)

  await $.command.run({ command: 'done-ping', args: 'test' } as any)
  await spy.clock.advance(5)
  expect(banners(spy)).toHaveLength(1)
})

test('a wait right before the end rings once, not twice', async ($, on) => {
  const spy = spyOf()
  await setup($, on, spy)

  await $.tool.check({ tool: 'Bash', input: { command: 'ls' }, tool_use_id: 'u1' })
  await turn($, spy, 75_000)

  expect(banners(spy)).toHaveLength(1)
})

test('terminal-notifier, when installed, draws the host app icon', async ($, on) => {
  const spy = spyOf({ host: CLAUDE_APP, files: new Set([NOTIFIER]) })
  await setup($, on, spy)

  await turn($, spy, 75_000)

  const argv = banners(spy)[0] ?? []
  expect(argv[0]).toBe(NOTIFIER)
  expect(argv).toContain('-sender')
  expect(argv).toContain(CLAUDE_APP)
  expect(spy.runs.some(run => run[0] === 'osascript')).toBe(false)
})

test('on the desktop the app notification is used when it runs without asking', async ($, on) => {
  const spy = spyOf({ surface: 'desktop', push: { message: '', localSent: true } })
  await setup($, on, spy)

  await turn($, spy, 75_000)

  expect(spy.calls[0]).toMatchObject({ status: 'proactive', message: 'Tur bitti · eliti\ntestler geçti · 2 dosya' })
  expect(banners(spy)).toHaveLength(0)
})

test('on the desktop, the app saying the person is present keeps it quiet', async ($, on) => {
  const spy = spyOf({ surface: 'desktop', push: { message: '', localSent: false, disabledReason: 'user_present' } })
  await setup($, on, spy)

  await turn($, spy, 75_000)

  expect(spy.calls).toHaveLength(1)
  expect(banners(spy)).toHaveLength(0)
})

test('with appNotification off the desktop uses the banner', { options: { appNotification: false } }, async ($, on) => {
  const spy = spyOf({ surface: 'desktop', files: new Set([NOTIFIER]), push: { message: '', localSent: true } })
  await setup($, on, spy)

  await turn($, spy, 75_000)

  expect(spy.calls).toHaveLength(0)
  expect(banners(spy)).toHaveLength(1)
})

test('on the desktop without terminal-notifier no Script Editor banner is sent', async ($, on) => {
  const spy = spyOf({ surface: 'desktop' })
  await setup($, on, spy)

  await turn($, spy, 75_000)
  const ui = await $.ui.mount(bandOf('desktop') as any)

  expect(banners(spy)).toHaveLength(0)
  expect(await ui.find({ key: 'done-ping-dismiss' })).toBeDefined()
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`without a notifier the ping falls back to one line above the others (${surface})`, async ($, on) => {
    const spy = spyOf({ exitCode: 1, surface })
    await setup($, on, spy)

    await turn($, spy, 75_000)
    const ui = await $.ui.mount(bandOf(surface) as any)

    const line = 'Tur bitti · testler geçti · 2 dosya değişti · 1dk 15sn'
    const drawn = JSON.stringify(await ui.drawn())
    if (surface === 'desktop') expect(drawn).toContain(`"alt":"${line}"`)
    else expect(await ui.find({ type: 'Text', text: line })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'engine' })).toBeDefined()
    await ui.press({ key: 'done-ping-dismiss' })
    expect(await ui.find({ key: 'done-ping-dismiss' })).toBeUndefined()
  })

  test(`a turn whose tests failed leads with "testler kaldı" and reads Flare (${surface})`, async ($, on) => {
    const spy = spyOf({ exitCode: 1, surface, isTestFailing: true })
    await setup($, on, spy)

    await turn($, spy, 75_000)
    const ui = await $.ui.mount(bandOf(surface) as any)

    const line = 'Tur bitti · testler kaldı · 2 dosya değişti · 1dk 15sn'
    if (surface === 'desktop') {
      const svg = (await ui.find({ type: 'Svg' })) as any
      expect(svg?.props?.alt).toBe(line)
      expect(String(svg?.props?.source)).toContain('flare-t')
    } else {
      expect(await ui.find({ type: 'Text', text: line })).toBeDefined()
      expect((await ui.find({ type: 'Text', text: '✕' }))?.props?.color).toBe('error')
    }
  })

  test(`the fallback row clears when the person sends the next prompt (${surface})`, async ($, on) => {
    const spy = spyOf({ exitCode: 1, surface })
    on('prompt.submit', (_: any, e: any) => ({ text: e.text }))
    await setup($, on, spy)
    await turn($, spy, 75_000)
    const ui = await $.ui.mount(bandOf(surface) as any)
    expect(await ui.find({ key: 'done-ping-dismiss' })).toBeDefined()
    await $.prompt.submit({ text: 'devam', context: [], wait: false, origin: { kind: 'composer' } } as any)
    await ui.redraw()
    expect(await ui.find({ key: 'done-ping-dismiss' })).toBeUndefined()
  })
}

const planSteps = {
  name: 'plan-steps',
  register(on: any) {
    on('session.start', async ($: any, e: any, next: any) => {
      await $.state.set({ plugin: 'plan-steps', key: 'notice' }, { at: 1 })

      return next(e)
    })
  },
}

test('a plan-steps notice keeps the slot: the fallback row waits', { plugins: [planSteps] }, async ($, on) => {
  const spy = spyOf({ exitCode: 1, surface: 'terminal' })
  await setup($, on, spy)

  await turn($, spy, 75_000)
  const ui = await $.ui.mount(bandOf('terminal') as any)
  expect(await ui.find({ key: 'done-ping-dismiss' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: 'engine' })).toBeDefined()
})
