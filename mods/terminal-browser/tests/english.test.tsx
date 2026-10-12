// Without MODZ_LANG the browser speaks English: the command's answers, the pane before its first frame, and
// the install errors. The desktop still draws nothing.
import { expect, test } from 'claude-code/testing'

import { PANE, bridgeState, browser, newWorld, shown, start } from './world'

const TURKISH_ONLY = /[çğıöşüİ]/

test('in English /browser opens and closes the pane and the pane says it is loading (terminal)', async ($, on) => {
  const world = newWorld()
  await start($, on, { world, surface: 'terminal', lang: 'en' })

  expect((await browser($, 'example.com'))?.text).toBe('Browser opened: https://example.com')
  expect(world.opened[0]).toEqual({ id: 'browser', title: 'Browser', focus: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const text = await shown(ui)
  expect(text).toContain('● BROWSER')
  expect(text).toContain('Loading the page…')
  expect(text).not.toMatch(TURKISH_ONLY)

  expect((await browser($, ''))?.text).toBe('Browser closed')
  expect((await browser($, 'close'))?.text).toBe('The browser is already closed')
})

test('in English a stopped page says how to try again, and the start page has its name (terminal)', async ($, on) => {
  const world = newWorld()
  world.states.push(bridgeState({ url: null, error: 'net::ERR_FAILED' }))
  await start($, on, { world, surface: 'terminal', lang: 'en' })

  expect((await browser($, ''))?.text).toBe('Browser opened: start page')
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.post({ type: 'size', cols: 80, rows: 20 })
  const text = await shown(ui)
  expect(text).toContain('Start page')
  expect(text).toContain('Try again with /browser · /browser close closes it')
  expect(text).not.toMatch(TURKISH_ONLY)
})

test('in English a missing or old install says what to do', async ($, on) => {
  const world = { ...newWorld(), caps: ['embedding'] }
  await start($, on, { world, surface: 'terminal', lang: 'en' })

  expect((await browser($, 'example.com'))?.text).toBe('This needs a newer terminal-browser: run terminal-browser upgrade')
  world.installed = false
  expect((await browser($, 'example.com'))?.text).toBe('Install terminal-browser first: https://terminal-browser.sh')
})

test('in English the desktop still gets no command and no drawing (desktop)', async ($, on) => {
  const world = newWorld()
  await start($, on, { world, surface: 'desktop', lang: 'en' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  expect(world.registered).not.toContain('browser')
  expect(await ui.find({ type: 'Text' })).toBeUndefined()
})
