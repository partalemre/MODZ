import { expect, mock, test } from 'claude-code/testing'

import type { Project, Snapshot } from '../types'

const TURKISH = /[çğıöşüİ]/

const project = (over: Partial<Project>): Project => ({
  root: '/w/app', name: 'app', isGit: true, isLive: false, lastAt: '2026-11-04T10:00:00.000Z', sessions: 3,
  tokens: { input: 10, cacheWrite: 1_200_000, cacheRead: 9_000_000, output: 40_000 },
  byModel: { opus: { input: 10, cacheWrite: 1_200_000, cacheRead: 9_000_000, output: 40_000 } },
  week: 500_000,
  git: { branch: 'main', head: 'abc', subject: 'feat: ship it', commitAt: 0, dirty: 2, commits: 9 },
  plans: [{ path: 'docs/plans/a.md', mtimeMs: 0, title: 'Ship plan', done: 1, total: 2, steps: [{ title: 'First step', isDone: true }, { title: 'Second step', isDone: false }] }],
  percent: { kind: 'estimate', value: 72, at: 0, isStale: true, basis: 'commits and notes' },
  estimate: { percent: 72, done: 'Core done', next: 'Write the docs', basis: 'commits and notes', at: 0, head: 'old' },
  leftOff: { title: 'Ship', prompt: 'finish the docs', reply: 'working on it', recap: 'Docs are half done.', tasks: [{ subject: 'Write docs', status: 'in_progress' }], at: '' },
  kinds: [{ type: 'Explore', runs: 2, tokens: 3000, tools: 5, ms: 90_000 }],
  runs: [{ type: 'Explore', description: 'Look around', tokens: 1500, tools: 2, first: '2026-11-04T09:00:00.000Z', last: '2026-11-04T09:01:00.000Z', isLive: false }],
  ...over,
})

const NO_NUMBER = { kind: 'none', value: null, at: 0, isStale: false, basis: '' } as const
const manyPlans = Array.from({ length: 7 }, (_, index) => ({ path: `p${index}.md`, mtimeMs: 0, title: `Plan number ${index + 1}`, done: 0, total: 3, steps: [] }))
const long = project({ root: '/w/long', name: 'long', plans: manyPlans, percent: NO_NUMBER, estimate: null, leftOff: { title: '', prompt: 'ok', reply: '', recap: `${'word '.repeat(120)}the very last words`, tasks: [{ subject: 'Open task', status: 'pending' }], at: '' } })

const SNAPSHOT: Snapshot = {
  at: 1,
  projects: [project({}), project({ root: '/w/bare', name: 'bare', plans: [], percent: NO_NUMBER, estimate: null, leftOff: null, kinds: [], runs: [] }), long],
  other: { folders: 4, tokens: 2_000_000 },
  hidden: 0,
}

