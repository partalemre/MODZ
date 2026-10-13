import { mock, test, tier } from 'claude-code/testing'

import type { On } from 'claude-code'
import type { Engine } from 'claude-code/testing'

import { HOUR, MIN, START, bandProps, prompt, run, session, step, turn, world } from './world'

tier('user')

/** The test runner's console: bin/preview reads the trees it prints. */
declare const console: { log: (text: string) => void }

const OPUS_TURN = turn({ usage: { input_tokens: 2, output_tokens: 10, cache_read_input_tokens: 51000, cache_creation_input_tokens: 900, model: 'claude-opus-5' } })

/** A warm cache written on Opus, then the session switched to Sonnet and a send held for it. */
async function switchHeld($: Engine, on: On, o: { surface: 'desktop' | 'terminal'; theme: string; columns: number }) {
  const clock = mock.clock(on, { now: START })
  const w = world(on, [], { theme: { value: o.theme }, model: 'claude-opus-5', live: { tokens: 51929 } })
  await $.session.start({ ...session, surface: o.surface, isInteractive: true })
  await step($, 'claude-opus-5')
  await $.turn.complete(OPUS_TURN)
  await clock.advance(12 * MIN)
  const ui = await $.ui.mount({ plugin: 'cache-tax', surface: o.surface, component: 'AbovePrompt', props: { ...bandProps, bodyColumns: o.columns } })
  w.current.model = 'claude-sonnet-5'
  await $.prompt.submit(prompt('Nerede kalmıştık? Bana iki satırlık bir özet ver.'))
  return ui
}

// Each state drawn on the desktop, in both themes, for bin/preview to paint.
// Full width, then the band at about 520 px and 400 px (8 px a column); `-w<px>` sets the preview's page.
const SIZES = [{ tag: '', columns: 112 }, { tag: '-w520', columns: 65 }, { tag: '-w400', columns: 50 }]

for (const [theme, size] of (['dark', 'light'] as const).flatMap(theme => SIZES.map(size => [theme, size] as const))) {
  const WIDE = { ...bandProps, bodyColumns: size.columns }

  test(`preview ${theme}${size.tag}: hold card`, async ($, on) => {
    const clock = mock.clock(on, { now: START })
    world(on, [], { theme: { value: theme }, model: 'claude-opus-5', live: { tokens: 51929 } })
    await $.session.start({ ...session, surface: 'desktop', isInteractive: true })
    await $.turn.complete(turn({ usage: { input_tokens: 2, output_tokens: 10, cache_read_input_tokens: 51000, cache_creation_input_tokens: 900, model: 'claude-opus-5' } }))
    await clock.advance(7 * HOUR + 38 * MIN)
    const ui = await $.ui.mount({ plugin: 'cache-tax', surface: 'desktop', component: 'AbovePrompt', props: WIDE })
    await $.prompt.submit(prompt('Nerede kalmıştık? Bana iki satırlık bir özet ver.'))
    console.log(`@@TREE@@hold-card-${theme}${size.tag}@@` + JSON.stringify(await ui.drawn()))
  })

  test(`preview ${theme}${size.tag}: hold card for a model switch`, async ($, on) => {
    const ui = await switchHeld($, on, { surface: 'desktop', theme, columns: size.columns })
    console.log(`@@TREE@@hold-switch-${theme}${size.tag}@@` + JSON.stringify(await ui.drawn()))
  })

  test(`preview ${theme}${size.tag}: status rows`, async ($, on) => {
    const clock = mock.clock(on, { now: START })
    world(on, [{ read: 61000, write: 0 }], { theme: { value: theme }, model: 'claude-opus-5', live: { tokens: 61000 } })
    await $.session.start({ ...session, surface: 'desktop', isInteractive: true })
    await $.turn.complete(turn({ usage: { input_tokens: 2, output_tokens: 10, cache_read_input_tokens: 61000, cache_creation_input_tokens: 0, model: 'claude-opus-5' } }))
    await $.command.run(run('keepwarm', '6h'))
    const ui = await $.ui.mount({ plugin: 'cache-tax', surface: 'desktop', component: 'AbovePrompt', props: WIDE })
    await clock.advance(68 * MIN)
    console.log(`@@TREE@@row-warm-${theme}${size.tag}@@` + JSON.stringify(await ui.drawn()))
    await $.command.run(run('keepwarm', 'off'))
    await clock.advance(2 * HOUR)
    console.log(`@@TREE@@row-cold-${theme}${size.tag}@@` + JSON.stringify(await ui.drawn()))
  })
}

test('preview terminal: hold card and status row', async ($, on) => {
  const clock = mock.clock(on, { now: START })
  world(on, [], { theme: { value: 'dark' }, model: 'claude-opus-5', live: { tokens: 51929 } })
  await $.session.start({ ...session, surface: 'terminal', isInteractive: true })
  await $.turn.complete(turn({ usage: { input_tokens: 2, output_tokens: 10, cache_read_input_tokens: 51000, cache_creation_input_tokens: 900, model: 'claude-opus-5' } }))
  await clock.advance(7 * HOUR + 38 * MIN)
  const ui = await $.ui.mount({ plugin: 'cache-tax', surface: 'terminal', component: 'AbovePrompt', props: { ...bandProps, bodyColumns: 100 } })
  await $.prompt.submit(prompt('Nerede kalmıştık? Bana iki satırlık bir özet ver.'))
  console.log('@@TREE@@hold-card-terminal@@' + JSON.stringify(await ui.drawn()))
})

test('preview terminal: hold card for a model switch', async ($, on) => {
  const ui = await switchHeld($, on, { surface: 'terminal', theme: 'dark', columns: 100 })
  console.log('@@TREE@@hold-switch-terminal@@' + JSON.stringify(await ui.drawn()))
})
