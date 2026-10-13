import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { HEADER, cardTree, described } from './card'
import { findSecrets } from './detect'
import { blockedDeny, isMovable, moveYourselfDeny, pendingOf, unattendedDeny } from './findings'
import type { Found } from './findings'
import { gitSteps, isEnvFile, scanStep } from './git'
import type { GitHost } from './git'
import { maskTree } from './mask'
import { appendText, envLines, envRootOf, hasEnvIgnore, parseEnv, planEntries, rewrite, withTokens } from './move'
import { bashCommand, scrubbedContent, withNote, withTokenNote } from './placeholders'
import { maskedProps } from './rec'
import { isNewStatus, statusText } from './status'
import { fileText, isFileTool, patchedFields, pathOf } from './tools'
import { clearVault, hasTokens, hide, sessionVault, tokenHits } from './vault'
import { setLang } from './lang'
import { resolveLight } from './theme'
import { words } from './words'

type On = Parameters<Register>[0]

const COMMAND = 'secret-guard'
const REC_COMMAND = 'rec'
const STORE_KEY = 'secret-guard.enabled'
const DEFAULT_COLUMNS = 100
const FILE_MAX_BYTES = 1_000_000

const pendingAtom = atom({ plugin: 'secret-guard', key: 'pending' } as const, null)
const enabledAtom = atom({ plugin: 'secret-guard', key: 'isEnabled' } as const, true)
// Recording mode is the session's: off at start, kept across a reload of the mod.
const recordingAtom = atom({ plugin: 'secret-guard', key: 'isRecording' } as const, false)
const session = { cwd: '', isLight: false }

async function scanFile($: EngineInterface, path: string): Promise<string> {
  try {
    const stat = await $.fs.stat(path)
    if (stat.kind !== 'file' || stat.size > FILE_MAX_BYTES) return ''

    return await $.fs.read(path)
  } catch {
    return ''
  }
}

function gitHost($: EngineInterface): GitHost {
  const git = async (argv: string[], cwd: string) => {
    const ran = await $.process.run(['git', ...argv], { cwd })

    return ran.exitCode === 0 ? ran.stdout : ''
  }

  return { cwd: session.cwd, git, read: path => scanFile($, path) }
}

async function inspect($: EngineInterface, input: Record<string, unknown>): Promise<Found | null> {
  const found: Found = { secrets: [], envFiles: [], path: null, command: String(input.command ?? '') }
  if (isFileTool(input)) {
    const path = pathOf(input)
    if (path === null || isEnvFile(path)) return null
    found.path = path
    const text = fileText(input)
    found.secrets = [...findSecrets(text, path), ...tokenHits(sessionVault, text)].map(secret => ({ ...secret, where: `${path}:${secret.line}` }))
  } else if (input.tool === 'Bash' && typeof input.command === 'string') {
    for (const step of gitSteps(input.command)) await scanStep(gitHost($), step, found)
  }
  found.envFiles = [...new Set(found.envFiles)]
  found.secrets = [...new Map(found.secrets.map(secret => [secret.token ?? secret.value, secret])).values()]

  return found.secrets.length + found.envFiles.length === 0 ? null : found
}

async function askUser($: EngineInterface, found: Found): Promise<string> {
  const pending = pendingOf(found, session.cwd)
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

async function writeEnv($: EngineInterface, found: Found) {
  const { root, isRepo } = await envRootOf({ path: found.path ?? session.cwd, cwd: session.cwd, exists: path => $.fs.exists(path) })
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

async function showStatus($: EngineInterface): Promise<void> {
  const text = statusText({ isRecording: await read($, recordingAtom), keptCount: sessionVault.byValue.size })
  if (isNewStatus(text)) $.ui.status(text)
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
      await $.command.register({ name: REC_COMMAND, description: words().recCommandLine })
      await showStatus($)
    } catch {
      $.ui.log('secret-guard: could not load settings', { to: 'debug' })
    }
    await refreshTheme($).catch(() => $.ui.log('secret-guard: could not read the theme, drawing dark', { to: 'debug' }))

    return next(e)
  })
  // A cleared chat holds no placeholder any more: the values go with it.
  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      clearVault(sessionVault)
      await showStatus($)
    }

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
  on('command.run', { command: REC_COMMAND }, async $ => {
    const isOn = !(await read($, recordingAtom))
    await update($, recordingAtom, () => isOn)
    await showStatus($)

    return { text: words().recToggled(isOn) }
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
    if (found === null) return withTokenNote(input, await next(e))
    if (await isUnattended($, e)) return { deny: unattendedDeny(found) }

    const answer = await askUser($, found)
    if (answer === words().allow) return withTokenNote(input, await next(e))
    if (found.secrets.length === 0 || answer !== words().move(found.secrets.length)) return { deny: blockedDeny(found) }
    if (!isMovable(found)) return { deny: moveYourselfDeny(found) }
    const { entries, envPath } = await writeEnv($, found)
    const path = found.path ?? ''
    const spelled = withTokens(entries, found.secrets.map(secret => secret.token))
    const ran = await next({ ...e, ...patchedFields(input, text => rewrite(text, { path, entries: spelled })) } as typeof e)
    const note = `secret-guard moved ${entries.length} secret(s) from ${path} into ${envPath} as ${entries.map(entry => entry.name).join(', ')}; the file now reads them from the environment. Make sure the program loads .env.`

    return ran.deny === undefined ? { ...ran, context: [...(ran.context ?? []), note] } : ran
  })
}

// Placeholders: the prompt hides pasted secrets, Bash gets them back, tool output hides them again.
function hookPlaceholders(on: On): void {
  on('prompt.submit', async ($, e, next) => {
    if (!(await read($, enabledAtom))) return next(e)
    const text = hide(sessionVault, e.text)
    if (text === e.text) return next(e)
    const entered = await next({ ...e, text })
    await showStatus($)

    return entered
  })
  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)

    return { ...composed, sections: withNote(composed.sections) }
  })
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    if (e.tool !== 'Bash' || !hasTokens(e.command)) return next(e)
    const revealed = bashCommand(e.command)

    return 'deny' in revealed ? revealed : next({ ...e, command: revealed.command })
  })
  on('session.append', async ($, e, next) => {
    const content = scrubbedContent({ door: e.door, content: e.message.content })

    return content === null ? next(e) : next({ ...e, message: { ...e.message, content } })
  })
}

function hookRender(on: On): void {
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
  // Recording mode masks the props on the way down, for the engine's own drawing, and the tree that comes
  // back, for whatever a hook beneath drew (a skin), so it holds whichever way the plugins are stacked.
  on('ui.render', { component: ['UserMessage', 'AssistantMessage', 'ToolUse', 'ToolResult'] }, async ($, e, next) => {
    if (!(await read($, recordingAtom))) return next(e)
    const known = [...sessionVault.byValue.keys()]
    const props = maskedProps(e.component, e.props, known)
    const tree = await next(props === e.props ? e : ({ ...e, props } as typeof e))

    return maskTree(tree, known)
  })
}

export const register: Register = on => {
  hookSession(on)
  hookCommand(on)
  hookCall(on)
  hookPlaceholders(on)
  hookRender(on)
}
