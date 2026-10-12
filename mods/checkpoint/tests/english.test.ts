import { expect, test } from 'claude-code/testing'

import { hubOf } from '../hooks/hub'
import { setLang } from '../hooks/lang'
import { newFake, paneOf, stub } from './stubs'
import type { Fake } from './stubs'

// With no MODZ_LANG the pane, the undo card and the hub line read in English, nothing only Turkish has.

const TURKISH_ONLY = /[çğıöşüİ]/i
const SURFACES = ['terminal', 'desktop'] as const
const ONE = { refs: 'refs/checkpoints/s/1\tc1\t100\tfix login', diff: 'M\0a.ts\0A\0new.ts\0', numstat: '12\t3\ta.ts\0' + '0\t20\tnew.ts\0' }
const english = (over: Partial<Fake> = {}): Fake => newFake({ env: { HOME: '/Users/x' }, ...over })

async function openPane($: any, on: any, spec: { fake: Fake; surface: string }) {
  stub(on, spec.fake)
  await $.session.start({ surface: spec.surface, isInteractive: true, cwd: '/w' })
  await $.command.run({ command: 'checkpoints', args: '' })

  return $.ui.mount(paneOf(spec.surface))
}

// Every Svg alt and source with what Texts and Buttons show: what a person reads on the surface.
function shownOf(tree: any): string[] {
  if (tree === null || typeof tree !== 'object') return typeof tree === 'string' ? [tree] : []
  if (Array.isArray(tree)) return tree.flatMap(shownOf)
  const own = [tree.props?.alt, tree.props?.source, tree.props?.label].filter(part => typeof part === 'string')

  return [...own, ...shownOf(tree.children ?? [])]
}
const shown = async (ui: any) => shownOf(await ui.drawn()).join('\n')

for (const surface of SURFACES) {
  test(`${surface}: the pane lists turns and asks before an undo, in English`, async ($: any, on: any) => {
    const pane = await openPane($, on, { fake: english(ONE), surface })
    const list = await shown(pane)
    expect(list).toMatch(/CHECKPOINTS/)
    expect(list).toContain('1 saved · newest ')
    expect(list).toContain('Undo')
    expect(TURKISH_ONLY.test(list)).toBe(false)

    await pane.press({ key: 'cp-undo-0' })
    const card = await shown(pane)
    expect(card).toContain('Go back to before "fix login"?')
    expect(card).toContain('2 files will change')
    expect(((await pane.find({ key: 'cp-confirm' })) as any)?.props.label).toBe('Restore 2 files')
    expect(((await pane.find({ key: 'cp-cancel' })) as any)?.props).toMatchObject({ label: 'Cancel', autoFocus: true })
    expect(TURKISH_ONLY.test(card)).toBe(false)
  })

  test(`${surface}: confirming says what went back and keeps an English safety label`, async ($: any, on: any) => {
    const fake = english(ONE)
    const pane = await openPane($, on, { fake, surface })
    await pane.press({ key: 'cp-undo-0' })
    await pane.press({ key: 'cp-confirm' })

    expect(fake.calls.some(call => call.argv.join(' ').includes('-m before undo: fix login'))).toBe(true)
    expect(await pane.find({ type: 'Text', text: 'Restored 2 files to before "fix login".' })).toBeDefined()
    expect(((await pane.find({ key: 'cp-redo' })) as any)?.props.label).toBe('Redo')
  })

  test(`${surface}: an empty project says how checkpoints are made, in English`, async ($: any, on: any) => {
    const pane = await openPane($, on, { fake: english(), surface })
    const empty = await shown(pane)
    expect(empty).toContain('No checkpoints yet')
    expect(TURKISH_ONLY.test(empty)).toBe(false)
  })
}

test('/checkpoint off says so in English', async ($: any, on: any) => {
  const fake = english()
  stub(on, fake)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })

  await $.command.run({ command: 'checkpoint', args: '' })
  expect(fake.asked).toEqual(['toast:checkpoint off'])
})

test('the hub line reads like the film', () => {
  setLang('en')
  const entries = Array.from({ length: 13 }, (_, i) => ({ ref: `r${i}`, commit: `c${i}`, at: 0, label: 'x' }))
  expect(hubOf(entries, 30 * 1000).detail).toBe('13 saved · just now')
  expect(hubOf(entries, 41 * 60 * 1000).detail).toBe('13 saved · 41m ago')
})
