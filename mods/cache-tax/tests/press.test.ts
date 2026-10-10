import { expect, mock, test, tier } from 'claude-code/testing'

import { HOUR, START, bandProps, prompt, session, turn, world } from './world'

tier('user')

// A desktop clicks the tree it last painted. Every redraw keeps each button's press handle, so a click
// on an earlier tree still lands.

const WIDER_BY = 20
// Long enough for the cache to go cold, so a sent prompt waits on the hold card's buttons.
const COLD_AFTER = 7 * HOUR
const HELD = 'Nerede kalmıştık?'

function handlesOf(node: any, out: Record<string, number> = {}): Record<string, number> {
  if (node === null || typeof node !== 'object') return out
  if (node.press !== undefined && typeof node.props?.key === 'string') out[`${node.type}:${node.props.key}`] = node.press.handle
  for (const child of node.children ?? []) handlesOf(child, out)

  return out
}

test('a band redraw keeps every button’s press handle', async ($, on) => {
  const clock = mock.clock(on, { now: START })
  world(on, [])
  await $.session.start({ ...session, surface: 'desktop', isInteractive: true })
  await $.turn.complete(turn())
  await clock.advance(COLD_AFTER)
  const band = await $.ui.mount({ plugin: 'cache-tax', surface: 'desktop', component: 'AbovePrompt', props: bandProps })
  await $.prompt.submit(prompt(HELD))
  const before = handlesOf(await band.drawn())
  await band.redraw({ ...bandProps, bodyColumns: bandProps.bodyColumns + WIDER_BY })

  expect(Object.keys(before).length).toBeGreaterThan(0)
  expect(handlesOf(await band.drawn())).toEqual(before)
})
