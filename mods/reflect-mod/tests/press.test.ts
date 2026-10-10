import { expect, test } from 'claude-code/testing'

import { BAND, say, start, world } from './world'

// A desktop clicks the tree it last painted. Every redraw keeps each button's press handle, so a click
// on an earlier tree still lands.

const PNPM = { is_rule: true, rule: 'Use pnpm, not npm, in this repo', scope: 'project', confidence: 0.92 }
const WIDER_BY = 20

function handlesOf(node: any, out: Record<string, number> = {}): Record<string, number> {
  if (node === null || typeof node !== 'object') return out
  if (node.press !== undefined && typeof node.props?.key === 'string') out[`${node.type}:${node.props.key}`] = node.press.handle
  for (const child of node.children ?? []) handlesOf(child, out)

  return out
}

test('a band redraw keeps every button’s press handle', async ($, on) => {
  const w = world(on, { verdicts: { 'нет, используй pnpm': PNPM }, files: { '/repo/CLAUDE.md': '# Repo\n' } })
  await start($)
  await say($, w, 'нет, используй pnpm')
  const site = { plugin: 'reflect-mod', surface: 'desktop', ...BAND } as const
  const band = await $.ui.mount(site)
  const before = handlesOf(await band.drawn())
  await band.redraw({ ...site.props, bodyColumns: site.props.bodyColumns + WIDER_BY })

  expect(Object.keys(before).length).toBeGreaterThan(0)
  expect(handlesOf(await band.drawn())).toEqual(before)
})
