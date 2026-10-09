// Draws the desktop MODZ pane from a snapshot of the real marketplace, for bin/preview:
// the hub calm and busy, narrow and wide, and the catalog view.
import { test } from 'claude-code/testing'

import { MARKET_FILES } from './market-fixture'

/** The test runner's console: bin/preview reads the trees it prints. */
declare const console: { log: (text: string) => void }

const pane = (bodyColumns: number) => ({ plugin: 'modz', component: 'Pane', requestId: 'modz', viewport: { columns: 100, rows: 40 }, props: { bodyColumns } }) as const

const MARKET = '/m/.claude-plugin/marketplace.json'

// The snapshot with trouble in it: a listed mod whose folder is gone, one the catalog has no notes
// for, and hud-pro switched off.
function troubled(): Record<string, string> {
  const market = JSON.parse(MARKET_FILES[MARKET] ?? '{}')
  market.plugins.push({ name: 'ghost', source: './mods/ghost' }, { name: 'transceiver', source: './mods/transceiver' })

  return { ...MARKET_FILES, [MARKET]: JSON.stringify(market), '/m/mods/transceiver/.claude-plugin/plugin.json': JSON.stringify({ version: '0.1.0', description: 'Two-way radio between sessions' }) }
}

function stub(on: any, theme: string, isTroubled: boolean) {
  const files = isTroubled ? troubled() : MARKET_FILES
  on('fs.stat', () => ({ value: { kind: 'directory', size: 0, mtimeMs: 0, isLink: false, realPath: '/m/mods/modz' } }))
  on('fs.read', (_: unknown, e: { path: string }) => {
    const text = files[e.path]
    if (!text) throw new Error(`ENOENT ${e.path}`)

    return { value: text }
  })
  const names = Object.keys(MARKET_FILES).map(path => /mods\/([^/]+)\//.exec(path)?.[1]).filter(Boolean)
  const flags = Object.fromEntries(names.map(name => [`${name}@modz`, !(isTroubled && name === 'hud-pro')]))
  on('settings.read', () => ({ value: { enabledPlugins: flags } }))
  on('command.register', () => ({ value: undefined }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', () => ({ cwd: '/work' }))
  on('config.list', () => ({ value: [{ key: 'theme', value: theme }] }))
  on('command.run', () => ({ text: '' }))
}

// Stand-ins for the mods that report to the hub: each writes its own card, as the real mod does.
// The plugin and key are literals in each register, as the engine requires of a $.state call.
const reporters = [
  {
    name: 'savvy-progress',
    register(on: any) {
      on('command.run', { command: 'report' }, async ($: any, e: any, next: any) => {
        await $.state.set({ plugin: 'savvy-progress', key: 'hub' }, { pane: 'agents', detail: '2 ajan çalışıyor', tone: 'live', at: 3 })

        return next(e)
      })
    },
  },
  {
    name: 'filetree',
    register(on: any) {
      on('command.run', { command: 'report' }, async ($: any, e: any, next: any) => {
        await $.state.set({ plugin: 'filetree', key: 'hub' }, { pane: 'files', detail: '4 dosya bu tur', tone: 'live', at: 2 })

        return next(e)
      })
    },
  },
  {
    name: 'plan-steps',
    register(on: any) {
      on('command.run', { command: 'report' }, async ($: any, e: any, next: any) => {
        await $.state.set({ plugin: 'plan-steps', key: 'hub' }, { pane: 'plan', detail: '3/9 adım', tone: 'live', at: 1 })

        return next(e)
      })
    },
  },
  {
    name: 'test-badge',
    register(on: any) {
      on('command.run', { command: 'report' }, async ($: any, e: any, next: any) => {
        await $.state.set({ plugin: 'test-badge', key: 'hub' }, { pane: 'tests', detail: '41/42 geçti · lint 2', tone: 'bad', at: 1 })

        return next(e)
      })
    },
  },
  {
    name: 'checkpoint',
    register(on: any) {
      on('command.run', { command: 'report' }, async ($: any, e: any, next: any) => {
        await $.state.set({ plugin: 'checkpoint', key: 'hub' }, { pane: 'checkpoints', detail: '12 nokta · son 3 dk önce', tone: 'ok', at: 1 })

        return next(e)
      })
    },
  },
  {
    name: 'hud-pro',
    register(on: any) {
      on('command.run', { command: 'report' }, async ($: any, e: any, next: any) => {
        await $.state.set({ plugin: 'hud-pro', key: 'hub' }, { pane: 'usage', detail: '5s %44 · 7g %17', tone: 'idle', at: 1 })

        return next(e)
      })
    },
  },
  {
    name: 'skins',
    register(on: any) {
      on('command.run', { command: 'report' }, async ($: any, e: any, next: any) => {
        await $.state.set({ plugin: 'skins', key: 'hub' }, { pane: 'skins', detail: 'tidemark · koyu', tone: 'idle', at: 1 })

        return next(e)
      })
    },
  },
]

type Case = { label: string; busy: boolean; columns: number; surface?: 'terminal'; isCatalog?: boolean; isTroubled?: boolean }

const CASES: Case[] = [
  { label: 'hub-calm', busy: false, columns: 50 },
  { label: 'hub-busy', busy: true, columns: 50 },
  { label: 'hub-busy-wide', busy: true, columns: 80 },
  { label: 'hub-terminal', busy: true, columns: 70, surface: 'terminal' },
  { label: 'catalog', busy: false, columns: 50, isCatalog: true },
  { label: 'catalog-trouble', busy: false, columns: 50, isCatalog: true, isTroubled: true },
  { label: 'catalog-terminal', busy: false, columns: 80, surface: 'terminal', isCatalog: true, isTroubled: true },
]

for (const theme of ['dark', 'light']) {
  for (const c of CASES) {
    test(`preview: ${c.label} (${theme})`, { plugins: reporters }, async ($: any, on: any) => {
      const surface = c.surface ?? 'desktop'
      stub(on, theme, c.isTroubled === true)
      await $.session.start({ surface, isInteractive: true, cwd: '/work' })
      if (c.busy) {
        await $.command.run({ command: 'report', args: '' })
      }
      const ui = await $.ui.mount({ ...pane(c.columns), surface })
      if (c.isCatalog === true) await ui.press({ key: 'open-mods' })
      console.log(`@@TREE@@${c.label}${theme === 'light' ? '-light' : ''}@@${JSON.stringify(await ui.drawn())}`)
    })
  }
}
