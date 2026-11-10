import { expect, test } from 'claude-code/testing'

import { accountHistory, costSeries, seriesOf } from '../hooks/history'
import { parseLine } from '../hooks/past-log'
import { BAND, MS_PER_HOUR, USAGE, start, store, stubSession } from './stubs'

// What the meter must get right: one session's context and cost apart from another's, limits shared and merged,
// small writes, a transcript line read whatever order its usage holds, and a band that does not repeat the app.

const PATH = '/home/me/.claude/projects/-work/aaaaaaaa-0000-0000-0000-000000000001.jsonl'
const NOW = Date.parse('2026-10-29T12:00:00Z')

test('a transcript line reads whatever order its usage fields come in', () => {
  const record = {
    timestamp: new Date(NOW).toISOString(),
    id: 'msg_01',
    usage: { output_tokens: 40, output_tokens_details: { thinking_tokens: 5 }, cache_read_input_tokens: 3000, input_tokens: 10, cache_creation_input_tokens: 200 },
    model: 'claude-fable-5-2',
  }
  expect(parseLine(`${PATH}\t${JSON.stringify(record)}`)).toEqual({
    session: 'aaaaaaaa-0000-0000-0000-000000000001', model: 'claude-fable-5-2', id: 'msg_01', atMs: NOW, tokens: 50, cache: 3200,
  })
  expect(parseLine(`${PATH}\t{"model":"claude-fable-5-2","id":"msg_01"`)).toBeNull()
})

const OTHER = { t: 5, percents: { seven_day: 30, context: 77 }, cost: 21.9 }
const reading = (sevenDay: number, contextPercent: number, usd: number): any => ({
  context: { window: 200_000, tokens: contextPercent * 2000, percent: contextPercent },
  rateLimits: [{ kind: 'seven_day', percentUsed: sevenDay, resetsAt: new Date(94 * MS_PER_HOUR).toISOString() }],
  cost: { usd },
  changed: ['rateLimits', 'context', 'cost'],
})

test('limits history is account-wide and merged; context and cost stay with their session', async ($, on) => {
  const clock = stubSession(on, { ...USAGE, rateLimits: [] })
  store.saved['hud-pro.history'] = [OTHER]
  await start($, 'desktop')
  await clock.advance(10)
  await $.session.measure(reading(31, 10, 1))
  const history = store.writes.filter(write => write.key === 'hud-pro.history').at(-1)?.value

  expect(history).toEqual([{ t: 5, percents: { seven_day: 30 } }, { t: expect.any(Number), percents: { seven_day: 31 } }])
})

test('another session\'s stored cost and context never reach this one\'s sparklines', () => {
  const loaded = accountHistory([OTHER, { t: 6, percents: { context: 12 }, cost: 0.0003 }])
  expect(loaded).toEqual([{ t: 5, percents: { seven_day: 30 } }])
  expect(costSeries(loaded)).toEqual([])
  expect(seriesOf(loaded, 'context')).toEqual([])
})

test('a reading that moves only the context or the cost writes nothing', async ($, on) => {
  stubSession(on, { ...USAGE, rateLimits: [] })
  await start($, 'desktop')
  await $.session.measure(reading(31, 10, 1))
  const before = store.writes.length
  await $.session.measure(reading(31, 12, 1.5))
  await $.session.measure(reading(31, 14, 2))

  expect(store.writes.length).toBe(before)
})

const CALM: any = {
  ...USAGE,
  rateLimits: [
    { kind: 'five_hour', percentUsed: 10, resetsAt: new Date(2 * MS_PER_HOUR).toISOString() },
    { kind: 'seven_day', percentUsed: 20, resetsAt: new Date(94 * MS_PER_HOUR).toISOString() },
  ],
}

test('desktop: the band defaults to alerts, since the app shows the limits itself; /hud band always brings the line back', async ($, on) => {
  stubSession(on, CALM)
  await start($, 'desktop')
  expect(await (await $.ui.mount({ ...BAND, surface: 'desktop' })).find({ type: 'Svg' })).toBeUndefined()

  expect(await $.command.run({ command: 'hud', args: 'band always' } as any)).toMatchObject({ text: expect.stringContaining('always') })
  expect(store.saved['hud-pro.band']).toBe('always')
  expect(await (await $.ui.mount({ ...BAND, requestId: 'band-2', surface: 'desktop' })).find({ type: 'Svg' })).toBeDefined()
})

test('terminal: the band keeps the full line by default', async ($, on) => {
  stubSession(on, CALM)
  await start($, 'terminal')
  expect(await (await $.ui.mount({ ...BAND, surface: 'terminal' })).find({ type: 'Text', text: '%10' })).toBeDefined()
})
