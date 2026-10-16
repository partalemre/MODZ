import { packOf } from './pack'
import type { SoundPack } from './pack'
import { words } from './words'

// `fail`: a finished turn whose own test command failed, the one finish worth a Flare look.
export type PingKind = 'done' | 'fail' | 'wait'

// One notification (RESEARCH.md §c): `title` the outcome in at most four words, `subtitle` the
// project, `body` facts only (files, tests); `detail` is the in-app row's line. Never code or secrets.
export type Ping = { kind: PingKind; project: string; title: string; subtitle: string; body: string; detail: string }

// What the turn's own test commands said: the last one that ran wins.
export type TestsSeen = 'pass' | 'fail' | null

export type PingConfig = {
  thresholdSeconds: number
  isPermissionPing: boolean
  sound: string
  soundPack: SoundPack
  isQuietWhenFocused: boolean
  isAppNotification: boolean
}

const MS_PER_SECOND = 1_000
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const DEFAULT_THRESHOLD = 60
const DEFAULT_SOUND = 'Glass'
const SILENT = 'none'
const BODY_CHARS = 80
const EDIT_TOOLS = ['Edit', 'Write', 'MultiEdit', 'NotebookEdit']
const PATH_KEYS = ['file_path', 'notebook_path', 'path']
const FILE_KEYS = ['file_path', 'notebook_path', 'path']
const TEST_COMMAND = /\b(?:(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?test|vitest|jest|pytest|mocha|playwright\s+test|go\s+test|cargo\s+test|flutter\s+test|dart\s+test|phpunit|rspec)\b/

export function configFrom(options: Record<string, unknown>): PingConfig {
  const threshold = Number(options.thresholdSeconds)
  const soundPack = packOf(options.soundPack)
  // A pack takes the banner's own sound's place, so one ping never rings twice.
  const banner = typeof options.sound === 'string' ? options.sound.trim() : DEFAULT_SOUND
  const sound = soundPack === 'off' ? banner : SILENT

  return {
    thresholdSeconds: Number.isFinite(threshold) && threshold >= 0 ? threshold : DEFAULT_THRESHOLD,
    isPermissionPing: options.pingOnPermission !== false,
    sound,
    soundPack,
    isQuietWhenFocused: options.quietWhenFocused !== false,
    isAppNotification: options.appNotification !== false,
  }
}

export function durationText(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / MS_PER_SECOND))
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE)
  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  if (hours > 0) return words().hours(hours, minutes % MINUTES_PER_HOUR)
  if (minutes > 0) return words().minutes(minutes, seconds % SECONDS_PER_MINUTE)

  return words().seconds(seconds)
}

export function projectOf(cwd: string): string {
  const parts = cwd.split('/').filter(part => part !== '')

  return parts[parts.length - 1] ?? 'Claude'
}

export function editedPath(input: Record<string, unknown>): string | null {
  if (typeof input.tool !== 'string' || !EDIT_TOOLS.includes(input.tool)) return null
  for (const key of PATH_KEYS) {
    const value = input[key]
    if (typeof value === 'string' && value !== '') return value
  }

  return null
}

export function clip(text: string, max = BODY_CHARS): string {
  const flat = text.replace(/\s+/g, ' ').trim()

  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`
}

// The opening words of a reply, without markdown marks: what a banner can show.
export function plainSnippet(markdown: string): string {
  const text = markdown
    .replace(/```[\s\S]*?(```|$)/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|[-*+>]|\d+\.)\s+/gm, '')
    .replace(/[*_`~|]/g, '')

  return clip(text)
}

export const isTestCommand = (command: unknown): boolean => typeof command === 'string' && TEST_COMMAND.test(command)

function testsText(tests: TestsSeen): string {
  if (tests === null) return ''

  return tests === 'pass' ? words().testsPassed : words().testsFailed
}

// "Tur bitti" · project · "testler geçti · 3 dosya"; with neither fact, how long it took. Facts lead with
// what matters most on return (the tests), so a narrow row drops the duration first.
export function donePing(spec: { project: string; durationMs: number; files: number; tests: TestsSeen }): Ping {
  const took = durationText(spec.durationMs)
  const tests = testsText(spec.tests)
  const says = words()
  const hasFiles = spec.files > 0
  const body = [tests, hasFiles ? says.files(spec.files) : ''].filter(part => part !== '').join(' · ') || says.took(took)
  const detail = [tests, hasFiles ? says.filesChanged(spec.files) : '', took].filter(part => part !== '').join(' · ')
  const kind = spec.tests === 'fail' ? 'fail' : 'done'

  return { kind, project: spec.project, title: says.done, subtitle: spec.project, body, detail }
}

function baseName(path: string): string {
  return path.split('/').filter(part => part !== '').pop() ?? path
}

// What the tool wants, without its input: a command is never shown, a file by its name, a page by its host.
export function toolDetail(tool: string, input: Record<string, unknown>): string {
  if (tool === 'Bash') return words().bashCommand
  for (const key of FILE_KEYS) {
    const value = input[key]
    if (typeof value === 'string' && value.trim() !== '') return `${tool} · ${clip(baseName(value), BODY_CHARS)}`
  }
  const host = typeof input.url === 'string' ? /^https?:\/\/([^/?#]+)/.exec(input.url)?.[1] : undefined

  return host === undefined ? words().toolPermission(tool) : `${tool} · ${host}`
}

export function questionOf(input: Record<string, unknown>): string {
  const questions = Array.isArray(input.questions) ? input.questions : []
  const first = questions[0] as { question?: unknown } | undefined

  return typeof first?.question === 'string' ? plainSnippet(first.question) : ''
}

export function permissionPing(project: string, tool: string, input: Record<string, unknown>): Ping {
  const body = toolDetail(tool, input)

  return { kind: 'wait', project, title: words().waitingApproval, subtitle: project, body, detail: body }
}

export function questionPing(project: string, input: Record<string, unknown>): Ping {
  const body = questionOf(input) || words().hasQuestion

  return { kind: 'wait', project, title: words().waitingAnswer, subtitle: project, body, detail: body }
}

export function parseSeconds(text: string): number | null {
  const match = /^(\d+)\s*(s|sn|sec|secs|seconds|m|dk|min|mins|minutes)?$/i.exec(text.trim())
  if (match === null) return null
  const value = Number(match[1])
  const unit = (match[2] ?? '').toLowerCase()
  const isMinutes = unit.startsWith('m') || unit === 'dk'

  return isMinutes ? value * SECONDS_PER_MINUTE : value
}
