import { describe, expect, mock, test, tier } from 'claude-code/testing'
import type { On } from 'claude-code'
import type { Engine } from 'claude-code/testing'

import { modelName, switchOf } from '../hooks/model-switch'
import { HOUR, MIN, START, bandProps, prompt, run, session, step, turn, usage, world } from './world'

tier('user')

const OPUS = 'claude-opus-5'
const SONNET = 'claude-sonnet-5'
const OPUS_TURN = turn({ usage: usage({ model: OPUS }) })
const SWITCH_LEAD = /model değişti \(Opus 5 → Sonnet 5\): önbellek yeniden yazılacak\. /
const HELD = 'Devam edelim.'

/** A warm big cache written on Opus, ten minutes ago. */
async function warmOnOpus($: Engine, on: On, surface: 'terminal' | 'desktop' | null = null) {
  const clock = mock.clock(on, { now: START })
  const w = world(on, [], { model: OPUS })
  await $.session.start({ ...session, surface, isInteractive: surface !== null })
  await step($, OPUS)
  await $.turn.complete(OPUS_TURN)
  await clock.advance(10 * MIN)
  return { clock, w }
}

describe('model switch', () => {
  test('names a model by family and version, whatever its suffix', () => {
    expect(modelName('claude-sonnet-4-5-20250929')).toBe('Sonnet 4.5')
    expect(modelName('claude-opus-5[1m]')).toBe('Opus 5')
    expect(modelName('default')).toBe('default')
    expect(switchOf(OPUS, 'claude-opus-5-20260101')).toBe(null)
    expect(switchOf(OPUS, 'opus')).toBe(null)
    expect(switchOf('claude-fable-5', 'claude-fable-5-1')).toEqual({ from: 'claude-fable-5', to: 'claude-fable-5-1' })
  })

  test('a different model holds a warm send once, priced at the new model, then the resend goes through', async ($, on) => {
    const { w } = await warmOnOpus($, on)
    w.current.model = SONNET
    const first = await $.prompt.submit(prompt('hi'))
    expect(first.drop).toMatch(SWITCH_LEAD)
    expect(first.drop).toMatch(/en fazla 200\.502 token'ı \$4\/MTok fiyatla yeniden yazar = \$0,80 \(sıcak bir tur \$0,04 olurdu\)/)
    expect(w.entered).toEqual([])
    await $.prompt.submit(prompt('hi'))
    expect(w.entered).toEqual(['hi'])
    await step($, SONNET)
    await $.turn.complete(turn({ usage: usage({ model: SONNET, cache_read_input_tokens: 0, cache_creation_input_tokens: 200502 }) }))
    expect(w.logs.at(-1)).toMatch(/201k token soğuk yazım ödendi \(\$0,80\)/)
    await $.prompt.submit(prompt('again'))
    expect(w.entered).toEqual(['hi', 'again'])
  })

  test('the same model, or the same one named another way, adds no hold', async ($, on) => {
    const { w } = await warmOnOpus($, on)
    await $.prompt.submit(prompt('one'))
    w.current.model = 'claude-opus-5-20260101'
    await $.prompt.submit(prompt('two'))
    w.current.model = 'opus'
    await $.prompt.submit(prompt('three'))
    expect(w.entered).toEqual(['one', 'two', 'three'])
  })

  test('the first prompt of a session keeps the clock guard alone', async ($, on) => {
    const clock = mock.clock(on, { now: START })
    const w = world(on, [], { model: SONNET })
    await $.session.start(session)
    await $.turn.complete(OPUS_TURN)
    await $.prompt.submit(prompt('warm'))
    expect(w.entered).toEqual(['warm'])
    await clock.advance(3 * HOUR)
    const cold = await $.prompt.submit(prompt('cold'))
    expect(cold.drop).toMatch(/^cache-tax: önbellek 2 sa önce soğudu\. /)
  })

  test('a subagent on another model leaves the cache model alone', async ($, on) => {
    const { w } = await warmOnOpus($, on)
    await step($, SONNET, 'agent-1')
    await $.prompt.submit(prompt('hi'))
    expect(w.entered).toEqual(['hi'])
  })

  test('warn mode logs the switch and its price, and sends', async ($, on) => {
    const { w } = await warmOnOpus($, on)
    await $.command.run(run('cache-tax', 'guard warn'))
    w.current.model = SONNET
    await $.prompt.submit(prompt('hi'))
    expect(w.entered).toEqual(['hi'])
    expect(w.logs.at(-1)).toMatch(SWITCH_LEAD)
    expect(w.logs.at(-1)).toMatch(/Yine de gönderiliyor/)
  })

  for (const surface of ['terminal', 'desktop'] as const) {
    test(`${surface}: the card gives the switch as its reason, and switching back takes it down`, async ($, on) => {
      const { w } = await warmOnOpus($, on, surface)
      const ui = await $.ui.mount({ plugin: 'cache-tax', surface, component: 'AbovePrompt', props: bandProps })
      w.current.model = SONNET
      const dropped = await $.prompt.submit(prompt(HELD))
      expect(dropped.drop).toBe('cache-tax: mesajın bekletiliyor, kartta seç (model değişti, en fazla $0,80).')
      const reason = 'Model değişti (Opus 5 → Sonnet 5): önbellek yeniden yazılacak.'
      if (surface === 'desktop') expect(String((await ui.find({ type: 'Svg' }))?.props.source)).toContain(reason)
      else expect(await ui.find({ type: 'Text', text: reason })).not.toBe(undefined)
      expect(JSON.stringify(await ui.drawn())).toContain('$0,80')
      w.current.model = OPUS
      await $.prompt.submit(prompt(HELD))
      expect(w.entered).toEqual([HELD])
      expect(await ui.find({ key: 'cache-tax:hold' })).toBe(undefined)
    })
  }

  test('in English the switch reads as one plain sentence, with English prices', async ($, on) => {
    mock.clock(on, { now: START })
    const w = world(on, [], { model: OPUS, lang: 'en' })
    await $.session.start(session)
    await step($, OPUS)
    await $.turn.complete(OPUS_TURN)
    w.current.model = SONNET
    const first = await $.prompt.submit(prompt('hi'))
    expect(first.drop).toMatch(/^cache-tax: Model changed \(Opus 5 → Sonnet 5\): the cache will be rewritten\. This send rewrites up to 200,502 tokens at \$4\/MTok = \$0\.80/)
  })
})
