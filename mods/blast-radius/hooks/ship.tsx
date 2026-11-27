// A push to a repository that is not the person's own: a quiet line above the prompt, never a hold. /ship and
// Claude push through Bash, so the push's own call is where this looks. "Trusted" means the remote's GitHub
// owner is the login `gh` is signed in as; anything else (another owner, an organisation, a non-GitHub remote,
// no gh login) is untrusted and said once per repository per session. The check runs beside the push: it never
// delays or refuses it.

import type { EngineInterface, Register } from 'claude-code'

import { pick } from './lang'
import { splitCommands, tokenize } from './shell'

type On = Parameters<Register>[0]

export type Push = { dir: string | null; remote: string }
export type Warning = { repo: string; owner: string | null; login: string | null }

const TIMEOUT_MS = 3000
const GIT_VALUED = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace'])
const OWNER = /github\.com[:/]+([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/i
const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/

// The pushes on a command line: where each runs (`git -C dir`) and the remote it names, `origin` when none.
export function pushesOf(command: string): Push[] {
  const found: Push[] = []
  for (const segment of splitCommands(command)) {
    const words = tokenize(segment.trim())
    let at = 0
    while (ASSIGNMENT.test(words[at] ?? '')) at += 1
    if (words[at] !== 'git') continue
    let dir: string | null = null
    at += 1
    while ((words[at] ?? '').startsWith('-')) {
      if (words[at] === '-C') dir = words[at + 1] ?? null
      at += GIT_VALUED.has(words[at] ?? '') ? 2 : 1
    }
    if (words[at] !== 'push') continue
    const remote = words.slice(at + 1).find(word => !word.startsWith('-')) ?? 'origin'
    found.push({ dir, remote })
  }

  return found
}

/** `owner/repo` of a GitHub remote URL; null for any other host. */
export function repoOf(url: string): { owner: string; name: string } | null {
  const match = OWNER.exec(url.trim())

  return match === null ? null : { owner: match[1] ?? '', name: match[2] ?? '' }
}

/** The warning a push gets, or null when the repository is the signed-in user's own. */
export function warningFor(url: string, login: string | null): Warning | null {
  const repo = repoOf(url)
  if (repo !== null && login !== null && repo.owner.toLowerCase() === login.toLowerCase()) return null

  return { repo: repo === null ? url.trim() || 'this repository' : `${repo.owner}/${repo.name}`, owner: repo?.owner ?? null, login }
}

export const WORDS = {
  en: {
    head: (repo: string) => `Pushing to ${repo}, which is not yours`,
    why: (w: Warning) => (w.login === null ? 'gh is not signed in, so its owner could not be checked' : w.owner === null ? 'not a GitHub repository you own' : `owned by ${w.owner}, you are ${w.login}`),
    dismiss: 'Got it',
  },
  tr: {
    head: (repo: string) => `${repo} deposuna gönderiliyor, depo senin değil`,
    why: (w: Warning) => (w.login === null ? 'gh oturumu açık değil, sahibi denetlenemedi' : w.owner === null ? 'senin GitHub deponu değil' : `sahibi ${w.owner}, sen ${w.login}`),
    dismiss: 'Tamam',
  },
}

const state: { login?: string | null; told: Set<string>; shown: Warning | null } = { told: new Set(), shown: null }

/** A new session says each repository again (register.tsx's session.start). */
export function resetShip(): void {
  state.login = undefined
  state.told.clear()
  state.shown = null
}

async function loginOf($: EngineInterface): Promise<string | null> {
  if (state.login !== undefined) return state.login
  const ran = await $.process.run(['gh', 'api', 'user', '--jq', '.login'], { timeoutMs: TIMEOUT_MS })
  state.login = ran.exitCode === 0 && ran.stdout.trim() !== '' ? ran.stdout.trim() : null

  return state.login
}

async function check($: EngineInterface, push: Push): Promise<void> {
  const cwd = await $.session.cwd()
  const dir = push.dir === null ? cwd : push.dir.startsWith('/') ? push.dir : `${cwd}/${push.dir}`
  const isUrl = /[:/]/.test(push.remote)
  const ran = isUrl ? null : await $.process.run(['git', '-C', dir, 'remote', 'get-url', push.remote], { timeoutMs: TIMEOUT_MS })
  if (ran !== null && ran.exitCode !== 0) return // no such remote: git refuses the push itself
  const warning = warningFor(ran === null ? push.remote : ran.stdout, await loginOf($))
  if (warning === null || state.told.has(warning.repo)) return
  state.told.add(warning.repo)
  state.shown = warning
  $.ui.invalidate('ui.render')
}

type Ui = ReturnType<EngineInterface['ui']['resolve']>

function drawWarning($: EngineInterface, ui: Ui, shown: Warning) {
  const { Box, Text, Button } = ui
  const says = pick(WORDS)
  const dismiss = () => {
    state.shown = null
    $.ui.invalidate('ui.render')
  }

  return (
    <Box key="blast-radius-ship" flexDirection="row" flexWrap="wrap" columnGap={2}>
      <Text color="warning">{`⚠ ${says.head(shown.repo)}`}</Text>
      <Text dimColor>{says.why(shown)}</Text>
      <Button key="blast-radius-ship-ok" label={says.dismiss} variant="secondary" onPress={dismiss} />
    </Box>
  )
}

export function shipHooks(on: On): void {
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const pushes = pushesOf(String(e.command ?? ''))
    for (const push of pushes) {
      void check($, push).catch(cause => $.ui.log(`blast-radius: could not check the push target: ${String(cause)}`, { to: 'debug' }))
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const shown = state.shown
    if (shown === null || e.props.hasSurvey) return next(e)
    const theirs = await next(e)
    const ui = $.ui.resolve(e)
    const { Box } = ui

    return (
      <Box flexDirection="column">
        {drawWarning($, ui, shown)}
        {theirs}
      </Box>
    )
  })
}
