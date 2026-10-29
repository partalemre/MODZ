import { expect, mock, test } from 'claude-code/testing'

import { gitBinary, list, locate, parseNameStatus, parseNumstat, prune, snapshot } from '../hooks/git'
import { markUndone, pendingOf } from '../hooks/meta'
import { setLang } from '../hooks/lang'
import { diffstatSvg } from '../hooks/pane-svg'
import type { Run } from '../hooks/git'
import { fakeFor, newFake, ok, paneOf, stub } from './stubs'
import type { Fake } from './stubs'

const runOf = (fake: Fake): Run => async (argv, init) => fakeFor(fake)([...argv], init as never)
const lines = (fake: Fake) => fake.calls.map(call => call.argv.join(' '))

test('a snapshot goes through a private index and a checkpoint ref, never the real index or branch', async () => {
  const fake = newFake({ big: './assets/video.mp4\n' })
  const run = runOf(fake)
  const repo = await locate(run, { cwd: '/w/sub', home: '/Users/x', bin: 'git' })
  expect(repo).toEqual({ root: '/w', gitDir: '/w/.git', isShadow: false, bin: 'git' })

  await snapshot(run, repo!, { ref: 's1/100', label: 'fix the bug' })
  const add = fake.calls.find(call => call.argv[1] === 'add')!
  expect(add.env.GIT_INDEX_FILE).toBe('/w/.git/checkpoint.index')
  expect(add.argv).toContain(':(exclude,literal)assets/video.mp4')
  expect(fake.calls.find(call => call.argv[1] === 'write-tree')!.env.GIT_INDEX_FILE).toBe('/w/.git/checkpoint.index')
  expect(lines(fake)).toContain('git commit-tree tree1 -p head1 -m fix the bug')
  expect(lines(fake)).toContain('git update-ref refs/checkpoints/s1/100 commit1')
  const touchesBranch = lines(fake).some(line => /git (checkout|reset|stash|commit |branch|switch)/.test(line))
  expect(touchesBranch).toBe(false)
})

test('a folder that is not a repo gets a shadow repo, but never the home folder', async () => {
  const fake = newFake({ isRepo: false })
  const run = runOf(fake)
  const repo = await locate(run, { cwd: '/Users/x/notes', home: '/Users/x', bin: 'git' })
  expect(repo).toEqual({ root: '/Users/x/notes', gitDir: '/Users/x/.cache/claude-checkpoint/Users-x-notes.git', isShadow: true, bin: 'git' })
  expect(lines(fake).some(line => line.startsWith('git init -q --bare'))).toBe(true)

  expect(await locate(run, { cwd: '/Users/x', home: '/Users/x', bin: 'git' })).toBeNull()
})

test('only the newest 30 checkpoint refs are kept; a shadow repo is also asked to gc', async () => {
  const refs = Array.from({ length: 33 }, (_, i) => `refs/checkpoints/s/${i}\tc${i}\t${1000 - i}\tturn ${i}`).join('\n')
  const fake = newFake({ refs })
  const run = runOf(fake)
  const repo = { root: '/w', gitDir: '/w/.git', isShadow: false, bin: 'git' }

  expect((await list(run, repo))[0]).toEqual({ ref: 'refs/checkpoints/s/0', commit: 'c0', at: 1_000_000, label: 'turn 0' })
  expect(await prune(run, repo)).toHaveLength(30)
  const stdin = fake.calls.find(call => call.argv.includes('--stdin'))!.stdin
  expect(stdin).toBe('delete refs/checkpoints/s/30\ndelete refs/checkpoints/s/31\ndelete refs/checkpoints/s/32\n')
  expect(lines(fake).some(line => line.includes(' gc '))).toBe(false)

  await prune(run, { ...repo, gitDir: '/c/w.git', isShadow: true })
  expect(lines(fake).at(-1)).toBe('git --git-dir=/c/w.git --work-tree=/w gc --auto --quiet')
})

test('a broken git (the macOS Xcode-license shim) falls back to the Command Line Tools git', async () => {
  const tried: string[] = []
  const run: Run = async argv => {
    tried.push(argv[0] ?? '')

    return ok('', argv[0] === 'git' ? 69 : 0)
  }
  expect(await gitBinary(run, '/w')).toBe('/Library/Developer/CommandLineTools/usr/bin/git')
  expect(tried).toEqual(['git', '/Library/Developer/CommandLineTools/usr/bin/git'])
})

