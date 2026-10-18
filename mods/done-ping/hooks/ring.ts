import type { ProcessRunInit, ProcessRunResult } from 'claude-code'

import { afplayArgv, asnOf, frontBundleOf, NOTIFIER_PATHS, osascriptArgv, soundOf, terminalNotifierArgv } from './notifier'
import type { Sound } from './notifier'
import type { Ping, PingConfig } from './ping'

// Where a ping went: the app's own notification, a macOS banner, nowhere on purpose, or nowhere.
export type Rung = 'app' | 'system' | 'quiet' | 'failed'

export type RingSpec = { ping: Ping; config: PingConfig; isForced: boolean }

// What ringing reaches the host through; the hooks module builds it from `$`.
export type RingIo = {
  surfaces: () => Promise<readonly string[]>
  toolNames: () => Promise<string[]>
  checkTool: (tool: string, input: Record<string, unknown>) => Promise<string>
  callTool: (tool: string, input: Record<string, unknown>) => Promise<unknown>
  hostBundle: () => Promise<string | undefined>
  run: (argv: readonly string[], init?: ProcessRunInit) => Promise<ProcessRunResult>
  exists: (path: string) => Promise<boolean>
  log: (text: string) => void
}

type AppAnswer = 'sent' | 'present' | 'unavailable'

type PushResult = { localSent?: boolean; pushSent?: boolean; disabledReason?: string }

const PUSH_TOOL = 'PushNotification'
const DESKTOP_BUNDLE = 'com.anthropic.claudefordesktop'
const RUN_TIMEOUT_MS = 5_000

export function appMessage(ping: Ping): string {
  return `${ping.title} · ${ping.project}\n${ping.body}`
}

// The desktop app's own notification (its icon, its focus rule) through the PushNotification tool,
// used only where the tool exists and runs without asking.
async function appNotify(io: RingIo, spec: RingSpec): Promise<AppAnswer> {
  const surfaces = await io.surfaces()
  if (!surfaces.includes('desktop')) return 'unavailable'
  if (!(await io.toolNames()).includes(PUSH_TOOL)) return 'unavailable'
  const input = { message: appMessage(spec.ping), status: 'proactive' }
  if ((await io.checkTool(PUSH_TOOL, input)) !== 'allow') return 'unavailable'
  const ran = await io.callTool(PUSH_TOOL, input)
  const result = (ran as { result?: PushResult } | null)?.result ?? {}
  if (result.localSent === true || result.pushSent === true) return 'sent'
  if (result.disabledReason === 'user_present' && !spec.isForced) return 'present'

  return 'unavailable'
}

async function hostBundle(io: RingIo): Promise<string | null> {
  const value = await io.hostBundle()

  return value === undefined || value.trim() === '' ? null : value.trim()
}

// The surface list, or the launching app's bundle where an older engine names neither surface. A terminal
// opened inside the desktop app inherits its bundle, so a listed 'terminal' wins over the bundle.
export async function isDesktop(io: RingIo): Promise<boolean> {
  try {
    const surfaces = await io.surfaces()
    if (surfaces.includes('desktop')) return true
    if (surfaces.includes('terminal')) return false

    return (await hostBundle(io)) === DESKTOP_BUNDLE
  } catch {
    return false
  }
}

// True while the app this session runs in (the desktop app, the terminal) is the frontmost one.
async function isHostFrontmost(io: RingIo, host: string | null): Promise<boolean> {
  if (host === null) return false
  const front = await io.run(['lsappinfo', 'front'], { timeoutMs: RUN_TIMEOUT_MS })
  const asn = asnOf(front.stdout)
  if (front.exitCode !== 0 || asn === null) return false
  const info = await io.run(['lsappinfo', 'info', '-only', 'bundleid', asn], { timeoutMs: RUN_TIMEOUT_MS })

  return frontBundleOf(info.stdout) === host
}

async function notifierPath(io: RingIo): Promise<string | null> {
  for (const path of NOTIFIER_PATHS) {
    if (await io.exists(path)) return path
  }

  return null
}

type Banner = { ping: Ping; sound: Sound; host: string | null; isDesktop: boolean }

async function banner(io: RingIo, note: Banner): Promise<boolean> {
  const { ping, sound, host } = note
  const notifier = await notifierPath(io)
  if (notifier !== null) {
    const argv = terminalNotifierArgv({ path: notifier, ping, sound, sender: host })
    const shown = await io.run(argv, { timeoutMs: RUN_TIMEOUT_MS })
    if (shown.exitCode === 0) return true
  }
  // An osascript banner belongs to Script Editor and a click opens it; the desktop shows its own row instead.
  if (note.isDesktop) return false
  const shown = await io.run(osascriptArgv(ping, sound), { timeoutMs: RUN_TIMEOUT_MS })

  return shown.exitCode === 0
}

async function tryApp(io: RingIo, spec: RingSpec): Promise<AppAnswer> {
  if (!spec.config.isAppNotification) return 'unavailable'
  try {
    return await appNotify(io, spec)
  } catch (error) {
    io.log(`done-ping: app notification unavailable (${error instanceof Error ? error.message : 'unknown'})`)

    return 'unavailable'
  }
}

export async function ring(io: RingIo, spec: RingSpec): Promise<Rung> {
  const app = await tryApp(io, spec)
  if (app === 'sent') return 'app'
  if (app === 'present') return 'quiet'
  const host = await hostBundle(io)
  const shouldCheckFocus = spec.config.isQuietWhenFocused && !spec.isForced
  if (shouldCheckFocus && (await isHostFrontmost(io, host).catch(() => false))) return 'quiet'
  const sound = soundOf(spec.config.sound)
  const isShown = await banner(io, { ping: spec.ping, sound, host, isDesktop: await isDesktop(io) }).catch(() => false)
  const play = afplayArgv(sound)
  if (isShown && play !== null) {
    await io.run(play, { timeoutMs: RUN_TIMEOUT_MS }).catch(() => io.log('done-ping: afplay failed'))
  }

  return isShown ? 'system' : 'failed'
}
