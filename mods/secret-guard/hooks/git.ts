import { findSecrets } from './detect'
import type { Secret } from './detect'
import { resolvePath } from './tools'

export type GitStep =
  | { kind: 'add'; cwd: string | null; args: string[] }
  | { kind: 'commit'; cwd: string | null; isAll: boolean }

// What a scan reaches the repository through: register.tsx makes these calls on `$`.
export type GitHost = { cwd: string; git: (argv: string[], cwd: string) => Promise<string>; read: (path: string) => Promise<string> }
export type GitFound = { secrets: (Secret & { where: string })[]; envFiles: string[] }

const FILES_MAX = 300
const SEPARATORS = /&&|\|\||;|\n|\|/
const ENV_FILE = /^\.env(\..+)?$/
const ENV_TEMPLATE = /\.(example|sample|template|dist)$/i
// git's own options that take a value as the next word.
const GIT_VALUE_OPTIONS = ['-C', '-c', '--git-dir', '--work-tree', '--namespace']

// Shell words, quotes stripped; enough for reading git's arguments, not a full shell parser.
export function words(segment: string): string[] {
  const found: string[] = []
  for (const match of segment.matchAll(/"((?:[^"\\]|\\.)*)"|'([^']*)'|(\S+)/g)) {
    found.push(match[1] ?? match[2] ?? match[3] ?? '')
  }

  return found
}

function stepOf(tokens: string[]): GitStep | null {
  let at = 0
  while (at < tokens.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[at] ?? '')) at += 1
  if (tokens[at] !== 'git') return null
  at += 1
  let cwd: string | null = null
  while (at < tokens.length && (tokens[at] ?? '').startsWith('-')) {
    const option = tokens[at] ?? ''
    if (option === '-C') cwd = tokens[at + 1] ?? null
    at += GIT_VALUE_OPTIONS.includes(option) ? 2 : 1
  }
  const verb = tokens[at]
  const rest = tokens.slice(at + 1)
  if (verb === 'add') return { kind: 'add', cwd, args: rest }
  if (verb === 'commit') return { kind: 'commit', cwd, isAll: rest.some(word => word === '--all' || /^-[a-zA-Z]*a[a-zA-Z]*$/.test(word)) }

  return null
}

export function gitSteps(command: string): GitStep[] {
  return command
    .split(SEPARATORS)
    .map(segment => stepOf(words(segment.trim())))
    .filter((step): step is GitStep => step !== null)
}

export function baseName(path: string): string {
  const parts = path.split('/')

  return parts[parts.length - 1] ?? path
}

export function isEnvFile(path: string): boolean {
  const name = baseName(path)

  return ENV_FILE.test(name) && !ENV_TEMPLATE.test(name)
}

// `git add -n` prints one `add 'path'` line per file it would stage.
export function dryRunPaths(stdout: string): string[] {
  return stdout
    .split('\n')
    .map(line => /^add '(.*)'$/.exec(line.trim())?.[1])
    .filter((path): path is string => path !== undefined)
}

// The added lines of a unified diff, grouped by the file they land in.
export function addedByFile(diff: string): Map<string, string> {
  const files = new Map<string, string>()
  let current = ''
  for (const line of diff.split('\n')) {
    const header = /^\+\+\+ b\/(.*)$/.exec(line)
    if (header !== null) {
      current = header[1] ?? ''
      continue
    }
    if (line.startsWith('+') && !line.startsWith('+++') && current !== '') {
      files.set(current, `${files.get(current) ?? ''}${line.slice(1)}\n`)
    }
  }

  return files
}

async function scanAdd(host: GitHost, step: Extract<GitStep, { kind: 'add' }>, found: GitFound): Promise<void> {
  const dir = step.cwd === null ? host.cwd : resolvePath(host.cwd, step.cwd)
  found.envFiles.push(...step.args.filter(isEnvFile))
  const paths = dryRunPaths(await host.git(['add', '-n', ...step.args], dir))
  found.envFiles.push(...paths.filter(isEnvFile))
  for (const path of paths.filter(entry => !isEnvFile(entry)).slice(0, FILES_MAX)) {
    const text = await host.read(resolvePath(dir, path))
    found.secrets.push(...findSecrets(text, path).map(secret => ({ ...secret, where: `${path}:${secret.line}` })))
  }
}

// `git add` scans the files it would stage; `git commit` the added lines of the staged diff (and the unstaged one for -a).
export async function scanStep(host: GitHost, step: GitStep, found: GitFound): Promise<void> {
  if (step.kind === 'add') return scanAdd(host, step, found)
  const dir = step.cwd === null ? host.cwd : resolvePath(host.cwd, step.cwd)
  const scopes = step.isAll ? [['--cached'], []] : [['--cached']]
  for (const scope of scopes) {
    const names = (await host.git(['diff', ...scope, '--name-only'], dir)).split('\n').filter(name => name !== '')
    found.envFiles.push(...names.filter(isEnvFile))
    for (const [path, added] of addedByFile(await host.git(['diff', ...scope, '-U0', '--no-color'], dir))) {
      found.secrets.push(...findSecrets(added, path).map(secret => ({ ...secret, where: path })))
    }
  }
}
