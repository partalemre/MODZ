// The guard's dollar floor, ported from upstream karanb192/cache-tax 7535fe3.
import { describe, expect, mock, test, tier } from 'claude-code/testing'

import { HOUR, START, prompt, run, session, turn, usage, world } from './world'

tier('user')

// The world's context is 200,502 tokens on Fable 5.1: a cold send is priced at $4.01.
describe('guard refuse with a dollar floor', () => {
  test('a cold send under the floor goes through with its price and the floor shown, and is scored', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const store = new Map<string, unknown>()
    const w = world(on, [], { store })
    await $.session.start(session)
    await $.turn.complete(turn())
    const set = await $.command.run(run('cache-tax', 'guard refuse 5'))
    expect(set.text).toBe('koruma: $5,00 ve üstüne gelen mesajı bir kez beklet. Daha ucuzu fiyatı gösterilerek geçer')
    expect(store.get('guard')).toBe(5)
    await clock.advance(3 * HOUR)
    expect((await $.prompt.submit(prompt('hi'))).drop).toBe(undefined)
    expect(w.entered).toEqual(['hi'])
    expect(w.logs.at(-1)).toMatch(/\$4,01.*Yine de gönderiliyor.* \$5,00 sınırının altında olduğu için bekletilmedi\.$/)
    await $.turn.complete(turn({ usage: usage({ cache_read_input_tokens: 0, cache_creation_input_tokens: 1000 }) }))
    const card = await $.command.run(run('cache-tax', ''))
    expect(card.text).toMatch(/sohbet 1 kez baştan okundu/)
    expect(card.text).toMatch(/koruma      \$5,00 ve üstünde bir kez beklet, altında uyar/)
  })

  test('a cold send at or over the floor is held as before', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const w = world(on, [], { store: new Map<string, unknown>([['guard', 4]]) })
    await $.session.start(session)
    await $.turn.complete(turn())
    await clock.advance(3 * HOUR)
    expect((await $.prompt.submit(prompt('hi'))).drop).toBeDefined()
    expect(w.entered).toEqual([])
  })

  test('a model with no price is never let through by the floor', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const w = world(on, [], { store: new Map<string, unknown>([['guard', 1000]]), model: 'mystery-model' })
    await $.session.start(session)
    await $.turn.complete(turn({ usage: usage({ model: 'mystery-model' }) }))
    await clock.advance(3 * HOUR)
    expect((await $.prompt.submit(prompt('hi'))).drop).toBeDefined()
    expect(w.entered).toEqual([])
  })

  test('a floor that is not a positive amount, or anything after it, is refused; plain refuse clears it', async ($, on) => {
    mock.clock(on, { now: START })
    const store = new Map<string, unknown>()
    world(on, [], { store })
    await $.session.start(session)
    for (const args of ['guard refuse 0', 'guard refuse -1', 'guard refuse abc', 'guard refuse 5 now', 'guard warn 5']) {
      expect((await $.command.run(run('cache-tax', args))).text).toBe('/cache-tax guard warn, refuse ya da refuse 5 gibi dolar sınırlı bir refuse alır')
    }
    expect(store.has('guard')).toBe(false)
    await $.command.run(run('cache-tax', 'guard refuse $2.5'))
    expect(store.get('guard')).toBe(2.5)
    await $.command.run(run('cache-tax', 'guard refuse'))
    expect(store.get('guard')).toBe('refuse')
  })

  test('in English', async ($, on) => {
    mock.clock(on, { now: START })
    world(on, [], { lang: 'en' })
    await $.session.start(session)
    const set = await $.command.run(run('cache-tax', 'guard refuse 5'))
    expect(set.text).toBe('guard: hold the message once when it costs $5.00 or more. A cheaper one goes through with its price shown')
  })
})
