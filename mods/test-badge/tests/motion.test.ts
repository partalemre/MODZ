// The Tests pane in motion on the desktop (kit/moving.ts): every drawing is an interactive frame that enters as the
// pane opens, keeps its very source while what it shows is unchanged, and lets an age tick on without a sweep.
import { expect, test } from 'claude-code/testing'

import { newGh, passed, pending, setupCi } from './ci-world'
import { editAndRun, newWorld, paneOf, setup } from './world'

const sources = async (pane: any): Promise<string[]> => (await pane.findAll({ type: 'Svg' })).map((svg: any) => svg.props.source as string)
// One drawing of the pane: mounted, read, and taken down again for the next.
async function draw($: any): Promise<string[]> {
  const pane = await $.ui.mount(paneOf('desktop'))
  const drawn = await sources(pane)
  await pane.unmount()

  return drawn
}
// Each CI check row's source by the check it draws (its alt reads "name: state").
async function rowsOf($: any): Promise<Record<string, string>> {
  const pane = await $.ui.mount(paneOf('desktop'))
  const svgs = await pane.findAll({ type: 'Svg' })
  await pane.unmount()

  return Object.fromEntries(svgs.map((svg: any) => [String(svg.props.alt).split(':')[0], svg.props.source]))
}
const openPane = ($: any) => $.command.run({ command: 'test-badge', args: 'details' })
// Past the 15 s refresh, so the header's age reads on.
const PAST_TICK_MS = 31_000
// Past a CI poll, so the watch reads the checks again.
const PAST_POLL_MS = 60_000

const STILL = '<style>*{animation:none!important;transition:none!important}</style></svg>'

test('desktop: the pane cascades in as frames, and a redraw or a tick of its age keeps every source', async ($: any, on: any) => {
  const clock = await setup($, on, newWorld({ surface: 'desktop' }))
  await editAndRun($, clock)
  await openPane($)
  const pane = await $.ui.mount(paneOf('desktop'))
  const svgs = await pane.findAll({ type: 'Svg' })
  const first = await sources(pane)
  await pane.unmount()

  expect(svgs.length).toBeGreaterThan(3)
  expect(svgs.every((svg: any) => svg.props.width > 0 && svg.props.height > 0)).toBe(true)
  // A drawing under a press is a plain still image (its buttons take the press); the rest stay interactive frames.
  const isPressed = (svg: any) => (svg.props.source as string).endsWith(STILL)
  expect(svgs.filter(isPressed).length).toBeGreaterThan(0)
  expect(svgs.filter(isPressed).every((svg: any) => svg.props.isInteractive !== true)).toBe(true)
  expect(svgs.filter(svg => !isPressed(svg)).every((svg: any) => svg.props.isInteractive === true)).toBe(true)
  expect(first.every(source => source.includes(':root{color-scheme:light dark}') && source.includes('class="m-in"'))).toBe(true)
  expect(first.filter(source => source.includes('class="m-wash"'))).toHaveLength(3)
  expect(await draw($)).toEqual(first)

  await clock.advance(PAST_TICK_MS)
  const later = await draw($)
  expect(later.slice(1)).toEqual(first.slice(1))
  expect(later[0]).not.toEqual(first[0])
  expect(later[0]).not.toContain('m-sweep')

  await openPane($)
  expect((await draw($)).every(source => source.includes('class="m-in"'))).toBe(true)
})

test('desktop: a run still going breathes one accent dot, with no light running along a bar', async ($: any, on: any) => {
  await editAndRun($, await setup($, on, newWorld({ surface: 'desktop', hold: new Promise<void>(() => undefined) })))
  await openPane($)
  const [header] = await draw($)

  expect(header).toContain('class="breathe" cx="3" cy="9" r="3" style="fill:var(--kiln)"')
  expect(header).not.toContain('m-shine')
  expect(header).not.toContain('Gradient')
})

test('desktop: a pending CI check breathes, with no rings, and its row follows the check, not its place', async ($: any, on: any) => {
  const gh = newGh({ checks: [passed('lint'), pending('unit tests')] })
  const clock = await setupCi($, on, { gh, surface: 'desktop', lang: 'tr' })
  await clock.advance(PAST_POLL_MS)
  await openPane($)
  const before = await rowsOf($)

  expect(before['unit tests']).toContain('class="breathe"')
  expect(before['unit tests']).not.toContain('m-ripple')
  expect(before.lint).not.toContain('class="breathe"')

  gh.checks = [pending('build'), ...gh.checks]
  await clock.advance(PAST_POLL_MS)
  const after = await rowsOf($)
  expect(after['unit tests']).toEqual(before['unit tests'])
  expect(after.build).toContain('class="m-in"')
})
