import { expect, mock, test } from 'claude-code/testing'

import { DEFAULT_PREFS, parsePrefs, runSkinCommand } from '../hooks/command'
import { skinNames } from '../hooks/custom'
import { BAND_OFF_KEY, bandOffWrites } from '../hooks/migrate'
import { SKINS } from '../hooks/themes'

const NAMES = skinNames({})

test('Tidemark is the first built-in skin and the default only when nothing was chosen', async () => {
  expect(SKINS[0]?.name).toBe('tidemark')
  expect(DEFAULT_PREFS.skin).toBe('tidemark')
  expect(parsePrefs(undefined, NAMES).skin).toBe('tidemark')
  expect(parsePrefs({ skin: 'nord' }, NAMES).skin).toBe('nord')
  expect(parsePrefs({ skin: 'off' }, NAMES).skin).toBe('off')
})

test('the usage band starts off and /skin band on turns it on', async () => {
  expect(DEFAULT_PREFS.band).toBe(false)
  expect(parsePrefs(undefined, NAMES).band).toBe(false)
  expect(runSkinCommand('band on', DEFAULT_PREFS, NAMES).prefs.band).toBe(true)
})

test('the band migration writes back only the keys that hold prefs, then the marker', async () => {
  expect(bandOffWrites(undefined, undefined, undefined)).toEqual([[BAND_OFF_KEY, true]])
  expect(bandOffWrites(undefined, { skin: 'nord', band: true }, { '/a': { band: true }, '/b': { skin: 'mono' } })).toEqual([
    ['prefs', { skin: 'nord', band: false }],
    ['folders', { '/a': { band: false }, '/b': { skin: 'mono', band: false } }],
    [BAND_OFF_KEY, true],
  ])
  expect(bandOffWrites(true, { band: true }, undefined)).toEqual([])
})

test('on load the band migration runs once, so a band turned back on stays on', async ($, on) => {
  const store: Record<string, unknown> = { prefs: { skin: 'dracula', band: true }, folders: { '/work': { band: true } } }
  mock.clock(on, { now: 10_000 })
  on('session.cwd', () => ({ value: '/work' }))
  on('env.get', () => ({ value: undefined }))
  on('config.list', () => ({ value: [] }))
  on('store.get', ($, e) => ({ value: store[e.key] }))
  on('store.set', ($, e) => {
    store[e.key] = e.value
    return { value: undefined }
  })
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000, percent: 42 }, rateLimits: [] } }))
  on('session.start', () => ({ cwd: '/work' }))
  on('command.register', () => ({ value: { command: 'skin' } }))
  on('tool.register', () => ({ value: { tool: 'mcp__skins__design' } }))

  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect(store.prefs).toEqual({ skin: 'dracula', band: false })
  expect(store.folders).toEqual({ '/work': { band: false } })
  expect(store[BAND_OFF_KEY]).toBe(true)

  store.prefs = { skin: 'dracula', band: true }
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect(store.prefs).toEqual({ skin: 'dracula', band: true })
})
