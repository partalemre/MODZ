import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { HEADER, cardTree, chipOf, optionsOf } from './card'
import { findSecrets, isTestPath, mask } from './detect'
import type { Secret } from './detect'
import { addedByFile, dryRunPaths, gitSteps, isEnvFile } from './git'
import type { GitStep } from './git'
import { appendText, envLines, hasEnvIgnore, parseEnv, planEntries, rewrite } from './move'
import { fileText, isFileTool, patchedFields, pathOf, resolvePath } from './tools'
import { setLang } from './lang'
import { resolveLight } from './theme'
import { words } from './words'
import type { GuardPending } from '../types'

type On = Parameters<Register>[0]
type Found = { secrets: (Secret & { where: string })[]; envFiles: string[]; path: string | null; command: string }

const COMMAND = 'secret-guard'
const STORE_KEY = 'secret-guard.enabled'
const DEFAULT_COLUMNS = 100
const FILE_MAX_BYTES = 1_000_000
const FILES_MAX = 300

const pendingAtom = atom({ plugin: 'secret-guard', key: 'pending' } as const, null)
const enabledAtom = atom({ plugin: 'secret-guard', key: 'isEnabled' } as const, true)
const session = { cwd: '', isLight: false }

async function git($: EngineInterface, argv: string[], cwd: string): Promise<string> {
  const ran = await $.process.run(['git', ...argv], { cwd })

  return ran.exitCode === 0 ? ran.stdout : ''
}

async function scanFile($: EngineInterface, path: string): Promise<string> {
  try {
    const stat = await $.fs.stat(path)
    if (stat.kind !== 'file' || stat.size > FILE_MAX_BYTES) return ''

    return await $.fs.read(path)
  } catch {
    return ''
  }
}

async function scanStep($: EngineInterface, step: GitStep, found: Found): Promise<void> {
  const dir = step.cwd === null ? session.cwd : resolvePath(session.cwd, step.cwd)
  if (step.kind === 'add') {
    found.envFiles.push(...step.args.filter(isEnvFile))
    const paths = dryRunPaths(await git($, ['add', '-n', ...step.args], dir))
    found.envFiles.push(...paths.filter(isEnvFile))
    for (const path of paths.filter(entry => !isEnvFile(entry)).slice(0, FILES_MAX)) {
      const text = await scanFile($, resolvePath(dir, path))
      found.secrets.push(...findSecrets(text, path).map(secret => ({ ...secret, where: `${path}:${secret.line}` })))
    }

    return
  }
  const scopes = step.isAll ? [['--cached'], []] : [['--cached']]
  for (const scope of scopes) {
    const names = (await git($, ['diff', ...scope, '--name-only'], dir)).split('\n').filter(name => name !== '')
    found.envFiles.push(...names.filter(isEnvFile))
    for (const [path, added] of addedByFile(await git($, ['diff', ...scope, '-U0', '--no-color'], dir))) {
      found.secrets.push(...findSecrets(added, path).map(secret => ({ ...secret, where: path })))
    }
  }
}

async function inspect($: EngineInterface, input: Record<string, unknown>): Promise<Found | null> {
  const found: Found = { secrets: [], envFiles: [], path: null, command: String(input.command ?? '') }
  if (isFileTool(input)) {
    const path = pathOf(input)
    if (path === null || isEnvFile(path)) return null
    found.path = path
    found.secrets = findSecrets(fileText(input), path).map(secret => ({ ...secret, where: `${path}:${secret.line}` }))
  } else if (input.tool === 'Bash' && typeof input.command === 'string') {
    for (const step of gitSteps(input.command)) await scanStep($, step, found)
  }
  found.envFiles = [...new Set(found.envFiles)]
  found.secrets = [...new Map(found.secrets.map(secret => [secret.value, secret])).values()]

  return found.secrets.length + found.envFiles.length === 0 ? null : found
}

function relative(path: string): string {
  return session.cwd !== '' && path.startsWith(`${session.cwd}/`) ? path.slice(session.cwd.length + 1) : path
}

// A file write names the file in the card's title, so each finding says only its line.
function sourceOf(found: Found): GuardPending['source'] {
  if (found.path !== null) return 'write'

  return gitSteps(found.command).some(step => step.kind === 'commit') ? 'commit' : 'add'
}

