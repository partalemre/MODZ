import { expect, mock, test } from 'claude-code/testing'

import { FOCUS_SETTLE_MS } from '../hooks/focus'

// The two desktop press races: a click that focuses the pane redraws it under the click, and a desktop
// that reattaches keeps a tree whose buttons the engine already released.

const MIN = 60_000
const PANE = {
  plugin: 'plan-steps', component: 'Pane', requestId: 'plan-steps', surface: 'desktop',
  viewport: { columns: 160, rows: 40 },
  props: { title: 'Plan', isFocused: true, bodyColumns: 52, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const
const PLAN = { tool: 'TodoWrite', todos: [{ content: 'Tipleri yaz', status: 'in_progress', activeForm: 'Tipleri yaz' }] }

// Only what the pane needs to draw a plan; the session starts on the terminal as in the main tests.
async function setup($: any, on: any) {
  const clock = mock.clock(on)
  on('session.start', () => ({ cwd: '/w' }))
  on('command.register', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.render', () => ({ type: 'engine', ref: 1 }))
  on('tool.call', () => ({ result: 'ok' }))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })

  return clock
}

async function svgOf(pane: any): Promise<string> {
  return String((await pane.find({ type: 'Svg' }))?.props?.source ?? '')
}

// Whether the work finishes before the clock moves at all; it is let finish either way.
async function isImmediate(clock: any, work: Promise<unknown>): Promise<boolean> {
  let isDone = false
  const watched = work.then(() => {
    isDone = true
  })
  await clock.settle()
  const wasDone = isDone
  await clock.advance(FOCUS_SETTLE_MS)
  await watched

  return wasDone
}

// The pane reads the clock without subscribing to it, so time alone leaves the drawing as it was:
// a new elapsed time showing up proves the attach drew it again.
test('a reattaching desktop gets the pane drawn again', async ($: any, on: any) => {
  on('session.attach', (_: unknown, e: any) => ({ clientId: e.clientId }))
  const clock = await setup($, on)
  await $.tool.call(PLAN)
  await clock.advance(2 * MIN)
  const pane = await $.ui.mount(PANE)
  const before = await svgOf(pane)
  expect(before).toContain('2dk')
  await clock.advance(5 * MIN)
  expect(await svgOf(pane)).toBe(before)

  await $.session.attach({ surface: 'desktop', clientId: 'desktop-2' })

  expect(await svgOf(pane)).toContain('7dk')
})

test('a pane render whose focus flipped waits for the click; first and same-focus renders do not', async ($: any, on: any) => {
  const clock = await setup($, on)
  const mounting = $.ui.mount(PANE)
  expect(await isImmediate(clock, mounting)).toBe(true)
  const pane = await mounting
  expect(await isImmediate(clock, pane.redraw(PANE.props))).toBe(true)

  let isDone = false
  const flip = pane.redraw({ ...PANE.props, isFocused: false }).then(() => {
    isDone = true
  })
  await clock.advance(FOCUS_SETTLE_MS - 1)
  expect(isDone).toBe(false)
  await clock.advance(1)
  await flip
  expect(isDone).toBe(true)
})
