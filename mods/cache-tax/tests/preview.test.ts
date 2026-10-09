import { mock, test, tier } from 'claude-code/testing'

import { HOUR, MIN, START, bandProps, prompt, run, session, turn, world } from './world'

tier('user')

/** The test runner's console: bin/preview reads the trees it prints. */
declare const console: { log: (text: string) => void }

// Each state drawn on the desktop, in both themes, for bin/preview to paint.
const WIDE = { ...bandProps, bodyColumns: 112 }

for (const theme of ['dark', 'light'] as const) {
  test(`preview ${theme}: hold card`, async ($, on) => {
    const clock = mock.clock(on, { now: START })
    world(on, [], { theme: { value: theme }, model: 'claude-opus-5', live: { tokens: 51929 } })
    await $.session.start({ ...session, surface: 'desktop', isInteractive: true })
    await $.turn.complete(turn({ usage: { input_tokens: 2, output_tokens: 10, cache_read_input_tokens: 51000, cache_creation_input_tokens: 900, model: 'claude-opus-5' } }))
    await clock.advance(7 * HOUR + 38 * MIN)
    const ui = await $.ui.mount({ plugin: 'cache-tax', surface: 'desktop', component: 'AbovePrompt', props: WIDE })
    await $.prompt.submit(prompt('Nerede kalmıştık? Bana iki satırlık bir özet ver.'))
    console.log(`@@TREE@@hold-card-${theme}@@` + JSON.stringify(await ui.drawn()))
  })

  test(`preview ${theme}: status rows`, async ($, on) => {
    const clock = mock.clock(on, { now: START })
    world(on, [{ read: 61000, write: 0 }], { theme: { value: theme }, model: 'claude-opus-5', live: { tokens: 61000 } })
    await $.session.start({ ...session, surface: 'desktop', isInteractive: true })
    await $.turn.complete(turn({ usage: { input_tokens: 2, output_tokens: 10, cache_read_input_tokens: 61000, cache_creation_input_tokens: 0, model: 'claude-opus-5' } }))
    await $.command.run(run('keepwarm', '6h'))
    const ui = await $.ui.mount({ plugin: 'cache-tax', surface: 'desktop', component: 'AbovePrompt', props: WIDE })
    await clock.advance(68 * MIN)
    console.log(`@@TREE@@row-warm-${theme}@@` + JSON.stringify(await ui.drawn()))
    await $.command.run(run('keepwarm', 'off'))
    await clock.advance(2 * HOUR)
    console.log(`@@TREE@@row-cold-${theme}@@` + JSON.stringify(await ui.drawn()))
  })
}
