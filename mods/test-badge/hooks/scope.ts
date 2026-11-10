import { PROBED_TEXTS, detect } from './detect'
import type { RootInfo } from './detect'
import { VENDOR_TOOLS } from './limits'
import type { Overrides } from './options'

// Where a run happens: the nearest folder above the edited file that has its own checks, so a monorepo runs the
// edited package's suite rather than the root's. Never above the session's folder.

export type Scope = { root: string; info: RootInfo }
// The engine's file reads, as closures: only register.tsx holds `$`. `list` gives the entry names.
export type Fs = { list: (dir: string) => Promise<string[]>; read: (path: string) => Promise<string>; exists: (path: string) => Promise<boolean> }

const NO_OVERRIDES = { test: '', lint: '' }
const DART_TEST = /_test\.dart$/

export async function rootInfo(fs: Fs, dir: string): Promise<RootInfo> {
  const names = new Set(await fs.list(dir))
  const texts: Record<string, string> = {}
  for (const name of PROBED_TEXTS.filter(file => names.has(file))) texts[name] = await fs.read(`${dir}/${name}`)
  const vendor = new Set<string>()
  for (const tool of VENDOR_TOOLS) if (await fs.exists(`${dir}/vendor/bin/${tool}`)) vendor.add(tool)

  return { names, texts, hasVendorBin: tool => vendor.has(tool) }
}

// The folders from the file's own up to the session's, nearest first; none for a file outside it.
export function foldersUp(file: string, cwd: string): string[] {
  const top = cwd.replace(/[\\/]$/, '')
  const path = file.replace(/\\/g, '/')
  if (!path.startsWith(`${top.replace(/\\/g, '/')}/`)) return []
  const parts = path.slice(top.length + 1).split('/').slice(0, -1)

  return parts.map((_, k) => `${top}/${parts.slice(0, parts.length - k).join('/')}`)
}

const hasChecks = (info: RootInfo): boolean => {
  const found = detect(info, NO_OVERRIDES)

  return found.test !== null || found.lint !== null
}

// A configured command is the project's own, so it runs in the session's folder.
export async function scopeOf(fs: Fs, spec: { file: string | null; cwd: string; overrides: Overrides }): Promise<Scope> {
  const isConfigured = spec.overrides.test.trim() !== '' || spec.overrides.lint.trim() !== ''
  const folders = spec.file === null || isConfigured ? [] : foldersUp(spec.file, spec.cwd)
  for (const dir of folders) {
    const info = await rootInfo(fs, dir)
    if (hasChecks(info)) return { root: dir, info }
  }

  return { root: spec.cwd, info: await rootInfo(fs, spec.cwd) }
}

// `flutter test` / `dart test` on the edited files' own tests where they exist (test/a/b_test.dart for
// lib/a/b.dart, or an edited test itself); the whole suite when none is found.
export async function focusedDart(fs: Fs, spec: { argv: string[]; root: string; edited: string[] }): Promise<string[]> {
  const isDart = spec.argv.length === 2 && (spec.argv[0] === 'flutter' || spec.argv[0] === 'dart') && spec.argv[1] === 'test'
  if (!isDart) return spec.argv
  const files = new Set<string>()
  for (const path of spec.edited.filter(file => file.startsWith(`${spec.root}/`))) {
    const rel = path.slice(spec.root.length + 1)
    if (rel.startsWith('test/') && DART_TEST.test(rel)) files.add(rel)
    const mirror = rel.startsWith('lib/') ? `test/${rel.slice('lib/'.length).replace(/\.dart$/, '_test.dart')}` : null
    if (mirror !== null && (await fs.exists(`${spec.root}/${mirror}`))) files.add(mirror)
  }

  return [...spec.argv, ...files]
}
