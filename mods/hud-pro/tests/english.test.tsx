import { expect, test } from 'claude-code/testing'

import { costText, untilReset } from '../hooks/format'
import { setLang } from '../hooks/lang'
import { ALWAYS, BAND, ENGLISH, MS_PER_HOUR, PANE, USAGE, opens, start, stubSession, toasts } from './stubs'

// Without MODZ_LANG every text reads English, on both surfaces; Turkish letters never show up.

const SURFACES = ['terminal', 'desktop'] as const
const TURKISH_ONLY = /[çğıöşüİ]/
const MEASURE: any = { ...USAGE, changed: ['rateLimits'] }
const FULL_CONTEXT: any = { ...USAGE, context: { window: 200_000, tokens: 168_000, percent: 84 } }

type Drawn = { props: { source: string; alt: string } } | undefined

const svgOf = async (ui: any): Promise<Drawn> => (await ui.find({ type: 'Svg' })) as Drawn

async function expectNoTurkish(ui: any) {
  expect(JSON.stringify(await ui.drawn())).not.toMatch(TURKISH_ONLY)
}

test('English numbers: a point decimal, the percent sign after, h and m countdowns', () => {
  setLang('en')
  expect(costText(1.234)).toBe('≈$1.23')
  expect(untilReset(new Date(94 * MS_PER_HOUR).toISOString(), 0)).toBe('3d 22h')
  expect(untilReset(new Date(2 * MS_PER_HOUR + 5 * 60_000).toISOString(), 0)).toBe('2h 5m')
})

test('band in English on the terminal: 5h with reset, 7d, context, cost', async ($, on) => {
  stubSession(on, USAGE, ENGLISH)
  await start($, 'terminal')
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })

  for (const text of ['5h', '32%', '↻ 2h 0m', 'week', '91%', '↻ 3d 22h', 'memory', '41%', '≈$1.23']) {
    expect(await ui.find({ type: 'Text', text })).toBeDefined()
  }
  await expectNoTurkish(ui)
})

test('band in English on the desktop: the pills read the long labels and the session cost', ALWAYS, async ($, on) => {
  stubSession(on, USAGE, ENGLISH)
  await start($, 'desktop')
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const svg = await svgOf(ui)

  expect(svg?.props.alt).toBe('5-hour allowance 32%, refills in 2h 0m · weekly allowance 91%, refills in 3d 22h · chat memory 41% · session ≈$1.23')
  expect(svg?.props.source).toContain('>5-hour allowance<')
  expect(svg?.props.source).toContain('>session<')
  await expectNoTurkish(ui)
})

for (const surface of SURFACES) {
  test(`the Compact button and a full window read English (${surface})`, ALWAYS, async ($, on) => {
    stubSession(on, { ...FULL_CONTEXT, rateLimits: [{ ...USAGE.rateLimits[0], percentUsed: 104 }] }, ENGLISH)
    await start($, surface)
    const ui = await $.ui.mount({ ...BAND, surface })

    expect((await ui.find({ key: 'compact' }))?.props?.label).toBe('Summarize')
    if (surface === 'terminal') expect(await ui.find({ type: 'Text', text: 'full' })).toBeDefined()
    else expect((await svgOf(ui))?.props.alt).toContain('5-hour allowance full, refills in 2h 0m')
    await expectNoTurkish(ui)
  })

  test(`/hud answers, the notice and the MODZ card read English (${surface})`, async ($, on) => {
    const cards: any[] = []
    stubSession(on, USAGE, ENGLISH)
    on('state.set', { plugin: 'hud-pro', key: 'hub' }, (_: any, e: any, next: any) => {
      cards.push(e.value)

      return next(e)
    })
    await start($, surface)
    await $.session.measure(MEASURE)

    expect(cards[0]?.detail).toBe('5-hour 32% · weekly 91%')
    expect(toasts).toEqual(['weekly allowance: 91% used · ↻ 3d 22h'])
    expect((await $.command.run({ command: 'hud', args: '' } as any)).text).toBe('Usage line hidden.')
    expect((await $.command.run({ command: 'hud', args: '' } as any)).text).toBe('Usage line shown.')
    await $.command.run({ command: 'hud', args: 'full' } as any)
    expect(opens).toEqual([expect.objectContaining({ id: 'hud-pro', title: 'Usage' })])
  })
}

async function fullPane($: any, on: any, surface: string) {
  const clock = stubSession(on, USAGE, ENGLISH)
  await start($, surface)
  await $.session.measure(MEASURE)
  await clock.advance(1_000)
  await $.session.measure({ ...MEASURE, rateLimits: [{ kind: 'five_hour', percentUsed: 64, resetsAt: USAGE.rateLimits[0]?.resetsAt }] })
  await $.turn.start({ text: 'go', turnId: 't1' } as any)
  for await (const _ of $.turn.step({ turnId: 't1', index: 0, model: 'claude-test' } as any)) void _
  await $.command.run({ command: 'hud', args: 'full' } as any)

  return $.ui.mount({ ...PANE, surface })
}

test('pane in English on the terminal: limits, resets, range and the last turn', async ($, on) => {
  const ui = await fullPane($, on, 'terminal')

  expect(await ui.find({ type: 'Text', text: 'Limits' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '2 readings · session ≈$1.23' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '· refills in 2h 0m · range 32%–64%' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^last turn: read 12.4k · wrote 640 · 96% reused · 1 model call$/ })).toBeDefined()
  await expectNoTurkish(ui)
})

test('pane in English on the desktop: figures with English labels, notes and captions', async ($, on) => {
  const ui = await fullPane($, on, 'desktop')
  const svg = await svgOf(ui)

  for (const text of ['Limits', '5-hour allowance 64%', 'range 32%–64%', 'session cost ≈$1.23', 'last turn 13k tokens', 'estimate at list prices · this session · 2 readings']) {
    expect(svg?.props.alt).toContain(text)
  }
  expect(svg?.props.alt).toContain('room for 118k more tokens')
  expect(svg?.props.source).toContain('>5-hour allowance<')
  expect(svg?.props.source).not.toContain('letter-spacing')
  await expectNoTurkish(ui)
})

for (const surface of SURFACES) {
  test(`the empty pane reads English (${surface})`, async ($, on) => {
    stubSession(on, { startedAt: 0, context: { window: 200_000 }, rateLimits: [] }, ENGLISH)
    await start($, surface)
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(await ui.find({ type: 'Text', text: 'Nothing measured yet; the numbers arrive with the first answer.' })).toBeDefined()
    await expectNoTurkish(ui)
  })
}
