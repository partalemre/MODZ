import { expect, test } from 'claude-code/testing'

import { begin, paneOf, spy, stateOf, stub, turn, worldOf } from './stubs'

// The pane opens only when asked (a hub row or the command), lists the turns, keeps the person's mode pick
// across sessions, and heads itself with the way back while the hub runs.

// Stands for the MODZ hub: it asks for a pane, switches itself on, and records the `home` presses it hears.
const modz = {
  name: 'modz',
  register(on: any) {
    const heard: unknown[] = []
    on('command.run', { command: 'hub-open' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'open' }, { pane: e.args, at: 1 })

      return {}
    })
    on('command.run', { command: 'hub-on' }, async ($: any) => {
      await $.state.set({ plugin: 'modz', key: 'isOn' }, true)

      return {}
    })
    on('state.set', { key: 'home' }, async (_: any, e: any, next: any) => (heard.push(e.value), next(e)))
    on('command.run', { command: 'hub-heard' }, async () => ({ text: JSON.stringify(heard) }))
  },
}

const WITH = { plugins: [spy, modz] }

function buttonsOf(node: any, out: string[] = []): string[] {
  if (node === null || typeof node !== 'object') return out
  if (node.type === 'Button') out.push(node.props.key)
  for (const child of node.children ?? []) buttonsOf(child, out)

  return out
}

function textOf(node: any): string {
  if (typeof node === 'string') return node
  if (node === null || typeof node !== 'object') return ''

  return [node.props?.alt ?? '', ...(node.children ?? []).map(textOf)].join(' ')
}

test('no pane opens by itself; a hub request for "effort" opens it in front, another pane\'s does not', WITH, async ($: any, on: any) => {
  const world = worldOf()
  stub(on, world)
  await begin($)
  await turn($, { text: 'Rename the helper', turnId: 't1' })
  expect(world.opened).toEqual([])

  await $.command.run({ command: 'hub-open', args: 'tests' })
  expect(world.opened).toEqual([])
  await $.command.run({ command: 'hub-open', args: 'effort' })
  expect(world.opened).toEqual([expect.objectContaining({ id: 'effort', title: 'Effort', focus: true })])

  await $.command.run({ command: 'effort-router', args: '' })
  expect(world.opened).toHaveLength(2)
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: the pane lists each turn with its class, the effort sent and the model`, { options: { mode: 'auto' }, ...WITH }, async ($: any, on: any) => {
    const world = worldOf({ reply: 'light' })
    stub(on, world)
    await begin($, surface)
    await turn($, { text: 'What does this regex match?', turnId: 't1', effort: 'high' })
    const shown = textOf(await (await $.ui.mount(paneOf(surface))).drawn())

    expect(shown).toContain('What does this regex match?')
    expect(shown).toContain('light')
    expect(shown).toContain('low')
    expect(shown).toContain('from high')
    expect(shown).toContain('opus-5-5')
  })

  test(`${surface}: picking a mode keeps it, and it wins over the option next session`, { options: { mode: 'show' }, ...WITH }, async ($: any, on: any) => {
    const world = worldOf()
    stub(on, world)
    await begin($, surface)
    const pane = await $.ui.mount(paneOf(surface))
    await pane.select({ key: 'er-mode', value: 'auto' })

    expect(world.stored.mode).toBe('auto')
    expect(await stateOf($, 'mode')).toBe('auto')
    await begin($, surface)
    expect(await stateOf($, 'mode')).toBe('auto')
  })

  test(`${surface}: with the hub on, "← MODZ" comes first and writes home`, WITH, async ($: any, on: any) => {
    stub(on, worldOf())
    await begin($, surface)
    const off = await $.ui.mount(paneOf(surface))
    expect(buttonsOf(await off.drawn())).not.toContain('modz-home')
    await off.unmount()

    await $.command.run({ command: 'hub-on', args: '' })
    const pane = await $.ui.mount(paneOf(surface))
    expect(buttonsOf(await pane.drawn())[0]).toBe('modz-home')
    await pane.press({ key: 'modz-home' })
    expect(JSON.parse((await $.command.run({ command: 'hub-heard', args: '' })).text)).toHaveLength(1)
  })
}

test('a mobile pane offers the modes as buttons and a press keeps the pick', WITH, async ($: any, on: any) => {
  const world = worldOf()
  stub(on, world)
  await begin($, 'mobile')
  const pane = await $.ui.mount(paneOf('mobile'))
  expect(buttonsOf(await pane.drawn())).toEqual(['er-mode-show', 'er-mode-auto', 'er-mode-off'])
  await pane.press({ key: 'er-mode-off' })
  expect(world.stored.mode).toBe('off')
})

test('the stored pick wins over the option at session start; a stored value that is no mode is ignored', { options: { mode: 'auto' }, ...WITH }, async ($: any, on: any) => {
  const world = worldOf({ stored: { mode: 'off' } })
  stub(on, world)
  await begin($)
  expect(await stateOf($, 'mode')).toBe('off')
  world.stored.mode = 'turbo'
  await begin($)
  expect(await stateOf($, 'mode')).toBe('auto')
})