// Moving to .env rewrites the call itself only for a file write with no private key. A test file's keys are
// fixtures more often than not: Claude is asked to deal with them instead of the guard moving them unseen.
const isMovable = (found: Found): boolean => found.path !== null && !isTestPath(found.path) && found.secrets.every(secret => secret.isMovable)

const atOf = (found: Found, secret: Found['secrets'][number]): string => (found.path === null ? relative(secret.where) : `${relative(found.path)}:${secret.line}`)

function pendingOf(found: Found): GuardPending {
  const where = (secret: Found['secrets'][number]) => (found.path === null ? secret.where : words().line(secret.line))
  const secrets = [...found.secrets].sort((a, b) => a.line - b.line)

  return {
    subject: found.path === null ? found.command : relative(found.path),
    source: sourceOf(found),
    envFiles: found.envFiles,
    secrets: secrets.map(secret => ({ label: secret.label, chip: chipOf(secret.label), masked: mask(secret.value), where: where(secret), at: atOf(found, secret) })),
    options: optionsOf({ secretCount: found.secrets.length, isMovable: isMovable(found) }),
  }
}

async function askUser($: EngineInterface, found: Found): Promise<string> {
  const pending = pendingOf(found)
  const options = pending.options.map(option => option.label)
  await update($, pendingAtom, () => pending)
  let answer = ''
  try {
    answer = await $.ui.ask(words().question, { options, header: HEADER })
  } catch {
    $.ui.log('secret-guard: question dismissed, call cancelled', { to: 'debug' })
  }
  await update($, pendingAtom, () => null)

  return answer
}

const dirOf = (path: string): string => path.slice(0, path.lastIndexOf('/')) || '/'

// The .env goes to the root of the repository holding the file (a worktree's own root, whose `.git` is a file),
// never the session's root when they differ. Outside any repository: the session's folder if the file is in it.
async function envRootOf($: EngineInterface, path: string): Promise<{ root: string; isRepo: boolean }> {
  const start = dirOf(resolvePath(session.cwd, path))
  for (let dir = start; ; dir = dirOf(dir)) {
    if (await $.fs.exists(`${dir}/.git`)) return { root: dir, isRepo: true }
    if (dir === '/') break
  }
  const isInSession = session.cwd !== '' && `${start}/`.startsWith(`${session.cwd}/`)

  return { root: isInSession ? session.cwd : start, isRepo: false }
}

async function writeEnv($: EngineInterface, found: Found) {
  const { root, isRepo } = await envRootOf($, found.path ?? session.cwd)
  const envPath = `${root}/.env`
  const existing = (await $.fs.exists(envPath)) ? await $.fs.read(envPath) : ''
  const entries = planEntries(found.secrets, parseEnv(existing))
  await $.fs.write(envPath, appendText(existing, envLines(entries)))
  if (isRepo) {
    const ignorePath = `${root}/.gitignore`
    const ignore = (await $.fs.exists(ignorePath)) ? await $.fs.read(ignorePath) : ''
    if (!hasEnvIgnore(ignore)) await $.fs.write(ignorePath, appendText(ignore, '.env\n'))
  }

  return { entries, envPath }
}

// A subagent's call, or a session nothing draws (a -p run): nobody can answer the card, so nothing is moved.
async function isUnattended($: EngineInterface, e: { agentId?: string }): Promise<boolean> {
  return e.agentId !== undefined || (await $.session.surfaces()).length === 0
}

const unattendedDeny = (found: Found): string =>
  `secret-guard blocked this call: it would expose ${summary(found) || found.envFiles.join(', ')}, and nobody can answer its question here, so nothing was moved. Keep secrets in .env (git-ignored) and read them from the environment, or leave this change to the main conversation.`

function summary(found: Found): string {
  return found.secrets.map(secret => `${secret.label} ${mask(secret.value)} (${secret.where})`).join(', ')
}

