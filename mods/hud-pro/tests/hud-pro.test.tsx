import { expect, test } from 'claude-code/testing'

import { costText, filledCells, paceOf, toneOf, untilReset } from '../hooks/format'
import { hubOf, isOwnOpen } from '../hooks/hub'
import { BAND, MS_PER_HOUR, PANE, USAGE, opens, start, stubSession, toasts } from './stubs'

const SURFACES = ['terminal', 'desktop'] as const

type Drawn = { props: { source: string; alt: string; width: number; isInteractive?: boolean } } | undefined

test('tone stays neutral on pace, Amber 10 points ahead, Flare from 95; context warns from 70', () => {
  expect(toneOf({ id: 'five_hour', percent: 32, pace: 60 })).toBe('neutral')
  expect(toneOf({ id: 'five_hour', percent: 70, pace: 60 })).toBe('warn')
  expect(toneOf({ id: 'seven_day', percent: 95, pace: 99 })).toBe('danger')
  expect(toneOf({ id: 'context', percent: 69, pace: null })).toBe('neutral')
  expect(toneOf({ id: 'context', percent: 70, pace: null })).toBe('warn')
  expect(paceOf({ id: 'five_hour', resetsAt: new Date(2 * MS_PER_HOUR).toISOString() }, 0)).toBe(60)
  expect(paceOf({ id: 'context', resetsAt: null }, 0)).toBeNull()
  expect(filledCells(1, 6)).toBe(1)
  expect(filledCells(0, 6)).toBe(0)
  expect(costText(1.234)).toBe('≈$1,23')
  expect(untilReset(new Date(94 * MS_PER_HOUR).toISOString(), 0)).toBe('3g 22sa')
  expect(untilReset(new Date(2 * MS_PER_HOUR + 5 * 60_000).toISOString(), 0)).toBe('2sa 5dk')
})

test('terminal: one text line under what others drew, 5s with reset, 7g, bağlam, cost', async ($, on) => {
  stubSession(on)
  await start($, 'terminal')

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })

  for (const text of ['theirs', '5s', '%32', '· 2sa 0dk', '7g', '%91', '· 3g 22sa', 'bağlam', '%41', '≈$1,23']) {
    expect(await ui.find({ type: 'Text', text })).toBeDefined()
  }
  const order = (await ui.findAll({ type: 'Text' })).map((found: any) => found.text)
  expect(order.indexOf('theirs')).toBeLessThan(order.indexOf('5s'))
  expect(await ui.find({ type: 'Text', text: /┊/ })).toBeDefined()
  expect(await ui.find({ type: 'Svg' })).toBeUndefined()
  expect((await ui.find({ type: 'Text', text: '%32' }))?.props?.dimColor).toBe(true)
  expect((await ui.find({ type: 'Text', text: '%91' }))?.props?.color).toBe('warning')
})

test('desktop: one transparent Svg line of pills with meters and pace ticks, under what others drew', async ($, on) => {
  stubSession(on)
  await start($, 'desktop')

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const svg = (await ui.find({ type: 'Svg' })) as Drawn

  expect(svg?.props.alt).toBe('5 saat %32, 2sa 0dk sonra sıfırlanır · 7 gün %91, 3g 22sa sonra sıfırlanır · bağlam %41 · oturum ≈$1,23')
  expect(svg?.props.source).toContain('class="f-hi" x=')
  expect(svg?.props.source).not.toContain('<path')
  expect(svg?.props.isInteractive).toBeUndefined()
  expect(svg?.props.source).toContain('prefers-color-scheme: light')
  expect(svg?.props.source).toContain('f-warn tab')
  const drawn = JSON.stringify(await ui.drawn())
  expect(drawn.indexOf('theirs')).toBeLessThan(drawn.indexOf('"Svg"'))
  expect(await ui.find({ key: 'compact' })).toBeUndefined()
})

