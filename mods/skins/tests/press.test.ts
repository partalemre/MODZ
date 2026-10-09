import { expect, test } from 'claude-code/testing'

import { FOCUS_SETTLE_MS } from '../hooks/focus'
import { runSkin, start, stubEngine } from './world'

// The two desktop press races: a click that focuses a pane redraws it under the click, and a desktop
// that reattaches keeps a tree whose buttons the engine already released.

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
const STAMP = { key: 'render-stamp' }

async function stampOf(ui: any): Promise<string | undefined> {
  return (await ui.find(STAMP))?.text
}

// Whether the work finishes before the clock moves at all; it is let finish either way.
async function isImmediate(clock: any, work: Promise<unknown>): Promise<boolean> {
  let isDone = false
  const watched = work.then(() => {
    isDone = true
  })
  await clock.settle()
  const wasDone = isDone
  await clock.advance(FOCUS_SETTLE_MS)
  await watched

  return wasDone
}

// The settings pane is left out here: the desktop engine 2.1.293 refuses its labelless skin Buttons, so it
// draws no stamp there. The redraw is the same `ui.render` invalidation for every drawing.
test('a reattaching desktop gets the gallery and the band drawn again', async ($: any, on: any) => {
  stubEngine(on)
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['stock row'] }))
  on('session.attach', (_: unknown, e: any) => ({ clientId: e.clientId }))
  await start($)
  // The band is off by default (hud-pro shows usage); turned on it draws the context meter.
  await runSkin($, 'band on')
  const gallery = await $.ui.mount(PANES[1])
  const band = await $.ui.mount(BAND)
  const before = [await stampOf(gallery), await stampOf(band)]
  expect(before).not.toContain(undefined)

  await $.session.attach({ surface: 'desktop', clientId: 'desktop-2' })

  expect(await stampOf(gallery)).not.toBe(before[0])
  expect(await stampOf(band)).not.toBe(before[1])
})

for (const pane of PANES) {
  test(`a ${pane.requestId} render whose focus flipped waits for the click; first and same-focus ones do not`, async ($: any, on: any) => {
    const { clock } = stubEngine(on)
    on('ui.render', () => ({ type: 'Text', props: {}, children: ['stock row'] }))
    await start($)
    const mounting = $.ui.mount(pane)
    expect(await isImmediate(clock, mounting)).toBe(true)
    const ui = await mounting
    expect(await isImmediate(clock, ui.redraw(pane.props))).toBe(true)

    let isDone = false
    const flip = ui.redraw({ ...pane.props, isFocused: !pane.props.isFocused }).then(() => {
      isDone = true
    })
    await clock.advance(FOCUS_SETTLE_MS - 1)
    expect(isDone).toBe(false)
    await clock.advance(1)
    await flip
    expect(isDone).toBe(true)
  })
}
