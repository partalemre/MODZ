import { resolve, segments, stripGlobals } from './shell'
import { saidOf } from './gitwords'
import { drivesOn, posix } from './tree'

export type GitAction = {
  kind: string
  verb: string
  running: string
  done: string
  tone: string
  icon: { nerd: string; plain: string }
  init?: boolean
}

const ICON = {
  commit: { nerd: '\u{f417}', plain: '●' },
  push: { nerd: '\u{f0552}', plain: '↑' },
  pull: { nerd: '\u{f0553}', plain: '↓' },
  branch: { nerd: '\u{f418}', plain: '⑂' },
  merge: { nerd: '\u{f419}', plain: '⑃' },
  pr: { nerd: '\u{f407}', plain: '⇄' },
  github: { nerd: '\u{f408}', plain: '◎' },
  stash: { nerd: '\u{f01bc}', plain: '≡' },
  undo: { nerd: '\u{f054c}', plain: '↶' },
  tag: { nerd: '\u{f412}', plain: '⌖' },
  git: { nerd: '\u{e702}', plain: '±' },
}

export const TONES: Record<string, { bright: string[]; dim: string[]; solid: string }> = {
  orange: { bright: ['#f97316', '#fb923c', '#fdba74', '#ffedd5'], dim: ['#8a4316', '#a3562a', '#bd7444', '#d29267'], solid: '#f97316' },
  green: { bright: ['#22c55e', '#4ade80', '#86efac', '#dcfce7'], dim: ['#14532d', '#166534', '#2f7a47', '#4f9a66'], solid: '#4ade80' },
  teal: { bright: ['#14b8a6', '#2dd4bf', '#5eead4', '#ccfbf1'], dim: ['#0f5e57', '#16786f', '#2a9488', '#4fb3a8'], solid: '#2dd4bf' },
  blue: { bright: ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'], dim: ['#1e3a8a', '#1d4ed8', '#3b6fd1', '#6b93dc'], solid: '#60a5fa' },
  iris: { bright: ['#a855f7', '#c084fc', '#d8b4fe', '#f3e8ff'], dim: ['#581c87', '#6b21a8', '#8b47c4', '#a874d6'], solid: '#c084fc' },
  purple: { bright: ['#a855f7', '#c084fc', '#d8b4fe', '#f3e8ff'], dim: ['#581c87', '#6b21a8', '#8b47c4', '#a874d6'], solid: '#c084fc' },
  cyan: { bright: ['#06b6d4', '#22d3ee', '#67e8f9', '#cffafe'], dim: ['#155e75', '#0e7490', '#2b8ea3', '#5aa9b8'], solid: '#22d3ee' },
  red: { bright: ['#ef4444', '#f87171', '#fca5a5', '#fee2e2'], dim: ['#7f1d1d', '#991b1b', '#b54040', '#c96a6a'], solid: '#f87171' },
}

// What each verb says comes from gitwords.ts when it is found, in the session's language.
type VerbSpec = Omit<GitAction, 'kind' | 'running' | 'done'>

const GIT_VERBS: Record<string, VerbSpec> = {
  commit: { verb: 'commit', tone: 'green', icon: ICON.commit },
  push: { verb: 'push', tone: 'teal', icon: ICON.push },
  pull: { verb: 'pull', tone: 'blue', icon: ICON.pull },
  fetch: { verb: 'fetch', tone: 'blue', icon: ICON.pull },
  checkout: { verb: 'checkout', tone: 'blue', icon: ICON.branch },
  switch: { verb: 'switch', tone: 'blue', icon: ICON.branch },
  branch: { verb: 'branch', tone: 'blue', icon: ICON.branch },
  merge: { verb: 'merge', tone: 'iris', icon: ICON.merge },
  rebase: { verb: 'rebase', tone: 'iris', icon: ICON.merge },
  'cherry-pick': { verb: 'cherry-pick', tone: 'iris', icon: ICON.merge },
  stash: { verb: 'stash', tone: 'orange', icon: ICON.stash },
  reset: { verb: 'reset', tone: 'red', icon: ICON.undo },
  restore: { verb: 'restore', tone: 'red', icon: ICON.undo },
  revert: { verb: 'revert', tone: 'red', icon: ICON.undo },
  add: { verb: 'add', tone: 'green', icon: ICON.git },
  rm: { verb: 'rm', tone: 'red', icon: ICON.git },
  mv: { verb: 'mv', tone: 'orange', icon: ICON.git },
  tag: { verb: 'tag', tone: 'iris', icon: ICON.tag },
  init: { verb: 'init', tone: 'green', icon: ICON.git, init: true },
  clone: { verb: 'clone', tone: 'blue', icon: ICON.pull, init: true },
}

const GH_VERBS: Record<string, VerbSpec> = {
  'pr create': { verb: 'pr create', tone: 'iris', icon: ICON.pr },
  'pr merge': { verb: 'pr merge', tone: 'iris', icon: ICON.merge },
  'pr checkout': { verb: 'pr checkout', tone: 'blue', icon: ICON.pr },
  'pr comment': { verb: 'pr comment', tone: 'iris', icon: ICON.pr },
  'pr review': { verb: 'pr review', tone: 'iris', icon: ICON.pr },
  'repo clone': { verb: 'repo clone', tone: 'blue', icon: ICON.github, init: true },
  'release create': { verb: 'release create', tone: 'iris', icon: ICON.tag },
  'issue create': { verb: 'issue create', tone: 'iris', icon: ICON.github },
}

const READ_ONLY_GIT = new Set(['status', 'log', 'diff', 'show', 'blame', 'rev-parse', 'ls-files', 'grep', 'describe', 'config', 'remote', 'reflog', 'shortlog', 'help', 'version', 'check-ignore'])

function gitVerb(tokens: string[]): number {
  let i = 1
  while (i < tokens.length && (tokens[i] ?? '').startsWith('-')) {
    if (tokens[i] === '-C' || tokens[i] === '-c') i++
    i++
  }
  return i
}

function gitReadOnly(verb: string, rest: string[]): boolean {
  if (!verb || READ_ONLY_GIT.has(verb)) return true
  if (verb === 'stash') return ['list', 'show'].includes(rest[0] ?? '')
  if (verb === 'branch') return rest.every(t => t.startsWith('-'))
  if (verb === 'tag') return rest.length === 0 || rest.some(t => /^(-l|--list|-n\d*|--contains|--points-at|--merged|--no-merged|-v|--verify)$/.test(t))
  return false
}

export function chainOf(command: string): { size: number; and: boolean } {
  const seps: string[] = []
  const size = segments(command, seps).length
  return { size, and: seps.every(s => s === '&&') }
}

export function gitActions(command: string): GitAction[] {
  const out: GitAction[] = []
  for (const raw of segments(command)) {
    const tokens = stripGlobals(raw)
    const head = tokens[0]?.split('/').pop()
    if (head === 'git') {
      const i = gitVerb(tokens)
      const verb = tokens[i] ?? ''
      const rest = tokens.slice(i + 1)
      if (gitReadOnly(verb, rest)) continue
      const spec = verb === 'checkout' && rest.includes('--') ? GIT_VERBS.restore : GIT_VERBS[verb]
      if (spec) out.push({ kind: `git ${verb}`, ...spec, ...saidOf(spec.verb) })
    } else if (head === 'gh') {
      const pair = `${tokens[1] ?? ''} ${tokens[2] ?? ''}`
      const spec = GH_VERBS[pair]
      if (spec) out.push({ kind: `gh ${pair}`, ...spec, ...saidOf(spec.verb) })
    }
  }
  return out
}

export const BRANCH_ICON = ICON.branch

const READERS = new Set(['rg', 'grep', 'egrep', 'fgrep', 'find', 'fd', 'fdfind', 'cat', 'head', 'tail', 'bat', 'less', 'more', 'ls', 'eza', 'tree', 'wc', 'sed', 'awk', 'jq'])
const PATTERN_FIRST = new Set(['rg', 'grep', 'egrep', 'fgrep', 'sed', 'awk', 'jq'])
const OUTPUT_PATHS = new Set(['rg', 'grep', 'egrep', 'fgrep', 'find', 'fd', 'fdfind'])

const WRITE_FLAGS = /^-(delete|exec|execdir|ok|okdir|fprint\w*|fls|x|X|-exec|-exec-batch)$/

export function readOnly(command: string): boolean {
  const bare = ` ${command}`.replace(/\d*>&\d/g, ' ').replace(/(\d*|&)>>?\s*\/dev\/null/g, ' ')
  if (/[^>]>[^>&]|>>/.test(bare)) return false
  return segments(command).every(raw => {
    const tokens = stripGlobals(raw)
    const head = tokens[0]?.split('/').pop() ?? ''
    if (head === 'cd' || head === 'echo' || head === 'printf' || head === 'true' || head === 'pwd') return true
    if (head === 'git') {
      const i = gitVerb(tokens)
      return gitReadOnly(tokens[i] ?? '', tokens.slice(i + 1))
    }
    if (head === 'sed') return !tokens.some(t => /^-i/.test(t))
    if (head === 'find' || head === 'fd' || head === 'fdfind') return !tokens.some(t => WRITE_FLAGS.test(t))
    return READERS.has(head)
  })
}

export function readTargets(command: string, at: { cwd: string; stdout: string; home?: string }): string[] {
  const { stdout, home = '' } = at
  let cwd = at.cwd
  const out = new Set<string>()
  let listsPaths = false
  for (const raw of segments(command)) {
    const tokens = stripGlobals(raw).map(t => posix(t.replace(/^["']|["']$/g, '')))
    const head = tokens[0]?.split('/').pop() ?? ''
    if (head === 'cd' && tokens[1]) {
      cwd = resolve(cwd, tokens[1], home)
      continue
    }
    if (!READERS.has(head)) continue
    if (head === 'sed' && tokens.some(t => /^-i/.test(t))) continue
    if (OUTPUT_PATHS.has(head)) listsPaths = true
    const args = tokens.slice(1)
    let skipPattern = PATTERN_FIRST.has(head) && !args.some(t => t === '-e' || t === '-f' || t === '--files')
    for (let i = 0; i < args.length; i++) {
      const a = args[i] ?? ''
      if (a.startsWith('-')) {
        if (/^-(e|f|g|t|T|m|A|B|C|-glob|-type|-max-count|name|iname|maxdepth|mindepth)$/.test(a)) i++
        continue
      }
      if (skipPattern) {
        skipPattern = false
        continue
      }
      if (/[*?<>|]/.test(a)) continue
      out.add(resolve(cwd, a, home))
    }
  }
  if (listsPaths) {
    for (const line of stdout.split('\n').slice(0, 400)) {
      const path = posix(line).match(drivesOn() ? /^((?:[A-Za-z]:)?[^:\0]+?)(?::\d+[:-]|$|:)/ : /^([^:\0]+?)(?::\d+[:-]|$|:)/)?.[1]?.trim()
      if (path && !path.includes(' ')) out.add(resolve(cwd, path, home))
    }
  }
  return [...out].slice(0, 60)
}
