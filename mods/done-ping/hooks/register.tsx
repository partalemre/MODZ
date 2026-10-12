import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { pingRow } from './band'
import { configFrom, donePing, editedPath, isTestCommand, parseSeconds, permissionPing, projectOf, questionPing } from './ping'
import type { Ping, PingConfig, TestsSeen } from './ping'
import { AUTO, themeFrom } from './tidemark'
import { ring } from './ring'
import type { RingIo } from './ring'
import { pinned } from './pin'
import { setLang } from './lang'
import { words } from './words'
import type { PingNotice } from '../types'

const COMMAND = 'done-ping'
const ENABLED_KEY = `${COMMAND}.enabled`
const THRESHOLD_KEY = `${COMMAND}.thresholdSeconds`
const MS_PER_SECOND = 1_000
// One "waiting on you" ping per stretch: a burst of permission asks rings once.
const WAIT_GAP_MS = 15_000
// Any two pings stand at least this far apart, so a question right before the end rings once.
const PING_GAP_MS = 10_000
const DISMISS_AFTER_MS = 20_000
// What `/done-ping test` shows: a turn of 2dk 14sn that changed 3 files and passed its tests.
const SAMPLE = { durationMs: 134_000, files: 3, tests: 'pass' as const }
// Notices that outrank this one on the shared line above the prompt.
const cacheTaxNotice = { plugin: 'cache-tax', key: 'notice' } as const
const knowNotice = { plugin: 'you-should-know', key: 'notice' } as const
const reflectNotice = { plugin: 'reflect', key: 'notice' } as const
const budgetNotice = { plugin: 'session-budget', key: 'notice' } as const
const testBadgeNotice = { plugin: 'test-badge', key: 'notice' } as const

const enabledAtom = atom({ plugin: 'done-ping', key: 'isEnabled' } as const, true)
const thresholdAtom = atom({ plugin: 'done-ping', key: 'thresholdSeconds' } as const, null)
const noticeAtom = atom({ plugin: 'done-ping', key: 'notice' } as const, null)
const themeAtom = atom({ plugin: 'done-ping', key: 'theme' } as const, AUTO)

const session = {
  project: 'Claude', lastWaitAt: -WAIT_GAP_MS, lastPingAt: -PING_GAP_MS, files: new Set<string>(), tests: null as TestsSeen, noticeId: 0,
}

async function showNotice($: EngineInterface, ping: Ping): Promise<void> {
  session.noticeId += 1
  const id = session.noticeId
  const expiresAt = (await $.clock.now()) + DISMISS_AFTER_MS
  await update($, noticeAtom, () => ({ id, kind: ping.kind, title: ping.title, detail: ping.detail, expiresAt }))
  $.clock.after(DISMISS_AFTER_MS, () => {
    void update($, noticeAtom, current => (current !== null && current.id === id ? null : current))
  })
}

function ioOf($: EngineInterface): RingIo {
  return {
    surfaces: () => $.session.surfaces(),
    toolNames: async () => (await $.tool.list()).map(tool => tool.name),
    checkTool: async (tool, input) => (await $.tool.check({ tool, input } as never)).decision,
    callTool: (tool, input) => $.tool.call({ tool, ...input } as never),
    // The bundle id macOS gives the app that launched this session (Claude, Terminal, Ghostty).
    hostBundle: () => $.env.get('__CFBundleIdentifier'),
    run: (argv, init) => $.process.run(argv, init),
    exists: path => $.fs.exists(path),
    log: text => $.ui.log(text, { to: 'debug' }),
  }
}

// The app's notification or a macOS banner; where neither can show, the shared notice line says it.
async function deliver($: EngineInterface, ping: Ping, spec: { config: PingConfig; isForced: boolean }): Promise<void> {
  try {
    const rung = await ring(ioOf($), { ping, ...spec })
    if (rung === 'failed') await showNotice($, ping)
  } catch (error) {
    $.ui.log(`done-ping: ping failed (${error instanceof Error ? error.message : 'unknown'})`, { to: 'debug' })
    await showNotice($, ping)
  }
}

// Rung after the hook's own dispatch so the notification never delays the turn.
async function later($: EngineInterface, ping: Ping, spec: { config: PingConfig; isForced: boolean }): Promise<void> {
  const nowMs = await $.clock.now()
  if (!spec.isForced && nowMs - session.lastPingAt < PING_GAP_MS) return
  session.lastPingAt = nowMs
  $.clock.after(1, () => void deliver($, ping, spec))
}

async function waitingOnUser($: EngineInterface, ping: Ping, config: PingConfig): Promise<void> {
  if (!config.isPermissionPing || !(await read($, enabledAtom))) return
  const nowMs = await $.clock.now()
  if (nowMs - session.lastWaitAt < WAIT_GAP_MS) return
  session.lastWaitAt = nowMs
  await later($, ping, { config, isForced: false })
}

async function thresholdOf($: EngineInterface, config: PingConfig): Promise<number> {
  return (await read($, thresholdAtom)) ?? config.thresholdSeconds
}