test('a narrow band drops bars first, then the reset and cost; the desktop line never overflows', async ($, on) => {
  stubSession(on)
  await start($, 'terminal')

  const medium = await $.ui.mount({ ...BAND, surface: 'terminal', props: { ...BAND.props, bodyColumns: 60 } })
  expect(await medium.find({ type: 'Text', text: /━/ })).toBeUndefined()
  expect(await medium.find({ type: 'Text', text: '· 2sa 0dk' })).toBeDefined()
  await medium.unmount()

  const narrow = await $.ui.mount({ ...BAND, surface: 'terminal', props: { ...BAND.props, bodyColumns: 40 } })
  expect(await narrow.find({ type: 'Text', text: '%32' })).toBeDefined()
  expect(await narrow.find({ type: 'Text', text: '≈$1,23' })).toBeUndefined()
  await narrow.unmount()

  const desk = await $.ui.mount({ ...BAND, surface: 'desktop', props: { ...BAND.props, bodyColumns: 50 } })
  expect(((await desk.find({ type: 'Svg' })) as Drawn)?.props.width).toBeLessThanOrEqual(50 * 6.4)
})

for (const surface of SURFACES) {
  test(`the line gives way to a survey and to /hud (${surface})`, async ($, on) => {
    stubSession(on)
    await start($, surface)

    const survey = await $.ui.mount({ ...BAND, surface, props: { ...BAND.props, hasSurvey: true } })
    expect(await survey.find({ type: 'Text', text: '%32' })).toBeUndefined()
    expect(await survey.find({ type: 'Svg' })).toBeUndefined()
    expect(await survey.find({ type: 'Text', text: 'theirs' })).toBeDefined()
    await survey.unmount()

    const answer = await $.command.run({ command: 'hud', args: '' } as any)
    const hidden = await $.ui.mount({ ...BAND, surface })
    expect(answer.text).toBe('HUD gizlendi.')
    expect(await hidden.find({ type: 'Svg' })).toBeUndefined()
    expect(await hidden.find({ type: 'Text', text: '%32' })).toBeUndefined()
    expect(await hidden.find({ type: 'Text', text: 'theirs' })).toBeDefined()
  })

  test(`from 70% context a Sıkıştır button runs /compact once, hidden while it runs and while working (${surface})`, async ($, on) => {
    let compacted = 0
    const clock = stubSession(on, { ...USAGE, context: { window: 200_000, tokens: 168_000, percent: 84 } })
    on('command.run', (_: any, e: any) => {
      if (e.command === 'compact') compacted += 1

      return {}
    })
    await start($, surface)

    const band = await $.ui.mount({ ...BAND, surface })
    expect((await band.find({ key: 'compact' }))?.props?.label).toBe('Sıkıştır')
    await band.press({ key: 'compact' })
    expect(compacted).toBe(0)
    expect(await band.find({ key: 'compact' })).toBeUndefined()
    await clock.advance(1)
    expect(compacted).toBe(1)
    expect(await band.find({ key: 'compact' })).toBeDefined()
    await band.unmount()

    const busy = await $.ui.mount({ ...BAND, surface, props: { ...BAND.props, isWorking: true } })
    expect(await busy.find({ key: 'compact' })).toBeUndefined()
  })
}

const MEASURE: any = { ...USAGE, changed: ['rateLimits'] }

test('a limit past 90% raises one notice per window', async ($, on) => {
  stubSession(on)
  await start($, 'terminal')

  await $.session.measure(MEASURE)
  await $.session.measure(MEASURE)

  expect(toasts.filter(text => text === '7 gün limiti %91 dolu').length).toBe(1)
})

async function fullPane($: any, on: any, surface: string) {
  const clock = stubSession(on)
  await start($, surface)
  await $.session.measure(MEASURE)
  await clock.advance(1_000)
  await $.session.measure({ ...MEASURE, rateLimits: [{ kind: 'five_hour', percentUsed: 64, resetsAt: USAGE.rateLimits[0]?.resetsAt }] })
  await $.turn.start({ text: 'go', turnId: 't1' } as any)
  for await (const _ of $.turn.step({ turnId: 't1', index: 0, model: 'claude-test' } as any)) void _
  const answer = await $.command.run({ command: 'hud', args: 'full' } as any)
  expect(answer.text).toBeUndefined()

  return $.ui.mount({ ...PANE, surface })
}

