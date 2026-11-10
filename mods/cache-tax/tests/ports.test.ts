// Fixes and features ported from upstream karanb192/cache-tax after 2026-10-29.
import { describe, expect, mock, test, tier } from 'claude-code/testing'
import type { ModelForkResult, PromptSubmitInput } from 'claude-code'

import { freshState, seedFromResume } from '../hooks/register'
import { onPrompt } from '../hooks/guard'
import type { GuardIo } from '../hooks/guard'

import { HOUR, MIN, START, prompt, run, session, step, turn, usage, warm, world } from './world'

tier('user')

const MODEL = 'claude-fable-5-1'

describe('a cold write is one request rewriting the context (upstream b05ec14)', () => {
  test('a long warm turn whose requests write half the context in all is not one', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const w = world(on, [])
    await $.session.start(session)
    await $.turn.complete(turn())
    await clock.advance(37 * MIN)
    w.current.stepWrite = 40000
    for (let i = 0; i < 3; i++) await step($, MODEL)
    await $.turn.complete(turn({ usage: usage({ cache_creation_input_tokens: 120000 }) }))
    const card = await $.command.run(run('cache-tax', 'status'))
    expect(card.text).toMatch(/önbellek 0 kez baştan yazıldı/)
  })

  test('one request that rewrites half the context is one', async ($, on) => {
    mock.clock(on, { now: START })
    const w = world(on, [])
    await $.session.start(session)
    await $.turn.complete(turn())
    w.current.stepWrite = 150000
    await step($, MODEL)
    await $.turn.complete(turn({ usage: usage({ cache_read_input_tokens: 0, cache_creation_input_tokens: 150000 }) }))
    const card = await $.command.run(run('cache-tax', 'status'))
    expect(card.text).toMatch(/önbellek 1 kez baştan yazıldı/)
  })

  test('a subagent\'s large write does not count as the main loop\'s', async ($, on) => {
    mock.clock(on, { now: START })
    const w = world(on, [])
    await $.session.start(session)
    await $.turn.complete(turn())
    w.current.stepWrite = 150000
    await step($, MODEL, 'agent-1')
    w.current.stepWrite = 500
    await step($, MODEL)
    await $.turn.complete(turn({ usage: usage({ cache_creation_input_tokens: 150500 }) }))
    const card = await $.command.run(run('cache-tax', 'status'))
    expect(card.text).toMatch(/önbellek 0 kez baştan yazıldı/)
  })
})

describe('keepwarm with nothing to fork yet (upstream 1cbbc79)', () => {
  const nothing = { isAnswered: false, reason: 'nothing-to-fork' } satisfies ModelForkResult

  test('says so once per wait, and again only after a turn starts a new one', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const w = world(on, [nothing, nothing, warm])
    await $.session.start(session)
    await $.turn.complete(turn())
    await $.command.run(run('keepwarm', '3h every 1m'))
    await clock.advance(MIN)
    const said = w.logs.filter(line => /henüz tazelenecek bir konuşma yok/.test(line))
    expect(said.length).toBe(1)
    await clock.advance(30 * MIN)
    expect(w.forks.length).toBe(1)
    expect(w.logs.filter(line => /henüz tazelenecek/.test(line)).length).toBe(1)
    await $.turn.complete(turn())
    await clock.advance(MIN)
    expect(w.forks.length).toBe(2)
    expect(w.logs.filter(line => /henüz tazelenecek/.test(line)).length).toBe(2)
  })

  test('in English', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const w = world(on, [nothing], { lang: 'en' })
    await $.session.start(session)
    await $.turn.complete(turn())
    await $.command.run(run('keepwarm', '3h every 1m'))
    await clock.advance(MIN)
    expect(w.logs).toContain('keepwarm is on, but there is no conversation to refresh yet, so no refresh goes out until your next message. Send one more message and the refreshes start.')
  })
})

describe('the countdown moves while idle (upstream 0f432b0)', () => {
  test('without a band the status line is rewritten as the minutes pass, with no model request', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const w = world(on, [])
    await $.session.start(session)
    await $.turn.complete(turn())
    await $.command.run(run('keepwarm', '3h'))
    expect(w.status.at(-1)).toMatch(/^sıcak tutma: 3 sa kaldı/)
    await clock.advance(5 * MIN)
    expect(w.status.at(-1)).toMatch(/^sıcak tutma: 2 sa 55 dk kaldı · tazeleme 45 dk sonra/)
    expect(w.forks.length).toBe(0)
  })

  test('the rewriting stops with the window', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const w = world(on, [])
    await $.session.start(session)
    await $.turn.complete(turn())
    await $.command.run(run('keepwarm', '30m'))
    await clock.advance(31 * MIN)
    expect(w.status.at(-1)).toBe(undefined)
    const written = w.status.length
    await clock.advance(10 * MIN)
    expect(w.status.length).toBe(written)
  })

  test('without a window nothing is written', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const w = world(on, [])
    await $.session.start(session)
    await $.turn.complete(turn())
    await clock.advance(10 * MIN)
    expect(w.status).toEqual([])
  })
})

