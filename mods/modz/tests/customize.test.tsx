// The person arranges the hub (move a row up, hide it, show it again, reset), kept across sessions; a mod the
// hub does not know gets a row from its own card; Transceiver wears its Beta badge; any mod's "← MODZ" brings the hub back.
import { expect, mock, test } from 'claude-code/testing'

import { cardOf, rowsOf } from '../hooks/hub'
import { arrange, EMPTY_LAYOUT, layoutOf, moveUp, setHidden } from '../hooks/layout'
import type { HubCard } from '../types'
import { stubWorld } from './world'

const PANE = { plugin: 'modz', component: 'Pane', requestId: 'modz', viewport: { columns: 100, rows: 40 }, props: { bodyColumns: 60 } } as const
const ENGLISH = {}

const card = (pane: string, more: Partial<HubCard> = {}): HubCard => ({ pane, detail: '', tone: 'idle', at: 1, ...more })
const panes = (rows: { entry: { pane: string } }[]) => rows.map(row => row.entry.pane)

test('a stored layout is read back whole, and anything malformed counts as none', () => {
  expect(layoutOf({ hidden: ['tests', 'tests', 7, 'bad id!'], order: ['files'] })).toEqual({ hidden: ['tests'], order: ['files'] })
  expect(layoutOf('nope')).toEqual(EMPTY_LAYOUT)
  expect(layoutOf(null)).toEqual(EMPTY_LAYOUT)
})

test('moving a row up swaps it with the one above; the first row stays; the rest keep their order', () => {
  const work = ['agents', 'files', 'plan']
  const moved = moveUp(EMPTY_LAYOUT, { panes: work, pane: 'plan' })

  expect(moved.order).toEqual(['agents', 'plan', 'files'])
  expect(moveUp(EMPTY_LAYOUT, { panes: work, pane: 'agents' })).toEqual(EMPTY_LAYOUT)
  expect(arrange(work.map(pane => ({ pane })), moved).map(item => item.pane)).toEqual(['agents', 'plan', 'files'])
  expect(setHidden(setHidden(EMPTY_LAYOUT, { pane: 'plan', isHidden: true }), { pane: 'plan', isHidden: false }).hidden).toEqual([])
})

test('the hub draws rows in the person\'s order and leaves the hidden ones out, numbering what it draws', () => {
  const layout = { hidden: ['files'], order: ['plan', 'agents'] }
  const rows = rowsOf({}, () => 'listed', layout)

  expect(panes(rows).slice(0, 2)).toEqual(['plan', 'agents'])
  expect(panes(rows)).not.toContain('files')
  expect(rows[0]?.hotkey).toBe('1')
})

test('a mod the hub does not know gets a row from its own card, but never takes a known pane', () => {
  const guest = cardOf({ pane: 'deploys', detail: '2 waiting', tone: 'live', at: 4, title: 'Deploys', icon: 'gauge', section: 'safety', badge: 'Alpha' })
  const rows = rowsOf({ 'deploy-watch': guest as HubCard, squatter: card('agents', { detail: 'not mine' }) }, () => 'unlisted')
  const row = rows.find(each => each.entry.pane === 'deploys')

  expect(row?.entry).toMatchObject({ mod: 'deploy-watch', title: 'Deploys', icon: 'gauge', section: 'safety', badge: 'Alpha', isGuest: true })
  expect(row?.card?.detail).toBe('2 waiting')
  expect(rows.filter(each => each.entry.pane === 'agents')).toEqual([])
  expect(cardOf({ pane: 'bad pane!', detail: '', tone: 'idle' })).toBeNull()
  expect(rowsOf({ 'deploy-watch': guest as HubCard }, mod => (mod === 'deploy-watch' ? 'off' : 'listed')).map(each => each.entry.pane)).not.toContain('deploys')
})

test('Transceiver wears its Beta badge on the hub', () => {
  const row = rowsOf({}, () => 'listed').find(each => each.entry.pane === 'transceiver')

  expect(row?.entry.badge).toBe('Beta')
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`Customize offers Up and Hide, hidden rows wait with Show, Done and Reset put it back (${surface})`, async ($: any, on: any) => {
    stubWorld(on, { env: ENGLISH })
    mock.store(on)
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ key: 'up-agents' })).toBeUndefined()

    await ui.press({ key: 'customize' })
    expect(await ui.find({ key: 'open-tests' })).toBeUndefined()
    expect(await ui.find({ key: 'up-agents' })).toBeUndefined()
    expect((await ui.find({ key: 'up-files' }))?.props.label).toBe('Up')

    await ui.press({ key: 'hide-tests' })
    expect(await ui.find({ key: 'hide-tests' })).toBeUndefined()
    expect((await ui.find({ key: 'show-tests' }))?.props.label).toBe('Show')

    await ui.press({ key: 'customize-done' })
    expect(await ui.find({ key: 'show-tests' })).toBeUndefined()
    expect(await ui.find({ key: 'open-tests' })).toBeUndefined()
    expect(JSON.stringify(await ui.drawn())).not.toMatch(/Hidden/)

    await ui.press({ key: 'customize' })
    await ui.press({ key: 'customize-reset' })
    await ui.press({ key: 'customize-done' })
    expect((await ui.find({ key: 'open-tests' }))?.props.label).toBe('Open')
  })
}

test('a layout kept from an earlier session arranges the hub as it starts', async ($: any, on: any) => {
  stubWorld(on, { env: ENGLISH })
  mock.store(on, { layout: { hidden: ['tests'], order: ['files', 'agents'] } })
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const keys: string[] = JSON.stringify(await ui.drawn()).match(/"open-[a-z-]+"/g) ?? []

  expect(keys.indexOf('"open-files"')).toBeLessThan(keys.indexOf('"open-agents"'))
  expect(keys).not.toContain('"open-tests"')
})

// A mod's "← MODZ" button writes its own `home` value; the hub opens itself, with the keyboard, in answer.
const homeMod = {
  name: 'checkpoint',
  register(on: any) {
    on('command.run', { command: 'go-home' }, async ($: any, e: any, next: any) => {
      await $.state.set({ plugin: 'checkpoint', key: 'home' }, { at: 2 })

      return next(e)
    })
    on('command.run', { command: 'hub-on' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'modz', key: 'isOn' })).value) }))
  },
}

test('a mod\'s home press brings the hub forward, and the hub says it runs', { plugins: [homeMod] }, async ($: any, on: any) => {
  const world = stubWorld(on, { env: ENGLISH })
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  const before = world.opened.filter(id => id === 'modz').length
  await $.command.run({ command: 'go-home', args: '' })

  expect(world.opened.filter(id => id === 'modz').length).toBe(before + 1)
  expect((await $.command.run({ command: 'hub-on', args: '' })).text).toBe('true')
})

test('the catalog tab has its own way back to the hub', async ($: any, on: any) => {
  const world = stubWorld(on, { env: ENGLISH })
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  const ui = await $.ui.mount({ ...PANE, requestId: 'modz-mods', surface: 'desktop' })
  const before = world.opened.length

  expect((await ui.find({ key: 'modz-home' }))?.props.label).toBe('← MODZ')
  await ui.press({ key: 'modz-home' })
  expect(world.opened.slice(before)).toContain('modz')
})
