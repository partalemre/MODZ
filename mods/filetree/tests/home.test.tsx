import { expect, test } from 'claude-code/testing'

import { world } from './world'
import type { World } from './world'

// The Files pane opens with a "← MODZ" button while the hub runs; pressing it writes this mod's own `home` value.

// Stands for the MODZ hub: it says it runs, and records the home values it hears.
const modz = {
  name: 'modz',
  register(on: any) {
    const homes: unknown[] = []
    on('command.run', { command: 'hub-on' }, async ($: any) => {
      await $.state.set({ plugin: 'modz', key: 'isOn' }, true)

      return {}
    })
    on('state.set', { key: 'home' }, async ($: any, e: any, next: any) => {
      homes.push({ from: e.plugin, value: e.value })

      return next(e)
    })
    on('command.run', { command: 'heard-home' }, async () => ({ text: JSON.stringify(homes) }))
  },
}

const props = { title: 'Dosyalar', isFocused: false, bodyColumns: 50, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} } as any
const ROOT = '/Users/k/MODZ'
const WORLD: World = { root: ROOT, files: ['a.ts'], status: '## main\0 M a.ts\0', heads: { [ROOT]: ['1111111aaaa'] } }

for (const surface of ['terminal', 'desktop'] as const) {
  const mount = async ($: any, on: any, isHubOn: boolean) => {
    const clock = world(on, { ...WORLD })
    await $.session.start({ cwd: ROOT, surface, isInteractive: true })
    await clock.settle()
    if (isHubOn) await $.command.run({ command: 'hub-on', args: '' } as any)

    return { clock, ui: await $.ui.mount({ plugin: 'filetree', surface, component: 'Pane', requestId: 'filetree', props }) }
  }

  test(`${surface}: with the hub off the Files pane draws no way back`, { plugins: [modz], timeoutMs: 20_000 }, async ($, on) => {
    const { ui } = await mount($, on, false)

    expect(await ui.find({ key: 'modz-home' })).toBeUndefined()
  })

  test(`${surface}: with the hub on "← MODZ" comes first, and pressing it writes this mod's home`, { plugins: [modz], timeoutMs: 20_000 }, async ($, on) => {
    const { clock, ui } = await mount($, on, true)
    const [first] = await ui.findAll({ type: 'Button' })

    expect(first?.props.label).toBe('← MODZ')
    await ui.press({ key: 'modz-home' })
    const heard = JSON.parse((await $.command.run({ command: 'heard-home', args: '' } as any)).text ?? '[]')

    expect(heard).toEqual([{ from: 'filetree', value: { at: await clock.now() } }])
  })
}
