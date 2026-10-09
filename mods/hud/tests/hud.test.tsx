import { expect, mock, test } from 'claude-code/testing'

const BAND = {
  plugin: 'hud',
  component: 'AbovePrompt',
  requestId: 'band',
  viewport: { columns: 120, rows: 30 },
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 5,
    bodyColumns: 120,
    scroll: { offset: 0, bodyRows: 5 },
    view: {},
  },
} as const

const MS_PER_HOUR = 3_600_000

const USAGE = {
  startedAt: 0,
  context: { window: 200_000, tokens: 82_000, percent: 41 },
  rateLimits: [
    { kind: 'five_hour', percentUsed: 32, resetsAt: new Date(2 * MS_PER_HOUR).toISOString() },
    { kind: 'seven_day', percentUsed: 91.4, resetsAt: new Date(94 * MS_PER_HOUR).toISOString() },
  ],
  cost: { usd: 1.234 },
}

const TURN_USAGE = {
  input_tokens: 400,
  output_tokens: 640,
  cache_read_input_tokens: 11_900,
  cache_creation_input_tokens: 100,
  model: 'claude-test',
}

function stubSession(on: any, blits: any[] = []) {
  const clock = mock.clock(on)
  on('session.usage', () => ({ value: USAGE }))
  on('config.list', () => ({ value: [{ key: 'theme', value: 'dark' }] }))
  on('command.register', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/work' }))
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['engine'] }))
  on('ui.blit', (_: any, e: any) => {
    blits.push(e)

    return { value: {} }
  })
  on('turn.start', (_: any, e: any) => ({ turnId: e.turnId }))
  on('turn.step', async function* (_: any, e: any) {
    return { turnId: e.turnId, index: e.index, answer: 'ok', toolUses: [], stopReason: 'end_turn', usage: TURN_USAGE }
  })

  return clock
}

async function start($: any) {
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
}

test('the terminal band is one Raster as wide as the band', async ($, on) => {
  stubSession(on)
  await start($)

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const raster = await ui.find({ type: 'Raster' })

  expect(raster?.props?.columns).toBe(120)
  expect(raster?.props?.rows).toBe(1)
  expect(await ui.find({ type: 'Text', text: 'engine' })).toBeUndefined()
})

test('the desktop band is a transparent Svg image that names every gauge', async ($, on) => {
  stubSession(on)
  await start($)

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const svg = await ui.find({ type: 'Svg' })

  expect(svg?.props?.isInteractive).toBeUndefined()
  expect(svg?.props?.source).toContain('5H')
  expect(svg?.props?.source).toContain('7D')
  expect(svg?.props?.source).toContain('CTX')
  expect(svg?.props?.alt).toContain('5h 32% used')
})

test('the band gives way while a survey holds it', async ($, on) => {
  stubSession(on)
  await start($)

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal', props: { ...BAND.props, hasSurvey: true } })

  expect(await ui.find({ type: 'Text', text: 'engine' })).toBeDefined()
})

test('a working band animates by repainting its Raster', async ($, on) => {
  const blits: any[] = []
  const clock = stubSession(on, blits)
  await start($)

  await $.ui.mount({ ...BAND, surface: 'terminal', props: { ...BAND.props, isWorking: true } })
  await clock.advance(400)

  expect(blits.length).toBeGreaterThan(2)
  expect(blits[0].key).toBe('hud')
  expect(blits[0].requestId).toBe('band')
})

test('a turn shows its token flow on the wide desktop band', async ($, on) => {
  stubSession(on)
  await start($)
  await $.turn.start({ text: 'hi', turnId: 't' })
  const stream = $.turn.step({ turnId: 't', index: 0, model: 'claude-test', messageCount: 1 })
  let step = await stream.next()
  while (step.done !== true) step = await stream.next()

  const ui = await $.ui.mount({
    ...BAND,
    viewport: { columns: 140, rows: 30 },
    surface: 'desktop',
    props: { ...BAND.props, bodyColumns: 140 },
  })
  const svg = await ui.find({ type: 'Svg' })

  expect(svg?.props?.source).toContain('12.4k in')
  expect(svg?.props?.source).toContain('cached')
})

test('/hud hides the band', async ($, on) => {
  stubSession(on)
  await start($)

  const answer = await $.command.run({ command: 'hud', args: '' })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })

  expect(answer.text).toBe('HUD hidden.')
  expect(await ui.find({ type: 'Text', text: 'engine' })).toBeDefined()
})
