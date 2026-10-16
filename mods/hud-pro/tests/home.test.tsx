import { expect, test } from 'claude-code/testing'

import { PANE, USAGE, start, stubSession } from './stubs'

// Every pane the MODZ hub opens draws "← MODZ" first while the hub runs; pressing it writes this mod's `home`.
// While the hub runs the pane also takes turns in its one panel (kit/stage.ts).

const SURFACES = ['terminal', 'desktop'] as const
const HOME_LABEL = '← MODZ'

// A stand-in for the hub: it switches `isOn`, hears `home`, and reports what it heard.
const HUB_STAND_IN = {
  name: 'modz',
  register(on: any) {
    const heard: unknown[] = []
    on('command.run', { command: 'hub-on' }, async ($: any) => {
      await $.state.set({ plugin: 'modz', key: 'isOn' }, true)

      return {}
    })
    on('command.run', { command: 'hub-open' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'open' }, { pane: e.args, at: 1 })

      return {}
    })
    on('command.run', { command: 'hub-stage' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'stage' }, { pane: e.args, at: 1 })

      return {}
    })
    on('state.set', { key: 'home' } as any, async (_: any, e: any, next: any) => {
      heard.push(e.value)

      return next(e)
    })
    on('command.run', { command: 'hub-heard' }, async () => ({ text: JSON.stringify(heard) }))
  },
}

async function firstButton(ui: any) {
  const buttons = await ui.findAll({ type: 'Button' })

  return buttons[0]
}

for (const surface of SURFACES) {
  test(`${surface}: with the hub off the pane draws no modz-home`, { plugins: [HUB_STAND_IN] } as any, async ($: any, on: any) => {
    stubSession(on, USAGE)
    await start($, surface)
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(await ui.find({ type: 'Button', key: 'modz-home' })).toBeUndefined()
  })

  test(`${surface}: with the hub on, modz-home is the first button and a press writes home`, { plugins: [HUB_STAND_IN] } as any, async ($: any, on: any) => {
    const clock = stubSession(on, USAGE)
    await start($, surface)
    await $.command.run({ command: 'hub-on', args: '' })
    const ui = await $.ui.mount({ ...PANE, surface })
    const first = await firstButton(ui)

    expect(first.props.key).toBe('modz-home')
    expect(first.props.label).toBe(HOME_LABEL)
    await ui.press({ key: 'modz-home' })
    await clock.advance(1)
    const out = await $.command.run({ command: 'hub-heard', args: '' })
    expect(JSON.parse(out.text ?? '')).toEqual([{ at: expect.any(Number) }])
  })
}

test('with the hub on the opened pane reports itself shown, and steps aside when another pane takes the panel', { plugins: [HUB_STAND_IN] } as any, async ($: any, on: any) => {
  const shown: unknown[] = []
  const closed: unknown[] = []
  on('state.set', { plugin: 'hud-pro', key: 'shown' }, (_: any, e: any, next: any) => (shown.push(e.value?.pane), next(e)))
  on('ui.close', (_: any, e: any) => (closed.push(e.id), { value: undefined }))
  stubSession(on, USAGE)
  await start($, 'desktop')
  await $.command.run({ command: 'hud', args: 'full' })
  // The hub is off: nothing to step aside for.
  expect(shown).toEqual([])
  await $.command.run({ command: 'hub-on', args: '' })
  await $.command.run({ command: 'hub-open', args: 'usage' })
  expect(shown).toEqual(['usage'])
  await $.command.run({ command: 'hub-stage', args: 'usage' })
  expect(closed).toEqual([])
  await $.command.run({ command: 'hub-stage', args: 'skins' })
  expect(closed).toEqual(['hud-pro'])
})
