import { expect, test } from 'claude-code/testing'

import { BUILD_SCAN, PANE_PROPS, mountBand, mountPane, pass, stub, world } from './world'

// A desktop clicks the tree it last painted. Every redraw keeps each button's press handle, so a click
// on an earlier tree still lands.

const BAND_PROPS = { hasSurvey: false, isWorking: true, maxRows: 20, bodyColumns: 110, scroll: { top: 0, bodyRows: 20, rows: 20 }, view: {} } as const
const WIDER_BY = 20
// Where the card is drawn: the pane when the surface places it, else the band above the prompt.
const PLACES = [
  { name: 'pane', isPlaced: true, mount: ($: any) => mountPane($, 'desktop'), props: { ...PANE_PROPS, isFocused: !PANE_PROPS.isFocused } },
  { name: 'band', isPlaced: false, mount: ($: any) => mountBand($, 'desktop'), props: { ...BAND_PROPS, bodyColumns: BAND_PROPS.bodyColumns + WIDER_BY } },
] as const

function handlesOf(node: any, out: Record<string, number> = {}): Record<string, number> {
  if (node === null || typeof node !== 'object') return out
  if (node.press !== undefined && typeof node.props?.key === 'string') out[`${node.type}:${node.props.key}`] = node.press.handle
  for (const child of node.children ?? []) handlesOf(child, out)

  return out
}

for (const place of PLACES) {
  test(`a ${place.name} redraw keeps every button's press handle`, async ($: any, on: any) => {
    const w = world({ isPlaced: place.isPlaced, answers: { files: BUILD_SCAN } })
    stub(on, w)
    on('ui.render', () => ({ type: 'Text', children: ['other mod row'] }))
    const call = $.tool.call({ tool: 'Bash', command: 'rm -rf build' })
    await pass(w, 0)
    const card = await place.mount($)
    const before = handlesOf(await card.drawn())
    await card.redraw(place.props)

    expect(Object.keys(before).length).toBeGreaterThan(0)
    expect(handlesOf(await card.drawn())).toEqual(before)
    await card.press({ key: 'cancel' })
    await pass(w)
    expect((await call).deny).toBeDefined()
  })
}
