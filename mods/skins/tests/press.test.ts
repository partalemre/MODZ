import { expect, test } from 'claude-code/testing'

import { runSkin, start, stubEngine } from './world'

// A desktop clicks the tree it last painted. Every redraw keeps each button's press handle, so a click
// on an earlier tree still lands.

const SITE = { plugin: 'skins', surface: 'desktop', viewport: { columns: 100, rows: 30 } } as const
const SETTINGS = {
  ...SITE,
  component: 'Pane',
  requestId: 'skins-settings',
  props: { title: 'Görünüm', isFocused: true, bodyColumns: 62, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
} as const
const PANES = [SETTINGS, { ...SETTINGS, requestId: 'skins-gallery', props: { ...SETTINGS.props, title: 'Skin galerisi' } }] as const
const BAND = {
  ...SITE,
  component: 'AbovePrompt',
  requestId: 'band',
  props: { hasSurvey: false, isWorking: false, maxRows: 4, bodyColumns: 100, scroll: { offset: 0, bodyRows: 4 }, view: {} },
} as const
const WIDER_BY = 20

function handlesOf(node: any, out: Record<string, number> = {}): Record<string, number> {
  if (node === null || typeof node !== 'object') return out
  if (node.press !== undefined && typeof node.props?.key === 'string') out[`${node.type}:${node.props.key}`] = node.press.handle
  for (const child of node.children ?? []) handlesOf(child, out)

  return out
}

async function startSkins($: any, on: any) {
  stubEngine(on)
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['stock row'] }))
  await start($)
}

for (const pane of PANES) {
  test(`a ${pane.requestId} redraw keeps every button’s press handle`, async ($: any, on: any) => {
    await startSkins($, on)
    const ui = await $.ui.mount(pane)
    const before = handlesOf(await ui.drawn())
    await ui.redraw({ ...pane.props, isFocused: !pane.props.isFocused })

    expect(Object.keys(before).length).toBeGreaterThan(0)
    expect(handlesOf(await ui.drawn())).toEqual(before)
  })
}

test('a band redraw keeps every button’s press handle', async ($: any, on: any) => {
  await startSkins($, on)
  // The band is off by default (hud-pro shows usage); turned on it draws the context meter.
  await runSkin($, 'band on')
  const band = await $.ui.mount(BAND)
  const before = handlesOf(await band.drawn())
  await band.redraw({ ...BAND.props, bodyColumns: BAND.props.bodyColumns + WIDER_BY })

  expect(Object.keys(before).length).toBeGreaterThan(0)
  expect(handlesOf(await band.drawn())).toEqual(before)
})
