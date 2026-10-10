import { expect, test } from 'claude-code/testing'

import { bandOf, setup, spyOf, turn } from './world'

// A desktop clicks the tree it last painted. Every redraw keeps each button's press handle, so a click
// on an earlier tree still lands.

// Long enough to ping; without a notifier the ping falls back to the band row.
const LONG_TURN_MS = 75_000
const WIDER_BY = 20

function handlesOf(node: any, out: Record<string, number> = {}): Record<string, number> {
  if (node === null || typeof node !== 'object') return out
  if (node.press !== undefined && typeof node.props?.key === 'string') out[`${node.type}:${node.props.key}`] = node.press.handle
  for (const child of node.children ?? []) handlesOf(child, out)

  return out
}

test('a band redraw keeps every button’s press handle', async ($, on) => {
  const spy = spyOf({ exitCode: 1, surface: 'desktop' })
  await setup($, on, spy)
  await turn($, spy, LONG_TURN_MS)
  const site = bandOf('desktop') as any
  const band = await $.ui.mount(site)
  const before = handlesOf(await band.drawn())
  await band.redraw({ ...site.props, bodyColumns: site.props.bodyColumns + WIDER_BY })

  expect(Object.keys(before).length).toBeGreaterThan(0)
  expect(handlesOf(await band.drawn())).toEqual(before)
})
