// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0
//
// What counts as risky: reads a shell command line and returns its risky segments, following
// `cd`, `pushd`, `popd` and `git -C` to where each would run, and reading the command inside
// `bash -c`, `eval`, `xargs` and prefixes such as `sudo` or `timeout`.

import { classifyGit } from './classify-git'
import { classifyTool } from './classify-tools'
import { commandName, joinDir, redirectTargets, splitCommands, tokenize } from './shell'

export type GitKind = 'git-reset' | 'git-clean' | 'git-push-force' | 'git-checkout' | 'git-stash' | 'git-branch-delete' | 'git-push-delete' | 'git-worktree'

// `isFromInput`: what it acts on comes from its input (`… | xargs rm`), so it can't be measured.
type Base = { label: string; dir: string | null; isFromInput?: boolean }

// `paths`: the pathspec it is limited to (none: the whole tree); `dropsStaged`: staged changes go too.
export type GitRisk = Base & { kind: GitKind; args: string[]; paths?: string[]; dropsStaged?: boolean }

export type ToolKind = 'docker-volume' | 'docker-prune' | 'docker-compose' | 'database' | 'terraform' | 'kubectl' | 'rsync'

export type Risk =
  | (Base & { kind: 'rm'; targets: string[] })
  | GitRisk
  | (Base & { kind: 'migrate'; tool: string })
  // `args`: find's own, with the deleting action swapped for -print, so they can be dry-run.
  | (Base & { kind: 'find'; args: string[] })
  // Files whose contents it would replace or wipe: a `>` redirect, mv/cp onto a file, truncate, dd, shred, tee.
  | (Base & { kind: 'overwrite'; paths: string[] })
  | (Base & { kind: 'tool'; tool: ToolKind; args: string[] })

// A segment that only moves the folder: where to, null for the session folder.
type Move = { cd: string | null }

type Context = { dir: string | null; pushed: (string | null)[]; depth: number; found: Risk[] }

// sudo options that take a value, so the value isn't read as the command.
const SUDO_VALUE_OPTIONS = ['-u', '-g', '-C', '-D', '-h', '-p', '-r', '-t', '-T', '-U']
// Commands that only change how the next one runs: the options that take a value, and how many words follow them.
const WRAPPERS: Record<string, { valued: string[]; skip: number }> = {
  sudo: { valued: SUDO_VALUE_OPTIONS, skip: 0 },
  doas: { valued: ['-u', '-C'], skip: 0 },
  env: { valued: ['-u', '-C', '--unset', '--chdir'], skip: 0 },
  nice: { valued: ['-n', '--adjustment'], skip: 0 },
  ionice: { valued: ['-c', '-n', '-p', '-P', '-u', '--class', '--classdata'], skip: 0 },
  timeout: { valued: ['-s', '-k', '--signal', '--kill-after'], skip: 1 },
  stdbuf: { valued: ['-i', '-o', '-e'], skip: 0 },
  exec: { valued: ['-a'], skip: 0 },
  nohup: { valued: [], skip: 0 },
  time: { valued: [], skip: 0 },
  command: { valued: [], skip: 0 },
  builtin: { valued: [], skip: 0 },
}
const KEYWORDS = new Set(['then', 'do', 'else', '!', 'if', 'elif', 'while', 'until'])
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh'])
const XARGS_VALUED = new Set(['-I', '-L', '-n', '-P', '-s', '-d', '-E', '-a', '--arg-file', '--delimiter', '--max-args', '--max-procs', '--max-lines', '--eof'])
// Commands that only read, so a bare word "migrate" in them isn't a migration.
const READ_ONLY = new Set(['ls', 'cat', 'echo', 'printf', 'grep', 'rg', 'find', 'less', 'head', 'tail', 'cd', 'git'])
const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/
// A redirect operator as its own word, or glued to its target (`2>/dev/null`).
const REDIRECT_ALONE = /^(?:\d*|&)(?:>>?|<)(?:&?\d*|\|)?$/
const REDIRECT_GLUED = /^(?:\d*|&)(?:>>?|<)/
// `bash -c "…"` inside `eval "…"` inside `sh -c`: deeper than this is not read.
const MAX_DEPTH = 4

