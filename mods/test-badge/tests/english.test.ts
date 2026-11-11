import { expect, test } from 'claude-code/testing'

import { hubOf } from '../hooks/hub'
import { setLang } from '../hooks/lang'
import { badgeText } from '../hooks/parse'
import { bandOf, editAndRun, newWorld, paneOf, setup } from './world'

// Without MODZ_LANG every word the mod shows is English, on both surfaces.

const SURFACES = ['terminal', 'desktop'] as const
const TURKISH = /[çğıöşüİ]/
const ENGLISH = { env: {} }

function alts(tree: any): string[] {
  if (tree === null || typeof tree !== 'object') return []
  if (Array.isArray(tree)) return tree.flatMap(alts)
  const own = tree.type === 'Svg' ? [String(tree.props?.alt ?? '')] : []

  return [...own, ...alts(tree.children ?? tree.props?.children ?? [])]
}

const shown = async (ui: any, surface: string): Promise<string> =>
  surface === 'desktop' ? alts(await ui.drawn()).join('\n') : (await ui.findAll({ type: 'Text' })).map((t: any) => t.text).join('\n')
const drawnText = async (ui: any): Promise<string> => JSON.stringify(await ui.drawn())

for (const surface of SURFACES) {
  test(`${surface}: the failing band and pane read in English`, async ($: any, on: any) => {
    const world = newWorld({ ...ENGLISH, surface })
    await editAndRun($, await setup($, on, world))

    const band = await $.ui.mount(bandOf(surface))
    expect(await shown(band, surface)).toMatch(/✕ 1\/42 failed[\s\S]*style rules: 2 errors[\s\S]*\ds ago/)
    expect((await band.find({ key: 'tb-details' }))?.props?.label).toBe('Details')
    expect(await drawnText(band)).not.toMatch(TURKISH)

    const pane = await $.ui.mount(paneOf(surface))
    const text = await shown(pane, surface)
    expect(text).toMatch(/1 test failing[\s\S]*1 of 42 failed/)
    expect(text).toMatch(/On this computer[\s\S]*npm run --silent test/)
    expect((await pane.find({ key: 'tb-filter-all' }))?.text).toBe('All 3')
    expect((await pane.find({ key: 'tb-rerun' }))?.props?.label).toBe('Run tests and style-rule check')
    expect(await drawnText(pane)).not.toMatch(TURKISH)
    expect(world.statuses.at(-1)).toBe('tests 41/42 · style rules: 2 errors · 0s ago')
  })

  test(`${surface}: a green run and an empty pane read in English`, async ($: any, on: any) => {
    const world = newWorld({ ...ENGLISH, surface, outs: { test: ' Tests  42 passed (42)', lint: '' }, code: 0 })
    const clock = await setup($, on, world)
    const empty = await $.ui.mount(paneOf(surface))
    const sentence = 'No tests run yet'
    if (surface === 'desktop') expect((await empty.find({ type: 'Svg' }))?.props?.alt).toBe(sentence)
    else expect((await empty.find({ key: 'tb-verdict' }))?.text).toBe(sentence)
    expect((await empty.find({ key: 'tb-rerun' }))?.props?.label).toBe('Run tests and style-rule check')
    await empty.unmount()

    await editAndRun($, clock)
    const band = await $.ui.mount(bandOf(surface))
    expect(await shown(band, surface)).toMatch(/✓ 42\/42 passed[\s\S]*style rules ok/)
    const pane = await $.ui.mount(paneOf(surface))
    expect(await shown(pane, surface)).toMatch(/All tests pass on this computer[\s\S]*42 tests passed[\s\S]*clean/)
    expect(await drawnText(pane)).not.toMatch(TURKISH)
  })
}

test('the command answers and the copy toast read in English', async ($: any, on: any) => {
  const world = newWorld({ ...ENGLISH, canOpen: false })
  await editAndRun($, await setup($, on, world))
  expect(await $.command.run({ command: 'test-badge', args: 'details' })).toMatchObject({ text: 'test-badge: details opened' })
  expect(await $.command.run({ command: 'test-badge', args: 'off' })).toMatchObject({ text: 'test-badge off' })

  const pane = await $.ui.mount(paneOf('terminal'))
  await pane.press({ key: 'tb-open-1' })
  expect(world.toasts).toEqual(["Couldn't open it, so copied src/api/user.ts:3"])
})

test('the hub card and the status line read like the film', () => {
  setLang('en')
  const outcome = (over: object) => ({ status: 'pass' as const, passed: null, total: null, errors: null, failures: [], tail: [], ...over })
  const badge = { tests: outcome({ passed: 128, total: 128 }), lint: outcome({}), root: '/w', finishedAt: 1000, durationMs: 3000, isRunning: false }
  expect(hubOf(badge)).toEqual({ detail: '128/128 passed', tone: 'ok' })

  const failing = { ...badge, tests: outcome({ status: 'fail', passed: 41, total: 42 }), lint: outcome({ status: 'fail', errors: 1 }) }
  expect(hubOf(failing).detail).toBe('41/42 passed · style rules: 1 error')
  expect(badgeText(failing, 41 * 60_000 + 1000)).toBe('tests 41/42 · style rules: 1 error · 41m ago')
})
