import { expect, test } from 'claude-code/testing'

import { world } from './world'

// A desktop clicks the tree it last painted. Every redraw keeps each button's press handle, so a click
// on an earlier tree still lands.

const ROOT = '/Users/k/MODZ'
const REPO = { root: ROOT, files: ['a.ts'], status: '## main\0', heads: { [ROOT]: ['1111111aaaa'] } }
const PROPS = { title: 'Dosyalar', isFocused: false, bodyColumns: 50, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} } as any
const PANE = { plugin: 'filetree', surface: 'desktop', component: 'Pane', requestId: 'filetree', props: PROPS } as const

function handlesOf(node: any, out: Record<string, number> = {}): Record<string, number> {
  if (node === null || typeof node !== 'object') return out
  if (node.press !== undefined && typeof node.props?.key === 'string') out[`${node.type}:${node.props.key}`] = node.press.handle
  for (const child of node.children ?? []) handlesOf(child, out)

  return out
}

test('a pane redraw keeps every button’s press handle', { timeoutMs: 20_000 }, async ($: any, on: any) => {
  const clock = world(on, REPO)
  await $.session.start({ cwd: ROOT, surface: 'desktop', isInteractive: true })
  await clock.settle()
  const pane = await $.ui.mount(PANE)
  await clock.settle()
  const before = handlesOf(await pane.drawn())
  await pane.redraw({ ...PROPS, isFocused: !PROPS.isFocused })
  await clock.settle()

  expect(Object.keys(before).length).toBeGreaterThan(0)
  expect(handlesOf(await pane.drawn())).toEqual(before)
})
