import type { Ping } from './ping'

// How a sound setting plays: a macOS system sound by name, a file through afplay, or none.
export type Sound = { kind: 'name'; name: string } | { kind: 'file'; path: string } | { kind: 'none' }

const SYSTEM_SOUNDS = /^\/System\/Library\/Sounds\/([A-Za-z]+)\.aiff$/
const SILENT = ['', 'none', 'off', 'yok', 'sessiz']

export const NOTIFIER_PATHS = ['/opt/homebrew/bin/terminal-notifier', '/usr/local/bin/terminal-notifier']

export function soundOf(setting: string): Sound {
  const text = setting.trim()
  if (SILENT.includes(text.toLowerCase())) return { kind: 'none' }
  const system = SYSTEM_SOUNDS.exec(text)
  if (system?.[1] !== undefined) return { kind: 'name', name: system[1] }
  if (text.includes('/')) return { kind: 'file', path: text }

  return { kind: 'name', name: text }
}

// The text travels as argv items, never spliced into the script, so quotes in it cannot break out.
export function osascriptArgv(ping: Ping, sound: Sound): string[] {
  const withSound = sound.kind === 'name' ? ' sound name (item 4 of argv)' : ''
  const script = `display notification (item 1 of argv) with title (item 2 of argv) subtitle (item 3 of argv)${withSound}`
  const argv = ['osascript', '-e', 'on run argv', '-e', script, '-e', 'end run', ping.body, ping.title, ping.subtitle]

  return sound.kind === 'name' ? [...argv, sound.name] : argv
}

// terminal-notifier draws the host app's icon (`-sender`) and replaces the project's previous banner (`-group`).
export function terminalNotifierArgv(spec: { path: string; ping: Ping; sound: Sound; sender: string | null }): string[] {
  const { ping, sound, sender } = spec
  const argv = [spec.path, '-title', ping.title, '-subtitle', ping.subtitle, '-message', ping.body, '-group', `done-ping:${ping.project}`]
  if (sender !== null) argv.push('-sender', sender, '-activate', sender)
  if (sound.kind === 'name') argv.push('-sound', sound.name)

  return argv
}

export function afplayArgv(sound: Sound): string[] | null {
  return sound.kind === 'file' ? ['afplay', sound.path] : null
}

// `lsappinfo info -only bundleid <asn>` prints `"CFBundleIdentifier"="id"` or `bundleID="id"`.
export function frontBundleOf(lsappinfo: string): string | null {
  const match = /(?:"CFBundleIdentifier"|bundleID)\s*=\s*"([^"]+)"/i.exec(lsappinfo)

  return match?.[1] ?? null
}

export function asnOf(front: string): string | null {
  const match = /ASN:[0-9a-fx-]+/i.exec(front)

  return match?.[0] ?? null
}
