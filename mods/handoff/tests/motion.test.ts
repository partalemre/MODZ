// The pane in motion on the desktop (kit/moving.ts): the kit's header and context meter are interactive frames that
// enter as the pane opens; a context reading moves the meter alone and leaves the header's very source, and the
// pane opening anew brings them in again. The band above the prompt draws as before.
import { expect, test } from 'claude-code/testing'

import { bandOf, measure, newWorld, paneOf, start, stub } from './stubs'

const sources = async (node: any) => (await node.findAll({ type: 'Svg' })).map((svg: any) => svg.props.source as string)

test('desktop: the drawings cascade in as frames, and a new reading moves only the meter', async ($: any, on: any) => {
  stub(on, newWorld())
  await start($, 'desktop')
  await measure($, 40)
  await $.command.run({ command: 'handoff', args: 'show' })
  const pane = await $.ui.mount(paneOf('desktop'))
  const svgs = await pane.findAll({ type: 'Svg' })
  const [head, meter] = await sources(pane)

  expect(svgs).toHaveLength(2)
  expect(svgs.every((svg: any) => svg.props.isInteractive === true && svg.props.width > 0 && svg.props.height > 0)).toBe(true)
  expect([head, meter].every(source => source.includes(':root{color-scheme:light dark}') && source.includes('class="m-in"'))).toBe(true)

  await measure($, 55)
  const [sameHead, newMeter] = await sources(pane)
  expect(sameHead).toBe(head)
  expect(newMeter).not.toBe(meter)
  expect(newMeter).toContain('m-sweep')

  // The desktop mounts a pane anew as it opens.
  await pane.unmount()
  await $.command.run({ command: 'handoff', args: 'show' })
  const again = await $.ui.mount(paneOf('desktop'))
  expect((await sources(again)).every(source => source.includes('class="m-in"'))).toBe(true)
})

test('desktop: the band above the prompt keeps plain drawings', async ($: any, on: any) => {
  stub(on, newWorld())
  await start($, 'desktop')
  await measure($, 80)
  const band = await $.ui.mount(bandOf('desktop'))
  const svgs = await band.findAll({ type: 'Svg' })

  expect(svgs.length).toBeGreaterThan(0)
  expect(svgs.every((svg: any) => svg.props.isInteractive !== true)).toBe(true)
})
