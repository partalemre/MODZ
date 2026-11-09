// Fixes and features ported from upstream karanb192/cache-tax after 2026-10-29.
import { describe, expect, mock, test, tier } from 'claude-code/testing'

import { MIN, START, run, session, step, turn, usage, world } from './world'

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
