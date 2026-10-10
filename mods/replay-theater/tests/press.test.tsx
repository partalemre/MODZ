import { expect, test } from 'claude-code/testing'

import { bandOf, newWorld, paneOf, plannedTurn, setup } from './fixtures'

// A desktop clicks the tree it last painted. Every redraw keeps each button's press handle, so a click
// on an earlier tree still lands.

const PANE = paneOf('desktop')
const BAND = bandOf('desktop')
const WIDER_BY = 20

function handlesOf(node: any, out: Record<string, number> = {}): Record<string, number> {
  if (node === null || typeof node !== 'object') return out
  if (node.press !== undefined && typeof node.props?.key === 'string') out[`${node.type}:${node.props.key}`] = node.press.handle
  for (const child of node.children ?? []) handlesOf(child, out)

  return out
}

test('a pane redraw keeps every button’s press handle', async ($: any, on: any) => {
  const world = newWorld()
  await setup($, on, world)
  await plannedTurn($, world)
  const pane = await $.ui.mount(PANE)
  const before = handlesOf(await pane.drawn())
  await pane.redraw({ ...PANE.props, isFocused: !PANE.props.isFocused })

  expect(Object.keys(before).length).toBeGreaterThan(0)
  expect(handlesOf(await pane.drawn())).toEqual(before)
})

test('an offer band redraw keeps every button’s press handle', async ($: any, on: any) => {
  const world = newWorld()
  await setup($, on, world)
  await plannedTurn($, world)
  const band = await $.ui.mount(BAND)
  const before = handlesOf(await band.drawn())
  await band.redraw({ ...BAND.props, bodyColumns: BAND.props.bodyColumns + WIDER_BY })

  expect(Object.keys(before).length).toBeGreaterThan(0)
  expect(handlesOf(await band.drawn())).toEqual(before)
})
