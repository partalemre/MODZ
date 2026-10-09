// Draws the desktop /modz pane from a snapshot of the real marketplace, for bin/preview.
import { test } from 'claude-code/testing'

import { MARKET_FILES } from './market-fixture'

const PANE = { plugin: 'modz', component: 'Pane', requestId: 'modz', viewport: { columns: 100, rows: 40 }, props: { bodyColumns: 90 } } as const

for (const theme of ['dark', 'light']) {
  test(`preview: the modz pane (${theme})`, async ($, on) => {
    on('fs.stat', () => ({ value: { kind: 'directory', size: 0, mtimeMs: 0, isLink: false, realPath: '/m/mods/modz' } }))
    on('fs.read', (_, e) => {
      const text = MARKET_FILES[e.path]
      if (!text) throw new Error(`ENOENT ${e.path}`)

      return { value: text }
    })
    const names = Object.keys(MARKET_FILES).map(path => /mods\/([^/]+)\//.exec(path)?.[1]).filter(Boolean)
    on('settings.read', () => ({ value: { enabledPlugins: Object.fromEntries(names.map(name => [`${name}@modz`, true])) } }))
    on('command.register', () => ({ value: undefined }))
    on('ui.open', () => ({ value: { isPlaced: true } }))
    on('session.start', () => ({ cwd: '/work' }))
    on('config.list', () => ({ value: [{ key: 'theme', value: theme }] }))
    await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
    await $.command.run({ command: 'modz', args: '' })
    const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
    console.log(`@@TREE@@modz-pane${theme === 'light' ? '-light' : ''}@@${JSON.stringify(await ui.drawn())}`)
  })
}
