// Without MODZ_LANG the skin's chrome speaks English: the settings pane, the gallery, the usage band, the
// cards, the turn footer, /skin's answers and the hub row. Nothing drawn carries a Turkish-only letter.
import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

const SURFACES = ['terminal', 'desktop'] as const
type Surface = (typeof SURFACES)[number]

const TURKISH_ONLY = /[çğıöşüİ]/
const SITE = { plugin: 'skins', viewport: { columns: 100, rows: 30 } } as const
const PANE_PROPS = { title: 'Look', isFocused: true, bodyColumns: 80, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} } as const

const pane = (surface: Surface, requestId: string) => ({ ...SITE, surface, component: 'Pane', requestId, props: PANE_PROPS }) as const

// A session with MODZ_LANG unset, the store kept in memory and the hub row's writes recorded.
async function english($: Engine, on: On, surface: Surface) {
  const world = { toasts: [] as string[], opened: [] as { id: string; title?: string }[], cards: [] as unknown[] }
  const store: Record<string, unknown> = {}
  mock.clock(on, { now: 10_000 })
  mock.env(on, {})
  on('session.cwd', () => ({ value: '/work' }))
  on('store.get', ($, e) => ({ value: store[e.key] }))
  on('store.set', ($, e) => {
    store[e.key] = e.value

    return { value: undefined }
  })
  on('config.list', () => ({ value: [] }))
  on('ui.toast', ($, e) => {
    world.toasts.push(e.text)

    return { value: undefined }
  })
  on('ui.open', ($, e) => {
    world.opened.push(e)

    return { value: { isPlaced: true } }
  })
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['stock row'] }))
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000, percent: 85 }, rateLimits: [{ kind: 'five_hour', percentUsed: 18 }] } }))
  on('session.start', () => ({ cwd: '/work' }))
  on('command.register', () => ({ value: { command: 'skin' } }))
  on('tool.register', () => ({ value: { tool: 'mcp__skins__design' } }))
  on('state.set', { plugin: 'skins', key: 'hub' }, ($, e, next) => {
    world.cards.push(e.value)

    return next(e)
  })
  await $.session.start({ surface, isInteractive: true, cwd: '/work' })

  return world
}

const skin = ($: Engine, args: string) =>
  $.command.run({ command: 'skin', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 100 } })

const labelOf = async (ui: { find: (q: object) => Promise<unknown> }, key: string) =>
  String(((await ui.find({ key })) as { props?: { label?: unknown } } | undefined)?.props?.label)

for (const surface of SURFACES) {
  test(`${surface}: the settings pane reads in English`, async ($, on) => {
    const world = await english($, on, surface)
    await skin($, '')
    const ui = await $.ui.mount(pane(surface, 'skins-settings'))

    expect(world.opened[0]?.title).toBe('Look')
    expect(await ui.find({ type: 'Text', text: 'THEME' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'OPTIONS' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'COLORS' })).toBeDefined()
    expect(await labelOf(ui, 'toggle-rail')).toBe('● Reply rail')
    expect(await labelOf(ui, 'skin-off')).toBe('Off')
    expect(await labelOf(ui, 'gallery')).toBe('Open the gallery')
    expect(await ui.find({ type: 'Text', text: /add rate limiting to the hub api/ })).toBeDefined()
    expect(JSON.stringify(await ui.drawn())).not.toMatch(TURKISH_ONLY)
  })

  test(`${surface}: the gallery numbers its sections in English`, async ($, on) => {
    const world = await english($, on, surface)
    await skin($, 'gallery')
    const ui = await $.ui.mount(pane(surface, 'skins-gallery'))

    expect(world.opened[0]?.title).toBe('Skin gallery')
    expect(await ui.find({ type: 'Text', text: /^1 {2}Your prompt$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^11 {2}Turn footer \(terminal\)$/ })).toBeDefined()
    expect(JSON.stringify(await ui.drawn())).not.toMatch(TURKISH_ONLY)
  })

  test(`${surface}: the usage band nudges to compact in English`, async ($, on) => {
    await english($, on, surface)
    await skin($, 'band on')
    const props = { hasSurvey: false, isWorking: false, maxRows: 4, bodyColumns: 100, scroll: { offset: 0, bodyRows: 4 }, view: {} }
    const ui = await $.ui.mount({ ...SITE, surface, component: 'AbovePrompt', requestId: 'band', props })

    expect(await ui.find({ type: 'Text', text: 'Context 85% full' })).toBeDefined()
    expect(await labelOf(ui, 'compact')).toBe('Compact now')
    expect(JSON.stringify(await ui.drawn())).toContain('5h')
    expect(JSON.stringify(await ui.drawn())).not.toMatch(TURKISH_ONLY)
  })
}

test('desktop: the shell card says its state and output in English', async ($, on) => {
  await english($, on, 'desktop')
  const props = { tool_use_id: 'tr1', tool: 'Bash', output: { stdout: '', stderr: '', interrupted: true }, isErrored: false }
  const ui = await $.ui.mount({ ...SITE, surface: 'desktop', component: 'ToolResult', requestId: 'tr1', props })
  const source = String(((await ui.find({ type: 'Svg' })) as { props: { source: string } } | undefined)?.props.source)

  expect(source).toContain('Output')
  expect(source).toContain('stopped')
  expect(source).toContain('no output')
  expect(JSON.stringify(await ui.drawn())).not.toMatch(TURKISH_ONLY)
})

test('terminal: the house skin works and finishes in English words', async ($, on) => {
  await english($, on, 'terminal')
  const footer = await $.ui.mount({ ...SITE, surface: 'terminal', component: 'TurnDuration', requestId: 'f1', props: { word: 'Baked', durationMs: 64000 } })
  const spinner = await $.ui.mount({ ...SITE, surface: 'terminal', component: 'Spinner', requestId: 'main', props: { word: 'Sauteing', message: null, suffix: '…', mode: 'responding' } })

  expect(await footer.find({ type: 'Text', text: /^◆ (Done|Finished|Settled) · 1m 4s$/ })).toBeDefined()
  expect(JSON.stringify(await spinner.drawn())).not.toMatch(TURKISH_ONLY)
})

test('/skin answers and the hub row read in English', async ($, on) => {
  const world = await english($, on, 'desktop')

  expect((await skin($, 'nope')).text).toBe('unknown skin "nope". /skin list shows them all')
  expect((await skin($, 'rail maybe')).text).toBe('usage: /skin rail on|off')
  await skin($, 'off')
  expect(world.toasts.at(-1)).toBe('skin off')
  await skin($, 'tidemark')
  await skin($, 'pin')
  expect(world.toasts.at(-1)).toBe('this folder keeps its own look')
  expect(world.cards.at(-1)).toMatchObject({ detail: 'tidemark · dark' })
})
