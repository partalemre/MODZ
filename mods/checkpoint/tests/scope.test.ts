import { expect, test } from 'claude-code/testing'

import { isReadOnly } from '../hooks/bash'
import { list, locate, prune, snapshot } from '../hooks/git'
import type { Run } from '../hooks/git'
import { keyOf, scopeOf } from '../hooks/key'
import { fakeFor, newFake, ok, paneOf, stub } from './stubs'
import type { Fake } from './stubs'

// Whose checkpoints a pane offers, what an undo brings back beside the files, and which calls take a snapshot.

const runOf = (fake: Fake): Run => async (argv, init) => fakeFor(fake)([...argv], init as never)
const lines = (fake: Fake) => fake.calls.map(call => call.argv.join(' '))
const PROMPT = { context: [], wait: false, origin: { kind: 'composer' } }
const commits = (fake: Fake) => lines(fake).filter(line => line.startsWith('git commit-tree') && !line.includes('checkpoint index'))

// for-each-ref as git answers it: only the refs under the prefix asked for.
function refsRun(refs: string[]): { run: Run; deleted: string[] } {
  const deleted: string[] = []
  const run: Run = async (argv, init) => {
    if (argv.includes('for-each-ref')) {
      const prefix = argv.at(-1) ?? ''

      return ok(refs.filter(ref => ref.startsWith(prefix)).map((ref, i) => `${ref}\tc${i}\t${1000 - i}\tturn`).join('\n'))
    }
    if (argv.includes('--stdin')) deleted.push(...String((init as { stdin?: string }).stdin ?? '').split('\n').filter(Boolean))

    return ok()
  }

  return { run, deleted }
}

test('a worktree lists only its own session\'s checkpoints, never another worktree\'s or the old unscoped ones', async () => {
  const mine = scopeOf('/w/.claude/worktrees/b', 'sess-1')
  const theirs = scopeOf('/w', 'sess-1')
  const { run } = refsRun([`${theirs}1`, `${mine}2`, 'refs/checkpoints/sess-1/3', `${scopeOf('/w/.claude/worktrees/b', 'sess-2')}4`])
  const repo = { root: '/w/.claude/worktrees/b', gitDir: '/w/.git/worktrees/b', isShadow: false, bin: 'git', scope: mine }

  expect((await list(run, repo)).map(entry => entry.ref)).toEqual([`${mine}2`])
})

test('30 are kept per session, so a busy session never prunes another\'s', async () => {
  const mine = scopeOf('/w', 'sess-1')
  const other = scopeOf('/w', 'sess-2')
  const refs = [...Array.from({ length: 33 }, (_, i) => `${mine}${i}`), ...Array.from({ length: 5 }, (_, i) => `${other}${i}`)]
  const { run, deleted } = refsRun(refs)

  expect(await prune(run, { root: '/w', gitDir: '/w/.git', isShadow: false, bin: 'git', scope: mine })).toHaveLength(30)
  expect(deleted).toEqual([`delete ${mine}30`, `delete ${mine}31`, `delete ${mine}32`])
})

test('shadow repos of /a/b-c and /a/b/c do not share a name, and skip node_modules', async () => {
  expect(keyOf('/a/b-c')).not.toBe(keyOf('/a/b/c'))
  const fake = newFake({ isRepo: false })
  const repo = await locate(runOf(fake), { cwd: '/Users/x/notes', home: '/Users/x', bin: 'git' })
  expect(repo?.gitDir).toBe(`/Users/x/.cache/claude-checkpoint/${keyOf('/Users/x/notes')}.git`)
  const exclude = fake.calls.find(call => call.argv.at(-1) === `${repo?.gitDir}/info/exclude`)
  expect(exclude?.stdin?.split('\n')).toContain('node_modules/')
})

