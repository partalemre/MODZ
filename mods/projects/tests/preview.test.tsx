import { mock, test } from 'claude-code/testing'

import type { Project, Snapshot } from '../types'

// bin/preview draws what this prints; it checks nothing. The two widths are a desktop pane's two ends.

declare const console: { log: (text: string) => void }

const NOW = 1_762_000_000_000
const HOUR = 3_600_000
const ago = (hours: number) => new Date(NOW - hours * HOUR).toISOString()
const NO_NUMBER = { kind: 'none', value: null, at: 0, isStale: false, basis: '' } as const

const steps = [{ title: 'Read the old screens', isDone: true }, { title: 'Draw the new profile', isDone: true }, { title: 'Move the settings across', isDone: false }]
const plans = [
  { path: 'a.md', mtimeMs: 0, title: 'Redesign phase 6: profile and everything left over (#1025)', done: 2, total: 3, steps },
  { path: 'b.md', mtimeMs: 0, title: 'Redesign phase 5: connections and chat', done: 2, total: 2, steps: [] },
  { path: 'c.md', mtimeMs: 0, title: 'Offline first sync', done: 0, total: 37, steps: [] },
  { path: 'd.md', mtimeMs: 0, title: 'Store listing', done: 1, total: 8, steps: [] },
  { path: 'e.md', mtimeMs: 0, title: 'Push notifications', done: 0, total: 6, steps: [] },
  { path: 'f.md', mtimeMs: 0, title: 'Accessibility pass', done: 4, total: 9, steps: [] },
]
const RECAP = 'All seven pull requests were squash-merged into main in order and none is left open. The chained branches had been opened on top of each other, so each was brought up to date with an ordinary merge, without any force-push. Before every merge the analyzer came back clean and the whole test suite passed, 1127 tests at the last step. The one conflict came from a file both branches had added; the two sides were combined and the default hint colour was chosen to clear the contrast threshold on a black ground. What remains is to run the merged main end to end on the simulator and then finish the TestFlight steps.'

const project = (over: Partial<Project>): Project => ({
  root: '/home/me/Work/client-projects/ideas/campus-hub-app', name: 'campus-hub-app', isGit: true, isLive: false, lastAt: ago(744), sessions: 41,
  tokens: { input: 900, cacheWrite: 26_000_000, cacheRead: 410_000_000, output: 1_100_000 },
  byModel: { 'claude-opus': { input: 800, cacheWrite: 24_000_000, cacheRead: 400_000_000, output: 1_000_000 }, 'claude-haiku': { input: 100, cacheWrite: 2_000_000, cacheRead: 10_000_000, output: 100_000 } },
  week: 0,
  git: { branch: 'main', head: 'abc', subject: 'docs(plans): tick the finished tasks of phases 1 to 5 (#88)', commitAt: 0, dirty: 0, commits: 412 },
  plans,
  percent: { kind: 'estimate', value: 62, at: NOW - 24 * HOUR, isStale: false, basis: 'Progress notes, phase plans and commit history; the roadmap has open work.' },
  estimate: { percent: 62, done: 'Core flows work', next: 'Run the merged main through QA on the simulator, then finish the TestFlight steps.', basis: '', at: NOW - 24 * HOUR, head: 'abc' },
  leftOff: { title: '', prompt: 'close the open pull requests', reply: '', recap: RECAP, tasks: [{ subject: 'Merge the chain', status: 'completed' }, { subject: 'Run the tests', status: 'completed' }, { subject: 'Write the release notes', status: 'in_progress' }, { subject: 'Submit to TestFlight', status: 'pending' }], at: '' },
  kinds: [{ type: 'Explore', runs: 12, tokens: 3_400_000, tools: 90, ms: 5_400_000 }, { type: 'general-purpose', runs: 4, tokens: 900_000, tools: 30, ms: 1_200_000 }],
  runs: [{ type: 'Explore', description: 'Map the old screens', tokens: 410_000, tools: 12, first: ago(800), last: ago(799), isLive: false }],
  ...over,
})

const SNAPSHOT: Snapshot = {
  at: NOW,
  projects: [
    project({ root: '/home/me/Work/console', name: 'console', isLive: true, lastAt: ago(0), percent: { kind: 'estimate', value: 88, at: NOW, isStale: false, basis: 'Commits and notes' }, week: 3_100_000 }),
    project({ root: '/home/me/Work/mobile-app', name: 'mobile-app', lastAt: ago(3), percent: { kind: 'estimate', value: 95, at: NOW - 48 * HOUR, isStale: true, basis: 'Commits and notes' } }),
    project({ root: '/home/me/Work/shipped-tool', name: 'shipped-tool', lastAt: ago(30), percent: { kind: 'ticks', value: 100, at: 0, isStale: false, basis: '12/12' } }),
    project({ root: '/home/me/Study/thesis', name: 'thesis', lastAt: ago(100), percent: { kind: 'ticks', value: 24, at: 0, isStale: false, basis: '6/25' } }),
    project({}),
    project({ root: '/home/me/Work/a-rather-long-folder-name-for-a-small-experiment', name: 'a-rather-long-folder-name-for-a-small-experiment', lastAt: ago(900), percent: NO_NUMBER, estimate: null, plans: [], kinds: [], runs: [], leftOff: null, git: null }),
  ],
  other: { folders: 4, tokens: 2_000_000 },
  hidden: 2,
}

const paneOf = (columns: number) => ({
  plugin: 'projects', component: 'Pane', requestId: 'projects', surface: 'desktop', viewport: { columns: 160, rows: 40 },
  props: { title: 'Projects', isFocused: false, bodyColumns: columns, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
}) as const

// Stands for the MODZ hub, so the head line shows its way back.
const hub = {
  name: 'modz',
  register(on: any) {
    on('command.run', { command: 'hub-on' }, async ($: any) => {
      await $.state.set({ plugin: 'modz', key: 'isOn' }, true)

      return {}
    })
  },
}

async function setup($: any, on: any, env: Record<string, string>) {
  mock.clock(on, { now: NOW })
  mock.env(on, { HOME: '/home/me', ...env })
  for (const name of ['command.register', 'ui.log', 'ui.status']) on(name, () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/w' }))
  on('ui.render', () => ({ type: 'engine', ref: 1 }))
  on('classic.SessionStart', () => ({}))
  on('process.run', () => ({ value: { exitCode: 0, stdout: 'Darwin', stderr: '' } }))
  on('fs.read', (_: any, e: any) => ({ value: String(e.path).endsWith('snapshot.json') ? JSON.stringify(SNAPSHOT) : '' }))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/w' })
  await $.classic.SessionStart({ transcript_path: '/home/me/.claude/projects/x/s.jsonl' })
  await $.command.run({ command: 'hub-on', args: '' })
}

const CAMPUS = 'row:/home/me/Work/client-projects/ideas/campus-hub-app:b'

for (const [width, columns] of [['narrow', 40], ['wide', 62]] as const) {
  for (const [language, env] of [['en', {}], ['tr', { MODZ_LANG: 'tr' }]] as const) {
    test(`preview: ${width} ${language}`, { plugins: [hub] }, async ($: any, on: any) => {
      await setup($, on, env)
      const pane = await $.ui.mount(paneOf(columns))
      const log = async (label: string) => console.log(`@@TREE@@${label}-${width}-${language}@@${JSON.stringify(await pane.drawn())}`)
      await log('list')
      await pane.press({ key: CAMPUS })
      await log('detail')
      await pane.press({ key: 'fold:story' })
      await pane.press({ key: 'a.md:b' })
      await pane.press({ key: 'fold:details' })
      await log('open')
    })
  }
}
