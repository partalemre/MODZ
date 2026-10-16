// The pane in motion on the desktop (kit/moving.ts): its drawing is an interactive frame that enters as the pane
// opens, the step under way sends rings out of its circle, and the 30-second tick rebuilds nothing until a time it
// shows really moves on, and even then without the sweep a real change gets.
import { expect, test } from 'claude-code/testing'

import { MIN, seen, todos, UNDER_WAY, world } from './world'

const SECOND = 1_000
const TICK = 30 * SECOND
// The step under way has run just under ten minutes: one tick on it still reads "10m", the next reads "11m".
const RUN = 10 * MIN - 20 * SECOND

const paneOf = () => ({
  plugin: 'plan-steps', component: 'Pane', requestId: 'plan-steps', surface: 'desktop', viewport: { columns: 160, rows: 40 },
  props: { title: 'Plan', isFocused: false, bodyColumns: 56, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
}) as const

const sources = async (pane: any) => (await pane.findAll({ type: 'Svg' })).map((svg: any) => svg.props.source as string)

async function opened($: any, on: any) {
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('fs.read', () => ({ value: '' }))
  await world($, on)
  await $.tool.call(UNDER_WAY)
  await seen.clock.advance(RUN)
  await $.command.run({ command: 'steps', args: '' })

  return $.ui.mount(paneOf())
}

test('desktop: the plan enters as a frame with rings on the step under way', async ($: any, on: any) => {
  const pane = await opened($, on)
  const svgs = await pane.findAll({ type: 'Svg' })
  const [source] = await sources(pane)

  expect(svgs).toHaveLength(1)
  expect(svgs[0].props.isInteractive).toBe(true)
  expect(svgs[0].props.width).toBeGreaterThan(0)
  expect(svgs[0].props.height).toBeGreaterThan(0)
  expect(source).toContain(':root{color-scheme:light dark}')
  expect(source).toContain('class="m-in"')
  expect(source).toContain('m-ripple')
})

test('desktop: a tick rebuilds nothing, a new minute redraws without a sweep, a finished step sweeps', async ($: any, on: any) => {
  const pane = await opened($, on)
  const first = await sources(pane)

  await seen.clock.advance(TICK)
  expect(await sources(pane)).toEqual(first)

  await seen.clock.advance(TICK)
  const [minute] = await sources(pane)
  expect(minute).not.toBe(first[0])
  expect(minute).toContain('>11m<')
  expect(minute).not.toContain('m-sweep')

  await $.tool.call(todos([['Write the types', 'completed'], ['Draw the band', 'completed'], ['Write the README', 'in_progress']]))
  expect((await sources(pane))[0]).toContain('m-sweep')
})

test('desktop: the plan enters again when the pane opens anew, and a quiet plan has no rings', async ($: any, on: any) => {
  const pane = await opened($, on)
  await seen.clock.advance(2 * TICK)
  expect((await sources(pane))[0]).not.toContain('class="m-in"')

  // The desktop mounts a pane anew as it opens.
  await pane.unmount()
  await $.command.run({ command: 'steps', args: '' })
  const again = await $.ui.mount(paneOf())
  expect((await sources(again))[0]).toContain('class="m-in"')

  await seen.clock.advance(45 * MIN)
  expect((await sources(again))[0]).not.toContain('m-ripple')
})

test('desktop: the empty pane is a frame too', async ($: any, on: any) => {
  on('ui.open', () => ({ value: { isPlaced: true } }))
  await world($, on)
  await $.command.run({ command: 'steps', args: '' })
  const pane = await $.ui.mount(paneOf())
  const svg = await pane.find({ type: 'Svg' })

  expect(svg.props.isInteractive).toBe(true)
  expect(String(svg.props.source)).toContain('class="m-in"')
})
