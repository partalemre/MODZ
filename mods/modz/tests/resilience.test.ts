// The hub with the world as it really is: a removed mod's card still around, a catalog that cannot be
// read, a mod in the marketplace whose folder is gone and one the catalog has no notes for.
import { expect, mock, test } from 'claude-code/testing'

import { MARKET_FILES } from './market-fixture'
import { posix } from './world'

const PANE = { plugin: 'modz', component: 'Pane', requestId: 'modz', viewport: { columns: 100, rows: 40 }, props: { bodyColumns: 50 } } as const

type Files = Record<string, string>

function stubWorld(on: any, files: Files) {
  mock.env(on, { MODZ_LANG: 'tr' })
  on('fs.stat', () => ({ value: { kind: 'directory', size: 0, mtimeMs: 0, isLink: false, realPath: '/m/mods/modz' } }))
  on('fs.read', (_: unknown, e: { path: string }) => {
    const text = files[posix(e.path)]
    if (!text) throw new Error(`ENOENT ${e.path}`)

    return { value: text }
  })
  on('settings.read', () => ({ value: {} }))
  on('command.register', () => ({ value: undefined }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.close', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/work' }))
  on('config.list', () => ({ value: [] }))
  on('command.run', () => ({ text: '' }))
}

// Reporters write their own `hub` key, as the real mods do; agent-deck-pro is gone but its card lingers.
const reporters = [
  {
    name: 'agent-deck-pro',
    register(on: any) {
      on('command.run', { command: 'report' }, async ($: any, e: any, next: any) => {
        await $.state.set({ plugin: 'agent-deck-pro', key: 'hub' }, { pane: 'agents', detail: 'eski ajan kartı', tone: 'bad', at: 9 })

        return next(e)
      })
    },
  },
  {
    name: 'test-badge',
    register(on: any) {
      on('command.run', { command: 'report' }, async ($: any, e: any, next: any) => {
        await $.state.set({ plugin: 'test-badge', key: 'hub' }, { pane: 'tests', detail: '41/42 geçti', tone: 'bad', at: 1 })

        return next(e)
      })
    },
  },
]

async function said(ui: any, text: RegExp): Promise<boolean> {
  if ((await ui.find({ type: 'Text', text })) !== undefined) return true
  const svgs = await ui.findAll({ type: 'Svg' })

  return svgs.some((svg: any) => text.test(String(svg.props?.alt ?? '')))
}

const MARKET = '/m/.claude-plugin/marketplace.json'

// The real snapshot plus a mod whose folder is gone and one the catalog has no notes for.
function troubledMarket(): Files {
  const market = JSON.parse(MARKET_FILES[MARKET] ?? '{}')
  market.plugins.push({ name: 'ghost', source: './mods/ghost' }, { name: 'transceiver', source: './mods/transceiver' })

  return { ...MARKET_FILES, [MARKET]: JSON.stringify(market), '/m/mods/transceiver/.claude-plugin/plugin.json': JSON.stringify({ version: '0.1.0', description: 'Telsiz' }) }
}

for (const surface of ['terminal', 'desktop'] as const) {
  test(`a removed mod's card never leads; the head offers the real one (${surface})`, { plugins: reporters }, async ($: any, on: any) => {
    stubWorld(on, MARKET_FILES)
    const asked: unknown[] = []
    on('state.set', { plugin: 'modz', key: 'open' }, (_: unknown, e: any, next: any) => {
      asked.push(e.value?.pane)

      return next(e)
    })
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    await $.command.run({ command: 'report', args: '' })
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(await said(ui, /eski ajan kartı/)).toBe(false)
    // The terminal leads with the real card; the desktop has no head, and the row is there to press.
    if (surface === 'terminal') expect((await ui.find({ key: 'open-focus' }))?.props).toMatchObject({ label: 'Testler panelini aç', variant: 'primary' })
    await ui.press({ key: surface === 'terminal' ? 'open-focus' : 'open-tests' })
    expect(asked).toEqual(['tests'])
  })

  test(`with no readable catalog the hub keeps reporting mods and says why (${surface})`, { plugins: reporters }, async ($: any, on: any) => {
    stubWorld(on, {})
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    await $.command.run({ command: 'report', args: '' })
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(await ui.find({ key: 'open-tests' })).toBeDefined()
    expect(await ui.find({ key: 'open-files' })).toBeUndefined()
    expect(await said(ui, /katalog okunamadı/)).toBe(true)
    const catalog = await $.ui.mount({ ...PANE, requestId: 'modz-mods', surface })
    expect(await said(catalog, /Katalog okunamadı/)).toBe(true)
  })

  test(`the catalog marks a mod whose folder is gone and files an unknown one under Diğer (${surface})`, async ($: any, on: any) => {
    stubWorld(on, troubledMarket())
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    const ui = await $.ui.mount({ ...PANE, requestId: 'modz-mods', surface })

    expect(await ui.find({ key: 'mod-ghost' })).toBeDefined()
    expect(await said(ui, /ghost v\?.*sorunlu.*plugin\.json okunamadı|sorunlu/)).toBe(true)
    expect(await said(ui, /1 sorunlu/)).toBe(true)
    expect(await said(ui, /DİĞER|Diğer/)).toBe(true)
    expect(await ui.find({ key: 'mod-transceiver' })).toBeDefined()
  })
}