test('a diff splits into files to restore and files made since', () => {
  expect(parseNameStatus('M\0a.ts\0A\0new.ts\0D\0gone.ts\0')).toEqual({ restore: ['a.ts', 'gone.ts'], remove: ['new.ts'] })
})

const PROMPT = { context: [], wait: false, origin: { kind: 'composer' } }
const commits = (fake: Fake) => lines(fake).filter(line => line.startsWith('git commit-tree'))
const SURFACES = ['terminal', 'desktop'] as const

test('the first write of a turn takes one snapshot; later writes and other tools do not', async ($: any, on: any) => {
  const fake = newFake()
  stub(on, fake)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })

  await $.tool.call({ tool: 'Write', file_path: '/w/a.ts', content: 'x' })
  expect(commits(fake)).toHaveLength(0)
  await $.prompt.submit({ text: 'add a feature\nmore', ...PROMPT })
  await $.tool.call({ tool: 'Read', file_path: '/w/a.ts' })
  await $.tool.call({ tool: 'Edit', file_path: '/w/a.ts', old_string: 'x', new_string: 'y' })
  await $.tool.call({ tool: 'Write', file_path: '/w/b.ts', content: 'z' })
  expect(commits(fake)).toEqual(['git commit-tree tree1 -p head1 -m add a feature'])
})

test('zero tokens: the prompt, tool results and commands reach the model untouched, and no row is appended', async ($: any, on: any) => {
  const fake = newFake()
  // mock.session is newer than the shared _types this tsconfig reads.
  const session = (mock as any).session(on)
  const seen: any[] = []
  stub(on, fake, { seen })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })

  const prompt = { text: 'fix it', ...PROMPT }
  expect(await $.prompt.submit(prompt)).toEqual({ text: 'fix it' })
  const write = { tool: 'Write', file_path: '/w/a.ts', content: 'x' }
  expect(await $.tool.call(write)).toMatchObject({ result: 'written' })
  expect(seen).toEqual([expect.objectContaining(prompt), expect.objectContaining(write)])
  expect(seen[0].context).toEqual([])
  for (const args of ['', 'off']) {
    const out = await $.command.run({ command: args === '' ? 'checkpoints' : 'checkpoint', args })
    expect(out?.text).toBeUndefined()
    expect(out?.context).toBeUndefined()
  }
  expect(session.appended()).toEqual([])
})

test('/checkpoint off stops snapshots and says so in a toast, not the transcript', async ($: any, on: any) => {
  const fake = newFake()
  stub(on, fake)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })

  await $.command.run({ command: 'checkpoint', args: '' })
  expect(fake.asked).toEqual(['toast:checkpoint kapalı'])
  await $.prompt.submit({ text: 'go', ...PROMPT })
  await $.tool.call({ tool: 'Write', file_path: '/w/a.ts', content: 'x' })
  expect(commits(fake)).toHaveLength(0)
})

async function openPane($: any, on: any, spec: { fake: Fake; surface: string }) {
  stub(on, spec.fake)
  await $.session.start({ surface: spec.surface, isInteractive: true, cwd: '/w' })
  await $.command.run({ command: 'checkpoints', args: '' })

  return $.ui.mount(paneOf(spec.surface))
}

const ONE = { refs: 'refs/checkpoints/s/1\tc1\t100\tfix login', diff: 'M\0a.ts\0A\0new.ts\0' }

// Every Svg alt in a drawn tree, joined with what Texts show: what a person reads on the surface.
function shownOf(tree: any): string[] {
  if (tree === null || typeof tree !== 'object') return typeof tree === 'string' ? [tree] : []
  if (Array.isArray(tree)) return tree.flatMap(shownOf)
  const own = tree.type === 'Svg' ? [String(tree.props?.alt ?? '')] : []

  return [...own, ...shownOf(tree.children ?? tree.props?.children ?? [])]
}
const shown = async (ui: any) => shownOf(await ui.drawn()).join('\n')

