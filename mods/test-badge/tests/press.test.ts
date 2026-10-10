import { expect, test } from 'claude-code/testing'

import { bandOf, editAndRun, newWorld, paneOf, setup } from './world'

// A desktop clicks the tree it last painted. Every redraw keeps each button's press handle, so a click
// on an earlier tree still lands.

const WIDER_BY = 20

function handlesOf(node: any, out: Record<string, number> = {}): Record<string, number> {
  if (node === null || typeof node !== 'object') return out
  if (node.press !== undefined && typeof node.props?.key === 'string') out[`${node.type}:${node.props.key}`] = node.press.handle
  for (const child of node.children ?? []) handlesOf(child, out)

  return out
}

test('a pane redraw keeps every button’s press handle', async ($: any, on: any) => {
  await editAndRun($, await setup($, on, newWorld({ surface: 'desktop' })))
  const site = paneOf('desktop')
  const pane = await $.ui.mount(site)
  const before = handlesOf(await pane.drawn())
  await pane.redraw({ ...site.props, isFocused: !site.props.isFocused })

  expect(Object.keys(before).length).toBeGreaterThan(0)
  expect(handlesOf(await pane.drawn())).toEqual(before)
})

test('a band redraw keeps every button’s press handle', async ($: any, on: any) => {
  // A finished run leaves its notice on the band, so the band has something to draw.
  await editAndRun($, await setup($, on, newWorld({ surface: 'desktop' })))
  const site = bandOf('desktop')
  const band = await $.ui.mount(site)
  const before = handlesOf(await band.drawn())
  await band.redraw({ ...site.props, bodyColumns: site.props.bodyColumns + WIDER_BY })

  expect(Object.keys(before).length).toBeGreaterThan(0)
  expect(handlesOf(await band.drawn())).toEqual(before)
})
