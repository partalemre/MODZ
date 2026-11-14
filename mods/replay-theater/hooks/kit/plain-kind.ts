// MODZ kit — what kind of work a tool call is, so a drawing can give it a picture: looking, changing, checking,
// saving a version. Worked out by rules from the call's own input, as plain.ts works out its sentence.
import type { IconName } from './icons'
import type { Lang } from './lang'
import { leadsOf } from './plain-shell'
import type { Call } from './plain-shell'

export type Kind = 'read' | 'search' | 'edit' | 'run' | 'test' | 'save' | 'github' | 'install' | 'delete' | 'web' | 'agent' | 'wait' | 'ask' | 'plan' | 'service'

export const KIND_ICON: Record<Kind, IconName> = {
  read: 'eye', search: 'search', edit: 'pencil', run: 'terminal', test: 'shield', save: 'bookmark', github: 'branch', install: 'cube',
  delete: 'trash', web: 'globe', agent: 'sparkle', wait: 'clock', ask: 'bell', plan: 'list', service: 'plug',
}

// The kind's name: beside its icon in the picture of a run's order, and the icon's name for someone who cannot see it.
const WORDS: Record<Kind, readonly [en: string, tr: string]> = {
  read: ['look', 'inceleme'], search: ['search', 'arama'], edit: ['change', 'değişiklik'], run: ['command', 'komut'],
  test: ['check', 'kontrol'], save: ['saved version', 'sürüm kaydı'], github: ['GitHub', 'GitHub'], install: ['install', 'kurulum'],
  delete: ['delete', 'silme'], web: ['internet', 'internet'], agent: ['helper agent', 'yardımcı ajan'], wait: ['wait', 'bekleme'],
  ask: ['question', 'soru'], plan: ['plan', 'plan'], service: ['connected service', 'bağlı servis'],
}

export const kindWord = (kind: Kind, lang: Lang): string => WORDS[kind][lang === 'tr' ? 1 : 0]

const TOOL_KIND: Readonly<Record<string, Kind>> = {
  Read: 'read', NotebookRead: 'read', Skill: 'read', BashOutput: 'read', TaskOutput: 'read', Monitor: 'read',
  Glob: 'search', Grep: 'search', LS: 'search', ToolSearch: 'search',
  Write: 'edit', Edit: 'edit', MultiEdit: 'edit', NotebookEdit: 'edit',
  WebSearch: 'web', WebFetch: 'web', Artifact: 'web',
  Agent: 'agent', Task: 'agent', SendMessage: 'agent', SubagentHandback: 'agent',
  TodoWrite: 'plan', TaskCreate: 'plan', TaskUpdate: 'plan', TaskList: 'plan', TaskGet: 'plan', EnterPlanMode: 'plan', ExitPlanMode: 'plan',
  AskUserQuestion: 'ask', ScheduleWakeup: 'wait', CronCreate: 'wait',
}

const LOOKS = new Set(['cat', 'head', 'tail', 'less', 'ls', 'wc', 'stat', 'file', 'tree', 'du', 'which', 'pwd', 'echo', 'diff'])
const SEARCHES = new Set(['grep', 'rg', 'find', 'fd', 'ag'])
const GIT_LOOKS = new Set(['status', 'log', 'diff', 'show', 'branch', 'ls-files', 'remote', 'blame', 'worktree', 'rev-parse', 'fetch'])
const INSTALLERS = new Set(['npm', 'pnpm', 'yarn', 'bun', 'pip', 'pip3', 'brew', 'cargo', 'gem', 'apt', 'apt-get', 'flutter', 'dart'])
const INSTALL_VERBS = new Set(['install', 'add', 'i', 'ci', 'get', 'upgrade'])
const CHECK_WORD = /^(tests?|check|validate|lint|tsc|jest|vitest|pytest|typecheck|analyze)$/

// A line of several steps is the kind of its weightiest one: `ls && git commit` saves a version.
const WEIGHT: readonly Kind[] = ['wait', 'read', 'search', 'run', 'web', 'test', 'install', 'github', 'save', 'delete']

const last = (path: string): string => path.split('/').filter(Boolean).at(-1) ?? path

/** The kind of one command of a line: `rm` deletes, `git commit` saves a version. */
export function commandKind(call: Call): Kind {
  const name = last(call.name)
  const verb = call.args.find(arg => !arg.startsWith('-')) ?? ''
  if (name === 'sleep') return 'wait'
  if (name === 'gh') return 'github'
  if (name === 'git') return GIT_LOOKS.has(verb) ? 'read' : 'save'
  if (name === 'rm' || name === 'rmdir' || (name === 'find' && call.args.includes('-delete'))) return 'delete'
  if (name === 'curl' || name === 'wget') return 'web'
  if ([name, ...call.args].some(word => CHECK_WORD.test(last(word)))) return 'test'
  if (INSTALLERS.has(name) && call.args.some(arg => INSTALL_VERBS.has(arg))) return 'install'
  if (SEARCHES.has(name)) return 'search'

  return LOOKS.has(name) ? 'read' : 'run'
}

function shellKind(command: string): Kind {
  const kinds = leadsOf(command).map(commandKind)

  return kinds.reduce<Kind>((top, kind) => (WEIGHT.indexOf(kind) > WEIGHT.indexOf(top) ? kind : top), kinds[0] ?? 'run')
}

function serviceKind(tool: string): Kind {
  if (/browser|chrome|playwright|web_|exa|fetch/i.test(tool)) return 'web'

  return /github/i.test(tool) ? 'github' : 'service'
}

const fieldOf = (input: unknown, name: string): string => {
  const value = typeof input === 'object' && input !== null ? (input as Record<string, unknown>)[name] : undefined

  return typeof value === 'string' ? value.trim() : ''
}

/**
 * The kind of work a call is.
 *
 * @example kindOf('Bash', { command: 'sleep 5; gh pr merge 70' }) // "github"
 */
export function kindOf(tool: string, input: unknown): Kind {
  if (tool === 'Bash' || tool === 'PowerShell') return shellKind(fieldOf(input, 'command'))
  if (tool.startsWith('mcp__')) return serviceKind(tool)

  return TOOL_KIND[tool] ?? 'service'
}

const PURPOSE_MAX = 96

/**
 * What the call is for, in the words the agent itself wrote with it (a shell command's `description`, a browser
 * step's `action_summary`); empty when it wrote none. Read from the call, so it costs nothing.
 */
export function purposeOf(input: unknown): string {
  const text = (fieldOf(input, 'description') || fieldOf(input, 'action_summary')).split('\n')[0]?.trim() ?? ''

  return text.length > PURPOSE_MAX ? `${text.slice(0, PURPOSE_MAX - 1)}…` : text
}

const REASON_MAX = 160

/**
 * Why a step's calls were made, in the agent's own words: the last sentence it wrote before making them ("Önce
 * yayın planına bakıyorum."); empty when it called its tools without a word. Read from the reply, so it costs nothing.
 */
export function reasonOf(answer: string): string {
  const line = answer.split('\n').map(part => part.replace(/[*_`#>]+/g, '').trim()).filter(part => part !== '').at(-1) ?? ''
  const text = line.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[:：]$/, '').trim()

  return text.length > REASON_MAX ? `${text.slice(0, REASON_MAX - 1)}…` : text
}
