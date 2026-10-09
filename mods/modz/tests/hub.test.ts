import { expect, test } from 'claude-code/testing'

import { cardOf, focusOf, rowsOf } from '../hooks/hub'
import type { Presence } from '../hooks/hub'
import type { HubCard } from '../types'
import { stubWorld } from './world'

const PANE = { plugin: 'modz', component: 'Pane', requestId: 'modz', viewport: { columns: 100, rows: 40 }, props: { bodyColumns: 50 } } as const

const card = (pane: string, tone: HubCard['tone'], detail: string, at = 1): HubCard => ({ pane, tone, detail, at })

test('a card from another mod is kept only when it has the right shape', () => {
  expect(cardOf({ pane: 'agents', detail: '2 ajan çalışıyor', tone: 'live', at: 5 })).toEqual(card('agents', 'live', '2 ajan çalışıyor', 5))
  expect(cardOf({ pane: 'agents', detail: 'x', tone: 'loud' })).toBeNull()
  expect(cardOf('2 ajan')).toBeNull()
})

test('rows list listed mods in order, number them and always offer the catalog', () => {
  const rows = rowsOf({ 'savvy-progress': card('agents', 'live', '2 ajan çalışıyor') }, mod => (mod === 'savvy-progress' || mod === 'test-badge' ? 'listed' : 'off'))

  expect(rows.map(row => row.entry.pane)).toEqual(['agents', 'tests', 'modz-mods'])
  expect(rows.map(row => row.hotkey)).toEqual(['1', '2', '3'])
  expect(rows[0]?.card?.detail).toBe('2 ajan çalışıyor')
})

test('a pane shows only its own mod\'s card: a removed mod\'s leftover card is never drawn', () => {
  const cards = { 'agent-deck-pro': card('agents', 'bad', 'eski kart', 9), 'savvy-progress': card('agents', 'live', '1 ajan', 1) }
  const rows = rowsOf(cards, () => 'listed')
  expect(rows.find(row => row.entry.pane === 'agents')?.card?.detail).toBe('1 ajan')
  expect(focusOf(rows)?.row.card?.detail).toBe('1 ajan')

  const alone = rowsOf({ 'agent-deck-pro': card('agents', 'bad', 'eski kart') }, () => 'listed')
  expect(alone.find(row => row.entry.pane === 'agents')?.card).toBeNull()
  expect(focusOf(alone)).toBeNull()
})

test('a mod the catalog does not list shows once it reports; a switched-off mod stays hidden', () => {
  const cards = { 'test-badge': card('tests', 'ok', '42/42 geçti'), 'hud-pro': card('usage', 'idle', '5s %10') }
  const presence = (mod: string): Presence => (mod === 'hud-pro' ? 'off' : 'unlisted')
  const rows = rowsOf(cards, presence)

  expect(rows.map(row => row.entry.pane)).toEqual(['tests', 'modz-mods'])
})

test('the head leads with a failure before a warning before live work, and stays calm otherwise', () => {
  const all = (cards: Record<string, HubCard>) => rowsOf(cards, () => 'listed')

  expect(focusOf(all({ 'savvy-progress': card('agents', 'live', '2 ajan'), 'test-badge': card('tests', 'bad', '41/42 geçti') }))?.row.entry.pane).toBe('tests')
  expect(focusOf(all({ 'savvy-progress': card('agents', 'live', '2 ajan', 9), 'plan-steps': card('plan', 'live', '3/9 adım', 3) }))?.row.entry.pane).toBe('agents')
  expect(focusOf(all({ checkpoint: card('checkpoints', 'ok', '12 nokta') }))).toBeNull()
  expect(focusOf(all({ 'savvy-progress': card('agents', 'live', '') }))).toBeNull()
})

test('a tenth row still gets a digit: 0 after 9', () => {
  const rows = rowsOf({}, () => 'listed')

  expect(rows.length).toBeGreaterThanOrEqual(10)
  expect(rows[9]?.hotkey).toBe('0')
})

