// The Usage page the hub draws in its own pane (hooks/pages/usage.tsx), from what hud-pro keeps, with the sections
// the meter mods it hosts publish.
import { expect, mock } from 'claude-code/testing'
import { test } from './budget'

import { stubWorld } from './world'

const PANE = { plugin: 'modz', component: 'Pane', requestId: 'modz', viewport: { columns: 100, rows: 40 }, props: { bodyColumns: 80 } } as const

// Stands for hud-pro: it keeps a reading, asks the hub for its page, and records the presses handed to it.
const hudPro = {
  name: 'hud-pro',
  register(on: any) {
    const acts: unknown[] = []
    on('command.run', { command: 'hp-fill' }, async ($: any) => {
      // Spelled out: a stand-in's hooks see none of this file's names.
      const usage = { gauges: [{ id: 'five_hour', label: '5h', percent: 44, resetsAt: null }], costUsd: 1.2, context: { tokens: 82_000, window: 200_000 } }
      await $.state.set({ plugin: 'hud-pro', key: 'usage' }, usage)

      return {}
    })
    on('command.run', { command: 'hp-ask' }, async ($: any) => (await $.state.set({ plugin: 'hud-pro', key: 'home' }, { pane: 'usage', at: 2 }), {}))
    on('state.set', { plugin: 'modz', key: 'act' }, async (_: any, e: any, next: any) => (acts.push(e.value), next(e)))
    on('command.run', { command: 'hp-acts' }, async () => ({ text: JSON.stringify(acts) }))
  },
}
// Stands for session-budget, whose section the page hosts.
const budget = {
  name: 'session-budget',
  register(on: any) {
    on('command.run', { command: 'sb-section' }, async ($: any) => {
      const section = { id: 'budget', title: 'Session budget', tone: 'neutral', at: 1, lines: ['No budget set.'], actions: [{ id: 'set', label: 'Set' }] }
      await $.state.set({ plugin: 'session-budget', key: 'section' }, section)

      return {}
    })
  },
}

for (const surface of ['desktop', 'terminal'] as const) {
  test(`${surface}: the hub draws the Usage page in its one pane, and hands its presses to hud-pro`, { timeoutMs: 20_000, plugins: [hudPro, budget] }, async ($: any, on: any) => {
    const world = stubWorld(on, { hasOwnClock: true })
    const clock = mock.clock(on, { now: 60_000 })
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    await $.command.run({ command: 'hp-fill', args: '' })
    await $.command.run({ command: 'sb-section', args: '' })
    await $.command.run({ command: 'hp-ask', args: '' })
    await clock.advance(1)
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(new Set(world.opened)).toEqual(new Set(['modz']))
    expect(await ui.find({ key: 'modz-home' })).toBeDefined()
    expect(await ui.find({ key: 'open-usage' })).toBeUndefined()
    expect(JSON.stringify(await ui.drawn())).toContain('No budget set.')

    await ui.press({ key: 'usage-budget-set' })
    await ui.press({ key: 'compact-now' })
    const acts = JSON.parse((await $.command.run({ command: 'hp-acts', args: '' })).text)
    expect(acts).toEqual([
      { page: 'usage', action: 'press', arg: JSON.stringify(['budget', 'set']), at: expect.any(Number) },
      { page: 'usage', action: 'compact', at: expect.any(Number) },
    ])
  })
}
