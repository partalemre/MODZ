import { expect, test } from 'claude-code/testing'

import { growProjects, isShown, joinCopies, LIVE_MS, spent, withClearNames, withLiveNow } from '../hooks/build'
import { rowWidth } from '../hooks/pane'
import { bigPic, mapPic, rowPic } from '../hooks/svg-rows'
import { mono, sans } from '../hooks/kit/svg-core'
import { leftOffOf, plainOf } from '../hooks/leftoff'
import { parseEstimate, percentOf } from '../hooks/percent'
import { parseCeo, parseMarkdown } from '../hooks/plans'
import { cutWorktree, isMachinery, mergeMoved, resolveRoots } from '../hooks/roots'
import { parseOutput, scanFiles, sessionOf } from '../hooks/scan'
import type { ScanIo } from '../hooks/scan'
import type { Found } from '../hooks/build'
import type { FileSum, PlanRow, Project, Snapshot } from '../types'

const plan = (done: number, total: number): PlanRow => ({ path: 'p.md', mtimeMs: 0, title: 'p', done, total, steps: [] })
const NOW = Date.parse('2026-11-04T12:00:00.000Z')
const sum = (over: Partial<FileSum>): FileSum => ({
  path: '/c/projects/x/s1.jsonl', size: 1, mtimeMs: 0, cwd: '/w/app', title: '', first: '2026-11-04T10:00:00.000Z', last: '2026-11-04T11:00:00.000Z', tools: 0,
  models: { opus: { input: 10, cacheWrite: 20, cacheRead: 1000, output: 30, replies: 1 } }, ...over,
})

test('a plan nobody ticked gives no number, never 0 %', () => {
  expect(percentOf([plan(0, 37)], undefined, 'h')).toEqual({ kind: 'none', value: null, at: 0, isStale: false, basis: '' })
})

test('ticked plans count only their own steps', () => {
  const percent = percentOf([plan(3, 4), plan(0, 100)], undefined, 'h')
  expect(percent.kind).toBe('ticks')
  expect(percent.value).toBe(75)
  expect(percent.basis).toBe('3/4')
})

test('an estimate wins, and goes stale when the head moved', () => {
  const estimate = { percent: 60, done: 'a', next: 'b', basis: 'c', at: 5, head: 'old' }
  expect(percentOf([plan(4, 4)], estimate, 'old')).toMatchObject({ kind: 'estimate', value: 60, isStale: false })
  expect(percentOf([plan(4, 4)], estimate, 'new').isStale).toBe(true)
})

test('an estimate reply is clamped, and a broken one is refused', () => {
  const stamp = { at: 1, head: 'h' }
  expect(parseEstimate('here: {"percent": 140, "done": "d", "next": "n"}', stamp)?.percent).toBe(100)
  expect(parseEstimate('{"percent": "much", "done": "d", "next": "n"}', stamp)).toBeNull()
  expect(parseEstimate('no json', stamp)).toBeNull()
})

test('markdown plans: boxes win over headings, headings alone are unmarked', () => {
  const boxes = parseMarkdown('# Ship\n## Task 1: x\n- [x] one\n- [ ] two\n', 'f.md')
  expect(boxes).toMatchObject({ title: 'Ship', done: 1, total: 2 })
  const headings = parseMarkdown('## Task 1: first\n### Step 2: second\n', 'f.md')
  expect(headings).toMatchObject({ title: 'f.md', done: 0, total: 2 })
})

test('a CEO Mode plan counts tasks by status', () => {
  const text = JSON.stringify({ title: 'T', milestones: [{ tasks: [{ title: 'a', status: 'done' }, { title: 'b', status: 'queued' }] }] })
  expect(parseCeo(text, 'f')).toMatchObject({ title: 'T', done: 1, total: 2 })
  expect(parseCeo('{"version":1}', 'f')).toBeNull()
})

test('the scan output parses, and a cut row is left out', () => {
  const sums = parseOutput('F\t/a/s.jsonl\t/w\tTitle\t2026\t2027\t3\nU\t/a/s.jsonl\topus\t1\t2\t3\t4\t5\nU\t/a/s.jsonl\t<synthetic>\t9\t9\t9\t9\t9\nF\tcut\n')
  expect([...sums.keys()]).toEqual(['/a/s.jsonl'])
  expect(sums.get('/a/s.jsonl')?.models).toEqual({ opus: { input: 1, cacheWrite: 2, cacheRead: 3, output: 4, replies: 5 } })
  expect(sessionOf('/p/x/abc.jsonl')).toBe('abc')
  expect(sessionOf('/p/x/abc/subagents/agent-1.jsonl')).toBe('abc')
})