/** `NAME=value` segments (or `export NAME=value`) set earlier on the line, so `rm -rf $NAME` can be measured. */
function readAssignments(segment: string, vars: Map<string, string>): void {
  const words = tokenize(segment.trim())
  if (words[0] === 'export') words.shift()
  if (words.length === 0 || !words.every(word => ASSIGNMENT.test(word))) return
  for (const word of words) {
    const at = word.indexOf('=')
    vars.set(word.slice(0, at), expandVars(word.slice(at + 1), vars))
  }
}

/** `$NAME` and `${NAME}` from earlier assignments on the line; anything else stays as written. */
export function expandVars(text: string, vars: Map<string, string>): string {
  return text.replace(/\$(?:\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*))/g, (whole, braced, bare) => vars.get(braced ?? bare) ?? whole)
}

/** Every risky segment of a shell command, in the order it would run them. */
export function classifyAll(command: string): Risk[] {
  return classifyLine(command, null, 0)
}

/** The first risky segment of a shell command, or null. */
export function classify(command: string): Risk | null {
  return classifyAll(command)[0] ?? null
}

function classifyLine(command: string, startDir: string | null, depth: number): Risk[] {
  const ctx: Context = { dir: startDir, pushed: [], depth, found: [] }
  if (depth > MAX_DEPTH) return ctx.found
  const scopes: (string | null)[] = [] // dir to restore when a ( subshell ) closes
  const vars = new Map<string, string>()
  for (const raw of splitCommands(command)) {
    readAssignments(raw, vars)
    const opens = raw.match(/^\s*\(+/)?.[0].trim().length ?? 0
    // Trailing redirects and & don't hide a closing ) : `(cd sub && make) > log`.
    const tail = raw.replace(/(?:\s*(?:\d*>>?|&>>?|<)\s*\S+|\s*&)+\s*$/, '')
    const closes = tail.match(/\)+\s*$/)?.[0].trim().length ?? 0
    for (let k = 0; k < opens; k += 1) scopes.push(ctx.dir)
    const segment = expandVars(raw, vars)
    const move = classifyWords(commandWords(segment), ctx)
    // A redirect after the closing ) writes where the ( subshell ) started.
    const closeAt = closes > 0 ? segment.lastIndexOf(')') : segment.length
    addWrites(segment.slice(0, closeAt), ctx)
    if (move !== null) ctx.dir = move.cd // a cd, pushd or popd moved the folder
    for (let k = 0; k < closes && scopes.length > 0; k += 1) ctx.dir = scopes.pop() ?? null // a cd inside ( ... ) doesn't outlive it
    addWrites(segment.slice(closeAt), ctx)
  }

  return ctx.found
}

function addWrites(text: string, ctx: Context): void {
  const targets = redirectTargets(text)
  if (targets.length > 0) ctx.found.push({ kind: 'overwrite', label: `> ${targets.join(' ')}`, paths: targets, dir: ctx.dir })
}

/** The words with redirects (`> log`, `2>/dev/null`, `< list`) taken out. */
function dropRedirects(words: string[]): string[] {
  const kept: string[] = []
  for (let i = 0; i < words.length; i += 1) {
    const word = words[i] ?? ''
    if (REDIRECT_ALONE.test(word)) i += 1
    else if (!REDIRECT_GLUED.test(word)) kept.push(word)
  }

  return kept
}

/** The words without VAR=value, shell keywords and wrappers such as sudo, timeout or nice. */
export function stripPrefixes(input: string[]): string[] {
  const words = [...input]
  for (let changed = true; changed && words.length > 0; ) {
    const first = words[0] ?? ''
    const name = commandName(first)
    const wrapper = Object.hasOwn(WRAPPERS, name) ? WRAPPERS[name] : undefined
    changed = ASSIGNMENT.test(first) || KEYWORDS.has(first) || wrapper !== undefined
    if (!changed) break
    words.shift()
    if (wrapper === undefined) continue
    while ((words[0] ?? '').startsWith('-') && words[0] !== '-') {
      const option = words.shift() ?? ''
      if (option === '--') break
      if (wrapper.valued.includes(option)) words.shift()
    }
    words.splice(0, wrapper.skip)
  }

  return words
}

function commandWords(segment: string): string[] {
  return stripPrefixes(dropRedirects(tokenize(segment.trim().replace(/^[({]+\s*/, '').replace(/\s*[)}]+$/, ''))))
}

