import { expect, test } from 'claude-code/testing'

import { autoUpdateSettings, installOf } from '../hooks/auto-update'

const GITHUB = { source: 'github', repo: 'partalemre/MODZ' }
const settings = (value: object) => JSON.stringify(value, null, 2)
const known = (value: object) => JSON.stringify(value)
const written = (text: string | undefined) => JSON.parse(String(text))

test('an installed copy names its marketplace and plugins folder; one loaded in place has none', () => {
  expect(installOf('/Users/a/.claude/plugins/cache/modz/hud-pro/0f3a9c21b7d4')).toEqual({ market: 'modz', pluginsDir: '/Users/a/.claude/plugins' })
  expect(installOf('C:\\Users\\a\\.claude\\plugins\\cache\\modz\\modz\\1.0.0\\')).toEqual({ market: 'modz', pluginsDir: 'C:/Users/a/.claude/plugins' })
  expect(installOf('/Users/a/Projects/MODZ/mods/modz')).toBeUndefined()
  expect(installOf('/Users/a/.claude/skills/modz')).toBeUndefined()
})

test('a declared marketplace gets autoUpdate and every other setting stays as it was', () => {
  const before = { theme: 'dark', env: { MODZ_LANG: 'tr' }, extraKnownMarketplaces: { modz: { source: GITHUB }, other: { source: GITHUB } } }
  const after = written(autoUpdateSettings({ market: 'modz', settingsText: settings(before), knownText: undefined }))

  expect(after).toEqual({ ...before, extraKnownMarketplaces: { modz: { source: GITHUB, autoUpdate: true }, other: { source: GITHUB } } })
})

test('a choice already made is kept, true or false', () => {
  for (const autoUpdate of [true, false]) {
    const text = settings({ extraKnownMarketplaces: { modz: { source: GITHUB, autoUpdate } } })
    expect(autoUpdateSettings({ market: 'modz', settingsText: text, knownText: undefined })).toBeUndefined()
  }
})

test('settings that do not declare it borrow the source the marketplace was added from', () => {
  const knownText = known({ modz: { source: GITHUB, installLocation: '/x', lastUpdated: '' } })
  const fromNothing = written(autoUpdateSettings({ market: 'modz', settingsText: undefined, knownText }))
  const fromOthers = written(autoUpdateSettings({ market: 'modz', settingsText: settings({ model: 'opus' }), knownText }))

  expect(fromNothing).toEqual({ extraKnownMarketplaces: { modz: { source: GITHUB, autoUpdate: true } } })
  expect(fromOthers).toEqual({ model: 'opus', extraKnownMarketplaces: { modz: { source: GITHUB, autoUpdate: true } } })
})

test('a local folder marketplace, an unknown one or unreadable settings are left alone', () => {
  const local = { source: 'directory', path: '/Users/a/Projects/MODZ' }

  expect(autoUpdateSettings({ market: 'modz', settingsText: settings({ extraKnownMarketplaces: { modz: { source: local } } }), knownText: undefined })).toBeUndefined()
  expect(autoUpdateSettings({ market: 'modz', settingsText: '{}', knownText: known({ modz: { source: local } }) })).toBeUndefined()
  expect(autoUpdateSettings({ market: 'modz', settingsText: '{}', knownText: '{}' })).toBeUndefined()
  expect(autoUpdateSettings({ market: 'modz', settingsText: '{ "a": 1, // note', knownText: known({ modz: { source: GITHUB } }) })).toBeUndefined()
  expect(autoUpdateSettings({ market: '', settingsText: '{}', knownText: known({ '': { source: GITHUB } }) })).toBeUndefined()
})
