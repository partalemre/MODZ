import { expect, test } from 'claude-code/testing'

import { marketRoot } from '../hooks/catalog'

const FILES: Record<string, string> = {
  '/.claude-plugin/marketplace.json': JSON.stringify({
    plugins: [{ name: 'hud', source: './mods/hud' }, { name: 'ghost', source: './mods/ghost' }],
  }),
  '/mods/hud/.claude-plugin/plugin.json': JSON.stringify({ version: '0.3.0', description: 'band' }),
}

const PANE = {
  plugin: 'modz',
  component: 'Pane',
  requestId: 'modz',
  viewport: { columns: 100, rows: 30 },
  props: {},
} as const

test('marketRoot climbs out of mods/<name>', () => {
  expect(marketRoot('/m/mods/modz')).toBe('/m')
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`the pane lists each mod with its version (${surface})`, async ($, on) => {
    on('fs.read', (_, e) => {
      const suffix = Object.keys(FILES).find(key => e.path.endsWith(key))
      const text = suffix && FILES[suffix]
      if (!text) throw new Error(`ENOENT ${e.path}`)

      return { value: text }
    })
    on('command.register', () => ({ value: undefined }))
    on('ui.open', () => ({ value: { isPlaced: true } }))
    on('session.start', () => ({ cwd: '/work' }))
    on('config.list', () => ({ value: [] }))
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    await $.command.run({ command: 'modz', args: '' })

    const ui = await $.ui.mount({ ...PANE, surface })

    expect(await ui.find({ key: 'mod-hud' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /0\.3\.0/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /okunamadı/ })).toBeDefined()
  })
}
