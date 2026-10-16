import { expect, test } from 'claude-code/testing'

import { WORDS } from '../hooks/words'
import { english, start } from './setup'

// Where "Move keys to .env" writes, and when the guard must not move anything at all.

// Built from pieces so this file never holds a literal that a scanner would take for a real key.
const ANT = ['sk', 'ant', 'api03', 'Zx9Qw7Er5Ty3Ui1Op8As6Df4Gh2Jk'].join('-')
const FAKE = ['sk', 'test', 'Zx9Qw7Er5Ty3Ui1Op8As6Df4Gh2Jk'].join('-')
const MOVE = WORDS.en.move(1)

test('a file in a worktree moves its key to the worktree root, not the session root', async ($, on) => {
  const setup = english(MOVE)
  setup.files['/work/.git'] = ''
  setup.files['/work/.claude/worktrees/wt/.git'] = 'gitdir: /work/.git/worktrees/wt\n'
  await start($, on, setup)

  const ran: any = await ($ as any).tool.call({ tool: 'Write', file_path: '/work/.claude/worktrees/wt/src/a.ts', content: `const k = "${ANT}"\n` })

  expect(setup.files['/work/.claude/worktrees/wt/.env']).toBe(`ANTHROPIC_API_KEY=${ANT}\n`)
  expect(setup.files['/work/.claude/worktrees/wt/.gitignore']).toBe('.env\n')
  expect(setup.files['/work/.env']).toBeUndefined()
  expect(ran.context?.[0]).toContain('/work/.claude/worktrees/wt/.env')
})

test('a file in a nested repository of its own gets that repository\'s .env', async ($, on) => {
  const setup = english(MOVE)
  setup.files['/elsewhere/app/.git'] = ''
  await start($, on, setup)

  await ($ as any).tool.call({ tool: 'Write', file_path: '/elsewhere/app/lib/a.ts', content: `const k = "${ANT}"\n` })

  expect(setup.files['/elsewhere/app/.env']).toBe(`ANTHROPIC_API_KEY=${ANT}\n`)
  expect(setup.files['/work/.env']).toBeUndefined()
})

test('a subagent\'s write is denied with the reason, never moved, and nobody is asked', async ($, on) => {
  const setup = english(MOVE)
  setup.files['/work/.git'] = ''
  await start($, on, setup)

  const denied: any = await ($ as any).tool.call({ tool: 'Write', file_path: '/work/src/a.ts', content: `const k = "${ANT}"\n`, agentId: 'agent-1' })

  expect(denied.deny).toMatch(/nobody can answer/)
  expect(denied.deny).not.toContain(ANT)
  expect(setup.asked.filter(line => !line.startsWith('LOG'))).toEqual([])
  expect(setup.files['/work/.env']).toBeUndefined()
  expect(setup.ran).toHaveLength(0)
})

test('a -p run with nothing drawing is denied the same way', async ($, on) => {
  const setup = { ...english(MOVE), surfaces: [] }
  await start($, on, setup)

  const denied: any = await ($ as any).tool.call({ tool: 'Write', file_path: '/work/src/a.ts', content: `const k = "${ANT}"\n` })

  expect(denied.deny).toMatch(/nobody can answer/)
  expect(setup.files['/work/.env']).toBeUndefined()
})

test('a fake key in a test file passes; a real-looking one there is left to Claude, not moved', async ($, on) => {
  const setup = english(MOVE)
  setup.files['/work/.git'] = ''
  await start($, on, setup)

  await ($ as any).tool.call({ tool: 'Write', file_path: '/work/tests/client.test.ts', content: `const k = "${FAKE}"\n` })
  expect(setup.ran).toHaveLength(1)

  const denied: any = await ($ as any).tool.call({ tool: 'Write', file_path: '/work/tests/client.test.ts', content: `const k = "${ANT}"\n` })
  expect(denied.deny).toMatch(/Move each secret/)
  expect(setup.files['/work/.env']).toBeUndefined()
})
