// The pane in motion on the desktop (kit/moving.ts): every drawing enters as the pane
// opens (the pressed ones are plain still images under their buttons, the rest interactive frames), keeps its very source while what it shows is unchanged, and enters again when the pane opens anew.
import { expect, test } from 'claude-code/testing'

import { newFake, paneOf, stub } from './stubs'

const TWO = { refs: 'refs/checkpoints/s/2\tc2\t200\tadd tests\nrefs/checkpoints/s/1\tc1\t100\tfix login', diff: 'M\0a.ts\0' }

const STILL = '<style>*{animation:none!important;transition:none!important}</style></svg>'

const sources = async (pane: any) => (await pane.findAll({ type: 'Svg' })).map((svg: any) => svg.props.source as string)

test('desktop: the drawings cascade in as frames and keep their sources across a redraw', async ($: any, on: any) => {
  stub(on, newFake(TWO))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/w' })
  await $.command.run({ command: 'checkpoints', args: '' })
  const pane = await $.ui.mount(paneOf('desktop'))
  const svgs = await pane.findAll({ type: 'Svg' })
  const first = await sources(pane)

  expect(svgs.length).toBeGreaterThan(2)
  const isPressed = (svg: any) => (svg.props.source as string).endsWith(STILL)

  expect(svgs.filter(isPressed).length).toBeGreaterThan(1)
  expect(svgs.filter(isPressed).every((svg: any) => svg.props.isInteractive !== true)).toBe(true)
  expect(svgs.filter(svg => !isPressed(svg)).every((svg: any) => svg.props.isInteractive === true)).toBe(true)
  expect(first.every(source => source.includes(':root{color-scheme:light dark}') && source.includes('class="m-in"'))).toBe(true)
  expect(first.filter(source => source.includes('class="m-wash"'))).toHaveLength(2)

  await pane.press({ key: 'cp-undo-0' })
  await pane.press({ key: 'cp-cancel' })
  expect(await sources(pane)).toEqual(first)

  await $.command.run({ command: 'checkpoints', args: '' })
  expect((await sources(pane)).every(source => source.includes('class="m-in"'))).toBe(true)
})
