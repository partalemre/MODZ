import { expect, test } from 'claude-code/testing'

import { BUILD_SCAN, EN, mountBand, pass, start, stub, world } from './world'

// Measuring decides: a command that would lose something is held and says what; one that
// would lose nothing runs with no card; a call nobody can answer is refused at once.

const call = ($: any, command: string, more: Record<string, unknown> = {}) => $.tool.call({ tool: 'Bash', command, ...more })

/** Holds until the card shows, reads it, presses Keep my work and returns the card's text and the refusal. */
async function heldCard($: any, w: any, command: string): Promise<{ drawn: string; deny: string }> {
  const pending = call($, command)
  await pass(w, 0)
  const ui = await mountBand($, 'desktop')
  const drawn = JSON.stringify(await ui.drawn())
  await ui.press({ key: 'cancel' })
  await pass(w)
  await ui.unmount()

  return { drawn, deny: ((await pending) as any).deny }
}

const LOG_TWO = 'a1b2c3d add the parser\ne4f5a6b fix the parser\n'

test('reset --hard to an older ref on a clean tree counts the commits it drops and holds', async ($, on) => {
  const w = world({ ...EN, answers: { 'git log --oneline --no-decorate origin/main..HEAD': LOG_TWO, 'git rev-parse --abbrev-ref HEAD': 'main\n' } })
  stub(on, w)
  await start($, w)
  const { drawn, deny } = await heldCard($, w, 'git reset --hard origin/main')

  expect(drawn).toContain('This would drop 2 commits from main.')
  expect(drawn).toContain('add the parser')
  expect(deny).toMatch(/move main back to origin\/main, dropping 2 commits/)
  expect(w.ran).toHaveLength(0)
})

test('what loses nothing runs with no card: a dry run, an even reset, ignored build output, a plain switch', async ($, on) => {
  const w = world({ ...EN, answers: { 'git check-ignore -- node_modules': 'node_modules\n' } })
  stub(on, w)
  await start($, w)
  for (const command of ['git clean -n', 'git reset --hard origin/main', 'rm -rf node_modules', 'git checkout main', 'git stash drop', 'git branch -D old', 'echo hi > notes.md', 'find . -name "*.pyc" -delete']) {
    expect([command, ((await call($, command)) as any)?.deny]).toEqual([command, undefined])
  }

  expect(w.ran).toHaveLength(8)
  expect(w.toasts).toEqual([])
})

test('rm -rf node_modules that git does not ignore is held like any delete', async ($, on) => {
  const w = world({ ...EN, answers: { files: BUILD_SCAN } })
  stub(on, w)
  await start($, w)

  expect((await heldCard($, w, 'rm -rf node_modules')).drawn).toContain('This would delete 9 files')
})

test('a write over a file git cannot bring back is held and names it; one git has unchanged runs', async ($, on) => {
  const w = world({ ...EN, answers: { writes: 'P\t2048\tother\tnotes.md\n' } })
  stub(on, w)
  await start($, w)
  const { drawn, deny } = await heldCard($, w, 'echo hi > notes.md')

  expect(drawn).toContain('This would write over 1 file (2.0 KB) whose contents git can\'t bring back.')
  expect(deny).toMatch(/overwrite 1 file git can't bring back: notes.md/)
  w.answers.writes = 'P\t2048\tclean\tnotes.md\n'
  expect(((await call($, 'cp other.md notes.md')) as any)?.deny).toBeUndefined()
})

test('a later risky part is measured when an earlier one would lose nothing', async ($, on) => {
  const w = world({ ...EN, answers: { files: BUILD_SCAN } })
  stub(on, w)
  await start($, w)

  expect((await heldCard($, w, 'git checkout main && rm -rf build')).deny).toMatch(/delete 9 files/)
})

test('stash drop, find -delete and a database statement say what they would lose', async ($, on) => {
  const w = world({
    ...EN,
    answers: { 'git stash list': 'stash@{0}: WIP on main: 1a2b half-done login\n', 'find . -name *.pyc -print': './a.pyc\n./b.pyc\n' },
  })
  stub(on, w)
  await start($, w)

  expect((await heldCard($, w, 'git stash drop')).drawn).toContain('half-done login')
  expect((await heldCard($, w, 'find . -name "*.pyc" -delete')).deny).toMatch(/delete 2 paths find matches/)
  expect((await heldCard($, w, 'psql -c "DROP TABLE users"')).drawn).toContain('This runs DROP TABLE users on a database.')
})

test('a subagent\'s risky call is refused at once, naming the command and why; a harmless one runs', async ($, on) => {
  const w = world({ ...EN, answers: { files: BUILD_SCAN } })
  stub(on, w)
  await start($, w)
  const result: any = await call($, 'rm -rf build', { agentId: 'agent-1' })

  expect(result.deny).toMatch(/refused this command without running it: it came from a subagent.*Command: rm -rf build\. It would have: delete 9 files/)
  expect(w.ran).toHaveLength(0)
  w.answers = {}
  expect(((await call($, 'rm -rf build', { agentId: 'agent-1' })) as any)?.deny).toBeUndefined()
  expect(w.ran).toHaveLength(1)
})

test('a run with no screen (claude -p) refuses a risky command at once', async ($, on) => {
  const w = world({ ...EN, surfaces: [], answers: { files: BUILD_SCAN } })
  stub(on, w)
  await start($, w)
  const result: any = await call($, 'bash -c "rm -rf build"')

  expect(result.deny).toMatch(/no screen \(claude -p\).*Command: bash -c "rm -rf build"/)
  expect(w.ran).toHaveLength(0)
})
