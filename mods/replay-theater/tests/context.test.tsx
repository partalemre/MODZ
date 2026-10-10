// Which turn is on screen: the prompt that started it and how long ago it ended, kept across a later
// turn without edits; and the one primary button on the card and in the pane.
import { expect, test } from 'claude-code/testing'

import { ageText } from '../hooks/age'
import { SURFACES, bandOf, newWorld, paneOf, plannedTurn, setup, svgText, texts } from './fixtures'

const OPEN_WAIT_MS = 200
const MINUTE_MS = 60_000

test('the age reads as the pane says it', () => {
  expect(ageText(undefined, 5)).toBe('')
  expect(ageText(1_000, 500)).toBe('')
  expect(ageText(0, 30_000)).toBe('az önce')
  expect(ageText(0, 3 * MINUTE_MS)).toBe('3 dk önce')
  expect(ageText(0, 125 * MINUTE_MS)).toBe('2 sa önce')
  expect(ageText(0, 50 * 60 * MINUTE_MS)).toBe('2 gün önce')
})

for (const surface of SURFACES) {
  test(`${surface}: the pane names the prompt and its age, after a later turn without edits too`, async ($: any, on: any) => {
    const world = newWorld()
    const clock = await setup($, on, world)
    await plannedTurn($, world)
    await $.turn.start({ text: 'teşekkürler', turnId: 't2' })
    await $.turn.complete({ answer: 'Rica ederim.', durationMs: 1, isAborted: false, turnId: 't2', reason: 'answer' })
    await clock.advance(4 * MINUTE_MS)

    const opening = $.command.run({ command: 'replay', args: '' })
    await clock.advance(OPEN_WAIT_MS)
    await opening
    const pane = await $.ui.mount(paneOf(surface))
    const shown = surface === 'desktop' ? await svgText(pane) : (await texts(pane)).join('\n')

    expect(shown).toContain('“greet adını welcome yap”')
    expect(shown).toContain('4 dk önce')
    expect(shown).toContain('2 dosyada 2 düzenleme')
    expect((await pane.find({ key: 'rt-next' }))?.props?.variant).toBe('primary')
    expect((await pane.find({ key: 'rt-prev' }))?.props?.variant).toBe('secondary')
  })

  test(`${surface}: watching the edits is the card's one primary action`, async ($: any, on: any) => {
    const world = newWorld()
    await setup($, on, world)
    await plannedTurn($, world)
    const band = await $.ui.mount(bandOf(surface))

    expect((await band.find({ key: 'rt-open' }))?.props?.variant).toBe('primary')
    expect((await band.find({ key: 'rt-dismiss' }))?.props?.plain).toBe(true)
  })
}
