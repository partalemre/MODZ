import { expect, test } from 'claude-code/testing'

import { stubWorld } from './world'

// A desktop clicks the tree it last painted. Every redraw keeps each button's press handle, so a click
// on a tree drawn before a focus flip or a state write still lands.

const HUB = { plugin: 'modz', component: 'Pane', requestId: 'modz', viewport: { columns: 100, rows: 40 }, props: { bodyColumns: 50, isFocused: true } } as const

function handlesOf(node: any, out: Record<string, number> = {}): Record<string, number> {
  if (node === null || typeof node !== 'object') return out
  if (node.press !== undefined && typeof node.props?.key === 'string') out[`${node.type}:${node.props.key}`] = node.press.handle
  for (const child of node.children ?? []) handlesOf(child, out)

  return out
}

test('a hub redraw keeps every button’s press handle', async ($: any, on: any) => {
  stubWorld(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  const ui = await $.ui.mount({ ...HUB, surface: 'desktop' })
  const before = handlesOf(await ui.drawn())
  await ui.redraw({ ...HUB.props, isFocused: false })
  await ui.redraw({ ...HUB.props, bodyColumns: 70 })

  expect(Object.keys(before).length).toBeGreaterThan(0)
  expect(handlesOf(await ui.drawn())).toEqual(before)
})
