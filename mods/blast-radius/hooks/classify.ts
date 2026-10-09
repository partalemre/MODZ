// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0
//
// What counts as risky: reads a shell command line and returns its first risky
// segment, following `cd`, `pushd`, `popd` and `git -C` to where it would run.

export type GitKind = 'git-reset' | 'git-clean' | 'git-push-force' | 'git-checkout'

export type GitRisk = { kind: GitKind; label: string; args: string[]; dir: string | null }

export type Risk =
  | { kind: 'rm'; label: string; targets: string[]; dir: string | null }
  | GitRisk
  | { kind: 'migrate'; tool: string; label: string; dir: string | null }

// A segment that only moves the folder: where to, null for the session folder.
type Move = { cd: string | null }

type Step = Risk | Move | null

// sudo options that take a value, so the value isn't read as the command.
const SUDO_VALUE_OPTIONS = new Set(['-u', '-g', '-C', '-D', '-h', '-p', '-r', '-t', '-T', '-U'])
// Commands that only read, so a bare word "migrate" in them isn't a migration.
const READ_ONLY = new Set(['ls', 'cat', 'echo', 'printf', 'grep', 'rg', 'find', 'less', 'head', 'tail', 'cd', 'git'])
// Words that can come before the real command without changing what it does.
const PREFIXES = new Set(['command', 'exec', 'env', 'nohup', 'time', 'then', 'do', 'else', '!'])
const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/

const isMove = (step: Step): step is Move => step !== null && 'cd' in step

/** A folder a later `cd arg` moves to, given the folder so far (null = the session folder). */
export function joinDir(dir: string | null, arg: string | undefined): string {
  if (arg === undefined || arg === '~' || arg.startsWith('/') || arg.startsWith('~/')) {
    return arg ?? '~'
  }

  return dir ? `${dir}/${arg}` : arg
}

/** Splits one segment into words, honouring quotes. Good enough to read flags and paths. */
export function tokenize(text: string): string[] {
  const words: string[] = []
  for (const match of text.matchAll(/"((?:[^"\\]|\\.)*)"|'([^']*)'|(\S+)/g)) {
    words.push(match[1] ?? match[2] ?? match[3] ?? '')
  }

  return words
}

/** The first risky segment of a shell command, or null. */
export function classify(command: string): Risk | null {
  let dir: string | null = null
  const scopes: (string | null)[] = [] // dir to restore when a ( subshell ) closes
  const pushed: (string | null)[] = [] // pushd stack, for popd
  for (const raw of command.split(/&&|\|\||;|\||\n/)) {
    const opens = raw.match(/^\s*\(+/)?.[0].trim().length ?? 0
    // Trailing redirects and & don't hide a closing ) : `(cd sub && make) > log`.
    const tail = raw.replace(/(?:\s*(?:\d*>>?|&>>?|<)\s*\S+|\s*&)+\s*$/, '')
    const closes = tail.match(/\)+\s*$/)?.[0].trim().length ?? 0
    for (let k = 0; k < opens; k += 1) scopes.push(dir)
    const step = classifySegment(raw, dir, pushed)
    if (step !== null && !isMove(step)) return step
    if (isMove(step)) dir = step.cd // a cd, pushd or popd moved the folder
    for (let k = 0; k < closes && scopes.length > 0; k += 1) dir = scopes.pop() ?? null // a cd inside ( ... ) doesn't outlive it
  }

  return null
}

/** The words of a segment with sudo, VAR=value, nice and harmless prefixes taken off. */
function commandWords(segment: string): string[] {
  const words = tokenize(segment.trim().replace(/^[({]+\s*/, '').replace(/\s*[)}]+$/, ''))
  while (words.length > 0 && ASSIGNMENT.test(words[0] ?? '')) words.shift()
  if (words[0] === 'sudo') {
    words.shift()
    while (words.length > 0 && (words[0] ?? '').startsWith('-')) {
      const option = words.shift() ?? ''
      if (SUDO_VALUE_OPTIONS.has(option)) words.shift()
    }
  }
  while (words.length > 0 && (PREFIXES.has(words[0] ?? '') || ASSIGNMENT.test(words[0] ?? ''))) words.shift()
  if (words[0] === 'nice') {
    words.shift()
    const option: string = words[0] ?? ''
    if (option === '-n') words.splice(0, 2)
    else if (/^-\d+$/.test(option)) words.shift()
  }

  return words
}

