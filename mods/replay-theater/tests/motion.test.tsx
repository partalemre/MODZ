// The pane in motion on the desktop (kit/moving.ts): every drawing is an interactive frame that enters as the pane
// opens, a step's drawings follow its edit rather than its place, the age reading on is no change to sweep, and a
// diff wider than the pane still scrolls sideways in its frame.
import { expect, test } from 'claude-code/testing'

import { newWorld, paneOf, plannedTurn, replayCommand, setup, startWithArchive } from './fixtures'

const sources = async (pane: any): Promise<string[]> => (await pane.findAll({ type: 'Svg' })).map((svg: any) => svg.props.source as string)
// Past a minute, so "just now" reads "1m ago".
const PAST_MINUTE_MS = 61_000
const LONG_LINE = `export const banner = '${'welcome to the station, '.repeat(8)}'\n`

async function draw($: any): Promise<string[]> {
  const pane = await $.ui.mount(paneOf('desktop'))
  const drawn = await sources(pane)
  await pane.unmount()

  return drawn
}

test('desktop: the replay cascades in as frames, a step follows its edit, and its age ticks on without a sweep', async ($: any, on: any) => {
  const world = newWorld()
  const clock = await setup($, on, world)
  await plannedTurn($, world)
  await replayCommand($, clock, '')
  const pane = await $.ui.mount(paneOf('desktop'))
  const svgs = await pane.findAll({ type: 'Svg' })
  const first = await sources(pane)

  expect(svgs).toHaveLength(3)
  expect(svgs.every((svg: any) => svg.props.isInteractive === true && svg.props.width > 0 && svg.props.height > 0)).toBe(true)
  expect(first.every(source => source.includes(':root{color-scheme:light dark}') && source.includes('class="m-in"'))).toBe(true)

  await pane.press({ key: 'rt-next' })
  const next = await sources(pane)
  expect(next[0]).toContain('m-sweep')
  expect(next.slice(1).every(source => source.includes('class="m-in"'))).toBe(true)

  await pane.press({ key: 'rt-prev' })
  expect((await sources(pane)).slice(1)).toEqual(first.slice(1))
  await pane.unmount()
  const back = await draw($)
  expect(await draw($)).toEqual(back)

  await clock.advance(PAST_MINUTE_MS)
  const later = await draw($)
  expect(later[0]).not.toEqual(back[0])
  expect(later[0]).not.toContain('m-sweep')
  expect(later.slice(1)).toEqual(back.slice(1))
})

test('desktop: a diff wider than the pane keeps its scroll room and its own width inside the frame', async ($: any, on: any) => {
  const world = newWorld()
  const clock = await setup($, on, world)
  await $.turn.start({ text: 'add a banner', turnId: 't1' })
  await $.tool.call({ tool: 'Write', file_path: '/w/src/banner.js', content: LONG_LINE })
  await $.turn.complete({ answer: 'Added it.', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' })
  await replayCommand($, clock, '')
  const diff = (await (await $.ui.mount(paneOf('desktop'))).findAll({ type: 'Svg' })).at(-1)
  const [, drawnWidth, drawnHeight] = /^<svg[^>]* width="(\d+)" height="(\d+)"/.exec(diff.props.source) ?? []

  expect(diff.props.isInteractive).toBe(true)
  expect(Number(drawnWidth)).toBeGreaterThan(diff.props.width)
  expect(diff.props.height).toBeGreaterThan(Number(drawnHeight))
  expect(diff.props.source).toContain('class="m-in"')
})

test('desktop: the session list rows wash on hover and cascade in again when the pane opens anew', async ($: any, on: any) => {
  const clock = await startWithArchive($, on, newWorld())
  await replayCommand($, clock, 'sessions')
  const first = await draw($)

  expect(first.length).toBeGreaterThan(2)
  expect(first.filter(source => source.includes('class="m-wash"')).length).toBeGreaterThan(1)
  expect(await draw($)).toEqual(first)

  await replayCommand($, clock, 'sessions')
  expect((await draw($)).every(source => source.includes('class="m-in"'))).toBe(true)
})
