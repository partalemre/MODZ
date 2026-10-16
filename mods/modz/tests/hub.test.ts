import { expect, test } from 'claude-code/testing'

import { cardOf, focusOf, presenceOf, rowsOf } from '../hooks/hub'
import type { Presence } from '../hooks/hub'
import type { HubCard } from '../types'
import { stubWorld } from './world'

const PANE = { plugin: 'modz', component: 'Pane', requestId: 'modz', viewport: { columns: 100, rows: 40 }, props: { bodyColumns: 50 } } as const

const card = (pane: string, look: { tone: HubCard['tone']; detail: string; at?: number }): HubCard => ({ pane, at: 1, ...look })

test('a card from another mod is kept only when it has the right shape', () => {
  expect(cardOf({ pane: 'agents', detail: '2 ajan çalışıyor', tone: 'live', at: 5 })).toEqual(card('agents', { tone: 'live', detail: '2 ajan çalışıyor', at: 5 }))
  expect(cardOf({ pane: 'agents', detail: 'x', tone: 'loud' })).toBeNull()
  expect(cardOf('2 ajan')).toBeNull()
})

test('rows list listed mods in order, number them and always offer the catalog', () => {
  const rows = rowsOf({ 'savvy-progress': card('agents', { tone: 'live', detail: '2 ajan çalışıyor' }) }, mod => (mod === 'savvy-progress' || mod === 'test-badge' ? 'listed' : 'off'))

  expect(rows.map(row => row.entry.pane)).toEqual(['agents', 'tests', 'modz-mods'])
  expect(rows.map(row => row.hotkey)).toEqual(['1', '2', '3'])
  expect(rows[0]?.card?.detail).toBe('2 ajan çalışıyor')
})

test('a pane shows only its own mod\'s card: a removed mod\'s leftover card is never drawn', () => {
  const cards = { 'agent-deck-pro': card('agents', { tone: 'bad', detail: 'eski kart', at: 9 }), 'savvy-progress': card('agents', { tone: 'live', detail: '1 ajan', at: 1 }) }
  const rows = rowsOf(cards, () => 'listed')
  expect(rows.find(row => row.entry.pane === 'agents')?.card?.detail).toBe('1 ajan')
  expect(focusOf(rows)?.row.card?.detail).toBe('1 ajan')

  const alone = rowsOf({ 'agent-deck-pro': card('agents', { tone: 'bad', detail: 'eski kart' }) }, () => 'listed')
  expect(alone.find(row => row.entry.pane === 'agents')?.card).toBeNull()
  expect(focusOf(alone)).toBeNull()
})

test('a mod the catalog does not list shows once it reports; a switched-off mod stays hidden', () => {
  const cards = { 'test-badge': card('tests', { tone: 'ok', detail: '42/42 geçti' }), 'hud-pro': card('usage', { tone: 'idle', detail: '5s %10' }) }
  const presence = (mod: string): Presence => (mod === 'hud-pro' ? 'off' : 'unlisted')
  const rows = rowsOf(cards, presence)

  expect(rows.map(row => row.entry.pane)).toEqual(['tests', 'modz-mods'])
})

