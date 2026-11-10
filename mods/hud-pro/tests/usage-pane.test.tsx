import { expect, test } from 'claude-code/testing'

import { isNotable, paceOf, paceWindow, shareOf } from '../hooks/pace'
import { isSection } from '../hooks/sections'
import { BAND, ENGLISH, MS_PER_HOUR, PANE, USAGE, opens, start, stubSession } from './stubs'

// The one Usage pane: the Pace section (each turn's share of the window, the burn rate, when it fills against its
// reset), the other meter mods' sections drawn from their `section` values, and the shared notice line.

const SURFACES = ['terminal', 'desktop'] as const
const MINUTE_MS = 60_000
const RESET = new Date(3 * MS_PER_HOUR).toISOString()
const five = (percentUsed: number) => ({ ...USAGE, rateLimits: [{ kind: 'five_hour', percentUsed, resetsAt: RESET }] })
const gauge = (id: string, percent: number, resetsAt: string | null = RESET) => ({ id, label: id, percent, resetsAt })

const EFFORT_SECTION = {
  id: 'effort', title: 'Effort', tone: 'neutral', at: 1,
  lines: ['Mode: Route', 'high · opus-5-5'],
  actions: [{ id: 'show', label: 'Show only' }, { id: 'auto', label: 'Route', isOn: true }],
}

// Stand-ins for the other meter mods: they publish a section, ask for the pane, raise a notice, and hear presses.
// The engine lists each module's state by literal references, so each stand-in spells its own.
const BUDGET = {
  name: 'session-budget',
  register(on: any) {
    // Spelled inside: a stand-in's module is compiled on its own.
    const section = { id: 'budget', title: 'Session budget', tone: 'neutral', at: 1, lines: ['No budget set.'], isEmpty: true }
    on('command.run', { command: 'sb-section' }, async ($: any) => (await $.state.set({ plugin: 'session-budget', key: 'section' }, section), {}))
    on('command.run', { command: 'sb-open' }, async ($: any) => (await $.state.set({ plugin: 'session-budget', key: 'openUsage' }, { section: 'budget', at: 1 }), {}))
    on('command.run', { command: 'sb-notice' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'session-budget', key: 'notice' }, e.args === 'off' ? null : { id: 1, text: 'louder', expiresAt: 0 })

      return {}
    })
    on('command.run', { command: 'sb-host' }, async ($: any) => ({ text: String((await $.state.get({ plugin: 'hud-pro', key: 'host' })).value) }))
  },
}
const EFFORT = {
  name: 'effort-router',
  register(on: any) {
    const heard: unknown[] = []
    const section = {
      id: 'effort', title: 'Effort', tone: 'neutral', at: 1, lines: ['Mode: Route', 'high · opus-5-5'],
      actions: [{ id: 'show', label: 'Show only' }, { id: 'auto', label: 'Route', isOn: true }],
    }
    on('command.run', { command: 'er-section' }, async ($: any) => (await $.state.set({ plugin: 'effort-router', key: 'section' }, section), {}))
    on('state.set', { plugin: 'hud-pro', key: 'press' }, async (_: any, e: any, next: any) => (heard.push(e.value), next(e)))
    on('command.run', { command: 'er-heard' }, async () => ({ text: JSON.stringify(heard) }))
  },
}
const HUB = {
  name: 'modz',
  register(on: any) {
    on('command.run', { command: 'hub-open' }, async ($: any, e: any) => (await $.state.set({ plugin: 'modz', key: 'open' }, { pane: e.args, at: 1 }), {}))
  },
}
const run = ($: any, command: string, args = '') => $.command.run({ command, args })

async function measureFive($: any, clock: any, percents: readonly number[]) {
  for (const percent of percents) {
    await clock.advance(5 * MINUTE_MS)
    await $.session.measure({ ...five(percent), changed: ['rateLimits'] })
  }
}

async function turn($: any, id: string) {
  await $.turn.start({ text: 'go', turnId: id } as any)
  await $.turn.complete({ answer: 'ok', durationMs: 1, isAborted: false, turnId: id, reason: 'answer' } as any)
}

