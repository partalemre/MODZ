import { mock } from 'claude-code/testing'

import { MARKET_FILES } from './market-fixture'

// The engine the hub tests stand in: the catalog read from the market fixture, every mod in it switched
// on, and the panes the hub asks for recorded. A test that mocks the clock itself says so. The hub
// speaks Turkish unless a test hands it another env (an empty one draws English); `files` replaces the fixture;
// `settings` joins the settings it reads.
type WorldOptions = { hasOwnClock?: boolean; env?: Record<string, string>; files?: Record<string, string>; settings?: Record<string, unknown> }

export function stubWorld(on: any, options: WorldOptions = {}) {
  const files = options.files ?? MARKET_FILES
  const opened: string[] = []
  const titles: Record<string, string> = {}
  // The panes up now, the shown one last, and every open that asked for the keyboard.
  const up: string[] = []
  const focused: string[] = []
  const drop = (id: string) => up.includes(id) && up.splice(up.indexOf(id), 1)
  mock.env(on, options.env ?? { MODZ_LANG: 'tr' })
  on('fs.stat', () => ({ value: { kind: 'directory', size: 0, mtimeMs: 0, isLink: false, realPath: '/m/mods/modz' } }))
  on('fs.read', (_: unknown, e: { path: string }) => {
    const text = files[e.path]
    if (!text) throw new Error(`ENOENT ${e.path}`)

    return { value: text }
  })
  const names = Object.keys(MARKET_FILES).map(path => /mods\/([^/]+)\//.exec(path)?.[1]).filter(Boolean)
  on('settings.read', () => ({ value: { ...options.settings, enabledPlugins: Object.fromEntries(names.map(name => [`${name}@modz`, true])) } }))
  on('command.register', () => ({ value: undefined }))
  on('ui.open', (_: unknown, e: { id: string; title?: string; focus?: true }) => {
    opened.push(e.id)
    titles[e.id] = e.title ?? ''
    drop(e.id)
    up.push(e.id)
    if (e.focus) focused.push(e.id)

    return { value: { isPlaced: true } }
  })
  on('ui.close', (_: unknown, e: { id: string }) => {
    opened.push(`close:${e.id}`)
    drop(e.id)

    return { value: undefined }
  })
  on('ui.panes', () => ({ value: up.map((id, i) => ({ id, title: titles[id], isShown: i === up.length - 1, isFocused: false, isPlaced: true })) }))
  on('session.start', () => ({ cwd: '/work' }))
  on('config.list', () => ({ value: [] }))
  if (!options.hasOwnClock) on('clock.now', () => ({ value: 1_000 }))
  on('command.run', () => ({ text: '' }))

  return { opened, titles, up, focused }
}