test('the head leads with a failure before a warning before live work, and stays calm otherwise', () => {
  const all = (cards: Record<string, HubCard>) => rowsOf(cards, () => 'listed')

  expect(focusOf(all({ 'savvy-progress': card('agents', { tone: 'live', detail: '2 ajan' }), 'test-badge': card('tests', { tone: 'bad', detail: '41/42 geçti' }) }))?.row.entry.pane).toBe('tests')
  expect(focusOf(all({ 'savvy-progress': card('agents', { tone: 'live', detail: '2 ajan', at: 9 }), 'plan-steps': card('plan', { tone: 'live', detail: '3/9 adım', at: 3 }) }))?.row.entry.pane).toBe('agents')
  expect(focusOf(all({ checkpoint: card('checkpoints', { tone: 'ok', detail: '12 nokta' }) }))).toBeNull()
  expect(focusOf(all({ 'savvy-progress': card('agents', { tone: 'live', detail: '' }) }))).toBeNull()
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

// A mod's answer to the hub's open request, as every MODZ mod gives it once its pane is open: `/shown <pane>`.
// A stand-in loads beneath the hub and so never hears the hub's own write; the test says when it answers.
const agentsMod = {
  name: 'savvy-progress',
  register(on: any) {
    on('command.run', { command: 'shown' }, async ($: any, e: any, next: any) => {
      await $.state.set({ plugin: 'savvy-progress', key: 'shown' }, { pane: e.args, at: 1 })

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

  expect(w.opened).toEqual(['modz', 'close:modz-mods'])
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`pressing a row swaps the panel to that mod and the catalog swaps with the hub (${surface})`, { plugins: [agentsMod] }, async ($: any, on: any) => {
    const w = stubWorld(on)
    const asked: unknown[] = []
    on('state.set', { plugin: 'modz', key: 'open' }, (_: unknown, e: any, next: any) => {
      asked.push(e.value?.pane)

      return next(e)
    })
    const staged: unknown[] = []
    on('state.set', { plugin: 'modz', key: 'stage' }, (_: unknown, e: any, next: any) => {
      staged.push(e.value?.pane)

      return next(e)
    })
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    const ui = await $.ui.mount({ ...PANE, surface })
    w.opened.length = 0
    await ui.press({ key: 'open-agents' })
    expect(asked).toEqual(['agents'])
    expect(w.opened).toEqual([])
    await $.command.run({ command: 'shown', args: 'agents' })
    expect(w.opened).toEqual(['close:modz', 'close:modz-mods'])
    expect(staged).toEqual(['agents'])

    await $.command.run({ command: 'modz', args: '' })
    expect(staged).toEqual(['agents', 'modz'])
    w.opened.length = 0
    await ui.press({ key: 'open-modz-mods' })
    expect(w.opened).toEqual(['modz-mods', 'close:modz'])
    expect(staged).toEqual(['agents', 'modz', 'modz-mods'])
    const catalog = await $.ui.mount({ ...PANE, requestId: 'modz-mods', surface })
    expect(await catalog.find({ key: 'mod-savvy-progress' })).toBeDefined()
  })

  test(`a mod that does not answer leaves the hub in the panel (${surface})`, async ($: any, on: any) => {
    const w = stubWorld(on)
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    const ui = await $.ui.mount({ ...PANE, surface })
    w.opened.length = 0
    await ui.press({ key: 'open-agents' })
    expect(w.opened).toEqual([])
    expect(await ui.find({ key: 'open-agents' })).toBeDefined()
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

  await $.command.run({ command: 'say', args: JSON.stringify(card('transceiver', { tone: 'live', detail: '2 okunmamış · 3 oda' })) })
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
  const line = card('tests', { tone: 'ok', detail: '42/42 geçti', at: 7 })
  const say = (value: HubCard) => $.command.run({ command: 'say', args: JSON.stringify(value) })
  await say(line)
  await say({ ...line })
  expect(writes).toHaveLength(1)

  await say(card('tests', { tone: 'bad', detail: '41/42 geçti', at: 8 }))
  expect(writes).toHaveLength(2)
})

test('a marketplace mod shows only once it is on or reports; nobody saying means not drawn yet', () => {
  const market = { name: 'modz', mods: [
    { name: 'filetree', isEnabled: true }, { name: 'checkpoint', isEnabled: false }, { name: 'hud-pro', isEnabled: null },
  ] } as any
  const presence = presenceOf(market)
  expect([presence('filetree'), presence('checkpoint'), presence('hud-pro'), presence('transceiver')]).toEqual(['listed', 'off', 'unlisted', 'unlisted'])
})

// Every element beneath a found one, depth first.
function beneath(element: any): any[] {
  const children = [element?.children ?? element?.props?.children ?? []].flat(Infinity).filter((child: any) => typeof child === 'object' && child !== null)

  return children.flatMap((child: any) => [child, ...beneath(child)])
}

test('on the desktop each row is one surface: its button sits over the drawing\'s right edge, and a status dot rides the tile', { plugins: [transceiverReporter] }, async ($: any, on: any) => {
  stubWorld(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'say', args: JSON.stringify(card('transceiver', { tone: 'live', detail: '2 okunmamış' })) })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const inside = beneath(await ui.find({ type: 'Box', key: 'row-transceiver' }))
  const drawing = inside.find(element => element.type === 'Svg')
  const over = inside.find(element => element.type === 'Box' && element.props?.position === 'absolute')
  expect(drawing?.props?.isInteractive).toBe(true)
  expect(beneath(over).some(element => element.props?.key === 'open-transceiver')).toBe(true)
  // A row is not a whole number of cells tall: the button spans it and centres, never pinned a cell from its top.
  expect(over?.props).toMatchObject({ top: 0, bottom: 0, alignItems: 'center' })
  expect(String(drawing?.props?.source)).toContain('m-ripple')
  expect(String(drawing?.props?.source)).not.toMatch(/class="[^"]*breathe/)
})

test('on the desktop the head gives its focus button a band of its own, in an even bottom-right corner', { plugins: [transceiverReporter] }, async ($: any, on: any) => {
  stubWorld(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const idleHead = beneath(await ui.find({ type: 'Box', key: 'head-card' })).find(element => element.type === 'Svg')
  await $.command.run({ command: 'say', args: JSON.stringify(card('transceiver', { tone: 'live', detail: '2 okunmamış' })) })
  const inside = beneath(await ui.find({ type: 'Box', key: 'head-card' }))
  const head = inside.find(element => element.type === 'Svg')
  const over = inside.find(element => element.type === 'Box' && element.props?.position === 'absolute')

  expect(beneath(over).some(element => element.props?.key === 'open-focus')).toBe(true)
  expect(over?.props).toMatchObject({ bottom: 1, right: 2 })
  expect(head?.props?.height).toBeGreaterThan(idleHead?.props?.height)
})
