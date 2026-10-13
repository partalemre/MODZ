import { expect, test } from 'claude-code/testing'

import { contextView } from '../hooks/breakdown'
import { clockText, fullAtOf, turnsLeftOf } from '../hooks/forecast'
import { setLang } from '../hooks/lang'
import { gaugeViews } from '../hooks/model'
import { BAND, BREAKDOWN, ENGLISH, MS_PER_HOUR, PANE, USAGE, breakdowns, compactions, start, stubSession, withBreakdown } from './stubs'

// The two estimates (a window's fill time, the context's turns left), the context card's breakdown
// and its "Compact now" press.

const SURFACES = ['terminal', 'desktop'] as const
const MINUTE_MS = 60_000
const RESET = new Date(3 * MS_PER_HOUR).toISOString()

const points = (values: readonly number[], stepMinutes = 5) => values.map((value, index) => ({ t: index * stepMinutes * MINUTE_MS, value }))
const at = (minutes: number) => minutes * MINUTE_MS

test('only the 5-hour window gets a fill time: an hour says little about a week', () => {
  const reset = new Date(90 * MS_PER_HOUR).toISOString()
  const gauges = ['five_hour', 'seven_day'].map(id => ({ id, label: id, percent: 55, resetsAt: reset }))
  const history = [40, 45, 50, 55].map((value, index) => ({ t: at(index * 5), percents: { five_hour: value, seven_day: value } }))
  const views = gaugeViews({ gauges, costUsd: null, context: null }, at(15), { history, turnsLeft: null })
  expect(views[0]?.forecast).not.toBe('')
  expect(views[1]?.forecast).toBe('')
})

test('a window rising a point a minute fills 100 % at that rate, from now', () => {
  const fullAt = fullAtOf({ points: points([40, 45, 50, 55]), percent: 55, resetsAt: RESET, nowMs: at(15) })

  expect(fullAt).toBe(at(15 + 45))
})

test('a flat, falling-then-flat, sparse, short or late-filling window has no fill time', () => {
  const base = { resetsAt: RESET, nowMs: at(15) }
  expect(fullAtOf({ ...base, points: points([40, 40, 40, 40]), percent: 40 })).toBeNull()
  expect(fullAtOf({ ...base, points: points([90, 95, 2, 2]), percent: 2 })).toBeNull()
  expect(fullAtOf({ ...base, points: points([40, 45]), percent: 45 })).toBeNull()
  expect(fullAtOf({ ...base, points: points([40, 41, 42, 43], 1), percent: 43 })).toBeNull()
  expect(fullAtOf({ ...base, points: points([40, 41, 42, 43]), percent: 43 })).toBeNull()
  expect(fullAtOf({ ...base, points: points([40, 45, 50, 55]), percent: 55, resetsAt: null })).toBeNull()
  expect(fullAtOf({ ...base, points: points([40, 45, 50, 55]), percent: 55, nowMs: at(15 + 61) })).toBeNull()
})

test('the turns left follow the average growth since the last compaction; flat or too few has none', () => {
  expect(turnsLeftOf([100_000, 110_000, 120_000], 200_000)).toBe(8)
  expect(turnsLeftOf([150_000, 40_000, 50_000, 60_000], 100_000)).toBe(4)
  expect(turnsLeftOf([100_000, 100_000, 100_000], 200_000)).toBeNull()
  expect(turnsLeftOf([100_000, 120_000], 200_000)).toBeNull()
  expect(turnsLeftOf([150_000, 40_000, 50_000], 100_000)).toBeNull()
  expect(turnsLeftOf([180_000, 190_000, 200_000], 200_000)).toBeNull()
})

test('the breakdown keeps the four largest used rows, folds the rest into Other, leaves out the deferred', () => {
  setLang('tr')
  const view = contextView(BREAKDOWN as any)

  expect(view?.segments.map(segment => [segment.label, segment.tokens, segment.kind])).toEqual([
    ['Mesajlar', 46_000, 'used'],
    ['Sistem araçları', 18_000, 'used'],
    ['MCP araçları', 9_000, 'used'],
    ['Bellek dosyaları', 4_000, 'used'],
    ['Diğer', 5_000, 'other'],
    ['Boş', 85_000, 'free'],
    ['Yedek pay', 33_000, 'reserve'],
  ])
  expect(view?.total).toBe(200_000)
  expect(view?.usedTokens).toBe(82_000)
  expect(view?.compactAt).toBe(167_000)
  expect(contextView({ ...BREAKDOWN, isAutoCompactEnabled: false } as any)?.compactAt).toBeNull()
  expect(contextView({ ...BREAKDOWN, categories: [] } as any)).toBeNull()
})

// Readings of the 5-hour window five minutes apart, the clock left at the last.
async function measureFive($: any, clock: any, percents: readonly number[]) {
  for (const percent of percents) {
    await clock.advance(5 * MINUTE_MS)
    const rateLimits = [{ kind: 'five_hour', percentUsed: percent, resetsAt: RESET }]
    await $.session.measure({ ...USAGE, rateLimits, changed: ['rateLimits'] })
  }
}

