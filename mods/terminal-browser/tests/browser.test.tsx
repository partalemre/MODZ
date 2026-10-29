// /browser end to end against a stand-in terminal-browser: missing or old installs, opening a page,
// the pane before its first frame (loading, then the bridge's error), input reaching the bridge,
// closing, and the agent's tools.
import { expect, test } from 'claude-code/testing'

import { normalizeUrl } from '../hooks/urls'
import { PANE, bridgeState, browser, newWorld, shown, start } from './world'

/** The test runner's console: bin/preview reads the trees it prints. */
declare const console: { log: (text: string) => void }

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
      expect(await ui.find({ type: 'Text', text: 'Tarayıcı' })).toBeDefined()
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
