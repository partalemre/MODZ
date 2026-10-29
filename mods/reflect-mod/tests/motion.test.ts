// The Ideas pane in motion on the desktop (kit/moving.ts): its head is an interactive frame that enters as `/mine`
// opens the pane, keeps its very source while what it shows is unchanged (the skeleton's shimmer runs on), flashes
// when the run moves on, and enters again when `/mine` opens the pane anew.
import { expect, test } from 'claude-code/testing'

import { IDEAS, mineWorld, paneSite } from './ideas-world'
import { start } from './world'

const RUN_MINE = { command: 'mine', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } } as never
const COLUMNS = 80

const svgsOf = async (ui: any) => await ui.findAll({ type: 'Svg' })
const sources = async (ui: any) => (await svgsOf(ui)).map((svg: any) => svg.props.source as string)

test('desktop: the head cascades in as a frame, holds still while reading, flashes once the ideas land', async ($: any, on: any) => {
  const w = mineWorld(on, { ideas: IDEAS, lang: null })
  await start($)
  await $.command.run(RUN_MINE)
  const pane = await $.ui.mount(paneSite('desktop', COLUMNS))
  const svgs = await svgsOf(pane)
  const reading = await sources(pane)

  expect(svgs).toHaveLength(1)
  expect(svgs[0].props.isInteractive).toBe(true)
  expect(reading[0]).toContain(':root{color-scheme:light dark}')
  expect(reading[0]).toContain('class="m-in"')
  expect(reading[0]).toContain('class="shimmer"')

  await pane.redraw((paneSite('desktop', COLUMNS) as any).props)
  expect(await sources(pane)).toEqual(reading)

  await w.clock.settle()
  const [done] = await sources(pane)
  expect(done).toContain('m-flash')
  expect(done).not.toContain('class="shimmer"')

  await $.command.run(RUN_MINE)
  expect((await sources(pane))[0]).toContain('class="m-in"')
  await w.clock.settle()
})
