// Without MODZ_LANG the mod speaks English: the hold card, the status row and the command answers, with
// English numbers ($4.01, 6h 30m). Nothing drawn carries a Turkish-only letter.
import { describe, expect, mock, test, tier } from 'claude-code/testing'

import { HOUR, MIN, START, bandProps, prompt, run, session, turn, world } from './world'

tier('user')

const TURKISH_ONLY = /[çğıöşüİ]/
const HELD = 'Where were we? Sum it up in two lines.'
const ROW = { type: 'Text', text: 'Cache · ' } as const

const band = { plugin: 'cache-tax', component: 'AbovePrompt', props: bandProps } as const

describe('in English', () => {
  for (const surface of ['terminal', 'desktop'] as const) {
    test(`${surface}: a cold send waits on the hold card with its English price`, async ($, on) => {
      const clock = mock.clock(on, { now: START })
      world(on, [], { lang: 'en' })
      await $.session.start({ ...session, surface, isInteractive: true })
      await $.turn.complete(turn())
      await clock.advance(7 * HOUR)
      const ui = await $.ui.mount({ ...band, surface })
      const dropped = await $.prompt.submit(prompt(HELD))

      expect(dropped.drop).toBe('cache-tax: your message is on hold, choose on the card (cold cache, up to $4.01).')
      if (surface === 'desktop') {
        const header = String((await ui.find({ type: 'Svg' }))?.props.source)
        expect(header).not.toContain('CACHE TAX')
        expect(header).toContain('Your message is on hold')
        expect(header).toContain('The cache went cold 6h ago.')
      } else {
        expect((await ui.find({ type: 'Text', text: 'Cache tax' }))?.props.dimColor).toBe(true)
        expect(await ui.find({ type: 'Text', text: '~200,502 tokens rewritten · $20/MTok' })).not.toBe(undefined)
        expect(await ui.find({ type: 'Text', text: '✓ Pay once and keepwarm holds the cache for 3h.' })).not.toBe(undefined)
      }
      expect((await ui.find({ type: 'Text', text: /^(⏸ )?Held: / }))?.text).toContain(`“${HELD}”`)
      expect((await ui.findAll({ type: 'Button' })).map(b => b.props.label)).toEqual(['Pay and send', 'Start fresh', 'Cache status'])
      expect(JSON.stringify(await ui.drawn())).not.toMatch(TURKISH_ONLY)
    })

    test(`${surface}: the status row says warm and cold in English`, async ($, on) => {
      const clock = mock.clock(on, { now: START })
      world(on, [], { lang: 'en' })
      await $.session.start({ ...session, surface, isInteractive: true })
      await $.turn.complete(turn())
      const ui = await $.ui.mount({ ...band, surface, props: { ...bandProps, bodyColumns: 160 } })
      await clock.advance(55 * MIN)
      const warm = (await ui.find(ROW))?.text ?? ''
      expect(warm).toContain('warm')
      expect(warm).toContain('goes cold in 5m')
      await clock.advance(2 * HOUR)

      const cold = (await ui.find(ROW))?.text ?? ''
      expect(cold).toContain('cold')
      expect(cold).toContain('went cold 1h 55m ago')
      expect(cold).toContain('next message up to $4.01')
      expect(JSON.stringify(await ui.drawn())).not.toMatch(TURKISH_ONLY)
    })
  }

  test('keepwarm and /cache-tax answer in English', async ($, on) => {
    mock.clock(on, { now: START })
    world(on, [], { lang: 'en' })
    await $.session.start({ ...session, surface: 'terminal', isInteractive: true })
    await $.turn.complete(turn())

    expect((await $.command.run(run('keepwarm', '90m')))?.text).toBe(
      'keepwarm on for 1h 30m: 50m into every idle stretch, a ping reads the cache without rewriting it')
    expect((await $.command.run(run('keepwarm', 'status')))?.text).toBe('keepwarm 1h 30m left · ping in 50m')
    expect((await $.command.run(run('keepwarm', 'soon')))?.text).toBe('keepwarm takes a span (6h, 90m) or always, off, status')
    expect((await $.command.run(run('keepwarm', 'off')))?.text).toBe('keepwarm off')
    expect((await $.command.run(run('cache-tax', 'guard warn')))?.text).toBe('guard: warn only. A cold send goes through with its price shown')
    const card = String((await $.command.run(run('cache-tax', '')))?.text)
    expect(card).toContain('context     ')
    expect(card).toContain('0 cold writes paid, $0.00')
    expect(card).not.toMatch(TURKISH_ONLY)
  })
})
