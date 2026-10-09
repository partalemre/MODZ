import { expect, test } from 'claude-code/testing'

import { cardOf, focusOf, rowsOf } from '../hooks/hub'
import type { HubCard } from '../types'
import { MARKET_FILES } from './market-fixture'

const PANE = { plugin: 'modz', component: 'Pane', requestId: 'modz', viewport: { columns: 100, rows: 40 }, props: { bodyColumns: 50 } } as const

const card = (pane: string, tone: HubCard['tone'], detail: string, at = 1): HubCard => ({ pane, tone, detail, at })

test('a card from another mod is kept only when it has the right shape', () => {
  expect(cardOf({ pane: 'agents', detail: '2 ajan çalışıyor', tone: 'live', at: 5 })).toEqual(card('agents', 'live', '2 ajan çalışıyor', 5))
  expect(cardOf({ pane: 'agents', detail: 'x', tone: 'loud' })).toBeNull()
  expect(cardOf('2 ajan')).toBeNull()
})

test('rows list installed mods in order, number the first nine and always offer the catalog', () => {
  const rows = rowsOf({ agents: card('agents', 'live', '2 ajan çalışıyor') }, mod => mod === 'savvy-progress' || mod === 'test-badge')

  expect(rows.map(row => row.entry.pane)).toEqual(['agents', 'tests', 'mods'])
  expect(rows.map(row => row.hotkey)).toEqual(['1', '2', '3'])
  expect(rows[0]?.card?.detail).toBe('2 ajan çalışıyor')
})

test('the head leads with a failure before a warning before live work, and stays calm otherwise', () => {
  const all = (cards: Record<string, HubCard>) => rowsOf(cards, () => true)

  expect(focusOf(all({ a: card('agents', 'live', '2 ajan'), t: card('tests', 'bad', '41/42 geçti') }))?.row.entry.pane).toBe('tests')
  expect(focusOf(all({ a: card('agents', 'live', '2 ajan', 9), p: card('plan', 'live', '3/9 adım', 3) }))?.row.entry.pane).toBe('agents')
  expect(focusOf(all({ c: card('checkpoints', 'ok', '12 nokta') }))).toBeNull()
  expect(focusOf(all({ a: card('agents', 'live', '') }))).toBeNull()
})

function stubWorld(on: any) {
  const opened: string[] = []
  on('fs.stat', () => ({ value: { kind: 'directory', size: 0, mtimeMs: 0, isLink: false, realPath: '/m/mods/modz' } }))
  on('fs.read', (_: unknown, e: { path: string }) => {
    const text = MARKET_FILES[e.path]
    if (!text) throw new Error(`ENOENT ${e.path}`)

    return { value: text }
  })
  const names = Object.keys(MARKET_FILES).map(path => /mods\/([^/]+)\//.exec(path)?.[1]).filter(Boolean)
  on('settings.read', () => ({ value: { enabledPlugins: Object.fromEntries(names.map(name => [`${name}@modz`, true])) } }))
  on('command.register', () => ({ value: undefined }))
  on('ui.open', (_: unknown, e: { id: string }) => {
    opened.push(e.id)

    return { value: { isPlaced: true } }
  })
  on('ui.close', (_: unknown, e: { id: string }) => {
    opened.push(`close:${e.id}`)

    return { value: undefined }
  })
  on('session.start', () => ({ cwd: '/work' }))
  on('config.list', () => ({ value: [] }))
  on('clock.now', () => ({ value: 1_000 }))

  return { opened }
}

test('the hub opens by itself at session start', async ($, on) => {
  const w = stubWorld(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })

  expect(w.opened).toEqual(['modz'])
})

test('with openOnStart off nothing opens until /modz', { options: { openOnStart: false } }, async ($, on) => {
  const w = stubWorld(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  expect(w.opened).toEqual([])
  await $.command.run({ command: 'modz', args: '' })

  expect(w.opened).toEqual(['modz'])
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`pressing a row asks its mod to open the pane; Modlar shows the catalog (${surface})`, async ($, on) => {
    const w = stubWorld(on)
    const asked: unknown[] = []
    on('state.set', { plugin: 'modz', key: 'open' }, (_: unknown, e: any, next: any) => {
      asked.push(e.value?.pane)
      w.opened.push(`ask:${e.value?.pane}`)

      return next(e)
    })
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    const ui = await $.ui.mount({ ...PANE, surface })
    w.opened.length = 0
    await ui.press({ key: 'open-agents' })
    expect(asked).toEqual(['agents'])
    // The hub lets go of the keyboard (closed, back as a tab) before asking, so the new pane comes to the front.
    expect(w.opened).toEqual(['close:modz', 'modz', 'ask:agents'])

    await ui.press({ key: 'open-mods' })
    expect(await ui.find({ key: 'home' })).toBeDefined()
    expect(await ui.find({ key: 'mod-savvy-progress' })).toBeDefined()

    await ui.press({ key: 'home' })
    expect(await ui.find({ key: 'open-mods' })).toBeDefined()
  })
}