async function runCommand($: EngineInterface, args: string, config: PingConfig): Promise<{ text: string }> {
  const word = args.trim().toLowerCase()
  if (word === 'test') {
    const ping = donePing({ project: session.project, ...SAMPLE })
    await later($, ping, { config, isForced: true })

    return { text: words().testSent }
  }
  const seconds = word === '' ? null : parseSeconds(word)
  if (word !== '' && seconds === null) return { text: words().usage }
  if (seconds !== null) {
    await update($, thresholdAtom, () => seconds)
    await $.store.set(THRESHOLD_KEY, seconds)

    return { text: words().thresholdSet(seconds) }
  }
  const isOn = !(await read($, enabledAtom))
  await update($, enabledAtom, () => isOn)
  await $.store.set(ENABLED_KEY, isOn)

  return { text: words().switched(isOn, await thresholdOf($, config)) }
}

async function hasLouderNotice($: EngineInterface): Promise<boolean> {
  const others: { value?: unknown }[] = [
    await $.state.get(cacheTaxNotice as never),
    await $.state.get(knowNotice as never),
    await $.state.get(reflectNotice as never),
    await $.state.get(budgetNotice as never),
    await $.state.get(testBadgeNotice as never),
  ]

  return others.some(other => other.value !== undefined && other.value !== null)
}

async function loadSettings($: EngineInterface, cwd: string): Promise<void> {
  session.project = projectOf(cwd)
  const saved = await $.store.get(ENABLED_KEY)
  await update($, enabledAtom, () => saved !== false)
  const threshold = await $.store.get(THRESHOLD_KEY)
  if (typeof threshold === 'number') await update($, thresholdAtom, () => threshold)
  const pinned = await $.env.get('MODZ_THEME').catch(() => undefined)
  await update($, themeAtom, () => themeFrom(pinned))
  await $.command.register({ name: COMMAND, description: words().help })
}

async function turnEnded($: EngineInterface, e: { durationMs: number; isAborted: boolean; agentId?: string }, config: PingConfig): Promise<void> {
  const isLong = e.durationMs >= (await thresholdOf($, config)) * MS_PER_SECOND
  if (e.agentId !== undefined || e.isAborted || !isLong || !(await read($, enabledAtom))) return
  const ping = donePing({ project: session.project, durationMs: e.durationMs, files: session.files.size, tests: session.tests })
  await later($, ping, { config, isForced: false })
}

type On = Parameters<Register>[0]

// Asks that wait on the person (a question, a permission dialog) and the files a turn changes.
function registerWaiting(on: On, config: PingConfig): void {
  on('tool.call', async ($, e, next) => {
    if (e.tool === 'AskUserQuestion') {
      const ping = questionPing(session.project, e as unknown as Record<string, unknown>)
      await waitingOnUser($, ping, config).catch(() => $.ui.log('done-ping: question ping failed', { to: 'debug' }))
    }
    const ran = await next(e)
    const path = editedPath(e as unknown as Record<string, unknown>)
    const isRun = ran.deny === undefined
    if (path !== null && isRun && ran.isError !== true) session.files.add(path)
    if (e.tool === 'Bash' && isRun && isTestCommand((e as { command?: unknown }).command)) session.tests = ran.isError === true ? 'fail' : 'pass'

    return ran
  }).catch(async ($, e, next) => next(e))

  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)
    if (verdict.decision === 'ask' && e.tool_use_id !== undefined) {
      const ping = permissionPing(session.project, String(e.tool), (e.input ?? {}) as Record<string, unknown>)
      await waitingOnUser($, ping, config).catch(() => $.ui.log('done-ping: permission ping failed', { to: 'debug' }))
    }

    return verdict
  }).catch(async ($, e, next) => next(e))
}

export const register: Register = (on, options) => {
  const config = configFrom(options)

  on('session.start', async ($, e, next) => {
    setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
    await loadSettings($, e.cwd).catch(() => $.ui.log('done-ping: could not load settings', { to: 'debug' }))

    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => runCommand($, e.args, config))

  on('turn.start', async ($, e, next) => {
    session.files.clear()
    session.tests = null

    return next(e)
  })

  registerWaiting(on, config)

  on('turn.complete', async ($, e, next) => {
    await turnEnded($, e, config).catch(() => $.ui.log('done-ping: done ping failed', { to: 'debug' }))

    return next(e)
  })

  registerBand(on)
}

// The fallback row: drawn above the others, and stepping aside once the person writes again.
function registerBand(on: On): void {
  on('prompt.submit', async ($, e, next) => {
    if ((await read($, noticeAtom)) !== null) await update($, noticeAtom, () => null)

    return next(e)
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const theirs = await next(e)
    const notice: PingNotice | null = await read($, noticeAtom)
    if (notice === null || e.props.hasSurvey || (await hasLouderNotice($))) return theirs
    const band = {
      notice, columns: e.props.bodyColumns, theme: await read($, themeAtom), isRich: e.surface !== 'terminal',
      onDismiss: () => void update($, noticeAtom, () => null),
    }

    const ui = $.ui.resolve(e)

    return pinned(e, pingRow(ui, band, theirs))
  })
}
