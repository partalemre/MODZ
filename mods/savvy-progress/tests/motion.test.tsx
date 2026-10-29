// The pane in motion on the desktop (kit/moving.ts): every drawing is an interactive frame that enters as the pane
// opens, keeps its very source while what it shows is unchanged (the once-a-second tick included), and enters again
// when the pane opens anew. Live work only breathes: a running pill's dot and the open call's dot; no bar shines.
import { expect, test } from 'claude-code/testing'

import { pulseSvg } from '../hooks/pane-svg'
import { PANE, SECOND, setup, threeRunning, tool } from './fixtures'

const mount = ($: any) => $.ui.mount({ ...PANE, surface: 'desktop' })
const sources = async (ui: any) => (await ui.findAll({ type: 'Svg' })).map((svg: any) => svg.props.source as string)
const texts = async (ui: any) => (await ui.findAll({ type: 'Text' })).map((t: any) => t.text ?? '').join('\n')

test('desktop: the drawings cascade in as frames, live work moves, and the one-second tick leaves them as they were', async ($: any, on: any) => {
  const { clock } = await setup($, on)
  await threeRunning($)
  const ui = await mount($)
  await ui.press({ key: 'open-a3' })
  const svgs = await ui.findAll({ type: 'Svg' })
  const drawn = await sources(ui)

  expect(svgs.length).toBeGreaterThan(10)
  expect(svgs.every((svg: any) => svg.props.isInteractive === true && svg.props.width > 0 && svg.props.height > 0)).toBe(true)
  expect(drawn.every(source => source.includes(':root{color-scheme:light dark}') && source.includes('class="m-in"'))).toBe(true)
  expect(drawn.some(source => /m-shine|m-ripple/.test(source))).toBe(false)
  expect(drawn.filter(source => source.includes('f-edit live')).length).toBeGreaterThanOrEqual(3)
  expect(pulseSvg()).toContain('f-edit live')

  // The clocks count on in native text; no drawing is rebuilt for them.
  await clock.advance(3 * SECOND)
  expect(await texts(ui)).toContain('0:03')
  expect(await sources(ui)).toEqual(drawn)
})

test('desktop: a change redraws in place, and opening the pane again brings every drawing in again', async ($: any, on: any) => {
  await setup($, on)
  await threeRunning($)
  const ui = await mount($)
  await tool($, { tool: 'Read', file_path: '/w/site/README.md', agentId: 'a1' })
  expect((await sources(ui)).some(source => !source.includes('class="m-in"'))).toBe(true)

  await ui.unmount()
  await $.command.run({ command: 'agents-info', args: '' })
  expect((await sources(await mount($))).every(source => source.includes('class="m-in"'))).toBe(true)
})