// The context at the end of each turn: the stub's usage answers with whatever it holds then.
async function endTurns($: any, usage: any, tokens: readonly number[]) {
  for (const [index, count] of tokens.entries()) {
    usage.context = { ...usage.context, tokens: count, percent: Math.round((count / usage.context.window) * 100) }
    await $.turn.complete({ answer: 'ok', durationMs: 1, isAborted: false, turnId: `t${index}`, reason: 'answer' })
  }
}

const textOf = async (ui: any): Promise<string> => JSON.stringify(await ui.drawn())

for (const surface of SURFACES) {
  test(`the HUD line names a fill time only within the hour, the pane any before the reset (${surface})`, async ($, on) => {
    setLang('tr')
    const clock = stubSession(on)
    await start($, surface)
    await measureFive($, clock, [40, 42.5, 45, 47.5])
    const slow = clockText(at(20 + 105), at(20))
    expect(await textOf(await $.ui.mount({ ...BAND, surface }))).not.toContain('~dolar')
    expect(await textOf(await $.ui.mount({ ...PANE, surface }))).toContain(`~${slow} civarında dolar`)

    await measureFive($, clock, [52.5, 57.5, 62.5])
    expect(await textOf(await $.ui.mount({ ...BAND, requestId: 'band-fast', surface }))).toContain('~dolar ')
  })

  test(`the HUD line names the turns left only from five, the pane always (${surface})`, async ($, on) => {
    setLang('tr')
    const usage = { ...USAGE, context: { ...USAGE.context } }
    stubSession(on, usage)
    await start($, surface)
    await endTurns($, usage, [100_000, 105_000, 110_000])
    await $.session.measure({ ...usage, changed: ['context'] })
    expect(await textOf(await $.ui.mount({ ...BAND, surface }))).not.toMatch(/~\d+ tur/)
    expect(await textOf(await $.ui.mount({ ...PANE, surface }))).toContain('~18 tur kaldı')

    await endTurns($, usage, [150_000, 160_000, 170_000])
    await $.session.measure({ ...usage, changed: ['context'] })
    // Six turns from 100k to 170k: 14k a turn, 30k left.
    expect(await textOf(await $.ui.mount({ ...BAND, requestId: 'band-near', surface }))).toContain('~2 tur')
  })

  test(`a flat context and too few turns draw no forecast (${surface})`, async ($, on) => {
    setLang('tr')
    const usage = { ...USAGE, context: { ...USAGE.context } }
    stubSession(on, usage)
    await start($, surface)
    await endTurns($, usage, [100_000, 100_000, 100_000])
    expect(await textOf(await $.ui.mount({ ...PANE, surface }))).not.toContain('kaldı')
  })

  test(`the context card: a summary breakdown read once while the pane draws, the turns up to compaction (${surface})`, async ($, on) => {
    setLang('tr')
    const usage = withBreakdown()
    const clock = stubSession(on, usage)
    await start($, surface)
    await endTurns($, usage, [100_000, 105_000, 110_000])
    await $.ui.mount({ ...BAND, surface })
    expect(breakdowns).toEqual([])

    const pane = await $.ui.mount({ ...PANE, surface })
    const drawn = await textOf(pane)
    for (const text of ['Mesajlar', '46k', 'Diğer', '5k', 'Boş', '~11 tur kaldı', 'son 3 tur']) expect(drawn).toContain(text)
    await pane.redraw(PANE.props)
    expect(breakdowns).toEqual(['summary'])
    await clock.advance(MINUTE_MS)
    await pane.redraw(PANE.props)
    expect(breakdowns).toEqual(['summary', 'summary'])
  })

  test(`"Şimdi sıkıştır" compacts once and shows what it came to (${surface})`, async ($, on) => {
    setLang('tr')
    const clock = stubSession(on, withBreakdown())
    await start($, surface)
    const pane = await $.ui.mount({ ...PANE, surface })
    expect((await pane.find({ key: 'compact-now' }))?.props?.label).toBe('Şimdi sıkıştır')

    await pane.press({ key: 'compact-now' })
    expect(await pane.find({ key: 'compact-now' })).toBeUndefined()
    await clock.advance(1)
    expect(compactions.count).toBe(1)
    expect(await pane.find({ type: 'Text', text: 'Sıkıştırıldı: 152k → 38k' })).toBeDefined()
    expect(await pane.find({ key: 'compact-now' })).toBeDefined()
  })
}

for (const surface of SURFACES) {
  test(`the context card and the estimates read English (${surface})`, async ($, on) => {
    const usage = withBreakdown()
    const clock = stubSession(on, usage, ENGLISH)
    await start($, surface)
    await measureFive($, clock, [40, 47.5, 55, 62.5])
    await endTurns($, usage, [100_000, 105_000, 110_000])
    expect(await textOf(await $.ui.mount({ ...BAND, surface }))).toContain('~full ')

    const drawn = await textOf(await $.ui.mount({ ...PANE, surface }))
    for (const text of ['Messages', 'System tools', 'Other', 'Free', '~11 turns left', 'last 3 turns', '~full at ', 'Compact now']) expect(drawn).toContain(text)
    expect(drawn).not.toMatch(/Mesajlar|kaldı|sıkıştır/)
  })
}