test('worktrees and inner folders are one project', async () => {
  const io = {
    exists: async (path: string) => path === '/w/app/.git' || path === '/w/app' || path === '/w/link/.git',
    isDir: async (path: string) => path === '/w/app/.git',
    read: async () => 'gitdir: /w/app/.git/worktrees/link\n',
  }
  const roots = await resolveRoots(['/w/app/.claude/worktrees/a', '/w/app/src', '/w/link'], new Set(), { io, home: '/h' })
  expect(cutWorktree('/w/app/.claude/worktrees/a')).toBe('/w/app')
  expect([...roots.values()].map(info => info.root)).toEqual(['/w/app', '/w/app', '/w/app'])
})

test('a moved folder joins the living project of its name', () => {
  const found = mergeMoved(new Map([
    ['/old/app', { root: '/old/app', isGit: false, isOnDisk: false }],
    ['/new/app', { root: '/new/app', isGit: true, isOnDisk: true }],
  ]))
  expect(found.get('/old/app')).toEqual({ root: '/new/app', isGit: true, isOnDisk: true })
})

test('machinery folders are never projects', () => {
  expect(isMachinery('/h', '/h')).toBe(true)
  expect(isMachinery('/h/Library/Application Support/x', '/h')).toBe(true)
  expect(isMachinery('/private/tmp/x', '/h')).toBe(true)
  expect(isMachinery('/h/Projects/x', '/h')).toBe(false)
})

test('subagents count for the project their session started in', () => {
  const roots = new Map([['/w/app', { root: '/w/app', isGit: true, isOnDisk: true }], ['/w/app/.claude/worktrees/a', { root: '/w/app', isGit: true, isOnDisk: true }]])
  const files = [
    sum({}),
    sum({ path: '/c/projects/x/s1/subagents/agent-1.jsonl', cwd: '/w/app/.claude/worktrees/a', tools: 7, agent: { type: 'Explore', description: 'look' } }),
  ]
  const project = growProjects(files, { roots, nowMs: NOW }).get('/w/app')
  expect(project?.sessions).toBe(1)
  expect(spent(project?.tokens ?? { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 })).toBe(120)
  expect(project?.tokens.cacheRead).toBe(2000)
  expect(project?.kinds).toEqual([{ type: 'Explore', runs: 1, tokens: 60, tools: 7, ms: 3_600_000 }])
  expect(project?.week).toBe(120)
})

test('a folder without a repo or a plan gets no row', () => {
  const roots = new Map([['/h/notes', { root: '/h/notes', isGit: false, isOnDisk: true }]])
  const big = sum({ cwd: '/h/notes', models: { opus: { input: 900_000, cacheWrite: 0, cacheRead: 0, output: 0, replies: 1 } } })
  const project = growProjects([big], { roots, nowMs: NOW }).get('/h/notes')
  if (project === undefined) throw new Error('no project')
  expect(isShown(project, { home: '/h', hidden: new Set(), hasPlans: false })).toBe(false)
  expect(isShown(project, { home: '/h', hidden: new Set(), hasPlans: true })).toBe(true)
  expect(isShown(project, { home: '/h', hidden: new Set(['/h/notes']), hasPlans: true })).toBe(false)
})

test('left off: last words, closing recap and the task list as its calls left it', () => {
  const line = (row: unknown) => JSON.stringify(row)
  const tool = (name: string, input: unknown) => line({ type: 'assistant', timestamp: 't2', message: { content: [{ type: 'tool_use', name, input }] } })
  const text = [
    '{"cut line',
    line({ type: 'user', timestamp: 't1', message: { content: 'ship it' } }),
    line({ type: 'user', timestamp: 't1', message: { content: '<system-reminder>no</system-reminder>' } }),
    line({ type: 'user', isSidechain: true, message: { content: 'an agent prompt' } }),
    tool('mcp__ccd_turn__update_plan', { items: [{ content: 'a', status: 'in_progress' }, { content: 'b', status: 'pending' }] }),
    tool('mcp__ccd_turn__update_plan', { advance: true }),
    tool('mcp__ccd_turn__wrap_up', { recap: 'Shipped a.' }),
    line({ type: 'assistant', timestamp: 't3', message: { content: [{ type: 'text', text: 'all done' }] } }),
  ].join('\n')
  expect(leftOffOf(text, 'T')).toEqual({
    title: 'T', prompt: 'ship it', reply: 'all done', recap: 'Shipped a.', at: 't3',
    tasks: [{ subject: 'a', status: 'completed' }, { subject: 'b', status: 'in_progress' }],
  })
})

test('a reply loses its markdown marks but not its words', () => {
  expect(plainOf('## Ne oldu\n**Kök** `kod`: [#79](https://x.y/79)\n- bir madde')).toBe('Ne oldu\nKök kod: #79\nbir madde')
})

