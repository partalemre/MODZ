// Fixes and features ported from upstream karanb192/cache-tax after 2026-10-29.
import { describe, expect, mock, test, tier } from 'claude-code/testing'
import type { ModelForkResult } from 'claude-code'

import { MIN, START, run, session, step, turn, usage, warm, world } from './world'

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