// The guard's own question gets a line under each answer saying what it does.
function described(questions: unknown[], pending: GuardPending): unknown[] {
  const lineOf = new Map(pending.options.map(option => [option.label, option.description]))

  return questions.map(question => {
    const asked = question as { question?: unknown; options?: unknown }
    if (asked.question !== words().question || !Array.isArray(asked.options)) return question
    const options = asked.options.map(option => {
      const label = (option as { label?: unknown }).label

      return typeof label === 'string' && lineOf.has(label) ? { ...(option as object), description: lineOf.get(label) } : option
    })

    return { ...asked, options }
  })
}

async function refreshTheme($: EngineInterface): Promise<void> {
  const rows = await $.config.list()
  const hints = { override: await $.env.get('MODZ_THEME'), theme: rows.find(row => row.key === 'theme')?.value, colorfgbg: await $.env.get('COLORFGBG') }
  if (resolveLight(hints) === resolveLight({ ...hints, systemDark: false })) {
    session.isLight = resolveLight(hints)

    return
  }
  const mac = await $.process.run(['defaults', 'read', '-g', 'AppleInterfaceStyle'], { timeoutMs: 2000 })
  session.isLight = resolveLight({ ...hints, systemDark: mac.exitCode === 0 ? mac.stdout.trim() === 'Dark' : false })
}

function hookSession(on: On): void {
  on('session.start', async ($, e, next) => {
    setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
    try {
      session.cwd = e.cwd
      const saved = await $.store.get(STORE_KEY)
      await update($, enabledAtom, () => saved !== false)
      await $.command.register({ name: COMMAND, description: words().commandLine })
    } catch {
      $.ui.log('secret-guard: could not load settings', { to: 'debug' })
    }
    await refreshTheme($).catch(() => $.ui.log('secret-guard: could not read the theme, drawing dark', { to: 'debug' }))

    return next(e)
  })
}

function hookCommand(on: On): void {
  on('command.run', { command: COMMAND }, async $ => {
    const isOn = !(await read($, enabledAtom))
    await update($, enabledAtom, () => isOn)
    await $.store.set(STORE_KEY, isOn)

    return { text: words().toggled(isOn) }
  })
}

function hookCall(on: On): void {
  on('tool.call', async ($, e, next) => {
    if (!(await read($, enabledAtom))) return next(e)
    const input = e as unknown as Record<string, unknown>
    let found: Found | null = null
    try {
      found = await inspect($, input)
    } catch {
      $.ui.log('secret-guard: scan failed, call passed through', { to: 'debug' })
    }
    if (found === null) return next(e)
    if (await isUnattended($, e)) return { deny: unattendedDeny(found) }

    const answer = await askUser($, found)
    if (answer === words().allow) return next(e)
    if (found.secrets.length === 0 || answer !== words().move(found.secrets.length)) return { deny: `The user blocked this call: it would expose ${summary(found) || found.envFiles.join(', ')}. Keep secrets in .env (git-ignored) and read them from the environment.` }
    if (!isMovable(found)) {
      return { deny: `The user chose "Move to .env" for ${summary(found)}. Move each secret into the project's .env (git-ignored), reference it from the environment, then retry.` }
    }
    const { entries, envPath } = await writeEnv($, found)
    const path = found.path ?? ''
    const ran = await next({ ...e, ...patchedFields(input, text => rewrite(text, { path, entries })) } as typeof e)
    const note = `secret-guard moved ${entries.length} secret(s) from ${path} into ${envPath} as ${entries.map(entry => entry.name).join(', ')}; the file now reads them from the environment. Make sure the program loads .env.`

    return ran.deny === undefined ? { ...ran, context: [...(ran.context ?? []), note] } : ran
  })
}

function hookDialog(on: On): void {
  on('ui.render', { component: 'AskUserQuestion' }, async ($, e, next) => {
    const pending = await read($, pendingAtom)
    if (pending === null) return next(e)
    const ui = $.ui.resolve(e)
    const { Box } = ui
    const theirs = await next({ ...e, props: { ...e.props, questions: described(e.props.questions, pending) } })
    const spec = { width: e.viewport?.columns ?? DEFAULT_COLUMNS, isLight: session.isLight, surface: e.surface }

    return (
      <Box flexDirection="column" rowGap={1}>
        {cardTree(ui, pending, spec)}
        {theirs}
      </Box>
    )
  })
}

export const register: Register = on => {
  hookSession(on)
  hookCommand(on)
  hookCall(on)
  hookDialog(on)
}
