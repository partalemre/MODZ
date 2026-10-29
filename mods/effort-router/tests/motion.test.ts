// The pane in motion on the desktop (kit/moving.ts): the head and the group label are interactive frames that enter
// as the pane opens; a new turn redraws the head it changes without a sheen (DESIGN.md §0.4) and leaves the label's
// very source, and the pane opening anew brings them in again.
import { expect, test } from 'claude-code/testing'

import { begin, paneOf, stub, turn, worldOf } from './stubs'

const sources = async (pane: any) => (await pane.findAll({ type: 'Svg' })).map((svg: any) => svg.props.source as string)

test('desktop: the drawings cascade in as frames, and a new turn moves only the one it changes', async ($: any, on: any) => {
  stub(on, worldOf())
  await begin($, 'desktop')
  await $.command.run({ command: 'effort-router', args: '' })
  const pane = await $.ui.mount(paneOf('desktop'))
  const svgs = await pane.findAll({ type: 'Svg' })
  const [head, eyebrow] = await sources(pane)

  expect(svgs).toHaveLength(2)
  expect(svgs.every((svg: any) => svg.props.isInteractive === true && svg.props.width > 0 && svg.props.height > 0)).toBe(true)
  expect([head, eyebrow].every(source => source.includes(':root{color-scheme:light dark}') && source.includes('class="m-in"'))).toBe(true)

  await turn($, { text: 'fix the login bug', turnId: 't1' })
  const [newHead, sameEyebrow] = await sources(pane)
  expect(newHead).not.toBe(head)
  expect(newHead).toContain('opus-5-5')
  expect(newHead).not.toContain('m-sweep')
  expect(sameEyebrow).toBe(eyebrow)

  // The desktop mounts a pane anew as it opens.
  await pane.unmount()
  await $.command.run({ command: 'effort-router', args: '' })
  const again = await $.ui.mount(paneOf('desktop'))
  expect((await sources(again)).every(source => source.includes('class="m-in"'))).toBe(true)
})