test('a snapshot keeps the staging area and HEAD; undo puts the staging area back', async () => {
  const fake = newFake()
  const run = runOf(fake)
  await snapshot(run, { root: '/w', gitDir: '/w/.git', isShadow: false, bin: 'git', scope: scopeOf('/w', 's') }, { ref: '1', label: 'fix' })
  // The staging area is read from the private copy, before anything is added to it.
  const staged = fake.calls.findIndex(call => call.argv[1] === 'write-tree')
  expect(fake.calls[staged]?.env.GIT_INDEX_FILE).toBe('/w/.git/checkpoint.index')
  expect(staged).toBeLessThan(fake.calls.findIndex(call => call.argv[1] === 'add'))
  const commit = fake.calls.find(call => call.argv.includes('fix'))!.argv.join(' ')
  expect(commit).toContain('-p head1 -p commit1')
  expect(commit).toContain('Checkpoint-Head: head1\nCheckpoint-Index: tree1')
})

async function confirmUndo($: any, on: any, fake: Fake) {
  stub(on, fake)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })
  await $.command.run({ command: 'checkpoints', args: '' })
  const pane = await $.ui.mount(paneOf('terminal'))
  await pane.press({ key: 'cp-undo-0' })

  return pane
}

const textOf = (tree: any): string => (typeof tree === 'string' ? tree : Array.isArray(tree) ? tree.map(textOf).join('\n') : (tree?.children ?? []).map(textOf).join(''))

test('the card says when commits were made since, and that ignored files stay; undo unstages', async ($: any, on: any) => {
  const fake = newFake({ refs: `${scopeOf('/w', 'sess-1')}1\tc1\t100\tfix login`, diff: 'M\0a.ts\0', body: 'fix login\n\nCheckpoint-Head: aaa111\nCheckpoint-Index: bbb222\n', ahead: '2' })
  const pane = await confirmUndo($, on, fake)
  const card = textOf(await pane.drawn())
  expect(card).toContain('sonraki 2 kayıt (commit) geçmişte kalır')
  expect(card).toContain('.env gibi')
  expect(lines(fake)).toContain('git rev-list --count aaa111..HEAD')

  await pane.press({ key: 'cp-confirm' })
  const all = lines(fake)
  expect(all.indexOf('git read-tree bbb222')).toBeGreaterThan(all.indexOf('git restore --source=c1 --worktree -- :(literal)a.ts'))
})

test('a turn that only stages files still has something to undo', async ($: any, on: any) => {
  const fake = newFake({ refs: `${scopeOf('/w', 'sess-1')}1\tc1\t100\tstage`, diff: '', body: 'stage\n\nCheckpoint-Index: bbb222\n' })
  const pane = await confirmUndo($, on, fake)
  expect(textOf(await pane.drawn())).toContain('eski haline döner')
})

test('a Bash call that may write takes the turn\'s snapshot; a read-only one does not', async ($: any, on: any) => {
  const fake = newFake()
  stub(on, fake)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })

  await $.prompt.submit({ text: 'look', ...PROMPT })
  await $.tool.call({ tool: 'Bash', command: 'git status && ls -la | head -5 2>/dev/null' })
  expect(commits(fake)).toHaveLength(0)
  await $.prompt.submit({ text: 'rename', ...PROMPT })
  await $.tool.call({ tool: 'Bash', command: "sed -i '' 's/a/b/' src/a.ts" })
  await $.tool.call({ tool: 'Bash', command: 'rm old.ts' })
  expect(commits(fake)).toHaveLength(1)
  expect(lines(fake).some(line => line.startsWith(`git update-ref ${scopeOf('/w', 'sess-1')}`))).toBe(true)
})

test('read-only Bash is told from writing Bash', () => {
  for (const command of ['ls', 'git log --oneline | head', 'rg foo src', 'cat a.ts > /dev/null', 'find . -name "*.ts"']) expect([command, isReadOnly(command)]).toEqual([command, true])
  for (const command of ['rm a.ts', 'echo x > a.ts', 'sed -i s/a/b/ a.ts', 'npm run gen', 'git checkout -- .', 'find . -delete', 'cat a >> b']) expect([command, isReadOnly(command)]).toEqual([command, false])
})
