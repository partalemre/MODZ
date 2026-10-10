import { expect, test } from 'claude-code/testing'

import { newFake, paneOf, stub } from './stubs'

// A desktop clicks the tree it last painted. Every redraw keeps each button's press handle, so a click
// on an earlier tree still lands.

const PANE = paneOf('desktop')

function handlesOf(node: any, out: Record<string, number> = {}): Record<string, number> {
  if (node === null || typeof node !== 'object') return out
  if (node.press !== undefined && typeof node.props?.key === 'string') out[`${node.type}:${node.props.key}`] = node.press.handle
  for (const child of node.children ?? []) handlesOf(child, out)

  return out
}

test('a pane redraw keeps every button’s press handle', async ($: any, on: any) => {
  stub(on, newFake({ refs: 'refs/checkpoints/s/1\tc1\t100\tfix login', diff: 'M\0a.ts\0' }))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/w' })
  await $.command.run({ command: 'checkpoints', args: '' })
  const pane = await $.ui.mount(PANE)
  const before = handlesOf(await pane.drawn())
  await pane.redraw({ ...PANE.props, isFocused: !PANE.props.isFocused })

  expect(Object.keys(before).length).toBeGreaterThan(0)
  expect(handlesOf(await pane.drawn())).toEqual(before)
  await pane.press({ key: 'cp-undo-0' })
  expect(await pane.find({ key: 'cp-confirm' })).toBeDefined()
})