test('/hud full on the terminal: each limit with its pace tick, reset, range, sparkline, the last turn', async ($, on) => {
  const ui = await fullPane($, on, 'terminal')

  expect(await ui.find({ type: 'Text', text: 'Limitler' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '%64' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '· sıfırlanma 2sa 0dk · aralık %32–%64' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^son tur: girdi 12,4k · çıktı 640/ })).toBeDefined()
})

test('/hud full on the desktop: stat tiles with meters and sparklines', async ($, on) => {
  const ui = await fullPane($, on, 'desktop')
  const svg = (await ui.find({ type: 'Svg' })) as Drawn

  expect(svg?.props.alt).toContain('Limitler')
  expect(svg?.props.alt).toContain('5 saat %64')
  expect(svg?.props.alt).toContain('aralık %32–%64')
  expect(svg?.props.alt).toContain('oturum maliyeti ≈$1,23')
  expect(svg?.props.source).toContain('fill-opacity="0.12"')
  expect(svg?.props.width).toBeLessThanOrEqual(80 * 6.4)
  expect(await ui.find({ type: 'Text', text: /^son tur: girdi 12,4k/ })).toBeDefined()
})

test('the pane says so before the first reading', async ($, on) => {
  stubSession(on, { startedAt: 0, context: { window: 200_000 }, rateLimits: [] })
  await start($, 'desktop')
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  expect(await ui.find({ type: 'Text', text: /^Henüz ölçüm yok/ })).toBeDefined()
})

const fiveAt = (percentUsed: number) => ({ ...MEASURE, rateLimits: [{ ...USAGE.rateLimits[0], percentUsed }, USAGE.rateLimits[1]] })

// Every card hud-pro writes, in order.
function watchHub(on: any): any[] {
  const cards: any[] = []
  on('state.set', { plugin: 'hud-pro', key: 'hub' }, (_: any, e: any, next: any) => {
    cards.push(e.value)

    return next(e)
  })

  return cards
}

test('the MODZ card reads both plan windows, the 5-hour one sets its tone, a same card is not rewritten', async ($, on) => {
  stubSession(on)
  const cards = watchHub(on)
  await start($, 'desktop')

  expect(cards).toEqual([expect.objectContaining({ pane: 'usage', detail: '5s %32 · 7g %91', tone: 'idle' })])
  await $.session.measure(MEASURE)
  expect(cards).toHaveLength(1)
  await $.session.measure(fiveAt(85))
  await $.session.measure(fiveAt(96))
  expect(cards.slice(1)).toEqual([
    expect.objectContaining({ detail: '5s %85 · 7g %91', tone: 'warn' }),
    expect.objectContaining({ detail: '5s %96 · 7g %91', tone: 'bad' }),
  ])
  expect(hubOf(null)).toEqual({ detail: '', tone: 'idle' })
})

// A stand-in for the MODZ main panel: a press on one of its rows writes `modz.open`.
const MODZ = {
  name: 'modz',
  register(on: any) {
    on('command.run', { command: 'modz-press' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'open' }, { pane: e.args, at: 1 })

      return {}
    })
  },
}

test('a MODZ open request for usage opens the Kullanım pane, and only that one', { plugins: [MODZ] } as any, async ($: any, on: any) => {
  stubSession(on)
  await start($, 'desktop')

  expect(isOwnOpen({ pane: 'usage', at: 1 })).toBe(true)
  expect(isOwnOpen(undefined)).toBe(false)
  await $.command.run({ command: 'modz-press', args: 'skins' })
  expect(opens).toEqual([])
  await $.command.run({ command: 'modz-press', args: 'usage' })
  expect(opens).toEqual([expect.objectContaining({ id: 'hud-pro', title: 'Kullanım', focus: true })])
})
