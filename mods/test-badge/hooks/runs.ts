import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, Timer } from 'claude-code'

import { isAllowed } from './consent'
import type { ConsentIo } from './consent'
import { detect, goModuleOf, isSource, spawnArgv } from './detect'
import type { Commands } from './detect'
import { offerFix } from './handoff'
import { hubCardOf } from './hub'
import { setLang } from './lang'
import { DEBOUNCE_MS, DISMISS_AFTER_MS, EMPTY, PRIORITY, REFRESH_MS, TIMEOUT_MS, TIMEOUT_SLACK_MS, WRITE_TOOLS } from './limits'
import type { Overrides } from './options'
import { badgeText, isFailing, parseLint, parseTests } from './parse'
import { focusedDart, rootInfo, scopeOf } from './scope'
import type { Fs } from './scope'
import type { ParseContext } from './text'
import { AUTO, themeFrom } from './tidemark'
import { words } from './words'
import type { CheckOutcome, CiWatch, SuiteFilter, TestBadge } from '../types'

// The local checks: when they run (a turn that edited source, then a pause; a press; /test-badge run), where (the
// edited file's package), with whose yes (consent.ts), and what a run leaves (badge, status line, notice, hub card,
// the prompt's offer). A press reaches here as a write of `rerun`.

// The $.state values this file reads or writes, declared here: the scan lists them per file.
const badgeAtom = atom({ plugin: 'test-badge', key: 'badge' } as const, EMPTY)
const ciAtom = atom({ plugin: 'test-badge', key: 'ci' } as const, null as CiWatch | null)
const enabledAtom = atom({ plugin: 'test-badge', key: 'isEnabled' } as const, true)
const filterAtom = atom({ plugin: 'test-badge', key: 'filter' } as const, 'all' as SuiteFilter)
const noticeAtom = atom({ plugin: 'test-badge', key: 'notice' } as const, null)
const commandsAtom = atom({ plugin: 'test-badge', key: 'commands' } as const, null as Commands | null)
const themeAtom = atom({ plugin: 'test-badge', key: 'theme' } as const, AUTO)
const hubRef = { plugin: 'test-badge', key: 'hub' } as const

const COMMAND = 'test-badge'
const STORE_KEY = 'test-badge.enabled'
const ALLOWED_KEY = 'test-badge.allowed'
// A tool that is not installed: POSIX exit 127 (nice's own), cmd's "not recognized", Python without pytest.
const NOT_FOUND_EXIT = 127
const NOT_INSTALLED = /is not recognized as an internal or external command|No module named pytest/

type Parse = (out: string, code: number, ctx: ParseContext) => CheckOutcome
// A run's ask: the files edited (the last one picks the package), and whether no person asked for it.
type Request = { edited: string[]; isAuto: boolean }
const flags = {
  edited: [] as string[], lastEdited: [] as string[], isRunning: false, queued: null as Request | null, debounce: null as Timer | null,
  noticeId: 0, isWindows: false, status: null as string | undefined | null,
}

const debug = ($: EngineInterface, line: string) => $.ui.log(line, { to: 'debug' })

function fsIo($: EngineInterface): Fs {
  return { list: async dir => (await $.fs.list(dir)).map(entry => entry.name), read: path => $.fs.read(path), exists: path => $.fs.exists(path) }
}

function consentIo($: EngineInterface): ConsentIo {
  return { get: () => $.store.get(ALLOWED_KEY), set: value => $.store.set(ALLOWED_KEY, value), ask: (question, options) => $.ui.ask(question, options), log: line => debug($, line) }
}

// The pane names what a run would do before any run has happened.
async function learnCommands($: EngineInterface, overrides: Overrides): Promise<void> {
  const info = await rootInfo(fsIo($), await $.session.cwd())
  await update($, commandsAtom, () => detect(info, overrides))
}

