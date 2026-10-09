import { test } from 'claude-code/testing'

import { BAND, MS_PER_HOUR, PANE, USAGE, start, stubSession } from './stubs'

// Visual states for bin/preview: each logs its drawn tree. Widths in columns of 6.4 px:
// the band at a wide (≈770 px) and a narrow (≈520 px) chat column, the pane at ≈400 and ≈600 px.
const BAND_NARROW = 81
const BAND_TIGHT = 62
const TERMINAL_NARROW = 60
const PANE_NARROW = 62
const PANE_WIDE = 94
const log = async (label: string, ui: any) => console.log(`@@TREE@@${label}@@${JSON.stringify(await ui.drawn())}`)

const limits = (five: number, seven: number) => [
  { kind: 'five_hour', percentUsed: five, resetsAt: new Date(2 * MS_PER_HOUR + 10 * 60_000).toISOString() },
  { kind: 'seven_day', percentUsed: seven, resetsAt: new Date(94 * MS_PER_HOUR).toISOString() },
]
const usage = (five: number, seven: number, context: number) => ({
  ...USAGE,
  context: { window: 200_000, tokens: context * 2_000, percent: context },
  rateLimits: limits(five, seven),
})

// The user's own band: the 5-hour window at 99 % with 1 h 20 min to go, a big session.
const critical = {
  ...usage(99, 24, 46),
  rateLimits: [
    { kind: 'five_hour', percentUsed: 99, resetsAt: new Date(MS_PER_HOUR + 20 * 60_000).toISOString() },
    { kind: 'seven_day', percentUsed: 24, resetsAt: new Date(94 * MS_PER_HOUR).toISOString() },
  ],
  cost: { usd: 18.78 },
}

const STATES = [
  { label: 'line-normal', value: usage(32, 38, 41) },
  { label: 'line-high', value: usage(78, 96, 55) },
  { label: 'line-compact', value: usage(32, 38, 84) },
  { label: 'line-critical', value: critical },
] as const

for (const state of STATES) {
  test(`preview ${state.label}`, async ($, on) => {
    stubSession(on, state.value)
    await start($, 'desktop')
    await log(state.label, await $.ui.mount({ ...BAND, surface: 'desktop' }))
    const narrow = { ...BAND.props, bodyColumns: BAND_NARROW }
    await log(`${state.label}-520`, await $.ui.mount({ ...BAND, requestId: 'band-n', surface: 'desktop', props: narrow }))
    const tight = { ...BAND.props, bodyColumns: BAND_TIGHT }
    await log(`${state.label}-400`, await $.ui.mount({ ...BAND, requestId: 'band-x', surface: 'desktop', props: tight }))
    await log(`${state.label}-terminal`, await $.ui.mount({ ...BAND, requestId: 'band-t', surface: 'terminal' }))
    await log(`${state.label}-terminal-60`, await $.ui.mount({ ...BAND, requestId: 'band-tn', surface: 'terminal', props: { ...BAND.props, bodyColumns: TERMINAL_NARROW } }))
  })
}

test('preview hud-full', async ($, on) => {
  const clock = stubSession(on, usage(32, 38, 41))
  await start($, 'desktop')
  const steps = [8, 12, 15, 19, 22, 26, 31, 35, 44, 52, 58, 64]
  for (const [index, five] of steps.entries()) {
    await $.session.measure({ ...usage(five, 30 + index, 20 + index * 4), cost: { usd: 0.1 * (index + 1) ** 1.3 }, changed: ['rateLimits'] } as any)
    await clock.advance(60_000)
  }
  await $.turn.start({ text: 'go', turnId: 't1' } as any)
  for await (const _ of $.turn.step({ turnId: 't1', index: 0, model: 'claude-test' } as any)) void _
  await $.command.run({ command: 'hud', args: 'full' } as any)
  const wide = await $.ui.mount({ ...PANE, surface: 'desktop', props: { ...PANE.props, bodyColumns: PANE_WIDE } })
  await log('hud-full-600', wide)
  await wide.unmount()
  const narrow = await $.ui.mount({ ...PANE, surface: 'desktop', props: { ...PANE.props, bodyColumns: PANE_NARROW } })
  await log('hud-full-400', narrow)
  await narrow.unmount()
  await log('hud-full-terminal', await $.ui.mount({ ...PANE, surface: 'terminal' }))
})