// Stand-ins for other mods: `/say <json>` writes that mod's hub line as the mod would. The engine
// reads a state reference off the source, so each spells its own literal.
const transceiverReporter = {
  name: 'transceiver',
  register(on: any) {
    on('command.run', { command: 'say' }, async ($: any, e: any, next: any) => {
      await $.state.set({ plugin: 'transceiver', key: 'hub' }, JSON.parse(e.args))

      return next(e)
    })
  },
}

const testsReporter = {
  name: 'test-badge',
  register(on: any) {
    on('command.run', { command: 'say' }, async ($: any, e: any, next: any) => {
      await $.state.set({ plugin: 'test-badge', key: 'hub' }, JSON.parse(e.args))

      return next(e)
    })
  },
}

test('the hub opens by itself at session start', async ($, on) => {
  const w = stubWorld(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })

  expect(w.opened).toEqual(['modz'])
})

test('with openOnStart off nothing opens until /modz', { options: { openOnStart: false } }, async ($: any, on: any) => {
  const w = stubWorld(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  expect(w.opened).toEqual([])
  await $.command.run({ command: 'modz', args: '' })

  expect(w.opened).toEqual(['modz'])
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`pressing a row asks its mod for a tab and keeps the hub open; Modlar opens its own tab (${surface})`, async ($: any, on: any) => {
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
    expect(w.opened).toEqual(['ask:agents'])

    await ui.press({ key: 'open-modz-mods' })
    expect(w.opened).toEqual(['ask:agents', 'modz-mods'])
    expect(await ui.find({ key: 'open-agents' })).toBeDefined()
    const catalog = await $.ui.mount({ ...PANE, requestId: 'modz-mods', surface })
    expect(await catalog.find({ key: 'mod-savvy-progress' })).toBeDefined()
  })

  test(`every drawing of the hub carries a new stamp, so the surface takes the live press handles (${surface})`, async ($: any, on: any) => {
    stubWorld(on)
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    const ui = await $.ui.mount({ ...PANE, surface })
    const first = (await ui.find({ key: 'render-stamp' }))?.text
    await ui.redraw()
    const second = (await ui.find({ key: 'render-stamp' }))?.text

    expect(first).toBeDefined()
    expect(second).not.toBe(first)
    expect((await ui.find({ key: 'render-stamp' }))?.props.display).toBe('none')
  })
}

test('Transceiver shows in Çalışma once it reports its line, and its row asks it to open', { plugins: [transceiverReporter] }, async ($: any, on: any) => {
  const asked: unknown[] = []
  on('state.set', { plugin: 'modz', key: 'open' }, (_: unknown, e: any, next: any) => {
    asked.push(e.value?.pane)

    return next(e)
  })
  stubWorld(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ key: 'open-transceiver' })).toBeUndefined()

  await $.command.run({ command: 'say', args: JSON.stringify(card('transceiver', 'live', '2 okunmamış · 3 oda')) })
  expect(await ui.find({ key: 'open-transceiver' })).toBeDefined()
  await ui.press({ key: 'open-transceiver' })
  expect(asked).toEqual(['transceiver'])
})

test('a card equal to the one kept is not written again, so the hub does not redraw for nothing', { plugins: [testsReporter] }, async ($: any, on: any) => {
  const writes: unknown[] = []
  on('state.set', { plugin: 'modz', key: 'cards' }, (_: unknown, e: any, next: any) => {
    writes.push(e.value)

    return next(e)
  })
  stubWorld(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  const line = card('tests', 'ok', '42/42 geçti', 7)
  const say = (value: HubCard) => $.command.run({ command: 'say', args: JSON.stringify(value) })
  await say(line)
  await say({ ...line })
  expect(writes).toHaveLength(1)

  await say(card('tests', 'bad', '41/42 geçti', 8))
  expect(writes).toHaveLength(2)
})