for (const surface of SURFACES) {
  test(`${surface}: the pane lists turns; Geri al shows the confirm card, Vazgeç changes nothing`, async ($: any, on: any) => {
    const fake = newFake({ ...ONE, numstat: '12\t3\ta.ts\0' + '0\t20\tnew.ts\0' })
    const pane = await openPane($, on, { fake, surface })
    expect(await shown(pane)).toContain('Kontrol noktaları')
    expect(await shown(pane)).toMatch(/1 kayıt · en yenisi /)
    expect(await shown(pane)).toContain('fix login')

    await pane.press({ key: 'cp-undo-0' })
    const card = await shown(pane)
    expect(card).toContain('"fix login" öncesine dönülsün mü? 2 dosya değişecek')
    expect(((await pane.find({ key: 'cp-confirm' })) as any)?.props.label).toBe('2 dosyayı geri al')
    expect(((await pane.find({ key: 'cp-cancel' })) as any)?.props.autoFocus).toBe(true)
    expect(card).toMatch(/\+12\s*−23/)
    expect(card).toMatch(/new\.ts/)
    expect(await pane.find({ key: 'cp-undo-0' })).toBeUndefined()

    await pane.press({ key: 'cp-cancel' })
    expect(await pane.find({ key: 'cp-undo-0' })).toBeDefined()
    expect(lines(fake).some(line => line.includes('restore') || line.startsWith('rm -f --'))).toBe(false)
  })

  test(`${surface}: confirming takes a safety snapshot, then restores and removes files`, async ($: any, on: any) => {
    const fake = newFake(ONE)
    const pane = await openPane($, on, { fake, surface })

    await pane.press({ key: 'cp-undo-0' })
    await pane.press({ key: 'cp-confirm' })
    const all = lines(fake)
    const safety = all.findIndex(line => line.includes('-m geri almadan önce: fix login'))
    const restore = all.indexOf('git restore --source=c1 --worktree -- :(literal)a.ts')
    expect(safety).toBeGreaterThan(-1)
    expect(restore).toBeGreaterThan(safety)
    expect(all).toContain('rm -f -- /w/new.ts')
    expect(await pane.find({ type: 'Text', text: '2 dosya "fix login" öncesine döndü.' })).toBeDefined()
    expect(await pane.find({ type: 'Text', text: '✓' })).toBeDefined()
    expect(await pane.find({ key: 'cp-redo' })).toBeDefined()
  })
}

test('a turn is numbered and keeps its files and tools; undo marks it and later turns undone', async ($: any, on: any) => {
  const fake = newFake({ diff: 'M\0a.ts\0' })
  const stored: Record<string, unknown> = {}
  stub(on, fake, { stored })
  on('turn.complete', (_: any, e: any) => ({ text: e.answer }))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/w' })

  await $.prompt.submit({ text: 'first', ...PROMPT })
  await $.prompt.submit({ text: 'second', ...PROMPT })
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  await $.tool.call({ tool: 'Edit', file_path: '/w/a.ts', old_string: 'x', new_string: 'y' })
  await $.tool.call({ tool: 'Write', file_path: '/w/b.ts', content: 'z' })
  await $.turn.complete({ answer: 'ok', durationMs: 1, isAborted: false, turnId: 't', reason: 'answer' })
  const meta = stored['checkpoint.meta'] as Record<string, any>
  expect(Object.values(meta)).toEqual([{ turn: 2, files: 2, tools: ['E', 'W', '$'] }])
})

test('undo bookkeeping and git numstat', () => {
  const entries = [1, 2, 3].map(at => ({ ref: `r${at}`, commit: `c${at}`, at, label: `t${at}` }))
  const out = markUndone({ r1: { turn: 1 }, r2: { turn: 2 } }, { entries: [...entries, { ref: 's', commit: 'cs', at: 4, label: 'x' }], target: entries[1]!, safetyRef: 's' })
  expect(out).toEqual({ r1: { turn: 1, isUndone: false }, r2: { turn: 2, isUndone: true }, r3: { isUndone: true }, s: { isSafety: true } })
  expect(parseNumstat('3\t1\ta.ts\0-\t-\timg.png\0')).toEqual([{ path: 'a.ts', added: 3, removed: 1 }, { path: 'img.png', added: 0, removed: 0 }])
})

for (const surface of SURFACES) {
  test(`${surface}: an empty project says how checkpoints are made`, async ($: any, on: any) => {
    const pane = await openPane($, on, { fake: newFake(), surface })
    expect(await shown(pane)).toContain('Henüz kontrol noktası yok · ilk dosya yazımından önce sessizce alınır')
  })
}

test('the desktop card counts the files it has no row for, as the terminal card does', () => {
  setLang('tr')
  const paths = Array.from({ length: 7 }, (_, i) => `src/f${i}.ts`)
  const entry = { ref: 'r', commit: 'c', at: 1, label: 'x' }
  const pending = pendingOf(entry, { changes: { restore: paths, remove: [] }, stats: paths.map(path => ({ path, added: 1, removed: 0 })), turn: 3 })
  const drawn = diffstatSvg({ width: 400, mode: 'dark' }, pending)
  expect(drawn.source).toContain('+2 dosya daha')
  expect(drawn.alt).toMatch(/\+2 dosya daha$/)
})