test('where a project stopped skips sessions that did no work', () => {
  const roots = new Map([['/w/app', { root: '/w/app', isGit: true, isOnDisk: true }]])
  const work = sum({ path: '/c/projects/x/work.jsonl', tools: 5, last: '2026-11-01T10:00:00.000Z' })
  const ping = sum({ path: '/c/projects/x/ping.jsonl', tools: 0, last: '2026-11-04T10:00:00.000Z' })
  expect(growProjects([work, ping], { roots, nowMs: NOW }).get('/w/app')?.newest?.path).toBe(work.path)
  expect(growProjects([ping], { roots, nowMs: NOW }).get('/w/app')?.newest).toBeNull()
})

test('two folders of one name say which is which', () => {
  const names = withClearNames([{ root: '/p/Subz', name: 'Subz' }, { root: '/p/_trial/Subz', name: 'Subz' }, { root: '/p/app', name: 'app' }]).map(one => one.name)
  expect(names).toEqual(['p/Subz', '_trial/Subz', 'app'])
})

test('a transcript gone between listing and reading costs only that file', async () => {
  const stream = (text: string, code: number) => Object.assign((async function* () { yield { stream: 'stdout', text } })(), { result: Promise.resolve({ code }) })
  const entry = (name: string) => ({ name, kind: 'file', size: 1, mtimeMs: 1 })
  const io: ScanIo = {
    list: async dir => (dir === '/r' ? [{ name: 'p', kind: 'dir', size: 0, mtimeMs: 0 }] : dir === '/r/p' ? [entry('a.jsonl'), entry('gone.jsonl')] : []),
    read: async () => '{}',
    spawn: argv => {
      const paths = argv.slice(2)
      if (paths.includes('/r/p/gone.jsonl')) return stream('', 2)

      return stream('F\t/r/p/a.jsonl\t/w\t\t2026\t2026\t0\n', 0)
    },
  }
  expect(Object.keys(await scanFiles(io, '/r', {}))).toEqual(['/r/p/a.jsonl'])
})

const rowProject = (over: Partial<Project>): Project => ({
  root: '/w/app', name: 'app', isGit: true, isLive: false, lastAt: new Date(NOW - 30 * 86_400_000).toISOString(), sessions: 1,
  tokens: { input: 0, cacheWrite: 26_900_000, cacheRead: 0, output: 0 }, byModel: {}, week: 0, git: null, plans: [],
  percent: { kind: 'estimate', value: 62, at: 0, isStale: false, basis: '' }, estimate: null,
  leftOff: { title: '', prompt: '', reply: '', recap: 'Birleşik maini simülatörde uçtan uca QA etmek için cihazı hazırla ve akışları tek tek dene', tasks: [], at: '' },
  kinds: [], runs: [], ...over,
})

const textsOf = (source: string): { x: number; anchor: string; size: number; text: string }[] => [...source.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)].map(found => ({
  x: Number(/\bx="([\d.]+)"/.exec(found[1] ?? '')?.[1] ?? 0),
  anchor: /text-anchor="(\w+)"/.exec(found[1] ?? '')?.[1] ?? 'start',
  size: Number(/font-size="([\d.]+)"/.exec(found[1] ?? '')?.[1] ?? 0),
  text: found[2] ?? '',
}))

test('a row keeps its token count and age whole, whatever the age says', () => {
  for (const days of [3, 30, 365]) {
    const project = rowProject({ lastAt: new Date(NOW - days * 86_400_000).toISOString() })
    const { source } = rowPic(project, { width: 414, nowMs: NOW })
    expect(source).toContain(`· ${days} d ago`)
    expect(source).not.toMatch(/· [^<]*…<\/text>/)
  }
})

test('a row is one control tall, so one button lights all of it', () => {
  expect(rowPic(rowProject({}), { width: 414, nowMs: NOW }).height).toBe(28)
})

test('a long name stops short of the facts on its right', () => {
  const width = 300
  const { source } = rowPic(rowProject({ name: 'a-very-long-project-folder-name-that-would-run-into-the-number', isLive: true }), { width, nowMs: NOW })
  const [name, meta] = textsOf(source)
  expect(name?.text.endsWith('…')).toBe(true)
  expect((name?.x ?? 0) + sans(13, 560)(name?.text ?? '')).toBeLessThanOrEqual((meta?.x ?? 0) - mono(11)(meta?.text ?? ''))
})

test('a stale estimate reads dim, a fresh one bright', () => {
  const stale = rowPic(rowProject({ percent: { kind: 'estimate', value: 62, at: 0, isStale: true, basis: '' } }), { width: 414, nowMs: NOW }).source
  const fresh = rowPic(rowProject({}), { width: 414, nowMs: NOW }).source
  expect(stale).not.toBe(fresh)
})

