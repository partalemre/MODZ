// The Tests page the hub draws in its own pane (hooks/pages/tests.tsx), from what test-badge keeps.
import { expect, mock } from 'claude-code/testing'
import { test } from './budget'

import { stubWorld } from './world'

const PANE = { plugin: 'modz', component: 'Pane', requestId: 'modz', viewport: { columns: 100, rows: 40 }, props: { bodyColumns: 80 } } as const

// Stands for test-badge: it keeps a failing run, asks the hub for its page, and records the presses handed to it.
const testBadge = {
  name: 'test-badge',
  register(on: any) {
    const acts: unknown[] = []
    on('command.run', { command: 'tb-fill' }, async ($: any) => {
      // Spelled out: a stand-in's hooks see none of this file's names.
      const failure = { suite: 'unit', file: 'src/a.test.ts', line: 4, name: 'a > b', message: 'AssertionError: x', durationMs: null }
      const tests = { status: 'fail', passed: 41, total: 42, errors: null, failures: [failure], tail: [] }
      await $.state.set({ plugin: 'test-badge', key: 'badge' }, { tests, lint: null, root: '/work', finishedAt: 50_000, durationMs: 900, isRunning: false })

      return {}
    })
    on('command.run', { command: 'tb-ask' }, async ($: any) => {
      await $.state.set({ plugin: 'test-badge', key: 'home' }, { pane: 'tests', at: 2 })

      return {}
    })
    on('state.set', { plugin: 'modz', key: 'act' }, async (_: any, e: any, next: any) => (acts.push(e.value), next(e)))
    on('command.run', { command: 'tb-acts' }, async () => ({ text: JSON.stringify(acts) }))
  },
}

for (const surface of ['desktop', 'terminal'] as const) {
  test(`${surface}: the hub draws the Tests page in its one pane, and hands its presses to test-badge`, { timeoutMs: 20_000, plugins: [testBadge] }, async ($: any, on: any) => {
    const world = stubWorld(on, { hasOwnClock: true })
    const clock = mock.clock(on, { now: 60_000 })
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    await $.command.run({ command: 'tb-fill', args: '' })
    await $.command.run({ command: 'tb-ask', args: '' })
    await clock.advance(1)
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(new Set(world.opened)).toEqual(new Set(['modz']))
    expect(await ui.find({ key: 'modz-home' })).toBeDefined()
    expect(await ui.find({ key: 'open-tests' })).toBeUndefined()

    await ui.press({ key: 'tb-rerun' })
    await ui.press({ key: 'tb-open-0' })
    await ui.press({ key: 'tb-filter-unit' })
    const acts = JSON.parse((await $.command.run({ command: 'tb-acts', args: '' })).text)
    expect(acts).toEqual([
      { page: 'tests', action: 'rerun', at: expect.any(Number) },
      { page: 'tests', action: 'open', arg: JSON.stringify([0, surface]), at: expect.any(Number) },
      { page: 'tests', action: 'filter', arg: 'unit', at: expect.any(Number) },
    ])
  })
}
