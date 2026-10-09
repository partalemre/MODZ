import { expect, mock, test } from 'claude-code/testing'

type Surface = 'terminal' | 'desktop'

type Spy = {
  runs: string[][]
  calls: Record<string, unknown>[]
  clock: any
  exitCode: number
  front: string
  host: string | undefined
  surface: Surface
  push: Record<string, unknown> | null
  files: Set<string>
}

const NOTIFIER = '/opt/homebrew/bin/terminal-notifier'
const CLAUDE_APP = 'com.anthropic.claudefordesktop'

function spyOf(over: Partial<Spy> = {}): Spy {
  return { runs: [], calls: [], clock: null, exitCode: 0, front: 'com.apple.Safari', host: undefined, surface: 'terminal', push: null, files: new Set(), ...over }
}

const ok = (stdout: string, exitCode = 0) => ({ value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })

function processAnswer(spy: Spy, argv: string[]) {
  if (argv[0] === 'lsappinfo') return argv[1] === 'front' ? ok('ASN:0x0-0x1:\n') : ok(`"CFBundleIdentifier"="${spy.front}"\n`)

  return ok('', spy.exitCode)
}

function toolAnswer(spy: Spy, e: any) {
  if (e.tool !== 'PushNotification') return { result: 'ok' }
  spy.calls.push(e)

  return { result: spy.push ?? {} }
}

async function setup($: any, on: any, spy: Spy) {
  spy.clock = mock.clock(on)
  mock.env(on, spy.host === undefined ? {} : { __CFBundleIdentifier: spy.host })
  on('session.start', () => ({ cwd: '/work/eliti' }))
  on('session.surfaces', () => ({ value: [spy.surface] }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('command.register', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['engine'] }))
  on('turn.start', (_: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', (_: any, e: any) => ({ text: e.answer }))
  on('fs.exists', (_: any, e: any) => ({ value: spy.files.has(e.path) }))
  on('tool.list', () => ({ value: spy.push === null ? [] : [{ name: 'PushNotification', description: '', mcp: false }] }))
  on('tool.call', (_: any, e: any) => toolAnswer(spy, e))
  on('tool.check', (_: any, e: any) => ({ decision: e.tool === 'PushNotification' ? 'allow' : 'ask' }))
  on('process.run', (_: any, e: any) => {
    spy.runs.push([...e.argv])

    return processAnswer(spy, e.argv)
  })
  await $.session.start({ surface: spy.surface, isInteractive: true, cwd: '/work/eliti' })
}

async function turn($: any, spy: Spy, durationMs: number, answer = 'Testler geçti, sürüm hazır.') {
  await $.turn.start({ text: 'go', turnId: 't' })
  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  await $.tool.call({ tool: 'Write', file_path: 'a.ts', content: 'x' })
  await $.tool.call({ tool: 'Edit', file_path: 'b.ts', old_string: 'a', new_string: 'b' })
  await $.turn.complete({ answer, durationMs, isAborted: false, turnId: 't', reason: 'answer' })
  await spy.clock.advance(5)
}

const banners = (spy: Spy) => spy.runs.filter(argv => argv[0] === 'osascript' || argv[0] === NOTIFIER)

test('a long turn shows a banner: outcome title, project subtitle, files and tests in the body', async ($, on) => {
  const spy = spyOf()
  await setup($, on, spy)

  await turn($, spy, 75_000)

  const argv = banners(spy)[0] ?? []
  expect(argv.slice(-4)).toEqual(['2 dosya · testler geçti', 'Tur bitti', 'eliti', 'Glass'])
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

  expect(spy.calls[0]).toMatchObject({ status: 'proactive', message: 'Tur bitti · eliti\n2 dosya · testler geçti' })
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
  const spy = spyOf({ surface: 'desktop', push: { message: '', localSent: true } })
  await setup($, on, spy)

  await turn($, spy, 75_000)

  expect(spy.calls).toHaveLength(0)
  expect(banners(spy)).toHaveLength(1)
})

const bandOf = (surface: Surface) => ({
  plugin: 'done-ping',
  component: 'AbovePrompt',
  requestId: 'band',
  surface,
  viewport: { columns: 100, rows: 30 },
  props: { hasSurvey: false, isWorking: false, maxRows: 5, bodyColumns: 100, scroll: { offset: 0, bodyRows: 5 }, view: {} },
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`without a notifier the ping falls back to one line above the others (${surface})`, async ($, on) => {
    const spy = spyOf({ exitCode: 1, surface })
    await setup($, on, spy)

    await turn($, spy, 75_000)
    const ui = await $.ui.mount(bandOf(surface) as any)

    const line = 'Tur bitti · 1dk 15sn · 2 dosya değişti · testler geçti'
    const drawn = JSON.stringify(await ui.drawn())
    if (surface === 'desktop') expect(drawn).toContain(`"alt":"${line}"`)
    else expect(await ui.find({ type: 'Text', text: line })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'engine' })).toBeDefined()
    await ui.press({ key: 'done-ping-dismiss' })
    expect(await ui.find({ key: 'done-ping-dismiss' })).toBeUndefined()
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