// Null when the tool is not installed: that is "no test command found", not a red badge.
async function check($: EngineInterface, argv: string[], how: { parse: Parse; ctx: ParseContext }): Promise<CheckOutcome | null> {
  const started = await $.clock.now()
  try {
    const out = await $.process.run(spawnArgv(argv, flags.isWindows), { cwd: how.ctx.root, timeoutMs: TIMEOUT_MS, env: { CI: '1', FORCE_COLOR: '0' } })
    const text = `${out.stdout}\n${out.stderr}`
    if (out.exitCode === NOT_FOUND_EXIT || (out.exitCode !== 0 && NOT_INSTALLED.test(text))) return null

    return how.parse(text, out.exitCode, how.ctx)
  } catch {
    const isTimeout = (await $.clock.now()) - started >= TIMEOUT_MS - TIMEOUT_SLACK_MS

    return { status: isTimeout ? 'timeout' : 'error', passed: null, total: null, errors: null, failures: [], tail: [] }
  }
}

// The status line is drawn as a warning (⚠), so it holds a failure only; a green run lives in the band and the MODZ hub.
async function showStatus($: EngineInterface): Promise<void> {
  const badge = await read($, badgeAtom)
  const isShown = (await read($, enabledAtom)) && isFailing(badge)
  const text = isShown ? badgeText(badge, await $.clock.now()) : undefined
  // The 15 s refresh mostly finds the same words; the status line is told only when they change.
  if (text === flags.status) return
  flags.status = text
  $.ui.status(text)
}

async function notify($: EngineInterface, badge: TestBadge): Promise<void> {
  flags.noticeId += 1
  const id = flags.noticeId
  const now = await $.clock.now()
  const text = badgeText(badge, now) ?? ''
  const expiresAt = now + DISMISS_AFTER_MS
  await update($, noticeAtom, () => ({ id, text, isFailing: isFailing(badge), hasDetails: isFailing(badge), priority: PRIORITY, expiresAt }))
  $.clock.after(DISMISS_AFTER_MS, () => {
    void update($, noticeAtom, current => (current !== null && current.id === id ? null : current))
  })
}

// The MODZ main panel's card, from the local checks and the CI watch (ci.ts writes it the same way).
async function writeHub($: EngineInterface): Promise<void> {
  const standing = (await $.state.get(hubRef)).value
  const card = hubCardOf({ badge: await read($, badgeAtom), ci: await read($, ciAtom), standing, at: await $.clock.now() })
  if (card !== null) await $.state.set(hubRef, card)
}

// The edited package's commands; an automatic run needs the person's yes for them, as detected (a focused
// Flutter run names this turn's files, which would ask again each time).
async function planOf($: EngineInterface, overrides: Overrides, request: Request) {
  const scope = await scopeOf(fsIo($), { file: request.edited.at(-1) ?? null, cwd: await $.session.cwd(), overrides })
  const found = detect(scope.info, overrides)
  const isFound = found.test !== null || found.lint !== null
  const asked = { root: scope.root, commands: [found.test, found.lint].filter(argv => argv !== null) }
  const isOk = isFound && (!request.isAuto || (await isAllowed(consentIo($), asked)))
  const test = found.test === null ? null : await focusedDart(fsIo($), { argv: found.test, root: scope.root, edited: request.edited })

  return { ...scope, commands: { test, lint: found.lint }, isFound, isOk }
}

async function finish($: EngineInterface, run: { badge: TestBadge; commands: Commands }): Promise<void> {
  await update($, commandsAtom, () => run.commands)
  await update($, badgeAtom, () => run.badge)
  await writeHub($)
  await update($, filterAtom, () => 'all')
  await showStatus($)
  await offerFix(text => $.prompt.suggest({ text }).catch(error => debug($, `test-badge: no suggestion (${String(error)})`)), run)
  if (run.badge.finishedAt !== null) await notify($, run.badge)
}

async function runChecks($: EngineInterface, overrides: Overrides, request: Request): Promise<void> {
  const { root, info, commands, isFound, isOk } = await planOf($, overrides, request)
  await update($, commandsAtom, () => commands)
  if (!isFound) debug($, 'test-badge: no test or lint command found here')
  if (!isOk) return
  const ctx: ParseContext = { root, goModule: goModuleOf(info) }
  const started = await $.clock.now()
  await update($, badgeAtom, badge => ({ ...badge, isRunning: true }))
  await writeHub($)
  await showStatus($)
  const tests = commands.test === null ? null : await check($, commands.test, { parse: parseTests, ctx })
  const lint = commands.lint === null ? null : await check($, commands.lint, { parse: parseLint, ctx })
  const finishedAt = await $.clock.now()
  const ran: Commands = { test: tests === null ? null : commands.test, lint: lint === null ? null : commands.lint }
  const isNone = tests === null && lint === null
  await finish($, { badge: isNone ? EMPTY : { tests, lint, root, finishedAt, durationMs: finishedAt - started, isRunning: false }, commands: ran })
}

