// The Files page the hub draws in its own pane (hooks/pages/files.tsx), from what filetree keeps.
import { expect, mock } from 'claude-code/testing'
import { test } from './budget'

import { stubWorld } from './world'

const PANE = { plugin: 'modz', component: 'Pane', requestId: 'modz', viewport: { columns: 100, rows: 40 }, props: { bodyColumns: 80, scroll: { offset: 0, bodyRows: 40 } } } as const

// Stands for filetree: it keeps a tree, asks the hub for its page, and records the presses handed to it.
const filetree = {
  name: 'filetree',
  register(on: any) {
    const acts: unknown[] = []
    on('command.run', { command: 'ft-fill' }, async ($: any) => {
      // Spelled out: a stand-in's hooks see none of this file's names.
      const node = (name: string, kind: string) => ({ id: `/work/${name}`, parent: '/work', name, kind, hidden: false, mtime: 1, size: 1, loaded: kind !== 'dir' })
      await $.state.set({ plugin: 'filetree', key: 'tree' }, { root: '/work', nodes: [node('src', 'dir'), node('a.ts', 'file')], expanded: [], cursor: '/work/a.ts' })
      await $.state.set({ plugin: 'filetree', key: 'feel' }, { glyphs: 'plain', noNerd: true, pointer: true, followClaude: true, follow: true })

      return {}
    })
    on('command.run', { command: 'ft-ask' }, async ($: any) => {
      await $.state.set({ plugin: 'filetree', key: 'home' }, { pane: 'files', at: 2 })

      return {}
    })
    on('state.set', { plugin: 'modz', key: 'act' }, async (_: any, e: any, next: any) => (acts.push(e.value), next(e)))
    on('command.run', { command: 'ft-acts' }, async () => ({ text: JSON.stringify(acts) }))
  },
}

for (const surface of ['desktop', 'terminal'] as const) {
  test(`${surface}: the hub draws the Files page in its one pane, and hands its presses to filetree`, { timeoutMs: 20_000, plugins: [filetree] }, async ($: any, on: any) => {
    const world = stubWorld(on, { hasOwnClock: true })
    const clock = mock.clock(on, { now: 60_000 })
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    await $.command.run({ command: 'ft-fill', args: '' })
    await $.command.run({ command: 'ft-ask', args: '' })
    await clock.advance(1)
    const ui = await $.ui.mount({ ...PANE, surface })

    expect(new Set(world.opened)).toEqual(new Set(['modz']))
    expect(await ui.find({ key: 'modz-home' })).toBeDefined()
    expect(await ui.find({ key: 'open-files' })).toBeUndefined()
    // The tree's rows are filetree's Client, drawn from this plugin's copy.
    expect((await ui.find({ type: 'Client' }))?.props.module).toBe('hooks/rows.tsx')
    expect(JSON.stringify(await ui.drawn())).toContain('a.ts')

    await ui.press({ key: 'refresh' })
    await ui.input({ key: 'q', text: 'a.t', kind: 'change' })
    await ui.input({ key: 'q', text: 'a.ts' })
    const acts = JSON.parse((await $.command.run({ command: 'ft-acts', args: '' })).text)
    expect(acts).toEqual([
      { page: 'files', action: 'refresh', at: expect.any(Number) },
      { page: 'files', action: 'find', arg: 'a.t', at: expect.any(Number) },
      { page: 'files', action: 'jump', arg: 'a.ts', at: expect.any(Number) },
    ])
  })
}

