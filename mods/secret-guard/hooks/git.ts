export type GitStep =
  | { kind: 'add'; cwd: string | null; args: string[] }
  | { kind: 'commit'; cwd: string | null; isAll: boolean }

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

export function diffPaths(diff: string): string[] {
  return [...addedByFile(diff).keys()]
}