// One run at a time: a request while one runs is queued, the latest kept, and runs once after it.
async function runAll($: EngineInterface, overrides: Overrides, request: Request): Promise<void> {
  if (flags.isRunning) {
    flags.queued = request

    return
  }
  flags.isRunning = true
  try {
    await runChecks($, overrides, request)
  } catch (error) {
    debug($, `test-badge: run failed (${error instanceof Error ? error.message : 'unknown'})`)
    await update($, badgeAtom, badge => ({ ...badge, isRunning: false }))
    await writeHub($)
  } finally {
    flags.isRunning = false
  }
  const queued = flags.queued
  flags.queued = null
  if (queued !== null) await runAll($, overrides, queued)
}

// The turn's edits are taken when the timer fires; a turn that starts first cancels it, so nothing runs
// beside Claude's next turn, and its edits wait for that turn's end.
function schedule($: EngineInterface, overrides: Overrides): void {
  flags.debounce?.cancel()
  flags.debounce = $.clock.after(DEBOUNCE_MS, () => {
    flags.debounce = null
    const request: Request = { edited: flags.edited, isAuto: true }
    flags.lastEdited = flags.edited
    flags.edited = []
    void runAll($, overrides, request).catch(error => debug($, `test-badge: run failed (${String(error)})`))
  })
}

async function startSession($: EngineInterface, overrides: Overrides): Promise<void> {
  setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
  flags.isWindows = (await $.env.get('OS').catch(() => undefined)) === 'Windows_NT'
  flags.status = null
  await learnCommands($, overrides).catch(() => debug($, 'test-badge: could not look for commands'))
  try {
    const saved = await $.store.get(STORE_KEY)
    await update($, enabledAtom, () => saved !== false)
    const pinned = await $.env.get('MODZ_THEME').catch(() => undefined)
    await update($, themeAtom, () => themeFrom(pinned))
    await writeHub($)
    await $.command.register({ name: COMMAND, description: words().commandHelp, argumentHint: '[on|off|run|details]' })
    $.clock.every(REFRESH_MS, () => {
      void read($, badgeAtom).then(badge => (badge.finishedAt === null ? undefined : showStatus($)))
    })
  } catch {
    debug($, 'test-badge: could not load settings')
  }
}

function hookTurns(on: On, overrides: Overrides): void {
  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    const path = (e as { file_path?: unknown }).file_path
    const isEdit = WRITE_TOOLS.has(String(e.tool)) && typeof path === 'string' && isSource(path)
    if (isEdit && result.deny === undefined && result.isError !== true) flags.edited.push(path)

    return result
  }).catch(($, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    if ((e as { agentId?: string }).agentId === undefined) {
      flags.debounce?.cancel()
      flags.debounce = null
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined && flags.edited.length > 0 && (await read($, enabledAtom))) schedule($, overrides)

    return next(e)
  })
}

export function hookRuns(on: On, overrides: Overrides): void {
  on('session.start', async ($, e, next) => {
    await startSession($, overrides)

    return next(e)
  })

  hookTurns(on, overrides)

  // A press (the pane's rerun, /test-badge run): the person's own ask, on the last turn's package.
  on('state.set', { plugin: 'test-badge', key: 'rerun' }, async ($, e, next) => {
    const done = await next(e)
    void runAll($, overrides, { edited: flags.lastEdited, isAuto: false }).catch(error => debug($, `test-badge: run failed (${String(error)})`))

    return done
  }).catch(($, e, next) => next(e))

  on('state.set', { plugin: 'test-badge', key: 'isEnabled' }, async ($, e, next) => {
    const done = await next(e)
    await showStatus($)

    return done
  }).catch(($, e, next) => next(e))
}
