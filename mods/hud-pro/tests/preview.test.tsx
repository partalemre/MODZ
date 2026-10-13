import { test } from 'claude-code/testing'

import { BAND, MS_PER_HOUR, PANE, USAGE, start, stubSession, withBreakdown } from './stubs'

/** The test runner's console: bin/preview reads the trees it prints. */
declare const console: { log: (text: string) => void }

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

// The context at the end of each turn, read back through the stub's usage.
async function endTurns($: any, live: any, tokens: readonly number[]) {
  for (const [index, count] of tokens.entries()) {
    live.context = { ...live.context, tokens: count, percent: Math.round((count / live.context.window) * 100) }
    await $.turn.complete({ answer: 'ok', durationMs: 1, isAborted: false, turnId: `c${index}`, reason: 'answer' } as any)
  }
}

const TURN_TOKENS = [52_000, 61_000, 64_000, 70_000, 78_000, 81_000, 90_000, 96_000, 104_000, 112_000, 118_000, 126_000]
const NEAR_TOKENS = [150_000, 158_000, 166_000, 174_000]

async function logPane($: any, label: string) {
  const wide = await $.ui.mount({ ...PANE, requestId: 'hud-pro', surface: 'desktop', props: { ...PANE.props, bodyColumns: PANE_WIDE } })
  await log(`${label}-600`, wide)
  await wide.unmount()
  const narrow = await $.ui.mount({ ...PANE, surface: 'desktop', props: { ...PANE.props, bodyColumns: PANE_NARROW } })
  await log(`${label}-400`, narrow)
  await narrow.unmount()
  const terminal = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await log(`${label}-terminal`, terminal)

  return terminal
}

// A 5-hour window filling within the hour and a context five turns from full: both estimates on the line.
test('preview line-forecast', async ($, on) => {
  const live: any = { ...usage(40, 30, 75), context: { window: 200_000, tokens: 150_000, percent: 75 } }
  const clock = stubSession(on, live)
  await start($, 'desktop')
  for (const five of [40, 46, 52, 58]) {
    await clock.advance(5 * 60_000)
    await $.session.measure({ ...live, rateLimits: limits(five, 30), changed: ['rateLimits'] } as any)
  }
  await endTurns($, live, NEAR_TOKENS)
  await $.session.measure({ ...live, rateLimits: limits(58, 30), changed: ['context'] } as any)
  await log('line-forecast', await $.ui.mount({ ...BAND, surface: 'desktop' }))
  await log('line-forecast-520', await $.ui.mount({ ...BAND, requestId: 'band-n', surface: 'desktop', props: { ...BAND.props, bodyColumns: BAND_NARROW } }))
  await log('line-forecast-terminal', await $.ui.mount({ ...BAND, requestId: 'band-t', surface: 'terminal' }))
})

// The context card before any breakdown or turn: the estimate line and the button alone.
test('preview hud-context-empty', async ($, on) => {
  stubSession(on, usage(32, 38, 41))
  await start($, 'desktop')
  await logPane($, 'hud-context-empty')
})

// After "Compact now": the card says what it came to.
test('preview hud-compacted', async ($, on) => {
  const clock = stubSession(on, withBreakdown(usage(32, 38, 19)))
  await start($, 'desktop')
  const terminal = await logPane($, 'hud-before-compact')
  await terminal.press({ key: 'compact-now' })
  await clock.advance(1)
  await terminal.unmount()
  await logPane($, 'hud-compacted')
})

test('preview hud-full', async ($, on) => {
  const live: any = withBreakdown(usage(32, 38, 41))
  const clock = stubSession(on, live)
  await start($, 'desktop')
  await endTurns($, live, TURN_TOKENS)
  const steps = [8, 12, 15, 19, 22, 26, 31, 35, 44, 52, 58, 64]
  for (const [index, five] of steps.entries()) {
    await $.session.measure({ ...usage(five, 30 + index, 20 + index * 4), cost: { usd: 0.1 * (index + 1) ** 1.3 }, changed: ['rateLimits'] } as any)
    await clock.advance(60_000)
  }
  await $.turn.start({ text: 'go', turnId: 't1' } as any)
  for await (const _ of $.turn.step({ turnId: 't1', index: 0, model: 'claude-test' } as any)) void _
  await $.command.run({ command: 'hud', args: 'full' } as any)
  await logPane($, 'hud-full')
})
