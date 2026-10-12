import { mock } from 'claude-code/testing'

// The session the browser tests stand in: a stand-in terminal-browser install and bridge, and the panes,
// commands and tools the mod asks for, recorded. `start` hands back the mocked clock.

type Post = { path: string; body: any }

export type World = {
  installed: boolean
  caps: string[]
  states: object[]
  posts: Post[]
  opened: { id: string; title?: string; focus?: boolean }[]
  closed: string[]
  registered: string[]
  tools: string[]
}

export const CAPS = ['embedding', 'image-frames']

export const newWorld = (): World => ({ installed: true, caps: CAPS, states: [], posts: [], opened: [], closed: [], registered: [], tools: [] })

export const PANE = {
  plugin: 'terminal-browser',
  component: 'Pane',
  requestId: 'browser',
  viewport: { columns: 100, rows: 30 },
  props: { title: 'Tarayıcı', isFocused: true, bodyColumns: 80, placement: 'inline', scroll: { offset: 0, bodyRows: 20 }, view: {} },
} as const

export const bridgeState = (extra: object) => ({ version: 1, frame: null, title: '', url: null, alive: true, error: null, inbox: 0, ...extra })

export function stubProcess(on: any, world: World) {
  on('fs.exists', () => ({ value: false }))
  on('process.run', (_: unknown, e: { argv: readonly string[] }) => {
    if (!world.installed) throw new Error('ENOENT terminal-browser')
    if (e.argv.includes('capabilities')) return { value: { exitCode: 0, stdout: `${JSON.stringify({ capabilities: world.caps })}\n`, stderr: '' } }

    return { value: { exitCode: 0, stdout: `${JSON.stringify({ port: 7700, token: 't0k' })}\n`, stderr: '' } }
  })
  // The bridge's long poll answers each queued state once, then fails, so the watcher sleeps on the mocked clock.
  on('http.fetch', (_: unknown, e: { url: string; init?: { body?: string } }) => {
    const path = e.url.replace('http://127.0.0.1:7700', '').replace(/\?.*$/, '')
    if (path === '/state') {
      const next = world.states.shift()

      return { value: next === undefined ? { status: 503, ok: false, headers: {}, text: '' } : { status: 200, ok: true, headers: {}, text: JSON.stringify(next) } }
    }
    world.posts.push({ path, body: JSON.parse(e.init?.body ?? '{}') })

    return { value: { status: 200, ok: true, headers: {}, text: '{}' } }
  })
}

export function stubUi(on: any, world: World) {
  on('ui.open', (_: unknown, e: { id: string; title?: string; focus?: boolean }) => {
    world.opened.push({ id: e.id, title: e.title, focus: e.focus })

    return { value: { isPlaced: true } }
  })
  on('ui.close', (_: unknown, e: { id: string }) => {
    world.closed.push(e.id)

    return { value: undefined }
  })
  on('ui.log', () => ({ value: undefined }))
  on('ui.blit', () => ({ value: {} }))
}

// The Turkish tests run with MODZ_LANG=tr; an English test passes `lang: 'en'` and leaves the variable unset.
export async function start($: any, on: any, spec: { world: World; surface: 'terminal' | 'desktop'; lang?: 'en' | 'tr' }) {
  const clock = mock.clock(on)
  mock.env(on, spec.lang === 'en' ? {} : { MODZ_LANG: 'tr' })
  on('session.surfaces', () => ({ value: [spec.surface] }))
  on('session.start', () => ({ cwd: '/work' }))
  on('command.register', (_: unknown, e: { name: string }) => {
    spec.world.registered.push(e.name)

    return { value: undefined }
  })
  on('tool.register', (_: unknown, e: { name: string }) => {
    spec.world.tools.push(e.name)

    return { value: undefined }
  })
  stubProcess(on, spec.world)
  stubUi(on, spec.world)
  await $.session.start({ surface: spec.surface, isInteractive: true, cwd: '/work' })

  return clock
}

export const browser = ($: any, args: string) => $.command.run({ command: 'browser', args })

export const shown = async (ui: any): Promise<string> => (await ui.findAll({ type: 'Text' })).map((found: any) => found.text).join('\n')