describe('the hold survives a new process (upstream 7d933e8)', () => {
  /** The guard as a fresh process sees it: a store shared with the last one, and nothing in memory. */
  function nextProcess(store: Map<string, unknown>, now: number) {
    const sent: string[] = []
    const io: GuardIo = {
      now: async () => now, model: async () => 'claude-fable-5-1', log: () => {}, redraw: () => {},
      get: async key => store.get(key), set: async (key, value) => store.set(key, value), del: async key => store.delete(key),
    }
    const s = freshState()
    s.sid = 'S1'
    s.guard = 'refuse'
    seedFromResume(s, { source: 'resume', model: 'claude-fable-5-1', context_tokens: 200502, seconds_since_last_response: Math.round((now - START) / 1000) }, now)
    const submit = (e: PromptSubmitInput) => onPrompt(io, s, { e, next: async x => { sent.push(x.text); return { text: x.text } } })
    return { s, sent, submit }
  }

  test('a resend from the next process goes through, once, and clears the stored hold', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const store = new Map<string, unknown>([['guard', 'refuse']])
    world(on, [], { store })
    await $.session.start(session)
    await $.turn.complete(turn())
    await clock.advance(3 * HOUR)
    expect((await $.prompt.submit(prompt('hi'))).drop).toBeDefined()
    expect(store.get('acked:S1')).toBe(START)
    const next = nextProcess(store, START + 3 * HOUR)
    expect((await next.submit(prompt('hi'))).drop).toBe(undefined)
    expect(next.sent).toEqual(['hi'])
    expect(next.s.coldWritePending).toBe(true)
    expect(store.has('acked:S1')).toBe(false)
  })

  test('a hold stored for an older response does not let this one through', async () => {
    const store = new Map<string, unknown>([['acked:S1', START - 2 * HOUR]])
    const next = nextProcess(store, START + 3 * HOUR)
    expect((await next.submit(prompt('hi'))).drop).toBeDefined()
    expect(next.sent).toEqual([])
    expect(store.get('acked:S1')).toBe(START)
  })

  test('a resend in the same process clears the stored hold too', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const store = new Map<string, unknown>()
    world(on, [], { store })
    await $.session.start(session)
    await $.turn.complete(turn())
    await clock.advance(3 * HOUR)
    await $.prompt.submit(prompt('hi'))
    await $.prompt.submit(prompt('hi'))
    expect(store.has('acked:S1')).toBe(false)
  })
})

describe('/keepwarm always takes a window of its own (upstream 90bcd45)', () => {
  test('always 24h stores the window, arms it, and a turn rolls it on', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const store = new Map<string, unknown>()
    const w = world(on, [], { store })
    await $.session.start(session)
    await $.turn.complete(turn())
    const r = await $.command.run(run('keepwarm', 'always 24h'))
    expect(r.text).toBe('keepwarm hep açık: her oturum 24 sa pencereyle başlar; /keepwarm off kalıcı olarak kapatır; en fazla 12 tazeleme, 1000 çıktı tokenından fazlasını yazan tazeleme pencereyi kapatır')
    expect(store.get('always')).toBe(24 * HOUR)
    expect(w.status.at(-1)).toMatch(/^sıcak tutma: 24 sa kaldı/)
    await clock.advance(30 * MIN)
    await $.turn.complete(turn())
    expect(w.status.at(-1)).toMatch(/^sıcak tutma: 24 sa kaldı/)
  })

  test('a bare always is still stored as true; a window out of range or with more after it is refused', async ($, on) => {
    mock.clock(on, { now: START })
    const store = new Map<string, unknown>()
    world(on, [], { store })
    await $.session.start(session)
    for (const args of ['always 30m', 'always 169h', 'always 24h now', 'always soon']) {
      expect((await $.command.run(run('keepwarm', args))).text).toBe('always 1h ile 168h arası tek bir pencere alır, örneğin always 24h')
    }
    expect(store.has('always')).toBe(false)
    await $.command.run(run('keepwarm', 'always'))
    expect(store.get('always')).toBe(true)
  })

  test('a stored window opens at session start, and the held send promises it', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const store = new Map<string, unknown>([['guard', 'refuse']])
    const w = world(on, [], { store })
    await $.session.start(session)
    await $.turn.complete(turn())
    await clock.advance(2 * HOUR)
    store.set('always', 12 * HOUR)
    await $.session.start(session)
    expect(w.status.at(-1)).toMatch(/^sıcak tutma: 12 sa kaldı/)
    const r = await $.prompt.submit(prompt('hi'))
    expect(r.drop).toMatch(/sonra \/keepwarm önbelleği sıcak tutar/)
    const card = await $.command.run(run('cache-tax', ''))
    expect(card.text).toMatch(/keepwarm    açık, 12 sa kaldı.*\(always\)/)
  })
})
