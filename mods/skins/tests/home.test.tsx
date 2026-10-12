import { expect, test } from 'claude-code/testing'

import { start, stubEngine } from './world'

// The Look pane draws "← MODZ" first while the hub runs; pressing it writes this mod's `home`.

const SURFACES = ['terminal', 'desktop'] as const
const HOME_LABEL = '← MODZ'

const pane = (surface: (typeof SURFACES)[number]) =>
  ({
    plugin: 'skins',
    viewport: { columns: 100, rows: 30 },
    surface,
    component: 'Pane',
    requestId: 'skins-settings',
    props: { title: 'Görünüm', isFocused: true, bodyColumns: 62, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
  }) as const

// A stand-in for the hub: it switches `isOn`, hears `home`, and reports what it heard.
const HUB_STAND_IN = {
  name: 'modz',
  register(on: any) {
    const heard: unknown[] = []
    on('command.run', { command: 'hub-on' }, async ($: any) => {
      await $.state.set({ plugin: 'modz', key: 'isOn' }, true)

      return {}
    })
    on('state.set', { key: 'home' } as any, async (_: any, e: any, next: any) => {
      heard.push(e.value)

      return next(e)
    })
    on('command.run', { command: 'hub-heard' }, async () => ({ text: JSON.stringify(heard) }))
  },
}

for (const surface of SURFACES) {
  test(`${surface}: with the hub off the pane draws no modz-home`, { plugins: [HUB_STAND_IN] } as any, async ($: any, on: any) => {
    stubEngine(on)
    await start($)
    const ui = await $.ui.mount(pane(surface))

    expect(await ui.find({ type: 'Button', key: 'modz-home' })).toBeUndefined()
  })

  test(`${surface}: with the hub on, modz-home is the first button and a press writes home`, { plugins: [HUB_STAND_IN] } as any, async ($: any, on: any) => {
    stubEngine(on)
    await start($)
    await $.command.run({ command: 'hub-on', args: '' })
    const ui = await $.ui.mount(pane(surface))
    const [first] = await ui.findAll({ type: 'Button' })

    expect(first.props.key).toBe('modz-home')
    expect(first.props.label).toBe(HOME_LABEL)
    await ui.press({ key: 'modz-home' })
    const out = await $.command.run({ command: 'hub-heard', args: '' })
    expect(JSON.parse(out.text ?? '')).toEqual([{ at: expect.any(Number) }])
  })
}
