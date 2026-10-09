// /browser end to end against a stand-in terminal-browser: missing or old installs, opening a page,
// the pane before its first frame (loading, then the bridge's error), input reaching the bridge,
// closing, and the agent's tools.
import { expect, mock, test } from 'claude-code/testing'

import { normalizeUrl } from '../hooks/urls'

type Post = { path: string; body: any }

type World = {
  installed: boolean
  caps: string[]
  states: object[]
  posts: Post[]
  opened: { id: string; title?: string; focus?: boolean }[]
  closed: string[]
  registered: string[]
  tools: string[]
}

const CAPS = ['embedding', 'image-frames']

const newWorld = (): World => ({ installed: true, caps: CAPS, states: [], posts: [], opened: [], closed: [], registered: [], tools: [] })

const PANE = {
  plugin: 'terminal-browser',
  component: 'Pane',
  requestId: 'browser',
  viewport: { columns: 100, rows: 30 },
  props: { title: 'Tarayıcı', isFocused: true, bodyColumns: 80, placement: 'inline', scroll: { offset: 0, bodyRows: 20 }, view: {} },
} as const

const bridgeState = (extra: object) => ({ version: 1, frame: null, title: '', url: null, alive: true, error: null, inbox: 0, ...extra })

function stubProcess(on: any, world: World) {
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

function stubUi(on: any, world: World) {
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

async function start($: any, on: any, spec: { world: World; surface: 'terminal' | 'desktop' }) {
  mock.clock(on)
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
}

const browser = ($: any, args: string) => $.command.run({ command: 'browser', args })

const shown = async (ui: any): Promise<string> => (await ui.findAll({ type: 'Text' })).map((found: any) => found.text).join('\n')

test('a typed address becomes a URL: local and bare IPs over http, the rest over https', () => {
  expect(normalizeUrl(' example.com ')).toBe('https://example.com')
  expect(normalizeUrl('localhost:3000/app')).toBe('http://localhost:3000/app')
  expect(normalizeUrl('127.0.0.1:8080')).toBe('http://127.0.0.1:8080')
  expect(normalizeUrl('file:///tmp/a.html')).toBe('file:///tmp/a.html')
  expect(normalizeUrl('example.com:8080/x')).toBe('https://example.com:8080/x')
  expect(normalizeUrl('http://example.com')).toBe('http://example.com')
  expect(normalizeUrl('about:blank')).toBe('about:blank')
})

test('without terminal-browser installed, /browser says how to get it and opens nothing', async ($, on) => {
  const world = { ...newWorld(), installed: false }
  await start($, on, { world, surface: 'terminal' })

  expect((await browser($, 'example.com'))?.text).toBe("Önce terminal-browser'ı kur: https://terminal-browser.sh")
  expect(world.opened).toEqual([])
})

test('an install without frame support is asked to upgrade', async ($, on) => {
  const world = { ...newWorld(), caps: ['embedding'] }
  await start($, on, { world, surface: 'terminal' })

  expect((await browser($, 'example.com'))?.text).toContain('terminal-browser upgrade')
  expect(world.opened).toEqual([])
})

test('/browser opens the page in a focused pane, sends its size, keys and closes it again', async ($, on) => {
  const world = newWorld()
  await start($, on, { world, surface: 'terminal' })

  expect((await browser($, 'example.com'))?.text).toBe('Tarayıcı açıldı: https://example.com')
  expect(world.opened[0]).toEqual({ id: 'browser', title: 'Tarayıcı', focus: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  console.log(`@@TREE@@pane-loading@@${JSON.stringify(await ui.drawn())}`)
  expect(await shown(ui)).toContain('Sayfa yükleniyor…')
  expect(await shown(ui)).toContain('https://example.com')

  // The pane's own Client reports its size on mount; the page opens at that size, later sizes resize it.
  expect(world.posts.find(post => post.path === '/open')?.body).toMatchObject({ url: 'https://example.com' })
  await ui.post({ type: 'size', cols: 70, rows: 18 })
  expect(world.posts.at(-1)).toEqual({ path: '/size', body: { cols: 70, rows: 18 } })
  await ui.key({ key: 'a' })
  await ui.advance(20)
  expect(world.posts.at(-1)?.path).toBe('/input')
  expect(world.posts.at(-1)?.body.events[0]).toMatchObject({ type: 'key', key: 'a', text: 'a' })

  expect((await browser($, ''))?.text).toBe('Tarayıcı kapatıldı')
  expect(world.closed).toEqual(['browser'])
  expect(world.posts.at(-1)?.path).toBe('/browser/close')
  expect((await browser($, 'close'))?.text).toBe('Tarayıcı zaten kapalı')
})

test('before its first frame the pane says why a page stopped, and how to try again', async ($, on) => {
  const world = newWorld()
  world.states.push(bridgeState({ url: 'https://nope.invalid', error: 'net::ERR_NAME_NOT_RESOLVED' }))
  await start($, on, { world, surface: 'terminal' })
  await browser($, 'nope.invalid')
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.post({ type: 'size', cols: 80, rows: 20 })

  console.log(`@@TREE@@pane-error@@${JSON.stringify(await ui.drawn())}`)
  const text = await shown(ui)
  expect(text).toContain('net::ERR_NAME_NOT_RESOLVED')
  expect(text).toContain('/browser ile yeniden dene')
  expect(text).not.toContain('Sayfa yükleniyor…')
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`the browser is the terminal's alone: the desktop gets no command and no drawing (${surface})`, async ($, on) => {
    const world = newWorld()
    await start($, on, { world, surface })
    if (surface === 'terminal') await browser($, 'localhost:3000')
    const ui = await $.ui.mount({ ...PANE, surface })

    if (surface === 'desktop') {
      expect(world.registered).not.toContain('browser')
      expect(await ui.find({ type: 'Text' })).toBeUndefined()
    } else {
      expect(world.registered).toContain('browser')
      expect(await ui.find({ type: 'Text', text: '● TARAYICI' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: 'http://localhost:3000' })).toBeDefined()
    }
  })
}

test('with the agent tool on, the model can open a page; a missing install is a clear refusal', { options: { agentTool: true } }, async ($, on) => {
  const world = { ...newWorld(), installed: false }
  await start($, on, { world, surface: 'terminal' })

  expect(world.tools).toEqual(['open', 'close'])
  const result = await $.tool.call({ tool: 'mcp__terminal-browser__open', url: 'example.com' })
  expect(String((result as any).deny ?? (result as any).text)).toContain('terminal-browser')
})
