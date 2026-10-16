// The pane in motion on the desktop (kit/moving.ts): both drawings are interactive frames that enter as the pane
// opens and keep their very sources while what they show is unchanged; the clock alone never sweeps them, and a
// running turn lights the meters.
import { expect, test } from 'claude-code/testing'

import { PANE, start, stubSession, withBreakdown } from './stubs'

const MINUTE_MS = 60_000
// Less than a minute: the countdowns stand still, the pace tick moves a fraction of a point.
const SECONDS_MS = 20_000

const sources = async (pane: any): Promise<string[]> => (await pane.findAll({ type: 'Svg' })).map((svg: any) => svg.props.source as string)

async function openPane($: any, on: any) {
  const clock = stubSession(on, withBreakdown())
  await start($, 'desktop')
  await $.command.run({ command: 'hud', args: 'full' })

  return { clock, pane: await $.ui.mount({ ...PANE, surface: 'desktop' }) }
}

test('desktop: the tiles and the context card cascade in as frames and keep their sources across a redraw', async ($, on) => {
  const { pane } = await openPane($, on)
  const svgs = await pane.findAll({ type: 'Svg' })
  const first = await sources(pane)

  expect(svgs).toHaveLength(2)
  expect(svgs.every((svg: any) => svg.props.isInteractive === true && svg.props.width > 0 && svg.props.height > 0)).toBe(true)
  expect(first.every(source => source.includes(':root{color-scheme:light dark}') && source.includes('class="m-in"'))).toBe(true)
  expect(first.some(source => source.includes('m-shine'))).toBe(false)

  await pane.redraw()
  expect(await sources(pane)).toEqual(first)

  await $.command.run({ command: 'hud', args: 'full' })
  expect((await sources(pane)).every(source => source.includes('class="m-in"'))).toBe(true)
})

test('the clock: seconds leave both sources as they were, a minute moves the countdown without a sweep', async ($, on) => {
  const { clock, pane } = await openPane($, on)
  const [tiles, card] = await sources(pane)

  await clock.advance(SECONDS_MS)
  await pane.redraw()
  expect(await sources(pane)).toEqual([tiles, card])

  await clock.advance(MINUTE_MS)
  const [ticked, kept] = await sources(pane)
  expect(tiles).toContain('↻ 2sa 0dk')
  expect(ticked).toContain('↻ 1sa 59dk')
  expect(ticked).not.toContain('m-sweep')
  expect(kept).toBe(card)
})

test('a running turn lights the meters and the window, its end puts them out', async ($, on) => {
  const { pane } = await openPane($, on)

  await $.turn.start({ text: 'go', turnId: 't1' } as any)
  const live = await sources(pane)
  expect(live.every(source => source.includes('class="m-shine"'))).toBe(true)

  await $.turn.complete({ answer: 'ok', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' } as any)
  expect((await sources(pane)).some(source => source.includes('m-shine'))).toBe(false)
})