test('a row spans the pane: 47 columns is the 424 px body less its slack', () => {
  expect(rowWidth(47)).toBe(414)
  expect(rowWidth(10)).toBe(240)
  expect(rowWidth(200)).toBe(640)
})

test('a snapshot older than the live window marks nobody live', () => {
  const snapshot: Snapshot = { at: NOW, projects: [rowProject({ isLive: true })], other: { folders: 0, tokens: 0 }, hidden: 0 }
  expect(withLiveNow(snapshot, NOW + LIVE_MS - 1).projects[0]?.isLive).toBe(true)
  expect(withLiveNow(snapshot, NOW + LIVE_MS).projects[0]?.isLive).toBe(false)
})

const NO_NUMBER = { kind: 'none', value: null, at: 0, isStale: false, basis: '' } as const

test('every colour a drawing names is one it declares, so nothing paints as nothing', () => {
  const live = rowProject({ isLive: true, percent: NO_NUMBER })
  const sources = [rowPic(live, { width: 414, nowMs: NOW }), rowPic(rowProject({}), { width: 414, nowMs: NOW }), bigPic(rowProject({}), 414), mapPic([live, rowProject({})], 414), mapPic([live], 414)].map(pic => pic.source)
  for (const source of sources) {
    for (const [, name] of source.matchAll(/var\(--([\w-]+)\)/g)) expect(source).toContain(`--${name}:`)
    for (const [, paint] of source.matchAll(/class="[^"]*\b[fs]-(\w+)/g)) expect(source).toContain(`--${paint}:`)
  }
})

const foundOf = (root: string, over: { isGit?: boolean; lastAt?: string; firstCommit?: string; plans?: PlanRow[]; sessions?: number } = {}): Found => ({
  grown: { root, name: root.split('/').at(-1) ?? '', isGit: over.isGit ?? true, isLive: false, lastAt: over.lastAt ?? '2026-11-01T00:00:00.000Z', sessions: over.sessions ?? 1, tokens: { input: 1, cacheWrite: 2, cacheRead: 3, output: 4 }, byModel: {}, week: 5, kinds: [], runs: [], newest: null },
  plans: over.plans ?? [],
  firstCommit: over.firstCommit ?? '',
})

test('two clones of one repository are one project, led by the one worked in last', () => {
  const joined = joinCopies([foundOf('/a/Satranc2', { firstCommit: 'abc' }), foundOf('/b/Satranç 2', { firstCommit: 'abc', lastAt: '2026-11-05T00:00:00.000Z', sessions: 2 })])
  expect(joined.length).toBe(1)
  const { grown } = joined[0] as Found
  expect(grown.root).toBe('/b/Satranç 2')
  expect(grown.also).toEqual(['/a/Satranc2'])
  expect(grown.sessions).toBe(3)
  expect(grown.tokens.output).toBe(8)
  expect(grown.week).toBe(10)
})

test('repositories that began apart stay apart, whatever their names', () => {
  expect(joinCopies([foundOf('/a/app', { firstCommit: 'one' }), foundOf('/b/app', { firstCommit: 'two' })]).length).toBe(2)
})

test('a plain copy joins the one repo of its name when they share a plan', () => {
  const shared: PlanRow = { path: 'docs/p.md', mtimeMs: 0, title: 'Switch', done: 0, total: 3, steps: [] }
  const repo = foundOf('/p/Subz', { firstCommit: 'abc', plans: [shared] })
  const copy = foundOf('/p/_trial/Subz', { isGit: false, plans: [{ ...shared, mtimeMs: 9 }], lastAt: '2026-11-05T00:00:00.000Z' })
  const joined = joinCopies([copy, repo])
  expect(joined.map(one => one.grown.root)).toEqual(['/p/Subz'])
  expect(joined[0]?.grown.also).toEqual(['/p/_trial/Subz'])
})

test('a same-named folder with no shared plan is a project of its own', () => {
  const repo = foundOf('/p/Subz', { firstCommit: 'abc', plans: [{ path: 'a.md', mtimeMs: 0, title: 'A', done: 0, total: 1, steps: [] }] })
  const other = foundOf('/x/Subz', { isGit: false, plans: [{ path: 'b.md', mtimeMs: 0, title: 'B', done: 0, total: 1, steps: [] }] })
  expect(joinCopies([repo, other]).length).toBe(2)
})

test('folders with no repo and no copy keep their own rows', () => {
  expect(joinCopies([foundOf('/a/one', { isGit: false }), foundOf('/a/two', { isGit: false })]).length).toBe(2)
})
