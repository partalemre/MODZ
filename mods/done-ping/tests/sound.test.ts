// The optional sound packs: a clip of the mod's own per ping, done or waiting, beside the banner it replaces the
// sound of; a host with no player stays quiet and says so only in the debug log.
import { describe, expect, test } from 'claude-code/testing'

import { packAsset, packOf } from '../hooks/pack'
import { bandOf, setup, spyOf, turn } from './world'
import type { Spy } from './world'

const LONG_MS = 75_000
const NOTIFIER = '/opt/homebrew/bin/terminal-notifier'
const banners = (spy: Spy) => spy.runs.filter(argv => argv[0] === 'osascript' || argv[0] === NOTIFIER)

describe('sound packs', () => {
  test('a pack name maps to its two clips, and anything else reads as off', () => {
    expect(packAsset('soft', 'done')).toBe('sounds/soft/done.wav')
    expect(packAsset('soft', 'fail')).toBe('sounds/soft/done.wav')
    expect(packAsset('soft', 'wait')).toBe('sounds/soft/wait.wav')
    expect(packAsset('off', 'done')).toBe(null)
    expect(packOf('Glass')).toBe('off')
  })

  test('off by default: no clip plays and the banner keeps its own sound', async ($, on) => {
    const spy = spyOf()
    await setup($, on, spy)

    await turn($, spy, LONG_MS)

    expect(spy.plays).toEqual([])
    expect(banners(spy)[0]?.at(-1)).toBe('Glass')
  })

  test('chime plays done after a long turn and wait on a permission ask, and the banner goes silent', { options: { soundPack: 'chime' } }, async ($, on) => {
    const spy = spyOf()
    await setup($, on, spy)

    await turn($, spy, LONG_MS)
    await spy.clock.advance(20_000)
    await $.tool.check({ tool: 'Bash', input: { command: 'ls' }, tool_use_id: 'u1' })
    await spy.clock.advance(5)

    expect(spy.plays).toEqual(['sounds/chime/done.wav', 'sounds/chime/wait.wav'])
    expect(banners(spy)).toHaveLength(2)
    expect(banners(spy).some(argv => argv.includes('Glass'))).toBe(false)
  })

  test('a turn whose tests failed plays the done clip too', { options: { soundPack: 'retro' } }, async ($, on) => {
    const spy = spyOf({ isTestFailing: true })
    await setup($, on, spy)

    await turn($, spy, LONG_MS)

    expect(spy.plays).toEqual(['sounds/retro/done.wav'])
  })

  test('no clip while the app the session runs in is in front', { options: { soundPack: 'chime' } }, async ($, on) => {
    const spy = spyOf({ host: 'com.apple.Terminal', front: 'com.apple.Terminal' })
    await setup($, on, spy)

    await turn($, spy, LONG_MS)

    expect(spy.plays).toEqual([])
  })

  for (const surface of ['terminal', 'desktop'] as const) {
    test(`${surface}: a host that cannot play keeps the banner, draws nothing and writes one debug line`, { options: { soundPack: 'soft' } }, async ($, on) => {
      const spy = spyOf({ isPlayFailing: true, surface, files: new Set([NOTIFIER]) })
      await setup($, on, spy)

      await turn($, spy, LONG_MS)
      const ui = await $.ui.mount(bandOf(surface) as any)

      expect(banners(spy)).toHaveLength(1)
      expect(spy.logs.filter(line => line.startsWith('done-ping: sound did not play'))).toHaveLength(1)
      // Newer engines tag the fallback with the part that drew it; only the drawing itself matters.
      expect(await ui.drawn()).toMatchObject({ type: 'Text', props: {}, children: ['engine'] })
    })
  }
})