test('the pace reads the 5-hour window, else the weekly one; a share is the rise within one window', () => {
  const week = gauge('seven_day', 20)
  expect(paceWindow({ gauges: [week, gauge('five_hour', 5)], costUsd: null, context: null })?.id).toBe('five_hour')
  expect(paceWindow({ gauges: [week], costUsd: null, context: null })?.id).toBe('seven_day')
  expect(paceWindow({ gauges: [], costUsd: 1, context: null })).toBeNull()
  expect(shareOf(gauge('five_hour', 30), gauge('five_hour', 44))).toBe(14)
  expect(shareOf(gauge('five_hour', 90), gauge('five_hour', 4, 'later'))).toBe(4)
  expect(shareOf(null, gauge('five_hour', 7))).toBe(7)
})

test('a notable turn is 10 points of the 5-hour window or 3 of the weekly one', () => {
  expect(isNotable({ window: 'five_hour', share: 10, percent: 50 })).toBe(true)
  expect(isNotable({ window: 'five_hour', share: 9, percent: 50 })).toBe(false)
  expect(isNotable({ window: 'seven_day', share: 3, percent: 50 })).toBe(true)
  expect(isNotable({ window: 'spend_limit', share: 99, percent: 99 })).toBe(false)
})

test('a weekly window is paced over a day of readings; too few readings give no rate', () => {
  const week = { gauges: [gauge('seven_day', 24, new Date(100 * MS_PER_HOUR).toISOString())], costUsd: null, context: null }
  const history = [20, 21, 22, 23, 24].map((value, index) => ({ t: index * 2 * MS_PER_HOUR, percents: { seven_day: value } }))
  const pace = paceOf({ usage: week, history, nowMs: 8 * MS_PER_HOUR })
  expect(Math.round((pace?.perHour ?? 0) * 100)).toBe(50)
  // 76 points left at half a point an hour is 152 hours: past the reset, so no fill time.
  expect(pace?.fullAt).toBeNull()
  expect(paceOf({ usage: week, history: history.slice(0, 2), nowMs: 8 * MS_PER_HOUR })?.perHour).toBeNull()
})

test('a published section is checked before it is drawn', () => {
  expect(isSection(EFFORT_SECTION)).toBe(true)
  expect(isSection({ ...EFFORT_SECTION, lines: [1] })).toBe(false)
  expect(isSection({ ...EFFORT_SECTION, tone: 'loud' })).toBe(false)
  expect(isSection({ ...EFFORT_SECTION, actions: [{ id: 'x' }] })).toBe(false)
  expect(isSection(null)).toBe(false)
})

for (const surface of SURFACES) {
  test(`${surface}: with too few readings the Pace section says so instead of forecasting`, async ($, on) => {
    const clock = stubSession(on, five(30), ENGLISH)
    await start($, surface)
    await measureFive($, clock, [30])
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(await ui.find({ type: 'Text', text: 'Pace' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^Too few readings for a pace yet: 1 of 3/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /At this pace/ })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /shows here once a turn ends/ })).toBeDefined()
  })

  test(`${surface}: a rising window gets its rate and the time it fills, before its reset`, async ($, on) => {
    const clock = stubSession(on, five(40), ENGLISH)
    await start($, surface)
    await measureFive($, clock, [40, 45, 50, 55])
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(await ui.find({ type: 'Text', text: '5-hour window 55% · rising 60% an hour' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /^At this pace it fills .+, before it resets at / })).toBeDefined()
  })

  test(`${surface}: each turn's share of the window is listed, newest first`, async ($, on) => {
    const clock = stubSession(on, five(44), ENGLISH)
    await start($, surface)
    await measureFive($, clock, [30])
    await turn($, 't1')
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(await ui.find({ type: 'Text', text: 'Last turn used 14% of the 5-hour window' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /other sessions on the account count too/ })).toBeDefined()
  })

  test(`${surface}: another meter mod's section is drawn, and its button's press is written for it`, { plugins: [EFFORT] } as any, async ($: any, on: any) => {
    stubSession(on, five(30), ENGLISH)
    await start($, surface)
    await run($, 'er-section')
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(await ui.find({ type: 'Text', text: 'Effort' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'high · opus-5-5' })).toBeDefined()
    await ui.press({ key: 'usage-effort-show' })
    expect(JSON.parse((await run($, 'er-heard')).text)).toMatchObject([{ section: 'effort', action: 'show' }])
  })
}

