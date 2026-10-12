import type { On } from 'claude-code'
import { mock } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

// The engine skins runs against on the desktop: a dark theme, nothing stored, 42% context used.

type Opened = { id: string; title?: string; focus?: boolean }

const themeRow = (value: string) => [{ key: 'theme', label: 'Theme', kind: 'enum', value, provider: { kind: 'engine' }, isLocked: false }]

export function stubEngine(on: On, theme = 'dark') {
  const clock = mock.clock(on, { now: 10_000 })
  const world = { opens: [] as Opened[], cards: [] as unknown[], clock }
  on('session.cwd', () => ({ value: '/work' }))
  on('env.get', ($, e) => ({ value: e.name === 'MODZ_LANG' ? 'tr' : undefined }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('config.list', () => ({ value: themeRow(theme) as never }))
  on('ui.toast', () => ({ value: undefined }))
  on('ui.open', ($, e) => {
    world.opens.push(e as Opened)

    return { value: { isPlaced: true } }
  })
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000, percent: 42 }, rateLimits: [] } }))
  on('session.start', () => ({ cwd: '/work' }))
  on('command.register', () => ({ value: { command: 'skin' } }))
  on('tool.register', () => ({ value: { tool: 'mcp__skins__design' } }))
  on('state.set', { plugin: 'skins', key: 'hub' }, ($, e, next) => {
    world.cards.push(e.value)

    return next(e)
  })

  return world
}

export const start = ($: Engine) => $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })

export const runSkin = ($: Engine, args: string) =>
  $.command.run({ command: 'skin', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 100 } })
