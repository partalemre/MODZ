import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { cardTree } from './card'

const RUN_IT = 'Run it'
const REFUSE = 'Refuse'
const PROTECTED_BRANCH = /^(main|master)$/
const PUSH = /\bgit\s+push\b/
const CELL_PIXELS = 7.6
const DEFAULT_COLUMNS = 100
const CARD_MAX_WIDTH = 620
const CARD_GUTTER = 48

const RISKS: { reason: string; pattern: RegExp }[] = [
  {
    reason: 'force push',
    pattern: /\bgit\s+push\b[^\n;&|]*\s(--force(-with-lease)?|-[a-zA-Z]*f[a-zA-Z]*)(\s|$)/,
  },
  {
    reason: 'push to main',
    pattern: /\bgit\s+push\b[^\n;&|]*[\s:](main|master)(?=\s|$)/,
  },
  { reason: 'hard reset', pattern: /\bgit\s+reset\b[^\n;&|]*--hard\b/ },
  { reason: 'git clean -f', pattern: /\bgit\s+clean\b[^\n;&|]*\s-[a-zA-Z]*f/ },
  { reason: 'recursive delete', pattern: /\brm\s+(-[a-zA-Z]*[rR][a-zA-Z]*|--recursive)\b/ },
]

const pendingAtom = atom({ plugin: 'git-guard', key: 'pending' } as const, null)

const flags = { theme: 'auto' as 'light' | 'dark' | 'auto' }

function risksOf(command: string): string[] {
  return RISKS.filter(risk => risk.pattern.test(command)).map(risk => risk.reason)
}

function themeOf(value: unknown): 'light' | 'dark' | 'auto' {
  const text = String(value ?? '').toLowerCase()
  if (text.includes('light')) return 'light'
  if (text.includes('dark')) return 'dark'

  return 'auto'
}

async function currentBranch($: EngineInterface): Promise<string | null> {
  try {
    const branch = await $.process.run(['git', 'branch', '--show-current'])

    return branch.exitCode === 0 ? branch.stdout.trim() : null
  } catch {
    $.ui.log('git-guard: could not read the current branch')

    return null
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    flags.theme = themeOf((await $.config.list()).find(row => row.key === 'theme')?.value)

    return next(e)
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const risks = risksOf(e.command)
    const isPush = PUSH.test(e.command)
    const branch = isPush || risks.length > 0 ? await currentBranch($) : null
    if (isPush && !risks.includes('push to main') && branch !== null && PROTECTED_BRANCH.test(branch)) {
      risks.push('push from main')
    }
    if (risks.length === 0) return next(e)

    await update($, pendingAtom, () => ({ command: e.command, risks, branch }))
    let answer = REFUSE
    try {
      answer = await $.ui.ask(`${risks.join(' + ')}: run this command? ${e.command}`, [RUN_IT, REFUSE])
    } catch {
      $.ui.log('git-guard: question dismissed, command refused')
    }
    await update($, pendingAtom, () => null)
    if (answer !== RUN_IT) {
      return { deny: `The user declined this command (${risks.join(', ')}). Ask before trying a different approach.` }
    }

    return next(e)
  }).catch(async ($, e, next) => {
    if (risksOf(e.command).length === 0) return next(e)

    return { deny: `git-guard failed (${next.error.kind}), so this risky command was not run.` }
  })

  on('ui.render', { component: 'AskUserQuestion' }, async ($, e, next) => {
    const pending = await read($, pendingAtom)
    if (pending === null) return next(e)

    const ui = $.ui.resolve(e)
    const { Box } = ui
    const theirs = await next(e)
    const columns = e.viewport?.columns ?? DEFAULT_COLUMNS
    const width = Math.min(CARD_MAX_WIDTH, Math.floor(columns * CELL_PIXELS) - CARD_GUTTER)

    return (
      <Box flexDirection="column" rowGap={1}>
        {cardTree(ui, { ...pending, width, theme: flags.theme, surface: e.surface })}
        {theirs}
      </Box>
    )
  })
}