test('a notable turn says one quiet line above the other rows; an ordinary one says none', async ($, on) => {
  const clock = stubSession(on, five(44), ENGLISH)
  await start($, 'terminal')
  await measureFive($, clock, [42])
  await turn($, 't0')
  const quiet = await $.ui.mount({ ...BAND, surface: 'terminal', requestId: 'quiet' })
  expect(await quiet.find({ type: 'Text', text: /^That turn used/ })).toBeUndefined()

  await measureFive($, clock, [30])
  await turn($, 't1')
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const order = (await band.findAll({ type: 'Text' })).map((found: any) => found.text)
  expect(order).toContain('That turn used 14% of the 5-hour window (now 44%).')
  expect(order.indexOf('That turn used 14% of the 5-hour window (now 44%).')).toBeLessThan(order.indexOf('theirs'))
})

test('a pace that fills the window before it resets says so once', async ($, on) => {
  const clock = stubSession(on, five(40), ENGLISH)
  await start($, 'terminal')
  await measureFive($, clock, [40, 45, 50, 55, 60])
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const lines = (await band.findAll({ type: 'Text', text: /^At this pace the 5-hour window fills/ })) as unknown[]

  expect(lines.length).toBe(1)
})

test('a louder notice holds the line; the HUD notice waits and shows once it clears, then goes', { plugins: [BUDGET] } as any, async ($: any, on: any) => {
  const clock = stubSession(on, five(44), ENGLISH)
  await start($, 'terminal')
  await run($, 'sb-notice')
  await measureFive($, clock, [30])
  await turn($, 't1')
  const held = await $.ui.mount({ ...BAND, surface: 'terminal', requestId: 'held' })
  expect(await held.find({ type: 'Text', text: /^That turn used/ })).toBeUndefined()

  await clock.advance(3 * MINUTE_MS)
  await run($, 'sb-notice', 'off')
  const shown = await $.ui.mount({ ...BAND, surface: 'terminal', requestId: 'shown' })
  expect(await shown.find({ type: 'Text', text: /^That turn used/ })).toBeDefined()

  await clock.advance(2 * MINUTE_MS)
  const gone = await $.ui.mount({ ...BAND, surface: 'terminal', requestId: 'gone' })
  expect(await gone.find({ type: 'Text', text: /^That turn used/ })).toBeUndefined()
})

test('a meter mod asks for the pane: it opens at that mod\'s section, which comes first', { plugins: [BUDGET] } as any, async ($: any, on: any) => {
  stubSession(on, five(30), ENGLISH)
  await start($, 'terminal')
  expect((await run($, 'sb-host')).text).toBe('true')
  await run($, 'sb-section')
  await run($, 'sb-open')
  expect(opens.map(open => open.id)).toEqual(['hud-pro'])

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const order = (await ui.findAll({ type: 'Text' })).map((found: any) => found.text)
  expect(order.indexOf('Session budget')).toBeLessThan(order.indexOf('Pace'))
})

test('the hub\'s Effort row opens the Usage pane at Effort once effort-router publishes, and not before', { plugins: [EFFORT, HUB] } as any, async ($: any, on: any) => {
  stubSession(on, five(30), ENGLISH)
  await start($, 'terminal')
  await run($, 'hub-open', 'effort')
  expect(opens.length).toBe(0)

  await run($, 'er-section')
  await run($, 'hub-open', 'effort')
  expect(opens.map(open => open.id)).toEqual(['hud-pro'])
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const order = (await ui.findAll({ type: 'Text' })).map((found: any) => found.text)
  expect(order.indexOf('Effort')).toBeLessThan(order.indexOf('Pace'))
})
