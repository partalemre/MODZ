import type { Secret } from './detect'
import { resolvePath } from './tools'

export type EnvEntry = { name: string; value: string; isNew: boolean }

const CODE_REFS: Record<string, (name: string) => string> = {
  js: name => `process.env.${name}`,
  py: name => `os.environ["${name}"]`,
  dart: name => `Platform.environment['${name}']`,
  go: name => `os.Getenv("${name}")`,
  rb: name => `ENV["${name}"]`,
  php: name => `getenv('${name}')`,
}
const EXTENSION_LANG: Record<string, string> = {
  js: 'js', jsx: 'js', ts: 'js', tsx: 'js', mjs: 'js', cjs: 'js', mts: 'js', cts: 'js',
  py: 'py', dart: 'dart', go: 'go', rb: 'rb', php: 'php',
}
const NEEDS_QUOTES = /[\s#"'$`\\]/

function extensionOf(path: string): string {
  const dot = path.lastIndexOf('.')

  return dot < 0 ? '' : path.slice(dot + 1).toLowerCase()
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function parseEnv(text: string): Map<string, string> {
  const entries = new Map<string, string>()
  for (const line of text.split('\n')) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line)
    if (match === null) continue
    entries.set(match[1] ?? '', (match[2] ?? '').trim().replace(/^(["'])(.*)\1$/, '$2'))
  }

  return entries
}

// One env name per secret: an existing entry holding the same value is reused, a taken name gets a suffix.
export function planEntries(secrets: Secret[], existing: Map<string, string>): EnvEntry[] {
  const taken = new Map(existing)
  const plan: EnvEntry[] = []
  for (const secret of secrets) {
    const same = [...taken.entries()].find(([, value]) => value === secret.value)
    if (same !== undefined) {
      plan.push({ name: same[0], value: secret.value, isNew: false })
      continue
    }
    let name = secret.envName
    for (let suffix = 2; taken.has(name); suffix += 1) name = `${secret.envName}_${suffix}`
    taken.set(name, secret.value)
    plan.push({ name, value: secret.value, isNew: true })
  }

  return plan
}

export function envLines(entries: EnvEntry[]): string {
  return entries
    .filter(entry => entry.isNew)
    .map(entry => `${entry.name}=${NEEDS_QUOTES.test(entry.value) ? JSON.stringify(entry.value) : entry.value}\n`)
    .join('')
}

export function appendText(existing: string, addition: string): string {
  if (addition === '') return existing
  const glue = existing === '' || existing.endsWith('\n') ? '' : '\n'

  return `${existing}${glue}${addition}`
}

// Code reads the value from the environment; any other file gets a ${NAME} placeholder.
export function rewrite(text: string, spec: { path: string; entries: EnvEntry[] }): string {
  const lang = EXTENSION_LANG[extensionOf(spec.path)]
  const toRef = lang === undefined ? undefined : CODE_REFS[lang]
  let out = text
  for (const entry of spec.entries) {
    const literal = escapeRegExp(entry.value)
    if (toRef !== undefined) {
      out = out.replace(new RegExp(`(["'\`])${literal}\\1`, 'g'), toRef(entry.name))
      out = out.split(entry.value).join(toRef(entry.name))
    } else {
      out = out.split(entry.value).join(`\${${entry.name}}`)
    }
  }

  return out
}

export function hasEnvIgnore(gitignore: string): boolean {
  return gitignore.split('\n').some(line => /^\/?\.env(\*|\.\*)?\s*$/.test(line.trim()))
}

// A placeholder in the file is rewritten to the env read too: the same entry, spelled as its token.
export function withTokens(entries: EnvEntry[], tokens: (string | undefined)[]): EnvEntry[] {
  const spelled = entries.flatMap((entry, index) => {
    const token = tokens[index]

    return token === undefined ? [] : [{ ...entry, value: token }]
  })

  return [...entries, ...spelled]
}

const dirOf = (path: string): string => path.slice(0, path.lastIndexOf('/')) || '/'

// The .env goes to the root of the repository holding the file (a worktree's own root, whose `.git` is a file),
// never the session's root when they differ. Outside any repository: the session's folder if the file is in it.
export async function envRootOf(spec: { path: string; cwd: string; exists: (path: string) => Promise<boolean> }): Promise<{ root: string; isRepo: boolean }> {
  const start = dirOf(resolvePath(spec.cwd, spec.path))
  for (let dir = start; ; dir = dirOf(dir)) {
    if (await spec.exists(`${dir}/.git`)) return { root: dir, isRepo: true }
    if (dir === '/') break
  }
  const isInSession = spec.cwd !== '' && `${start}/`.startsWith(`${spec.cwd}/`)

  return { root: isInSession ? spec.cwd : start, isRepo: false }
}
