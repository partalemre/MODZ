import { describe, expect, test } from 'claude-code/testing'

import { stubWorld } from './world'

// A mod the hub does not list, opening its pane as Wrapped does: no keyboard asked for, and its answer said inside
// the hub's own write, where the real engine runs none of the hub's hooks. A test plugin is written out to a file of
// its own, so it holds no outside names.
const guest = {
  name: 'guest',
  register(on: any) {
    on('state.set', { plugin: 'modz', key: 'open' }, async ($: any, e: any, next: any) => {
      const done = await next(e)
      if (e.value.pane === 'guest') {
        await $.ui.open({ id: 'guest', title: 'Guest' })
        await $.state.set({ plugin: 'guest', key: 'shown' }, { pane: 'guest', at: 1 })
      }

      return done
    })
    on('state.set', { plugin: 'modz', key: 'stage' }, async ($: any, e: any, next: any) => {
      const done = await next(e)
      if (e.value.pane !== 'guest') await $.ui.close({ id: 'guest' })

      return done
    })
    on('command.run', { command: 'report' }, async ($: any) => {
      await $.state.set({ plugin: 'guest', key: 'hub' }, { pane: 'guest', detail: '', tone: 'idle', at: 1, title: 'Guest', section: 'meter' })

      return { text: '' }
    })
  },
}
// A mod that reports a row and never opens anything.
const mute = {
  name: 'mute',
  register(on: any) {
    on('command.run', { command: 'report' }, async ($: any) => {
      await $.state.set({ plugin: 'mute', key: 'hub' }, { pane: 'mute', detail: '', tone: 'idle', at: 1, title: 'Mute', section: 'meter' })

      return { text: '' }
    })
  },
}
const PANE = { plugin: 'modz', component: 'Pane', requestId: 'modz', surface: 'desktop', props: {}, viewport: { columns: 100, rows: 40 } } as const

async function hubWith($: any, on: any, name: string) {
  const world = stubWorld(on)
  on('session.attach', (_: unknown, e: any) => ({ clientId: e.clientId }))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'report', args: '' })

  return { world, ui: await $.ui.mount(PANE), row: `open-${name}` }
}

describe('a row pressed on the hub', () => {
  test('swaps the panel to the mod even when a click left the hub holding the keyboard', { plugins: [guest] }, async ($: any, on: any) => {
    const { world, ui, row } = await hubWith($, on, 'guest')
    world.hold.id = 'modz'

    await ui.press({ key: row })

    expect(world.up).toEqual(['guest'])
  })

  test('swaps the panel when nothing holds the hub, and leaves no stand-in behind', { plugins: [guest] }, async ($: any, on: any) => {
    const { world, ui, row } = await hubWith($, on, 'guest')

    await ui.press({ key: row })

    expect(world.up).toEqual(['guest'])
    expect(world.opened).not.toContain('modz-hold')
  })

  test('brings the hub back alone when the mod never answers a held press', { plugins: [mute] }, async ($: any, on: any) => {
    const { world, ui, row } = await hubWith($, on, 'mute')
    world.hold.id = 'modz'

    await ui.press({ key: row })

    expect(world.up).toEqual(['modz'])
  })

  test('closes a pane left behind a tab before asking, so the asked one opens anew and comes forward', { plugins: [guest] }, async ($: any, on: any) => {
    const { world, ui, row } = await hubWith($, on, 'guest')
    world.up.splice(0, world.up.length, 'guest', 'modz')

    await ui.press({ key: row })

    expect(world.opened).toContain('close:guest')
    expect(world.up).toEqual(['guest'])
  })
})

describe('a desktop that comes back', () => {
  const attach = ($: any) => $.session.attach({ surface: 'desktop', clientId: 'desktop:default' })

  test('finds the mod it left on stage, with the hub staying away', { plugins: [guest] }, async ($: any, on: any) => {
    const { world, ui, row } = await hubWith($, on, 'guest')
    await ui.press({ key: row })
    const before = world.opened.length

    await attach($)

    expect(world.opened.slice(before)).toEqual([])
    expect(world.up).toEqual(['guest'])
  })

  test('gets the hub back when no mod holds the panel', async ($: any, on: any) => {
    const world = stubWorld(on)
    on('session.attach', (_: unknown, e: any) => ({ clientId: e.clientId }))
    await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
    world.up.splice(0, world.up.length)

    await attach($)

    expect(world.up).toEqual(['modz'])
  })
})
