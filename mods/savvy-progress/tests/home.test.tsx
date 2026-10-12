import { expect, test } from 'claude-code/testing'

import { PANE, SURFACES, setup, threeRunning } from './fixtures'

// The Agents pane opens with a "← MODZ" button while the hub runs; pressing it writes this mod's own `home` value.

// Stands for the MODZ hub: it says it runs, and records the home values it hears.
const HUB_STAND_IN = {
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

for (const surface of SURFACES) {
  const buttons = async (ui: any) => (await ui.findAll({ type: 'Button' })).map((b: any) => ({ key: b.props.key, label: b.props.label }))

  test(`${surface}: with the hub off the Agents pane draws no way back`, { plugins: [HUB_STAND_IN] }, async ($, on) => {
    await setup($, on)
    await threeRunning($)
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(await ui.find({ key: 'modz-home' })).toBeUndefined()
  })

  test(`${surface}: with the hub on "← MODZ" comes first, and pressing it writes this mod's home`, { plugins: [HUB_STAND_IN] }, async ($, on) => {
    const { clock } = await setup($, on)
    await threeRunning($)
    await $.command.run({ command: 'hub-on', args: '' } as never)
    const ui = await $.ui.mount({ ...PANE, surface })
    const [first] = await buttons(ui)

    expect(first?.label).toBe('← MODZ')
    await ui.press({ key: 'modz-home' })
    const heard = JSON.parse(((await $.command.run({ command: 'heard-home', args: '' } as never)).text ?? '[]'))

    expect(heard).toEqual([{ from: 'savvy-progress', value: { at: await clock.now() } }])
  })

  test(`${surface}: the empty Agents pane has the button too`, { plugins: [HUB_STAND_IN] }, async ($, on) => {
    await setup($, on)
    await $.command.run({ command: 'hub-on', args: '' } as never)
    const ui = await $.ui.mount({ ...PANE, surface })

    expect((await buttons(ui))[0]?.label).toBe('← MODZ')
  })
}
