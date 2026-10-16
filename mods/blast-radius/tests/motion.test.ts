// The card in motion on the desktop (kit/moving.ts): in the pane every drawing is an interactive frame that enters
// as the pane opens, keeps its very source while what it shows is unchanged, sweeps when its rows change and is
// struck without a sweep. The band above the prompt is no pane: its drawings stay plain.
import { expect, test } from 'claude-code/testing'

import { BUILD_SCAN, PANE_PROPS, mountBand, mountPane, pass, start, stub, world } from './world'

// Past one poll of the hold loop, which then sees Delete was pressed.
const POLL_MS = 300

const svgsOf = async (ui: any) => await ui.findAll({ type: 'Svg' })
const sources = async (ui: any) => (await svgsOf(ui)).map((svg: any) => svg.props.source as string)
// The list is the card's last drawing.
const listOf = async (ui: any) => (await sources(ui)).at(-1) as string

test('desktop pane: the drawings cascade in as frames and keep their sources across a redraw', async ($: any, on: any) => {
  const w = world({ answers: { files: BUILD_SCAN } })
  stub(on, w)
  await start($, w)
  const call = $.tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await pass(w, 0)
  const pane = await mountPane($, 'desktop')
  const svgs = await svgsOf(pane)
  const first = await sources(pane)

  expect(svgs.length).toBeGreaterThan(1)
  expect(svgs.every((svg: any) => svg.props.isInteractive === true)).toBe(true)
  expect(first.every(source => source.includes(':root{color-scheme:light dark}') && source.includes('class="m-in"'))).toBe(true)

  await pane.redraw({ ...PANE_PROPS, isFocused: !PANE_PROPS.isFocused })
  expect(await sources(pane)).toEqual(first)

  await pane.press({ key: 'cancel' })
  await pass(w)
  await call
})

test('desktop pane: Show more sweeps the list, the strike plays alone, a new card enters anew', async ($: any, on: any) => {
  const w = world({ answers: { files: BUILD_SCAN } })
  stub(on, w)
  await start($, w)
  const call = $.tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await pass(w, 0)
  const pane = await mountPane($, 'desktop')
  const [head] = await sources(pane)

  await pane.press({ key: 'toggle' })
  expect((await sources(pane))[0]).toBe(head)
  expect(await listOf(pane)).toContain('class="m-sweep"')

  await pane.press({ key: 'run' })
  await pass(w, POLL_MS)
  const struck = await listOf(pane)
  expect(struck).toContain('class="st"')
  expect(struck).not.toContain('class="m-sweep"')
  expect((await svgsOf(pane)).every((svg: any) => svg.props.isInteractive === true)).toBe(true)
  await pass(w)
  await call

  const again = $.tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await pass(w, 0)
  const anew = await sources(pane)
  expect(anew.length).toBeGreaterThan(1)
  expect(anew.every(source => source.includes('class="m-in"'))).toBe(true)
  await pane.press({ key: 'cancel' })
  await pass(w)
  await again
})

test('desktop band: the drawings stay plain', async ($: any, on: any) => {
  const w = world({ isPlaced: false, answers: { files: BUILD_SCAN } })
  stub(on, w)
  on('ui.render', () => ({ type: 'Text', children: ['other mod row'] }))
  await start($, w)
  const call = $.tool.call({ tool: 'Bash', command: 'rm -rf build' })
  await pass(w, 0)
  const band = await mountBand($, 'desktop')
  const svgs = await svgsOf(band)

  expect(svgs.length).toBeGreaterThan(1)
  expect(svgs.some((svg: any) => svg.props.isInteractive === true)).toBe(false)
  expect((await sources(band)).some(source => source.includes('m-in'))).toBe(false)
  await band.press({ key: 'cancel' })
  await pass(w)
  await call
})
