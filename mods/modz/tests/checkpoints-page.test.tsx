// The Restore points page the hub draws in its own pane (hooks/pages/checkpoints.tsx), from what checkpoint keeps.
import { expect, mock, test } from 'claude-code/testing'

import { stubWorld } from './world'

const PANE = { plugin: 'modz', component: 'Pane', requestId: 'modz', viewport: { columns: 100, rows: 40 }, props: { bodyColumns: 80 } } as const
const REF = 'refs/checkpoints/k/s/1'

// Stands for checkpoint: it keeps a list, asks the hub for its page, and records the presses handed to it.
const checkpoint = {
  name: 'checkpoint',
  register(on: any) {
    const acts: unknown[] = []
    on('command.run', { command: 'cp-fill' }, async ($: any) => {
      // Spelled out: a stand-in's hooks see none of this file's names.
      const entry = { ref: 'refs/checkpoints/k/s/1', commit: 'c1', at: 1_000, label: 'fix login' }
      await $.state.set({ plugin: 'checkpoint', key: 'view' }, { entries: [entry], status: null, isBusy: false, pending: null })
      await $.state.set({ plugin: 'checkpoint', key: 'meta' }, { [entry.ref]: { turn: 3 } })

      return {}
    })
    on('command.run', { command: 'cp-ask' }, async ($: any) => {
      await $.state.set({ plugin: 'checkpoint', key: 'home' }, { pane: 'checkpoints', at: 2 })

      return {}
    })
    on('state.set', { plugin: 'modz', key: 'act' }, async (_: any, e: any, next: any) => (acts.push(e.value), next(e)))
    on('command.run', { command: 'cp-acts' }, async () => ({ text: JSON.stringify(acts) }))
  },
}

for (const surface of ['desktop', 'terminal'] as const) {
  test(`${surface}: the hub draws the Restore points page in its one pane, and hands a press to checkpoint`, { timeoutMs: 20_000, plugins: [checkpoint] }, async ($: any, on: any) => {
    const world = stubWorld(on, { hasOwnClock: true })
    const clock = mock.clock(on, { now: 60_000 })
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    await $.command.run({ command: 'cp-fill', args: '' })
    await $.command.run({ command: 'cp-ask', args: '' })
    await clock.advance(1)
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(new Set(world.opened)).toEqual(new Set(['modz']))
    expect(await ui.find({ key: 'modz-home' })).toBeDefined()
    expect(await ui.find({ key: 'open-checkpoints' })).toBeUndefined()
    // checkpoint's own words, in the person's language (Turkish in this world).
    expect(JSON.stringify(await ui.drawn())).toContain('Geri dönüş noktaları')

    await ui.press({ key: 'cp-undo-0' })
    const acts = JSON.parse((await $.command.run({ command: 'cp-acts', args: '' })).text)
    expect(acts).toEqual([{ page: 'checkpoints', action: 'undo', arg: REF, at: expect.any(Number) }])
  })
}
