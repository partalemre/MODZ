import { test } from 'claude-code/testing'

import { begin, paneOf, stub, turn, worldOf } from './stubs'

/** The test runner's console: bin/preview reads the trees it prints. */
declare const console: { log: (text: string) => void }

// Draws the Effort pane for bin/preview: empty, in show mode and in auto mode, on the desktop in both pinned
// themes at a narrow (≈400 px) and a wide (≈600 px) panel, and on the terminal. This mod draws no band.
const MIN_MS = 60_000
const PROMPTS = [
  { text: 'Find why the session cache corrupts under load', reply: 'deep', effort: 'high', ago: 26 },
  { text: 'Add a retry with backoff to the fetch client', reply: 'normal', effort: 'high', ago: 14 },
  { text: 'What does this regex match?', reply: 'light', effort: 'high', ago: 6 },
  { text: 'yes', reply: 'light', effort: 'high', ago: 5 },
  { text: 'Rename getUser to fetchUser everywhere', reply: 'light', effort: 'xhigh', ago: 1 },
]
const WIDTHS = { narrow: 50, wide: 75 }

type Spec = { theme: string; mode: string; columns: number; surface?: string; isEmpty?: boolean }

async function open($: any, on: any, spec: Spec) {
  const world = worldOf({ env: { MODZ_THEME: spec.theme } })
  const clock = stub(on, world)
  const surface = spec.surface ?? 'desktop'
  await begin($, surface)
  let elapsed = 0
  for (const [i, p] of (spec.isEmpty === true ? [] : PROMPTS).entries()) {
    const at = (PROMPTS[0]!.ago - p.ago) * MIN_MS
    await clock.advance(at - elapsed)
    elapsed = at
    world.reply = p.reply
    await turn($, { text: p.text, turnId: `t${i}`, effort: p.effort })
  }
  await clock.advance(MIN_MS * PROMPTS[PROMPTS.length - 1]!.ago)

  return $.ui.mount(paneOf(surface, spec.columns))
}

const dump = async (label: string, ui: any) => console.log(`@@TREE@@${label}@@${JSON.stringify(await ui.drawn())}`)

for (const [size, columns] of Object.entries(WIDTHS)) {
  for (const theme of ['dark', 'light']) {
    test(`preview ${size} ${theme}: show mode`, { options: { mode: 'show' } }, async ($: any, on: any) => {
      await dump(`${size}-show-${theme}`, await open($, on, { theme, mode: 'show', columns }))
    })

    test(`preview ${size} ${theme}: auto mode`, { options: { mode: 'auto' } }, async ($: any, on: any) => {
      await dump(`${size}-auto-${theme}`, await open($, on, { theme, mode: 'auto', columns }))
    })

    test(`preview ${size} ${theme}: no turns yet`, { options: { mode: 'show' } }, async ($: any, on: any) => {
      await dump(`${size}-empty-${theme}`, await open($, on, { theme, mode: 'show', columns, isEmpty: true }))
    })
  }
}

test('preview terminal: show and auto', { options: { mode: 'auto' } }, async ($: any, on: any) => {
  const pane = await open($, on, { theme: 'dark', mode: 'auto', columns: 90, surface: 'terminal' })
  await dump('terminal-auto', pane)
  await pane.select({ key: 'er-mode', value: 'show' })
  await dump('terminal-show', pane)
})
