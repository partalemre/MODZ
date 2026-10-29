import { expect, mock, test } from 'claude-code/testing'

import { headline, installedMarketRoot, marketRoot } from '../hooks/catalog'
import type { ModInfo } from '../hooks/catalog'
import { setLang } from '../hooks/kit/lang'
import { githubName } from '../hooks/meta'
import { posix } from './world'

const FILES: Record<string, string> = {
  '/m/.claude-plugin/marketplace.json': JSON.stringify({
    name: 'modz',
    plugins: [{ name: 'hud', source: './mods/hud' }, { name: 'ghost', source: './mods/ghost' }, { name: 'cache-tax', source: './mods/cache-tax' }],
  }),
  '/m/mods/hud/.claude-plugin/plugin.json': JSON.stringify({ version: '0.3.0', description: 'band' }),
  '/m/mods/cache-tax/.claude-plugin/plugin.json': JSON.stringify({ version: '2.2.1', description: 'cache' }),
}

const PANE = {
  plugin: 'modz',
  component: 'Pane',
  requestId: 'modz',
  viewport: { columns: 100, rows: 30 },
  props: { bodyColumns: 90 },
} as const

test('marketRoot climbs out of mods/<name>', () => {
  expect(marketRoot('/m/mods/modz')).toBe('/m')
  expect(marketRoot('C:\\Users\\k\\MODZ\\mods\\modz')).toBe('C:/Users/k/MODZ')
})

test('a cached install finds the catalog in its marketplace clone', () => {
  const install = { market: 'modz', pluginsDir: 'C:/Users/k/.claude/plugins' }
  const known = JSON.stringify({ modz: { source: { source: 'github', repo: 'partalemre/MODZ' }, installLocation: 'D:\\claude\\plugins\\marketplaces\\modz\\' } })

  expect(installedMarketRoot(install, known)).toBe('D:/claude/plugins/marketplaces/modz')
  expect(installedMarketRoot(install, undefined)).toBe('C:/Users/k/.claude/plugins/marketplaces/modz')
  expect(installedMarketRoot(install, '{ broken')).toBe('C:/Users/k/.claude/plugins/marketplaces/modz')
  expect(installedMarketRoot(install, JSON.stringify({ other: { installLocation: '/x' } }))).toBe('C:/Users/k/.claude/plugins/marketplaces/modz')
})

test('names: GitHub owner/repo', () => {
  expect(githubName('https://github.com/zenbu-labs/terminal-browser/tree/main')).toBe('zenbu-labs/terminal-browser')
  expect(githubName('https://github.com/hellosverre')).toBe('hellosverre')
})

test('the headline counts enabled mods honestly', () => {
  const mod = (isEnabled: boolean | null) => ({ isEnabled }) as ModInfo
  setLang('tr')
  expect(headline([mod(true), mod(true)])).toBe('2 mod · hepsi açık')
  expect(headline([mod(true), mod(false)])).toBe('2 mod · 1 açık')
  expect(headline([mod(null)])).toBe('1 mod')
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`the pane lists each mod with its version, group and source (${surface})`, async ($: any, on) => {
    mock.env(on, { MODZ_LANG: 'tr' })
    on('fs.stat', () => ({
      value: { kind: 'dir', size: 0, mtimeMs: 0, isLink: false, realPath: '/m/mods/modz' },
    }))
    on('fs.read', (_, e) => {
      const text = FILES[posix(e.path)]
      if (!text) throw new Error(`ENOENT ${e.path}`)

      return { value: text }
    })
    on('settings.read', () => ({ value: { enabledPlugins: { 'hud@modz': true, 'ghost@modz': true, 'cache-tax@modz': false } } }))
    on('command.register', () => ({ value: { command: 'modz' } }))
    on('ui.open', () => ({ value: { isPlaced: true } }))
    on('session.start', () => ({ cwd: '/work' }))
    on('config.list', () => ({ value: [] }))
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    await $.command.run({ command: 'modz', args: '' })

    const ui = await $.ui.mount({ ...PANE, requestId: 'modz-mods', surface })
    const said = async (text: RegExp) => {
      if ((await ui.find({ type: 'Text', text })) !== undefined) return true
      const svgs = await ui.findAll({ type: 'Svg' })

      return svgs.some((svg: any) => text.test(String(svg.props?.alt ?? '')))
    }

    expect(await ui.find({ key: 'mod-hud' })).toBeDefined()
    expect(await said(/0\.3\.0/)).toBe(true)
    expect(await said(/okunamadı/)).toBe(true)
    expect(await said(/asıl: karanb192\/cache-tax/)).toBe(true)
    expect(await said(/3 mod · 2 açık/)).toBe(true)
  })
}

