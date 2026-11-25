// The Agents page lives in the hub's own pane (hooks/pages/agents.tsx): the hub draws it from what savvy-progress
// keeps, no second pane opens, and a press on it is handed to savvy-progress as `modz.act`.
import { expect } from 'claude-code/testing'
import { test } from './budget'

import { stubWorld } from './world'

const PANE = { plugin: 'modz', component: 'Pane', requestId: 'modz', viewport: { columns: 100, rows: 40 }, props: { bodyColumns: 50 } } as const

// A stand-in for savvy-progress: `/crew` writes one running agent as it keeps it, and the presses it hears are kept.
const crewMod = {
  name: 'savvy-progress',
  register(on: any) {
    const acts: unknown[] = []
    on('command.run', { command: 'crew' }, async ($: any, e: any, next: any) => {
      // Spelled inside the hook: the engine runs a stand-in's hook on its own, without this file's other names.
      const run = {
        id: 'a1', agentId: 'a1', type: 'general-purpose', description: 'auth akışını incele', model: 'opus', status: 'running',
        startedAt: 1, contextTokens: 0, contextMax: 200_000, tokens: 0, costUsd: 0, steps: 0, round: 1, toolCount: 0,
      }
      await $.state.set({ plugin: 'savvy-progress', key: 'agents' }, [run])
      await $.state.set({ plugin: 'savvy-progress', key: 'hub' }, { pane: 'agents', detail: '1 ajan', tone: 'live', at: 1 })

      return next(e)
    })
    on('state.set', { plugin: 'modz', key: 'act' }, async ($: any, e: any, next: any) => {
      acts.push(e.value)

      return next(e)
    })
    on('command.run', { command: 'acts' }, async () => ({ text: JSON.stringify(acts) }))
  },
}

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: the Agents row turns the hub's own pane to the agents, and a press there reaches savvy-progress`, { timeoutMs: 20_000, plugins: [crewMod] }, async ($: any, on: any) => {
    const w = stubWorld(on)
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    await $.command.run({ command: 'crew', args: '' })
    await $.command.run({ command: 'modz', args: '' })
    const ui = await $.ui.mount({ ...PANE, surface })
    w.opened.length = 0

    await ui.press({ key: 'open-agents' })
    expect(w.opened.filter(id => !id.startsWith('close:') && id !== 'modz')).toEqual([])
    expect(await ui.find({ key: 'open-agents' })).toBeUndefined()
    expect(await ui.find({ key: 'modz-home' })).toBeDefined()
    // savvy-progress' own words, in the hub's language.
    expect((await ui.find({ key: 'compact' }))?.props?.label).toBe('Daralt')
    expect(JSON.stringify(await ui.drawn())).toContain('auth akışını incele')

    await ui.press({ key: 'compact' })
    const acts = JSON.parse((await $.command.run({ command: 'acts', args: '' })).text)
    expect(acts).toEqual([expect.objectContaining({ page: 'agents', action: 'onCompact' })])

    await ui.press({ key: 'modz-home' })
    expect(await ui.find({ key: 'open-agents' })).toBeDefined()
  })
}
