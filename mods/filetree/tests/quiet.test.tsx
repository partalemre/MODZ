import { expect, test } from 'claude-code/testing'

import { world } from './world'
import type { World } from './world'

// A mod costs nothing until it is looked at: about fifteen sessions run side by side, each with this mod loaded.

const ROOT = '/Users/k/MODZ'
const props = { title: 'Files', isFocused: false, bodyColumns: 50, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} } as any
const MINUTE = 60_000
const worldOf = (): World => ({ root: ROOT, files: ['a.ts', 'b.ts'], status: '## main\0 M a.ts\0', heads: { [ROOT]: ['1111111aaaa'] }, calls: [] })
const gitCalls = (w: World) => (w.calls ?? []).filter(line => line.startsWith('git ')).length
const lists = (w: World) => (w.calls ?? []).filter(line => line.startsWith('list ')).length
const scans = (w: World) => (w.calls ?? []).filter(line => /^(find|touch) /.test(line)).length

test('a pane never opened lists nothing and runs one git status at start', { timeoutMs: 20_000 }, async ($: any, on: any) => {
  const w = worldOf()
  const clock = world(on, w)
  await $.session.start({ cwd: ROOT, surface: 'desktop', isInteractive: true })
  await clock.settle()

  expect(lists(w)).toBe(0)
  expect(gitCalls(w)).toBeLessThanOrEqual(1)
})

test('a pane never opened does not scan after Bash calls', { timeoutMs: 20_000 }, async ($: any, on: any) => {
  const w = worldOf()
  const clock = world(on, w)
  await $.session.start({ cwd: ROOT, surface: 'desktop', isInteractive: true })
  await clock.settle()
  const before = { git: gitCalls(w), lists: lists(w) }
  for (const command of ['touch c', 'npm run build', 'rm -rf dist']) await $.tool.call({ tool: 'Bash', command } as any)
  await clock.settle()

  expect(lists(w)).toBe(before.lists)
  expect(gitCalls(w)).toBe(before.git)
  expect(scans(w)).toBe(0)
})

test('opening the pane lists the tree', { timeoutMs: 20_000 }, async ($: any, on: any) => {
  const w = worldOf()
  const clock = world(on, w)
  await $.session.start({ cwd: ROOT, surface: 'desktop', isInteractive: true })
  await clock.settle()
  const ui = await $.ui.mount({ plugin: 'filetree', surface: 'desktop', component: 'Pane', requestId: 'filetree', props })
  await clock.settle()

  expect(JSON.stringify(await ui.drawn({ in: 'rows' }))).toContain('b.ts')
  await ui.unmount()
})

test('a pick older than two minutes is not named in the prompt', { timeoutMs: 20_000 }, async ($: any, on: any) => {
  const w = worldOf()
  const clock = world(on, w)
  on('prompt.submit', (_$: any, e: any) => ({ text: e.text, context: e.context }))
  await $.session.start({ cwd: ROOT, surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ plugin: 'filetree', surface: 'desktop', component: 'Pane', requestId: 'filetree', props })
  await clock.settle()
  await ui.post({ press: `${ROOT}/a.ts` }, { in: 'rows' })
  await clock.settle()
  await clock.advance(3 * MINUTE)

  const sent = await $.prompt.submit({ text: 'what is this?', wait: false } as any)
  expect(JSON.stringify(sent)).not.toContain(`${ROOT}/a.ts`)
  await ui.unmount()
})

test('a double click on a folder opens and closes it; the tree keeps its root', { timeoutMs: 20_000 }, async ($: any, on: any) => {
  const w = { ...worldOf(), files: ['src/', 'a.ts'] }
  const clock = world(on, w)
  await $.session.start({ cwd: ROOT, surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ plugin: 'filetree', surface: 'desktop', component: 'Pane', requestId: 'filetree', props })
  await clock.settle()
  await ui.post({ press: `${ROOT}/src` }, { in: 'rows' })
  await ui.post({ press: `${ROOT}/src` }, { in: 'rows' })
  await clock.settle()

  expect(JSON.stringify(await ui.drawn({ in: 'rows' }))).toContain('a.ts')
  await ui.unmount()
})
