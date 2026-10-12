// The Görünüm pane as a person uses it: which skin is on, each skin's colours, switching the skin
// off and the toggles' state; and a failed call said in a word, not by colour alone.
import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

const SURFACES = ['terminal', 'desktop'] as const

const SITE = { plugin: 'skins', viewport: { columns: 100, rows: 30 } } as const

const pane = (surface: (typeof SURFACES)[number]) =>
  ({
    ...SITE,
    surface,
    component: 'Pane',
    requestId: 'skins-settings',
    props: { title: 'Görünüm', isFocused: true, bodyColumns: 62, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
  }) as const

function stubEngine(on: On): { opened: string[] } {
  const opened: string[] = []
  mock.clock(on, { now: 10_000 })
  on('session.cwd', () => ({ value: '/work' }))
  on('env.get', ($, e) => ({ value: e.name === 'MODZ_LANG' ? 'tr' : undefined }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('ui.open', ($, e) => {
    opened.push(e.id)

    return { value: { isPlaced: true } }
  })
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000, percent: 42 }, rateLimits: [] } }))
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['stock row'] }))
  on('config.list', () => ({ value: [] }))
  on('session.start', () => ({ cwd: '/work' }))
  on('command.register', () => ({ value: { command: 'skin' } }))
  on('tool.register', () => ({ value: { tool: 'mcp__skins__design' } }))

  return { opened }
}

// The session start reads MODZ_LANG: these tests read Turkish.
const begin = ($: Engine, surface: (typeof SURFACES)[number]) => $.session.start({ surface, isInteractive: true, cwd: '/work' })

type Node = { type?: string; props?: Record<string, unknown>; children?: readonly unknown[] }

// Every Text colour inside a found element, in order.
function colors(node: Node | undefined): unknown[] {
  return (node?.children ?? []).flatMap(child => {
    const element = child as Node

    return element?.type === 'Text' ? [element.props?.color, ...colors(element)] : colors(element)
  })
}

for (const surface of SURFACES) {
  test(`${surface}: the skin in use is marked; each skin shows its own colours`, async ($, on) => {
    stubEngine(on)
    const ui = await $.ui.mount(pane(surface))

    const current = (await ui.find({ key: 'skin-tidemark' })) as Node | undefined
    expect(current?.props?.variant).toBe('secondary')
    expect(String(current?.props?.label)).toContain('✓')
    const dracula = (await ui.find({ key: 'skin-dracula' })) as Node | undefined
    expect(dracula?.props?.plain).toBe(true)
    const swatch = (await ui.find({ key: 'skin-swatch-dracula' })) as Node | undefined
    expect(colors(swatch).slice(0, 3)).toEqual(['#bd93f9', '#50fa7b', '#ff5555'])

    await ui.press({ key: 'skin-dracula' })
    expect(((await ui.find({ key: 'skin-dracula' })) as Node | undefined)?.props?.variant).toBe('secondary')
    expect(((await ui.find({ key: 'skin-tidemark' })) as Node | undefined)?.props?.plain).toBe(true)
  })

  test(`${surface}: Kapalı turns the skin off; the toggles say on or off; the gallery opens`, async ($, on) => {
    const world = stubEngine(on)
    await begin($, surface)
    const ui = await $.ui.mount(pane(surface))

    expect(String(((await ui.find({ key: 'toggle-rail' })) as Node | undefined)?.props?.label)).toBe('● Yanıt çizgisi')
    expect(String(((await ui.find({ key: 'toggle-band' })) as Node | undefined)?.props?.label)).toBe('○ Kullanım bandı')
    await ui.press({ key: 'toggle-band' })
    expect(String(((await ui.find({ key: 'toggle-band' })) as Node | undefined)?.props?.label)).toBe('● Kullanım bandı')

    await ui.press({ key: 'skin-off' })
    expect(((await ui.find({ key: 'skin-off' })) as Node | undefined)?.props?.label).toBe('Kapalı ✓')
    const row = await $.ui.mount({ ...SITE, surface, component: 'ToolUse', requestId: 'tu1', props: { tool_use_id: 'tu1', tool: 'Bash', input: { command: 'ls' }, isRunning: false, isErrored: false, isInterrupted: false } })
    expect(await row.find({ type: 'Text', text: 'stock row' })).toBeDefined()

    await ui.press({ key: 'gallery' })
    expect(world.opened).toContain('skins-gallery')
  })
}

test('a failed call says so in a word on the desktop, where the row has no status glyph', async ($, on) => {
  stubEngine(on)
  const failed = { tool_use_id: 'tu2', tool: 'Bash', input: { command: 'pnpm build' }, isRunning: false, isErrored: true, isInterrupted: false }
  const desktop = await $.ui.mount({ ...SITE, surface: 'desktop', component: 'ToolUse', requestId: 'tu2', props: failed })
  expect(await desktop.find({ type: 'Text', text: /pnpm build {2}· hata/ })).toBeDefined()

  const stopped = await $.ui.mount({ ...SITE, surface: 'desktop', component: 'ToolUse', requestId: 'tu3', props: { ...failed, tool_use_id: 'tu3', isErrored: false, isInterrupted: true } })
  expect(await stopped.find({ type: 'Text', text: /· durduruldu/ })).toBeDefined()
})
