import { expect, test } from 'claude-code/testing'

import { BAND, USAGE, compactions, start, stubSession } from './stubs'

// A desktop clicks the tree it last painted. Every redraw keeps each button's press handle, so a click
// on an earlier tree still lands.

const WIDER_BY = 20

function handlesOf(node: any, out: Record<string, number> = {}): Record<string, number> {
  if (node === null || typeof node !== 'object') return out
  if (node.press !== undefined && typeof node.props?.key === 'string') out[`${node.type}:${node.props.key}`] = node.press.handle
  for (const child of node.children ?? []) handlesOf(child, out)

  return out
}

test('a band redraw keeps every button’s press handle', async ($, on) => {
  const clock = stubSession(on, { ...USAGE, context: { window: 200_000, tokens: 168_000, percent: 84 } })
  await start($, 'desktop')
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const before = handlesOf(await band.drawn())
  await band.redraw({ ...BAND.props, bodyColumns: BAND.props.bodyColumns + WIDER_BY })

  expect(Object.keys(before).length).toBeGreaterThan(0)
  expect(handlesOf(await band.drawn())).toEqual(before)
  await band.press({ key: 'compact' })
  await clock.advance(1)
  expect(compactions.count).toBe(1)
})