/** One command's words: risks go into `ctx.found`; a folder change is returned. */
function classifyWords(words: string[], ctx: Context): Move | null {
  const [first, ...args] = words
  if (first === undefined) return null
  const cmd = commandName(first)
  if (cmd === 'cd') return { cd: args[0] === '-' ? '-' : joinDir(ctx.dir, args[0]) }
  if (cmd === 'pushd') {
    ctx.pushed.push(ctx.dir)

    return { cd: joinDir(ctx.dir, args[0]) }
  }
  if (cmd === 'popd') return { cd: ctx.pushed.length > 0 ? (ctx.pushed.pop() ?? null) : '-' }
  const inner = innerCommand(cmd, args)
  if (inner !== null) {
    ctx.found.push(...classifyLine(inner, ctx.dir, ctx.depth + 1))

    return null
  }
  if (cmd === 'xargs') return classifyXargs(args, ctx)
  const risk = cmd === 'rm' ? classifyRm(args, ctx.dir) : cmd === 'git' ? classifyGit(args, ctx.dir) : null
  const found = risk ?? classifyTool(words, cmd, ctx.dir) ?? classifyMigrate(words, cmd, ctx.dir)
  if (found !== null) ctx.found.push(found)

  return null
}

/** The command line `bash -c "…"` or `eval "…"` runs, or null. */
function innerCommand(cmd: string, args: string[]): string | null {
  if (cmd === 'eval') return args.join(' ')
  if (!SHELLS.has(cmd)) return null
  const at = args.findIndex(arg => /^-[a-zA-Z]*c[a-zA-Z]*$/.test(arg))

  return at === -1 ? null : (args[at + 1] ?? null)
}

/** `xargs rm`, `xargs git branch -D`: the command it runs, on paths it reads from its input. */
function classifyXargs(args: string[], ctx: Context): null {
  let at = 0
  while (at < args.length && (args[at] ?? '').startsWith('-')) at += XARGS_VALUED.has(args[at] ?? '') ? 2 : 1
  const words = stripPrefixes(args.slice(at))
  const inner: Context = { ...ctx, found: [] }
  if (commandName(words[0] ?? '') === 'rm') {
    const flags = words.slice(1).filter(word => word.startsWith('-'))
    inner.found.push({ kind: 'rm', label: `xargs rm ${flags.join(' ')}`.trim(), targets: words.slice(1).filter(word => !word.startsWith('-') && word !== '{}'), dir: ctx.dir })
  } else {
    classifyWords(words, inner)
  }
  ctx.found.push(...inner.found.map(risk => ({ ...risk, isFromInput: true })))

  return null
}

function classifyRm(args: string[], dir: string | null): Risk | null {
  const flags = args.filter(a => a.startsWith('-'))
  const recursive = flags.some(f => f === '--recursive' || (/^-[^-]/.test(f) && /[rR]/.test(f)))
  const force = flags.some(f => f === '--force' || (/^-[^-]/.test(f) && f.includes('f')))
  if (!recursive && !force) return null
  const targets = args.filter(a => !a.startsWith('-') || a === '-')

  return { kind: 'rm', label: `rm ${flags.join(' ')}`.trim(), targets, dir }
}

function classifyMigrate(words: string[], cmd: string, dir: string | null): Risk | null {
  const joined = words.join(' ')
  // Asking what would run changes nothing.
  if (/\bprisma\s+migrate\s+(?:status|diff)\b/.test(joined) || /\bmanage\.py\s+migrate\b.*\s--(?:plan|check)\b/.test(joined) || /\balembic\s+upgrade\b.*\s--sql\b/.test(joined)) return null
  if (/\balembic\s+upgrade\b/.test(joined)) return { kind: 'migrate', tool: 'alembic', label: 'alembic upgrade', dir }
  if (/\bdb:migrate(?!:status\b)/.test(joined)) return { kind: 'migrate', tool: 'rails', label: 'db:migrate', dir }
  if (/\bprisma\s+migrate\b/.test(joined)) return { kind: 'migrate', tool: 'prisma', label: 'prisma migrate', dir }
  if (/\bmanage\.py\s+migrate\b/.test(joined)) return { kind: 'migrate', tool: 'django', label: 'manage.py migrate', dir }
  if (!READ_ONLY.has(cmd) && words.slice(1).includes('migrate')) return { kind: 'migrate', tool: 'unknown', label: 'migrate', dir }

  return null
}
