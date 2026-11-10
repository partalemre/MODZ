// What the meter must get right: a price for every current model and none for an unknown one, keepwarm only
// when asked and bounded, stale store keys pruned, and on a subscription the cold send as a share of the limit.
import { describe, expect, mock, test } from 'claude-code/testing'

import { priceOf } from '../hooks/core'
import { HOUR, MIN, START, bandProps, prompt, run, session, turn, usage, warm, world } from './world'
import type { Limits } from './world'

// Published list prices, $ per million tokens: [cache read, 1h cache write (2× input), output].
// Source: the claude-api skill's model table, cached 2026-11-03, read 2026-11-10.
const CURRENT: Array<[string, [number, number, number]]> = [
  ['claude-fable-5-2', [0.2, 16, 40]],
  ['claude-mythos-5-2', [0.2, 16, 40]],
  ['claude-fable-5-1', [0.25, 20, 50]],
  ['claude-mythos-5-1', [0.25, 20, 50]],
  ['claude-fable-5', [1, 20, 50]],
  ['claude-mythos-5', [1, 20, 50]],
  ['claude-opus-5-5', [0.2, 8, 20]],
  ['claude-opus-5', [0.5, 10, 25]],
  ['claude-sonnet-5-5', [0.1, 4, 10]],
  ['claude-sonnet-5', [0.2, 4, 10]],
  ['claude-haiku-5-5', [0.01, 0.2, 0.5]],
]

describe('price table', () => {
  test('every current Claude 5 model id has its own row', () => {
    for (const [id, price] of CURRENT) expect([id, priceOf(id, 1000)]).toEqual([id, price])
    expect(priceOf('claude-opus-5-5[1m]', 1000)).toEqual([0.2, 8, 20])
    expect(priceOf('us.anthropic.claude-fable-5-2-v1:0', 1000)).toEqual([0.2, 16, 40])
  })

  test('an unknown model gets no price instead of a neighbour\'s', async ($, on) => {
    for (const id of ['claude-fable-5-3', 'claude-opus-5-7', 'claude-sonnet-6', 'claude-haiku-6-1']) expect([id, priceOf(id, 1000)]).toEqual([id, null])
    mock.clock(on, { now: START })
    world(on, [], { lang: 'en' })
    await $.session.start(session)
    await $.turn.complete(turn({ usage: usage({ model: 'claude-fable-5-3' }) }))
    expect((await $.command.run(run('cache-tax', 'status'))).text).toContain('no price for this model')
  })
})

describe('keepwarm only when asked', () => {
  test('a detected full rewrite scores the miss but starts no window', async ($, on) => {
    mock.clock(on, { now: START })
    const w = world(on, [warm], { lang: 'en' })
    await $.session.start(session)
    await $.turn.complete(turn())
    await $.turn.complete(turn({ usage: usage({ cache_read_input_tokens: 0, cache_creation_input_tokens: 200502 }) }))
    expect(w.status.at(-1)).toBe(undefined)
    expect(w.logs.at(-1)).toContain('/keepwarm')
    expect((await $.command.run(run('keepwarm', 'status'))).text).toBe('keepwarm off')
  })

  test('the card\'s pay button is asking: its paid write opens the window', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const w = world(on, [], { store: new Map([['guard', 'refuse']]) })
    await $.session.start({ ...session, surface: 'desktop', isInteractive: true })
    await $.turn.complete(turn())
    await clock.advance(7 * HOUR)
    const ui = await $.ui.mount({ plugin: 'cache-tax', surface: 'desktop', component: 'AbovePrompt', props: bandProps })
    await $.prompt.submit(prompt('held'))
    await ui.press({ key: 'cache-tax:pay' })
    await $.turn.complete(turn({ usage: usage({ cache_read_input_tokens: 0, cache_creation_input_tokens: 200502 }) }))
    expect((await $.command.run(run('keepwarm', 'status'))).text).toMatch(/^sıcak tutma: 3 sa kaldı/)
    expect(w.entered).toEqual(['held'])
  })
})

