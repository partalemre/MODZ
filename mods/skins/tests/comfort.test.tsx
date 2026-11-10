import type { On, RenderElement } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

// A comfort mod never hides what another mod draws, never cuts output out of reach, and spends nothing
// where nothing reads it. BENEATH stands for a mod below skins (a PR card, savvy-progress); the engine's own row
// is `{ type: 'engine' }`, which a skin may redraw.

const SITE = { plugin: 'skins', viewport: { columns: 100, rows: 30 } } as const
const BENEATH: RenderElement = { type: 'Text', props: {}, children: ['beneath'] }

function stub(on: On, opts: { lang?: string; surfaces?: string[]; frames?: number[] } = {}) {
  const clock = mock.clock(on, { now: 10_000 })
  on('session.cwd', () => ({ value: '/work' }))
  on('env.get', ($, e) => ({ value: e.name === 'MODZ_LANG' ? opts.lang : undefined }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000, percent: 42 }, rateLimits: [] } }))
  on('session.surfaces', () => ({ value: opts.surfaces ?? ['terminal'] }) as never)
  on('session.start', () => ({ cwd: '/work' }))
  on('command.register', () => ({ value: { command: 'skin' } }))
  on('tool.register', () => ({ value: { tool: 'mcp__skins__design' } }))
  on('turn.start', ($, e) => ({ turnId: e.turnId }) as never)
  on('state.set', { plugin: 'skins', key: 'frame' } as never, ($: any, e: any, next: any) => {
    opts.frames?.push(e.value)
    return next(e)
  })
  on('ui.render', () => BENEATH)
  return clock
}

const call = (tool: string, input: unknown, state: object = {}) => ({
  tool_use_id: 'tu1', tool, input, isRunning: false, isErrored: false, isInterrupted: false, ...state,
})
const site = (surface: 'terminal' | 'desktop', component: string, props: object) =>
  ({ ...SITE, surface, component, requestId: `${component}-${surface}`, props }) as never

const MOUNTS = [
  ['ToolUse', call('Bash', { command: 'pnpm test' })],
  ['AssistantMessage', { text: '| a | b |\n|---|---|\n| 1 | 2 |', isFirstOfReply: true }],
  ['UserMessage', { text: 'fix the build', origin: { kind: 'composer' }, isExpanded: false }],
  ['Spinner', { word: 'Sauteing', message: null, suffix: '…', mode: 'responding' }],
  ['TurnDuration', { word: 'Baked', durationMs: 64000 }],
] as const

for (const surface of ['terminal', 'desktop'] as const) {
  for (const [component, props] of MOUNTS) {
    test(`${component} keeps what a mod beneath draws (${surface})`, async ($, on) => {
      stub(on)
      const ui = await $.ui.mount(site(surface, component, props))
      expect(await ui.find({ type: 'Text', text: 'beneath' })).toBeDefined()
    })
  }
}

test('an MCP tool keeps its own row: savvy-progress hides its step calls there', async ($, on) => {
  stub(on)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount(site(surface, 'ToolUse', call('mcp__savvy-progress__step', { done: 1 })))
    expect(await ui.drawn()).toMatchObject(BENEATH)
    await ui.unmount()
  }
})

const lines = (n: number, word: string) => Array.from({ length: n }, (_, i) => `${word} ${i}`).join('\n')
const svgs = async (ui: { findAll: (q: object) => Promise<any[]> }) => (await ui.findAll({ type: 'Svg' })).map(svg => String(svg.props.source))

test('long shell output and big diffs are never cut on a card: the engine keeps its expandable result', async ($, on) => {
  stub(on, { lang: 'en' })
  const cases = [
    { tool: 'Bash', output: { stdout: lines(40, 'out'), stderr: '', interrupted: false }, isErrored: false },
    { tool: 'Bash', output: { stdout: 'a', stderr: lines(30, 'err'), interrupted: false }, isErrored: true },
    { tool: 'Edit', output: { filePath: '/work/a.ts', structuredPatch: [{ oldStart: 1, newStart: 1, lines: lines(40, '+x').split('\n') }] }, isErrored: false },
  ]
  for (const props of cases) {
    const ui = await $.ui.mount(site('desktop', 'ToolResult', { tool_use_id: 'r', ...props }))
    expect((await svgs(ui)).some(source => /more line/.test(source))).toBe(false)
    expect(await ui.find({ type: 'Text', text: 'beneath' })).toBeDefined()
    await ui.unmount()
  }
})

test('a failed command that fits keeps every stderr line on its card', async ($, on) => {
  stub(on, { lang: 'en' })
  const output = { stdout: lines(8, 'out'), stderr: lines(8, 'err'), interrupted: false }
  const ui = await $.ui.mount(site('desktop', 'ToolResult', { tool_use_id: 'r', tool: 'Bash', output, isErrored: true }))
  const card = (await svgs(ui)).join('')
  for (let i = 0; i < 8; i += 1) expect(card).toContain(`err ${i}`)
})

test('the desktop row says a failure and a stop in English by default', async ($, on) => {
  stub(on)
  const failed = await $.ui.mount(site('desktop', 'ToolUse', call('Bash', { command: 'false' }, { isErrored: true })))
  expect(await failed.find({ type: 'Text', text: /· error/ })).toBeDefined()
  expect(await failed.find({ type: 'Text', text: /hata/ })).toBeUndefined()
  await failed.unmount()
  const stopped = await $.ui.mount(site('desktop', 'ToolUse', call('Bash', { command: 'sleep 9' }, { isInterrupted: true })))
  expect(await stopped.find({ type: 'Text', text: /· stopped/ })).toBeDefined()
})

for (const [surfaces, isTicking] of [[['desktop'], false], [['terminal'], true]] as const) {
  test(`the spinner ticker runs only where a terminal draws it (${surfaces[0]})`, async ($, on) => {
    const frames: number[] = []
    const clock = stub(on, { surfaces: [...surfaces], frames })
    await $.session.start({ surface: surfaces[0], isInteractive: true, cwd: '/work' } as never)
    await $.turn.start({ text: 'go', turnId: 't' } as never)
    await clock.advance(1_000)
    expect(frames.length > 0).toBe(isTicking)
  })
}
