// With no MODZ_LANG the hub and the catalog speak English, in the film's words; MODZ_LANG=tr keeps Turkish.
import { expect, test } from 'claude-code/testing'

import { stubWorld } from './world'

const PANE = { plugin: 'modz', component: 'Pane', requestId: 'modz', viewport: { columns: 100, rows: 40 }, props: { bodyColumns: 60 } } as const
const ENGLISH = {}
const TURKISH_ONLY = /[çğıöşüİ]/

// Stand-ins for the mods that report: each writes its own card, the literal state reference the engine needs.
const reporters = [
  {
    name: 'savvy-progress',
    register(on: any) {
      on('command.run', { command: 'report' }, async ($: any, e: any, next: any) => {
        await $.state.set({ plugin: 'savvy-progress', key: 'hub' }, { pane: 'agents', detail: '3 running', tone: 'live', at: 3 })

        return next(e)
      })
    },
  },
  {
    name: 'test-badge',
    register(on: any) {
      on('command.run', { command: 'report' }, async ($: any, e: any, next: any) => {
        await $.state.set({ plugin: 'test-badge', key: 'hub' }, { pane: 'tests', detail: '128/128 passed', tone: 'ok', at: 1 })

        return next(e)
      })
    },
  },
]

// Every word the tree draws: Text children, button labels, Svg alt text and the Svg's own text.
const drawnText = async (ui: any): Promise<string> => JSON.stringify(await ui.drawn())

for (const surface of ['terminal', 'desktop'] as const) {
  test(`the hub reads WORK / SAFETY / METER with Open buttons and "N mods on" (${surface})`, { plugins: reporters }, async ($: any, on: any) => {
    stubWorld(on, { env: ENGLISH })
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    await $.command.run({ command: 'report', args: '' })
    const ui = await $.ui.mount({ ...PANE, surface })
    const text = await drawnText(ui)

    for (const word of [/17 mods on/, /WORK|Work/, /SAFETY|Safety/, /METER|Meter/, /Agents/, /Checkpoints/, /Usage/, /Look/, /Mods/, /3 running/]) expect(text).toMatch(word)
    // The terminal keeps an "Open" button per row and leads with what matters now; on the desktop the whole row is
    // a blank cover over its drawing, and no card above the list repeats a row.
    if (surface === 'terminal') {
      expect(text).toMatch(/Now/)
      expect((await ui.find({ key: 'open-focus' }))?.props.label).toBe('Open Agents')
      expect((await ui.find({ key: 'open-tests' }))?.props.label).toBe('Open')
    } else {
      expect(await ui.find({ key: 'open-focus' })).toBeUndefined()
      expect((await ui.find({ key: 'open-tests' }))?.props).toMatchObject({ plain: true })
    }
    expect(text).not.toMatch(TURKISH_ONLY)
  })

  test(`a quiet hub says so in English (${surface})`, async ($: any, on: any) => {
    stubWorld(on, { env: ENGLISH })
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    const text = await drawnText(await $.ui.mount({ ...PANE, surface }))

    // The desktop has no head: a quiet hub is its rows with nothing on their right.
    if (surface === 'terminal') expect(text).toMatch(/All quiet/)
    expect(text).not.toMatch(TURKISH_ONLY)
  })

  test(`the catalog lists every mod in English (${surface})`, async ($: any, on: any) => {
    stubWorld(on, { env: ENGLISH })
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    const text = await drawnText(await $.ui.mount({ ...PANE, requestId: 'modz-mods', surface }))

    for (const word of [/All mods/, /17 mods · all on/, /all healthy/, /LOOK|Look/, /SAFETY|Safety/, /FLOW|Flow/, /from karanb192\/cache-tax/, /desktop · terminal/, /Holds risky commands/]) expect(text).toMatch(word)
    expect(text).not.toMatch(TURKISH_ONLY)
  })
}

test('with no catalog both panes say it could not be read, in English', async ($: any, on: any) => {
  stubWorld(on, { env: ENGLISH, files: {} })
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  const hub = await drawnText(await $.ui.mount({ ...PANE, surface: 'desktop' }))
  const catalog = await drawnText(await $.ui.mount({ ...PANE, requestId: 'modz-mods', surface: 'desktop' }))

  expect(hub).toMatch(/catalog could not be read/)
  expect(catalog).toMatch(/Catalog could not be read/)
  expect(catalog).toMatch(/marketplace\.json is missing or lists no mods/)
  expect(hub + catalog).not.toMatch(TURKISH_ONLY)
})

test('/modz answers in English and the catalog tab opens as Mods', async ($: any, on: any) => {
  const w = stubWorld(on, { env: ENGLISH })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  const answer = await $.command.run({ command: 'modz', args: '' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'open-modz-mods' })

  expect(answer?.text).toBe('Opened the MODZ pane.')
  expect(w.titles['modz']).toBe('MODZ')
  expect(w.titles['modz-mods']).toBe('Mods')
})

test('MODZ_LANG=tr keeps the Turkish tab title and answer', async ($: any, on: any) => {
  const w = stubWorld(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  const answer = await $.command.run({ command: 'modz', args: '' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'open-modz-mods' })

  expect(answer?.text).toBe('MODZ paneli açıldı.')
  expect(w.titles['modz-mods']).toBe('Modlar')
  expect(await drawnText(ui)).toMatch(/17 mod açık/)
})