/** One segment: a risk, a folder change, or null. */
function classifySegment(segment: string, dir: string | null, pushed: (string | null)[]): Step {
  const words = commandWords(segment)
  const [first, ...args] = words
  if (first === undefined) return null
  const cmd = first.replace(/^\\/, '') // \rm skips aliases; it's still rm
  if (cmd === 'cd') return { cd: args[0] === '-' ? '-' : joinDir(dir, args[0]) }
  if (cmd === 'pushd') {
    pushed.push(dir)

    return { cd: joinDir(dir, args[0]) }
  }
  if (cmd === 'popd') return { cd: pushed.length > 0 ? (pushed.pop() ?? null) : '-' }
  if (cmd === 'rm' || cmd.endsWith('/rm')) {
    const risk = classifyRm(args, dir)
    if (risk !== null) return risk
  }
  if (cmd === 'git') {
    const risk = classifyGit(args, dir)
    if (risk !== null) return risk
  }

  return classifyMigrate(words, cmd, dir)
}

function classifyRm(args: string[], dir: string | null): Risk | null {
  const flags = args.filter(a => a.startsWith('-'))
  const recursive = flags.some(f => f === '--recursive' || (/^-[^-]/.test(f) && /[rR]/.test(f)))
  const force = flags.some(f => f === '--force' || (/^-[^-]/.test(f) && f.includes('f')))
  if (!recursive && !force) return null
  const targets = args.filter(a => !a.startsWith('-') || a === '-')

  return { kind: 'rm', label: `rm ${flags.join(' ')}`.trim(), targets, dir }
}

/** Git's own options come before the subcommand; -C moves where it runs. */
function gitSubcommand(args: string[], dir: string | null): { at: number; dir: string | null } {
  let gitDir = dir
  let at = 0
  while (at < args.length && (args[at] ?? '').startsWith('-')) {
    if (args[at] === '-C' && at + 1 < args.length) {
      gitDir = joinDir(gitDir, args[at + 1])
      at += 2
    } else if (args[at] === '-c' && at + 1 < args.length) {
      at += 2
    } else {
      at += 1
    }
  }

  return { at, dir: gitDir }
}

function classifyGit(args: string[], dir: string | null): Risk | null {
  const found = gitSubcommand(args, dir)
  const sub = args[found.at]
  const rest = args.slice(found.at + 1)
  const at = found.dir
  if (sub === 'reset' && rest.includes('--hard')) return { kind: 'git-reset', label: 'git reset --hard', args: rest, dir: at }
  if (sub === 'clean') return { kind: 'git-clean', label: 'git clean', args: rest, dir: at }
  const isForce = rest.some(a => a === '--force' || a === '-f' || a.startsWith('--force-with-lease') || /^\+/.test(a))
  if (sub === 'push' && isForce) return { kind: 'git-push-force', label: 'git push --force', args: rest, dir: at }
  const isStagedOnly = sub === 'restore' && rest.includes('--staged') && !rest.includes('--worktree') && !rest.includes('-W')
  if ((sub === 'checkout' || sub === 'restore') && rest.includes('.') && !isStagedOnly) {
    return { kind: 'git-checkout', label: `git ${sub} -- .`, args: rest, dir: at }
  }

  return null
}

function classifyMigrate(words: string[], cmd: string, dir: string | null): Risk | null {
  const joined = words.join(' ')
  if (/\balembic\s+upgrade\b/.test(joined)) return { kind: 'migrate', tool: 'alembic', label: 'alembic upgrade', dir }
  if (/\bdb:migrate(?!:status\b)/.test(joined)) return { kind: 'migrate', tool: 'rails', label: 'db:migrate', dir }
  if (/\bprisma\s+migrate\b/.test(joined)) return { kind: 'migrate', tool: 'prisma', label: 'prisma migrate', dir }
  if (/\bmanage\.py\s+migrate\b/.test(joined)) return { kind: 'migrate', tool: 'django', label: 'manage.py migrate', dir }
  if (!READ_ONLY.has(cmd) && words.slice(1).includes('migrate')) return { kind: 'migrate', tool: 'unknown', label: 'migrate', dir }

  return null
}
