import { expect, test } from 'claude-code/testing'

import { gitSteps } from '../hooks/git'
import { skillGitCommand } from '../hooks/skill-shell'
import { english, start } from './setup'

// /ship stages, commits and pushes on its own: the contents of what it sends are scanned, not just the file names.

// Joined at run time, so no file here holds a literal a push-protection scanner would take for a key.
const KEY = ['sk', 'live', 'Zx9Qw7Er5Ty3Ui1Op8As6Df4'].join('_')
const STAGED = `+++ b/src/pay.ts\n@@ -0,0 +1 @@\n+const stripe = "${KEY}"\n`
const UNPUSHED = 'log -p -U0 --no-color --format= HEAD --not --remotes --max-count=200'

test('the add, commit and push /ship runs in one line are caught on the staged file with a key', async ($, on) => {
  const setup = english('Cancel')
  setup.git['add -n -A'] = "add 'src/pay.ts'\n"
  setup.files['/work/src/pay.ts'] = `const stripe = "${KEY}"\n`
  await start($, on, setup)

  const denied: any = await ($ as any).tool.call({ tool: 'Bash', command: 'git add -A && git commit -m "ship" && git push -u origin feature/pay' })

  expect(denied.deny).toMatch(/blocked this call/)
  expect(denied.deny).not.toContain(KEY)
  expect(setup.ran).toHaveLength(0)
})

test('a commit of a staged key is caught, and so is a push of a commit that already holds one', async ($, on) => {
  const setup = english('Cancel')
  setup.git['diff --cached -U0 --no-color'] = STAGED
  await start($, on, setup)
  expect(((await ($ as any).tool.call({ tool: 'Bash', command: 'git commit -m "pay"' })) as any).deny).toMatch(/blocked this call/)

  delete setup.git['diff --cached -U0 --no-color']
  setup.git[UNPUSHED] = `diff --git a/src/pay.ts b/src/pay.ts\n${STAGED}`
  const pushed: any = await ($ as any).tool.call({ tool: 'Bash', command: 'git push' })

  expect(pushed.deny).toMatch(/blocked this call/)
  expect(setup.cards.at(-1)?.[0]).toBe('Leak blocked · git push')
  expect(setup.ran).toHaveLength(0)
})

test('a push of clean commits runs; one that sends an env file is held', async ($, on) => {
  const setup = english('Cancel')
  setup.git[UNPUSHED] = '+++ b/src/a.ts\n+const a = 1\n'
  await start($, on, setup)
  expect(((await ($ as any).tool.call({ tool: 'Bash', command: 'git push origin main' })) as any).deny).toBeUndefined()

  setup.git['log --name-only --format= HEAD --not --remotes --max-count=200'] = '.env.local\n'
  expect(((await ($ as any).tool.call({ tool: 'Bash', command: 'git -C . push' })) as any).deny).toMatch(/blocked this call/)
})

test('a push whose history git prints past the engine\'s cap is refused, not passed unread', async ($, on) => {
  const setup = { ...english('Cancel'), truncated: [UNPUSHED] }
  setup.git[UNPUSHED] = '+++ b/a.ts\n+const a = 1\n'
  await start($, on, setup)

  const pushed: any = await ($ as any).tool.call({ tool: 'Bash', command: 'git push' })

  expect(pushed.deny).toMatch(/secret-guard could not check/)
  expect(setup.ran).toHaveLength(0)
})

test('an injected skill command that pushes a key is refused without a card', async ($, on) => {
  // The event exists from Claude Code 2.1.332; an older engine raises none, so there is nothing to check there.
  if (typeof ($ as any).classic?.PreSkillShellCommand !== 'function') return
  const setup = english('Cancel')
  setup.git[UNPUSHED] = STAGED
  // The engine beneath: the command runs.
  ;(on as any)('classic.PreSkillShellCommand', () => ({}))
  await start($, on, setup)

  const pushed: any = await ($ as any).classic.PreSkillShellCommand({ tool_name: 'Bash', tool_input: { command: 'git push' } })
  const status: any = await ($ as any).classic.PreSkillShellCommand({ tool_name: 'Bash', tool_input: { command: 'git status' } })

  expect(pushed.block).toMatch(/secret-guard blocked this call/)
  expect(pushed.block).not.toContain(KEY)
  expect(status.block).toBeUndefined()
  expect(setup.asked.filter(line => !line.startsWith('LOG'))).toHaveLength(0)
})

test('push is read as a git step; only a skill command that runs git is scanned', () => {
  expect(gitSteps('git -C repo push -u origin main')).toEqual([{ kind: 'push', cwd: 'repo' }])
  expect(skillGitCommand({ hook_event_name: 'PreSkillShellCommand', tool_input: { command: 'git push' } })).toBe('git push')
  expect(skillGitCommand({ hook_event_name: 'PreSkillShellCommand', tool_input: { command: 'ls' } })).toBeNull()
  expect(skillGitCommand({ hook_event_name: 'Stop' })).toBeNull()
})
