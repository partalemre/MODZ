import { expect, test } from 'claude-code/testing'

import { newFake, paneOf, stub } from './stubs'

// A way back to the MODZ hub heads the pane while the hub runs; pressing it writes this mod's `home` value.

// Stands for the MODZ hub: it can switch itself on, and it records the `home` presses it hears.
const modz = {
  name: 'modz',
  register(on: any) {
    const heard: unknown[] = []
    on('command.run', { command: 'hub-on' }, async ($: any) => {
      await $.state.set({ plugin: 'modz', key: 'isOn' }, true)

      return {}
    })
    on('state.set', { key: 'home' }, async (_: any, e: any, next: any) => {
      heard.push(e.value)

      return next(e)
    })
    on('command.run', { command: 'hub-heard' }, async () => ({ text: JSON.stringify(heard) }))
  },
}

function buttonsOf(node: any, out: { key: string; label: string }[] = []) {
  if (node === null || typeof node !== 'object') return out
  if (node.type === 'Button') out.push({ key: node.props.key, label: node.props.label })
  for (const child of node.children ?? []) buttonsOf(child, out)

  return out
}

const REFS = 'refs/checkpoints/s/1\tc1\t100\tfix login'

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: with the hub off the pane draws no way back`, { plugins: [modz] }, async ($: any, on: any) => {
    stub(on, newFake({ refs: REFS, diff: 'M\0a.ts\0' }))
    await $.session.start({ surface, isInteractive: true, cwd: '/w' })
    await $.command.run({ command: 'checkpoints', args: '' })
    const pane = await $.ui.mount(paneOf(surface))

    expect(await pane.find({ key: 'modz-home' })).toBeUndefined()
    expect(buttonsOf(await pane.drawn()).length).toBeGreaterThan(0)
  })

  test(`${surface}: with the hub on "← MODZ" is the first button, and pressing it writes home`, { plugins: [modz] }, async ($: any, on: any) => {
    stub(on, newFake({ refs: REFS, diff: 'M\0a.ts\0' }))
    await $.session.start({ surface, isInteractive: true, cwd: '/w' })
    await $.command.run({ command: 'checkpoints', args: '' })
    await $.command.run({ command: 'hub-on', args: '' })
    const pane = await $.ui.mount(paneOf(surface))

    expect(buttonsOf(await pane.drawn())[0]).toEqual({ key: 'modz-home', label: '← MODZ' })
    await pane.press({ key: 'modz-home' })
    const heard = JSON.parse((await $.command.run({ command: 'hub-heard', args: '' })).text)
    expect(heard).toHaveLength(1)
    expect(typeof heard[0].at).toBe('number')
  })
}
