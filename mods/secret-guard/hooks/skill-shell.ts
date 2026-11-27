import { atom, read } from 'claude-code'
import type { Register } from 'claude-code'

import { failedDeny, unattendedDeny } from './findings'
import type { Found } from './findings'
import { gitSteps, scanStep } from './git'
import { gitHost } from './git-host'

// A skill's injected shell command (`!`git push`` in a SKILL.md, Claude Code 2.1.332+) fires no PreToolUse, so
// the git scan of a Bash call runs here too. It is heard through `classic.*` and picked out by name: an engine
// before 2.1.332 refuses the event's own name and would unload the whole guard. It can only refuse, as a skill
// can't wait for the card, and it refuses when the scan itself fails.

type On = Parameters<Register>[0]

const EVENT = 'PreSkillShellCommand'
// The same session value register.tsx's /secret-guard turns off.
const enabledAtom = atom({ plugin: 'secret-guard', key: 'isEnabled' } as const, true)

/** The git command an injected skill command would run, or null for any other classic event or command. */
export function skillGitCommand(e: unknown): string | null {
  const input = e as { hook_event_name?: unknown; tool_input?: { command?: unknown } }
  const command = input.hook_event_name === EVENT ? input.tool_input?.command : undefined

  return typeof command === 'string' && gitSteps(command).length > 0 ? command : null
}

export function hookSkillShell(on: On): void {
  on('classic.*', async ($, e, next) => {
    const command = skillGitCommand(e)
    if (command === null || !(await read($, enabledAtom))) return next(e)
    const found: Found = { secrets: [], envFiles: [], path: null, command }
    const host = gitHost($, (await $.session.cwd().catch(() => '')) || '')
    for (const step of gitSteps(command)) await scanStep(host, step, found)
    if (found.secrets.length + found.envFiles.length === 0) return next(e)

    return { block: unattendedDeny({ ...found, envFiles: [...new Set(found.envFiles)] }) } as never
  }).catch(($, e, next) => {
    if (next.called || skillGitCommand(e) === null) return next(e)

    return { block: failedDeny(next.error.message ?? next.error.kind) } as never
  })
}
