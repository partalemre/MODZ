import { expect, test } from 'claude-code/testing'

import { headline, marketRoot } from '../hooks/catalog'
import type { ModInfo } from '../hooks/catalog'
import { githubName, monogram } from '../hooks/meta'

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
})

test('names: monogram initials and GitHub owner/repo', () => {
  expect(monogram('blast-radius')).toBe('BR')
  expect(monogram('skins')).toBe('SK')
  expect(githubName('https://github.com/zenbu-labs/terminal-browser/tree/main')).toBe('zenbu-labs/terminal-browser')
  expect(githubName('https://github.com/hellosverre')).toBe('hellosverre')
})

test('the headline counts enabled mods honestly', () => {
  const mod = (isEnabled: boolean | null) => ({ isEnabled }) as ModInfo
  expect(headline([mod(true), mod(true)])).toBe('2 mod · hepsi açık')
  expect(headline([mod(true), mod(false)])).toBe('2 mod · 1 açık')
  expect(headline([mod(null)])).toBe('1 mod')
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`the pane lists each mod with its version, group and source (${surface})`, async ($, on) => {
    on('fs.stat', () => ({
      value: { kind: 'directory', size: 0, mtimeMs: 0, isLink: false, realPath: '/m/mods/modz' },
    }))
    on('fs.read', (_, e) => {
      const text = FILES[e.path]
      if (!text) throw new Error(`ENOENT ${e.path}`)

      return { value: text }
    })
    on('settings.read', () => ({ value: { enabledPlugins: { 'hud@modz': true, 'ghost@modz': true, 'cache-tax@modz': false } } }))
    on('command.register', () => ({ value: undefined }))
    on('ui.open', () => ({ value: { isPlaced: true } }))
    on('session.start', () => ({ cwd: '/work' }))
    on('config.list', () => ({ value: [] }))
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    await $.command.run({ command: 'modz', args: '' })

    const ui = await $.ui.mount({ ...PANE, surface })
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