// Windows sets USERPROFILE and no HOME: the link counts there too.
for (const home of [{ HOME: '/home/u' }, { USERPROFILE: '\\home\\u' }] as Record<string, string>[]) {
  test(`with no settings flag, a ~/.claude/skills link turns a mod on in the pane headline (${Object.keys(home)[0]})`, async ($: any, on) => {
    on('fs.stat', () => ({ value: { kind: 'dir', size: 0, mtimeMs: 0, isLink: false, realPath: '/m/mods/modz' } }))
    on('fs.read', (_, e) => {
      const text = FILES[posix(e.path)]
      if (!text) throw new Error(`ENOENT ${e.path}`)

      return { value: text }
    })
    on('fs.exists', (_, e) => ({ value: posix(e.path) === '/home/u/.claude/skills/hud' }))
    mock.env(on, { ...home, MODZ_LANG: 'tr' })
    on('settings.read', () => ({ value: {} }))
    on('command.register', () => ({ value: { command: 'modz' } }))
    on('ui.open', () => ({ value: { isPlaced: true } }))
    on('session.start', () => ({ cwd: '/work' }))
    on('config.list', () => ({ value: [] }))
    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
    await $.command.run({ command: 'modz', args: '' })

    const ui = await $.ui.mount({ ...PANE, requestId: 'modz-mods', surface: 'terminal' })

    expect(await ui.find({ type: 'Text', text: /3 mod · hepsi açık · 2 bilinmiyor/ })).toBeDefined()
  })
}

// `/plugin install modz@modz` copies mods/modz alone into the plugins cache; the catalog is in the clone.
test('installed from the marketplace, the hub reads the catalog from the marketplace clone', async ($: any, on) => {
  const clone = '/u/.claude/plugins/marketplaces/modz'
  const files: Record<string, string> = {
    '/u/.claude/plugins/known_marketplaces.json': JSON.stringify({ modz: { source: { source: 'github', repo: 'partalemre/MODZ' }, installLocation: clone } }),
    ...Object.fromEntries(Object.entries(FILES).map(([path, text]) => [path.replace(/^\/m\//, `${clone}/`), text])),
  }
  on('fs.stat', () => ({ value: { kind: 'dir', size: 0, mtimeMs: 0, isLink: false, realPath: '/u/.claude/plugins/cache/modz/modz/aabcb2b548be' } }))
  on('fs.read', (_, e) => {
    const text = files[posix(e.path)]
    if (!text) throw new Error(`ENOENT ${e.path}`)

    return { value: text }
  })
  on('fs.exists', (_, e) => ({ value: posix(e.path) in files }))
  mock.env(on, { MODZ_LANG: 'tr' })
  on('settings.read', () => ({ value: { enabledPlugins: { 'hud@modz': true, 'ghost@modz': true, 'cache-tax@modz': true } } }))
  on('command.register', () => ({ value: { command: 'modz' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', () => ({ cwd: '/work' }))
  on('config.list', () => ({ value: [] }))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'modz', args: '' })

  const ui = await $.ui.mount({ ...PANE, requestId: 'modz-mods', surface: 'terminal' })

  expect(await ui.find({ type: 'Text', text: /3 mod · hepsi açık/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /Katalog okunamadı/ })).toBeUndefined()
})