const paneOf = (surface: 'desktop' | 'terminal') => ({
  plugin: 'projects', component: 'Pane', requestId: 'projects', surface, viewport: { columns: 160, rows: 40 },
  props: { title: 'Projects', isFocused: false, bodyColumns: 56, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
}) as const

// Stands for the MODZ hub: it says it runs.
const hub = {
  name: 'modz',
  register(on: any) {
    on('command.run', { command: 'hub-on' }, async ($: any) => {
      await $.state.set({ plugin: 'modz', key: 'isOn' }, true)

      return {}
    })
  },
}

async function setup($: any, on: any) {
  mock.clock(on)
  mock.env(on, {})
  for (const name of ['command.register', 'ui.log', 'ui.status']) on(name, () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/w' }))
  on('ui.render', () => ({ type: 'engine', ref: 1 }))
  on('classic.SessionStart', () => ({}))
  on('process.run', () => ({ value: { exitCode: 0, stdout: 'Darwin', stderr: '' } }))
  // The last snapshot on disk: what a session draws before its first read.
  on('fs.read', (_: any, e: any) => ({ value: String(e.path).endsWith('snapshot.json') ? JSON.stringify(SNAPSHOT) : '' }))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })
  await $.classic.SessionStart({ transcript_path: '/c/projects/x/s.jsonl' })
}

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: the list says the percent honestly, in English by default`, async ($: any, on: any) => {
    await setup($, on)
    const pane = await $.ui.mount(paneOf(surface))
    const drawn = JSON.stringify(await pane.drawn())
    expect(drawn).not.toMatch(TURKISH)
    expect(drawn).toContain('~72%')
    expect(drawn).toContain('—')
    expect(drawn).toContain('Open full board')
    expect(drawn).toContain('Estimate 3 percents')
  })

  test(`${surface}: one project shows its percent basis, stop point, plans, tokens and agents`, async ($: any, on: any) => {
    await setup($, on)
    const pane = await $.ui.mount(paneOf(surface))
    await pane.press({ key: 'row:/w/app:b' })
    const drawn = JSON.stringify(await pane.drawn())
    expect(drawn).not.toMatch(TURKISH)
    for (const part of ['~72%', "Claude's estimate", 'New saved versions since', 'Docs are half done.', 'Write the docs', 'on main, 2 not saved yet', 'Ship plan', '1/2', '1.2M']) expect(drawn).toContain(part)
    await pane.press({ key: 'fold:details' })
    const details = JSON.stringify(await pane.drawn())
    for (const part of ['Explore', 'Look around', 'Reused (cache)']) expect(details).toContain(part)
    await pane.press({ key: 'fold:details' })
    expect(JSON.stringify(await pane.drawn())).not.toContain('Look around')
  })

  test(`${surface}: one project has one way back, not two`, { plugins: [hub] }, async ($: any, on: any) => {
    await setup($, on)
    await $.command.run({ command: 'hub-on', args: '' })
    const pane = await $.ui.mount(paneOf(surface))
    expect(JSON.stringify(await pane.drawn())).toContain('← modz')
    await pane.press({ key: 'row:/w/app:b' })
    const drawn = JSON.stringify(await pane.drawn())
    expect(drawn).toContain('← Projects')
    expect(drawn).not.toContain('← modz')
  })

  test(`${surface}: a long stop note folds, opens whole, and folds again; the next project starts folded`, async ($: any, on: any) => {
    await setup($, on)
    const pane = await $.ui.mount(paneOf(surface))
    await pane.press({ key: 'row:/w/long:b' })
    const end = 'the very last words'
    expect(JSON.stringify(await pane.drawn())).not.toContain(end)
    await pane.press({ key: 'fold:story' })
    expect(JSON.stringify(await pane.drawn())).toContain(end)
    await pane.press({ key: 'fold:story' })
    expect(JSON.stringify(await pane.drawn())).not.toContain(end)
    await pane.press({ key: 'fold:story' })
    await pane.press({ key: 'back' })
    await pane.press({ key: 'row:/w/long:b' })
    expect(JSON.stringify(await pane.drawn())).not.toContain(end)
  })

  test(`${surface}: only the first plans show until asked`, async ($: any, on: any) => {
    await setup($, on)
    const pane = await $.ui.mount(paneOf(surface))
    await pane.press({ key: 'row:/w/long:b' })
    expect(JSON.stringify(await pane.drawn())).not.toContain('Plan number 6')
    await pane.press({ key: 'fold:plans' })
    expect(JSON.stringify(await pane.drawn())).toContain('Plan number 6')
  })

  test(`${surface}: no estimate yet: the next step comes from the task list, and the number is honest`, async ($: any, on: any) => {
    await setup($, on)
    const pane = await $.ui.mount(paneOf(surface))
    await pane.press({ key: 'row:/w/long:b' })
    const drawn = JSON.stringify(await pane.drawn())
    expect(drawn).toContain('Open task')
    expect(drawn).toContain('No ticked plan to count')
  })
}

test('the desktop map answers hover by CSS alone, with no script', async ($: any, on: any) => {
  await setup($, on)
  const pane = await $.ui.mount(paneOf('desktop'))
  const drawn = JSON.stringify(await pane.drawn())
  expect(drawn).toContain('"isInteractive\":true')
  const source = drawn
  expect(source).toContain('.c:hover .t{opacity:1}')
  expect(source).toContain('.t{opacity:0;pointer-events:none}')
  expect(source).not.toContain('<script')
})

test('the count sits on the head line, as a drawing whose right edge is the rows\'', async ($: any, on: any) => {
  await setup($, on)
  const pane = await $.ui.mount(paneOf('desktop'))
  const drawn = JSON.stringify(await pane.drawn())
  expect(drawn).toContain('"alt":"3 projects"')
  expect(drawn).toContain('3 projects</text>')
})

test('a desktop row is a single button, so it never lights by halves', async ($: any, on: any) => {
  await setup($, on)
  const pane = await $.ui.mount(paneOf('desktop'))
  const keys: string[] = []
  const walk = (node: any) => {
    if (node?.type === 'Button' && String(node.props?.key).startsWith('row:')) keys.push(node.props.key)
    for (const child of node?.children ?? []) walk(child)
  }
  walk(await pane.drawn())
  expect(keys).toEqual(['row:/w/app:b', 'row:/w/bare:b', 'row:/w/long:b'])
})

test('Estimate shows the model\'s failure instead of passing in silence', async ($: any, on: any) => {
  on('fs.list', () => ({ value: [] }))
  on('fs.write', () => ({ value: undefined }))
  on('model.complete', () => ({ value: { isAnswered: false, reason: 'api-error', status: null, error: 'authentication_failed', usage: {} } }))
  await setup($, on)
  const pane = await $.ui.mount(paneOf('desktop'))
  await pane.press({ key: 'row:/w/bare:b' })
  await pane.press({ key: 'one' })
  expect(JSON.stringify(await pane.drawn())).toContain('bare: model: authentication_failed')
})

test('the language is known when the start hook writes the hub line, even if it runs first', async ($: any, on: any) => {
  mock.clock(on)
  mock.env(on, { MODZ_LANG: 'tr' })
  on('ui.render', () => ({ type: 'engine', ref: 1 }))
  on('classic.SessionStart', () => ({}))
  on('process.run', () => ({ value: { exitCode: 0, stdout: 'Darwin', stderr: '' } }))
  on('fs.read', (_: any, e: any) => ({ value: String(e.path).endsWith('snapshot.json') ? JSON.stringify(SNAPSHOT) : '' }))
  await $.classic.SessionStart({ transcript_path: '/c/projects/x/s.jsonl' })
  const pane = await $.ui.mount(paneOf('desktop'))
  expect(JSON.stringify(await pane.drawn())).toContain('3 proje')
})

test('USERPROFILE names the home folder where HOME is not set', async ($: any, on: any) => {
  mock.clock(on)
  mock.env(on, { USERPROFILE: 'C:\\Users\\me', OS: 'Windows_NT' })
  on('ui.render', () => ({ type: 'engine', ref: 1 }))
  on('classic.SessionStart', () => ({}))
  const windows: Snapshot = { ...SNAPSHOT, projects: [project({ root: 'C:\\Users\\me\\code\\app' })] }
  on('fs.read', (_: any, e: any) => ({ value: String(e.path).endsWith('snapshot.json') ? JSON.stringify(windows) : '' }))
  await $.classic.SessionStart({ transcript_path: 'C:\\Users\\me\\.claude\\projects\\x\\s.jsonl' })
  const pane = await $.ui.mount(paneOf('terminal'))
  await pane.press({ key: 'row:C:\\Users\\me\\code\\app:b' })
  expect(JSON.stringify(await pane.drawn())).toContain('~\\\\code\\\\app')
})

test('a person with no snapshot yet still gets a hub row: the pane is what does the first read', async ($: any, on: any) => {
  mock.clock(on)
  mock.env(on, {})
  for (const name of ['command.register', 'ui.log', 'ui.status']) on(name, () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/w' }))
  on('classic.SessionStart', () => ({}))
  on('process.run', () => ({ value: { exitCode: 0, stdout: 'Darwin', stderr: '' } }))
  on('fs.read', () => ({ value: '' }))
  const cards: unknown[] = []
  on('state.set', { plugin: 'projects', key: 'hub' }, (_: any, e: any, next: any) => (cards.push(e.value), next(e)))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/w' })
  await $.classic.SessionStart({ transcript_path: '/c/projects/x/s.jsonl' })

  expect(cards).toEqual([expect.objectContaining({ pane: 'projects' })])
})
