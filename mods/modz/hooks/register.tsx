import type { EngineInterface, Register } from 'claude-code'

import { loadCatalog, marketRoot } from './catalog'
import { modzTree } from './pane'
import type { Theme } from './theme'

const PANE = 'modz'
const TITLE = 'MODZ'

// Claude Code's theme names say light or dark; anything else follows the system in the Svg.
function themeOf(value: unknown): Theme {
  const name = String(value ?? '').toLowerCase()
  if (name.includes('light')) return 'light'

  return name.includes('dark') ? 'dark' : 'auto'
}

async function enabledPlugins($: EngineInterface): Promise<Record<string, unknown>> {
  try {
    const value = (await $.settings.read()).enabledPlugins

    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  } catch {
    $.ui.log('modz: settings could not be read; enabled state unknown', { to: 'debug' })

    return {}
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'modz',
      description: 'MODZ pazarındaki modları gruplara ayrılmış bir panelde gösterir',
    })

    return next(e)
  })

  on('command.run', { command: 'modz' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE })

    return { text: 'MODZ paneli açıldı.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const stat = await $.fs.stat($.plugin.root, { resolve: true }).catch(() => undefined)
    const root = marketRoot(stat?.realPath ?? $.plugin.root)
    const market = await loadCatalog(path => $.fs.read(path), root, await enabledPlugins($))
    const theme = themeOf((await $.config.list()).find(row => row.key === 'theme')?.value)

    return modzTree($.ui.resolve(e), { market, surface: e.surface, columns: e.props.bodyColumns || e.viewport?.columns || 80, theme })
  })
}