describe('pings are capped', () => {
  test('a window sends at most 12 refreshes, and says so when armed', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const w = world(on, Array.from({ length: 20 }, () => warm), { lang: 'en' })
    await $.session.start(session)
    expect((await $.command.run(run('keepwarm', '24h every 1m'))).text).toContain('at most 12 refreshes')
    await $.turn.complete(turn())
    await clock.advance(20 * MIN)
    expect(w.forks.length).toBe(12)
    expect((await $.command.run(run('keepwarm', 'status'))).text).toMatch(/^stopped keeping the cache warm: 12 refreshes/)
  })

  test('a refresh that answers at length ends the window', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const w = world(on, [{ read: 200000, write: 0, out: 1500 }, warm], { lang: 'en' })
    await $.session.start(session)
    await $.command.run(run('keepwarm', '3h every 1m'))
    await $.turn.complete(turn())
    await clock.advance(5 * MIN)
    expect(w.forks.length).toBe(1)
    expect((await $.command.run(run('keepwarm', 'status'))).text).toMatch(/^stopped keeping the cache warm: a refresh wrote 1500 output tokens/)
  })
})

describe('store', () => {
  test('other sessions\' windows that lapsed over a day ago are pruned on start; recent and live ones stay', async ($, on) => {
    mock.clock(on, { now: START + 30 * 24 * HOUR })
    const now = START + 30 * 24 * HOUR
    const store = new Map<string, unknown>([
      ['deadline:old', now - 3 * 24 * HOUR], ['every:old', MIN], ['deadline:zero', 0],
      ['deadline:recent', now - HOUR], ['deadline:live', now + HOUR], ['guard', 'warn'],
    ])
    world(on, [], { store, sid: 'mine' })
    await $.session.start(session)
    expect([...store.keys()]).toEqual(['deadline:recent', 'deadline:live', 'guard'])
  })
})

describe('on a subscription', () => {
  test('the guard warns by default; a fresh store holds nothing', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const w = world(on, [], { store: new Map(), lang: 'en' })
    await $.session.start(session)
    await $.turn.complete(turn())
    await clock.advance(3 * HOUR)
    expect((await $.prompt.submit(prompt('hi'))).drop).toBe(undefined)
    expect(w.entered).toEqual(['hi'])
  })

  test('a cold send reads as a share of the limit window first, dollars second', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const limits: Limits = { rateLimits: [{ kind: 'seven_day', percentUsed: 20 }], cost: { usd: 10 } }
    const w = world(on, [], { store: new Map(), lang: 'en', limits })
    await $.session.start(session)
    await $.turn.complete(turn())
    limits.rateLimits = [{ kind: 'seven_day', percentUsed: 22 }]
    limits.cost = { usd: 14 }
    await $.turn.complete(turn())
    await clock.advance(3 * HOUR)
    await $.prompt.submit(prompt('hi'))
    expect(w.logs.at(-1)).toContain('≈2% of the weekly limit ($4.01 at list price)')
  })

  for (const surface of ['terminal', 'desktop'] as const) {
    test(`the hold card says the share too (${surface})`, async ($, on) => {
      const clock = mock.clock(on, { now: START })
      const limits: Limits = { rateLimits: [{ kind: 'seven_day', percentUsed: 20 }], cost: { usd: 10 } }
      world(on, [], { store: new Map([['guard', 'refuse']]), lang: 'en', limits })
      await $.session.start({ ...session, surface, isInteractive: true })
      await $.turn.complete(turn())
      limits.rateLimits = [{ kind: 'seven_day', percentUsed: 22 }]
      limits.cost = { usd: 14 }
      await $.turn.complete(turn())
      await clock.advance(3 * HOUR)
      const ui = await $.ui.mount({ plugin: 'cache-tax', surface, component: 'AbovePrompt', props: bandProps })
      await $.prompt.submit(prompt('hi'))
      expect(JSON.stringify(await ui.drawn())).toContain('Sending now takes ≈2% of the weekly limit at this session’s pace')
    })
  }
})
