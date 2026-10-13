import { expect, test } from 'claude-code/testing'

import { MINUTE, buttonsOf, modz, newWorld, paneOf, said, start, stub } from './stubs'

// The Handoff pane: empty, with a note (preview, age, handing on), toggled, deleted; the way back to MODZ.

function handlesOf(node: any, out: Record<string, number> = {}): Record<string, number> {
  if (node === null || typeof node !== 'object') return out
  if (node.press !== undefined && typeof node.props?.key === 'string') out[`${node.type}:${node.props.key}`] = node.press.handle
  for (const child of node.children ?? []) handlesOf(child, out)

  return out
}

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: with no note the pane offers to write one`, async ($: any, on: any) => {
    const world = newWorld()
    stub(on, world)
    await start($, surface)
    const pane = await $.ui.mount(paneOf(surface))

    expect(buttonsOf(await pane.drawn())).toEqual(['handoff-write-now'])
    await pane.press({ key: 'handoff-write-now' })
    expect(Object.keys(world.files)).toHaveLength(1)
    expect(buttonsOf(await pane.drawn())).toEqual(['handoff-toggle', 'handoff-write-now', 'handoff-delete'])
  })

  test(`${surface}: a note shows its preview and its state; the toggle and delete work`, async ($: any, on: any) => {
    const world = newWorld({ messages: [said('user', 'fix login')] })
    const clock = stub(on, world)
    await start($, surface)
    await $.command.run({ command: 'handoff', args: '' })
    await clock.advance(12 * MINUTE)
    const pane = await $.ui.mount(paneOf(surface))

    expect((await pane.find({ type: 'Markdown' }))).toBeDefined()
    expect(await pane.find({ type: 'Button', text: "Don't hand it on" })).toBeDefined()
    await pane.press({ key: 'handoff-toggle' })
    expect(await pane.find({ type: 'Button', text: 'Hand it to the next chat' })).toBeDefined()

    const [path] = Object.keys(world.files)
    await pane.press({ key: 'handoff-delete' })
    expect(world.files[path!]).toBeUndefined()
    expect(world.argv.at(-1)).toEqual(['rm', '-f', '--', path])
    expect(world.store['latest:/w']).toBeUndefined()
    expect(buttonsOf(await pane.drawn())).toEqual(['handoff-write-now'])
  })

  test(`${surface}: with the hub on "← MODZ" comes first and writes home; a hub press opens the pane`, { plugins: [modz] }, async ($: any, on: any) => {
    const world = newWorld()
    stub(on, world)
    await start($, surface)
    await $.command.run({ command: 'modz-open', args: 'handoff' })
    expect(world.opened).toEqual(['handoff'])
    await $.command.run({ command: 'hub-on', args: '' })
    const pane = await $.ui.mount(paneOf(surface))

    expect(buttonsOf(await pane.drawn())[0]).toBe('modz-home')
    await pane.press({ key: 'modz-home' })
    const heard = JSON.parse((await $.command.run({ command: 'hub-heard', args: '' })).text)
    expect(typeof heard[0].at).toBe('number')
  })

  test(`${surface}: a redraw keeps every button's press handle`, async ($: any, on: any) => {
    stub(on, newWorld())
    await start($, surface)
    await $.command.run({ command: 'handoff', args: '' })
    const pane = await $.ui.mount(paneOf(surface))
    const before = handlesOf(await pane.drawn())
    await pane.redraw({ ...paneOf(surface).props, isFocused: false })

    expect(Object.keys(before).length).toBeGreaterThan(0)
    expect(handlesOf(await pane.drawn())).toEqual(before)
  })
}

test('a note a later chat took says so, and offers no toggle', async ($: any, on: any) => {
  const world = newWorld()
  stub(on, world)
  await start($, 'terminal')
  await $.command.run({ command: 'handoff', args: '' })
  world.sessionId = 's2'
  await $.prompt.compose({ model: 'm', promptModel: 'm', surfaces: [], tools: [], outputStyle: null, traits: [] })
  const pane = await $.ui.mount(paneOf('terminal'))

  expect(await pane.find({ text: /A later chat already took it in/ })).toBeDefined()
  expect(buttonsOf(await pane.drawn())).toEqual(['handoff-write-now', 'handoff-delete'])
})
