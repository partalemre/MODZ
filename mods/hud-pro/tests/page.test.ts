import { expect, test } from 'claude-code/testing'

import { breakdowns, BREAKDOWN, compactions, opens, start, stubSession, USAGE } from './stubs'

// The Usage page the MODZ hub draws in its own pane: /hud full and a meter mod's ask go to the hub, the stage closes
// this mod's pane and reads the breakdown outside any drawing, and a press on the page (modz.act) does what the
// pane's own control does: a section's button reaches the mod that owns it as `hud-pro.press`.

// Stands for a hub that draws the Usage page itself: it says so, stages pages, hands presses on, and hears `home`.
const HUB = {
  name: 'modz',
  register(on: any) {
    const heard: unknown[] = []
    on('command.run', { command: 'hub-draws' }, async ($: any) => {
      await $.state.set({ plugin: 'modz', key: 'isOn' }, true)
      await $.state.set({ plugin: 'modz', key: 'drawn' }, ['plan', 'usage'])

      return {}
    })
    on('command.run', { command: 'hub-stage' }, async ($: any, e: any) => (await $.state.set({ plugin: 'modz', key: 'stage' }, { pane: e.args, at: 1 }), {}))
    on('command.run', { command: 'hub-act' }, async ($: any, e: any) => (await $.state.set({ plugin: 'modz', key: 'act' }, { page: 'usage', ...JSON.parse(e.args), at: 1 }), {}))
    on('state.set', { key: 'home' }, async (_: any, e: any, next: any) => (heard.push(e.value), next(e)))
    on('command.run', { command: 'hub-heard' }, async () => ({ text: JSON.stringify(heard) }))
    // Spelled out: the engine admits a state read by literal plugin and key only.
    on('command.run', { command: 'hp-breakdown' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'hud-pro', key: 'breakdown' })).value ?? null) }))
    on('command.run', { command: 'hp-range' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'hud-pro', key: 'pastRange' })).value ?? null) }))
    on('command.run', { command: 'hp-focus' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'hud-pro', key: 'focus' })).value ?? null) }))
  },
}
// Stands for session-budget: it asks for the Usage view at its section and hears the presses meant for it.
const BUDGET = {
  name: 'session-budget',
  register(on: any) {
    const heard: unknown[] = []
    on('command.run', { command: 'sb-open' }, async ($: any) => (await $.state.set({ plugin: 'session-budget', key: 'openUsage' }, { section: 'budget', at: 1 }), {}))
    on('state.set', { plugin: 'hud-pro', key: 'press' }, async (_: any, e: any, next: any) => (heard.push(e.value), next(e)))
    on('command.run', { command: 'sb-heard' }, async () => ({ text: JSON.stringify(heard) }))
  },
}

const run = async ($: any, command: string, args = '') => (await $.command.run({ command, args })).text
const json = async ($: any, command: string) => JSON.parse(await run($, command))

async function begin($: any, on: any) {
  const clock = stubSession(on, { ...USAGE, context: { ...USAGE.context, breakdown: BREAKDOWN } })
  const closed: string[] = []
  on('ui.close', (_: any, e: any) => (closed.push(e.id), { value: undefined }))
  on('ui.panes', () => ({ value: [] }))
  await start($, 'desktop')
  await run($, 'hub-draws')

  return { clock, closed }
}

test('/hud full and a meter mod\'s ask go to a hub that draws the page; the ask\'s section leads', { plugins: [HUB, BUDGET] } as any, async ($: any, on: any) => {
  const { clock } = await begin($, on)
  await run($, 'hud', 'full')
  await run($, 'sb-open')
  await clock.advance(1)

  expect(opens).toEqual([])
  expect(await json($, 'hub-heard')).toEqual([{ pane: 'usage', at: expect.any(Number) }, { pane: 'usage', at: expect.any(Number) }])
  expect(await json($, 'hp-focus')).toBe('budget')
})

test('the hub staging the page closes this mod\'s pane and keeps the breakdown; leaving it forgets the section', { plugins: [HUB, BUDGET] } as any, async ($: any, on: any) => {
  const { clock, closed } = await begin($, on)
  await run($, 'sb-open')
  await clock.advance(1)
  await run($, 'hub-stage', 'usage')

  expect(closed).toContain('hud-pro')
  expect(breakdowns).toContain('summary')
  expect((await json($, 'hp-breakdown')).view).not.toBeNull()

  await run($, 'hub-stage', 'modz')
  expect(await json($, 'hp-focus')).toBeNull()
})

test('presses on the hub\'s page: a section button reaches its mod, a range is chosen, compact compacts', { plugins: [HUB, BUDGET] } as any, async ($: any, on: any) => {
  const { clock } = await begin($, on)
  await run($, 'hub-stage', 'usage')
  const press = async (action: object) => (await run($, 'hub-act', JSON.stringify(action)), await clock.advance(2))

  await press({ action: 'press', arg: JSON.stringify(['budget', 'set']) })
  expect(await json($, 'sb-heard')).toEqual([{ section: 'budget', action: 'set', at: expect.any(Number) }])
  await press({ action: 'range', arg: '30' })
  expect(await json($, 'hp-range')).toBe(30)
  const before = breakdowns.length
  await press({ action: 'compact' })
  expect(compactions.count).toBe(1)
  // The window changed: the page's breakdown is read again at once, not when it next goes stale.
  expect(breakdowns.length).toBe(before + 1)
})

test('a press for another page, or one that is not well formed, does nothing', { plugins: [HUB, BUDGET] } as any, async ($: any, on: any) => {
  const { clock } = await begin($, on)
  await run($, 'hub-act', JSON.stringify({ page: 'plan', action: 'compact' }))
  await run($, 'hub-act', JSON.stringify({ action: 'range', arg: '12' }))
  await run($, 'hub-act', JSON.stringify({ action: 'press', arg: 'budget' }))
  await clock.advance(2)

  expect(compactions.count).toBe(0)
  expect(await json($, 'hp-range')).toBeNull()
  expect(await json($, 'sb-heard')).toEqual([])
})
