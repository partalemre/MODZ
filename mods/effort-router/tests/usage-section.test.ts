import { expect, test } from 'claude-code/testing'

import { setLang } from '../hooks/kit/lang'
import { effortSection } from '../hooks/section'
import { begin, spy, stateOf, stub, turn, worldOf } from './stubs'

// While hud-pro runs its Usage pane is this mod's one place: the section there with the mode buttons, no pane or hub
// row of its own; and the lowered-turn row takes its turn in the shared line above the prompt.

const row = (turnId: string, sent: string, asked = sent) => ({ turnId, at: 0, snippet: 'Rename it', cls: null, asked, sent, model: 'claude-opus-5-5' }) as any

// Stands in for hud-pro (says it runs, presses a section button, reads what this mod wrote) and session-budget.
const HUD = {
  name: 'hud-pro',
  register(on: any) {
    on('command.run', { command: 'hud-host' }, async ($: any) => (await $.state.set({ plugin: 'hud-pro', key: 'host' }, true), {}))
    on('command.run', { command: 'hud-press' }, async ($: any, e: any) => (await $.state.set({ plugin: 'hud-pro', key: 'press' }, { section: 'effort', action: e.args, at: 1 }), {}))
    const said = async (value: unknown) => ({ text: JSON.stringify(value ?? null) })
    on('command.run', { command: 'hud-section' }, async ($: any) => said((await $.state.get({ plugin: 'effort-router', key: 'section' })).value))
    on('command.run', { command: 'hud-asked' }, async ($: any) => said((await $.state.get({ plugin: 'effort-router', key: 'openUsage' })).value))
    on('command.run', { command: 'hud-notice' }, async ($: any) => said((await $.state.get({ plugin: 'effort-router', key: 'notice' })).value))
  },
}
const BUDGET = {
  name: 'session-budget',
  register(on: any) {
    on('command.run', { command: 'sb-notice' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'session-budget', key: 'notice' }, e.args === 'off' ? null : { id: 1, text: 'Budget warning', expiresAt: 0 })

      return {}
    })
  },
}
const HUB = {
  name: 'modz',
  register(on: any) {
    on('command.run', { command: 'hub-open' }, async ($: any) => (await $.state.set({ plugin: 'modz', key: 'open' }, { pane: 'effort', at: 1 }), {}))
  },
}

const run = async ($: any, command: string, args = '') => (await $.command.run({ command, args })).text
const read = async ($: any, command: string) => JSON.parse(await run($, command))

const band = { plugin: 'effort-router', component: 'AbovePrompt', surface: 'terminal', viewport: { columns: 100, rows: 30 },
  props: { hasSurvey: false, isWorking: false, maxRows: 5, bodyColumns: 100, scroll: { offset: 0, bodyRows: 5 }, view: {} } } as const

test('the section names the mode with its buttons, then the newest turns; before one, what it will show', () => {
  setLang('en')
  const empty = effortSection([], 'show')
  expect(empty).toMatchObject({ id: 'effort', title: 'Effort', isEmpty: true, lines: ['No turns yet. The next turn shows here.', 'Mode: Show only. Shows the effort each turn was sent with. No tokens.'] })
  expect(empty.actions).toEqual([{ id: 'show', label: 'Show only', isOn: true }, { id: 'auto', label: 'Route', isOn: false }, { id: 'off', label: 'Off', isOn: false }])
  expect(effortSection([row('a', 'low', 'high'), row('b', 'high')], 'auto').lines.slice(1)).toEqual(['low from high · opus-5-5 · Rename it', 'high · opus-5-5 · Rename it'])
  expect(effortSection([row('a', 'high')], 'off').lines).toEqual(['Mode: Off. Effort is neither shown nor changed.'])
})

test('while hud-pro runs: no hub card, the command and the hub row open no pane, and the command asks for Usage', { plugins: [spy, HUD, HUB] } as any, async ($: any, on: any) => {
  const world = worldOf()
  stub(on, world)
  await run($, 'hud-host')
  await begin($)
  await turn($, { text: 'Rename the helper', turnId: 't1', effort: 'high' })

  expect(await stateOf($, 'hub')).toBeNull()
  expect((await read($, 'hud-section')).lines[1]).toBe('high · opus-5-5 · Rename the helper')
  await run($, 'effort-router')
  await run($, 'hub-open')
  expect(world.opened).toEqual([])
  expect(await read($, 'hud-asked')).toMatchObject({ section: 'effort' })
})

test('a mode button pressed in the Usage pane sets the mode, kept like a press in the Effort pane', { plugins: [spy, HUD] } as any, async ($: any, on: any) => {
  const world = worldOf()
  stub(on, world)
  await begin($)
  await run($, 'hud-press', 'auto')

  expect(await stateOf($, 'mode')).toBe('auto')
  expect(world.stored.mode).toBe('auto')
  expect((await read($, 'hud-section')).actions.find((action: any) => action.isOn).id).toBe('auto')
  await run($, 'hud-press', 'loud')
  expect(await stateOf($, 'mode')).toBe('auto')
})

test('a lowered turn waits behind a live budget notice, shows once it clears, and its notice goes with the next prompt', { options: { mode: 'auto' }, plugins: [HUD, BUDGET] } as any, async ($: any, on: any) => {
  const world = worldOf({ reply: 'light' })
  stub(on, world)
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['theirs'] }))
  await begin($)
  await run($, 'sb-notice')
  await turn($, { text: 'What does this regex match?', turnId: 'light' })
  expect(await read($, 'hud-notice')).toMatchObject({ text: 'Sent at low effort (yours: high): the judge called it light', expiresAt: 0 })
  const held = await $.ui.mount({ ...band, requestId: 'held' })
  expect(await held.find({ type: 'Text', text: /Sent at low effort/ })).toBeUndefined()

  await run($, 'sb-notice', 'off')
  const shown = await $.ui.mount({ ...band, requestId: 'shown' })
  expect(await shown.find({ type: 'Text', text: /Sent at low effort/ })).toBeDefined()

  await $.prompt.submit({ text: 'Thanks, now explain the second group', wait: false, origin: { kind: 'composer' } })
  expect(await read($, 'hud-notice')).toBeNull()
})
