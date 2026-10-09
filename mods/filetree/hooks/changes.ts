import type { Change } from './gitstatus'
import type { Host } from './host'
import { type Os, osName } from './platform'
import { mem } from './session'
import { inside } from './tree'

export type Since = { ms: number; mark: string; os: Os }

export const PRUNE = ['.git', 'node_modules', 'target', '.venv', '__pycache__', 'dist', '.next']
const HOME_PRUNE = ['Library', 'AppData', '.Trash']
const FIND_MS = 8_000
const TOUCH_MS = 3_000
const MS_PER_S = 1000
// `find -path` arguments for ignored folders, and paths `stat`ed on Windows, stay this short.
const IGNORED_LIMIT = 40
const STAT_LIMIT = 4_000

let markId = 0

export function broad(root: string): boolean {
  return root === mem.home || root === '/' || /^[A-Za-z]:\/$/.test(root)
}

export function rootOfDisk(root: string): boolean {
  return root === '/' || /^[A-Za-z]:\/$/.test(root)
}

export function pruneArgs(root: string, ignored: string[] = []): string[] {
  const names = broad(root) ? [...PRUNE, ...HOME_PRUNE] : PRUNE
  return ['(', ...names.flatMap((name, i) => (i === 0 ? ['-name', name] : ['-o', '-name', name])), ...ignored.flatMap(p => ['-o', '-path', p]), ')', '-prune', '-o']
}

async function newer(h: Host, paths: string[], sinceMs: number): Promise<string[]> {
  const stats = await Promise.all(
    paths.map(async p => {
      try {
        return (await h.stat(p)).mtimeMs > sinceMs ? p : ''
      } catch {
        return ''
      }
    }),
  )
  return stats.filter(Boolean)
}

export type Scan = { root: string; since: Since; depth?: number; ignored?: string[] }

export async function changedSince(h: Host, scan: Scan): Promise<string[]> {
  const { root, since, depth = 0, ignored = [] } = scan
  if (rootOfDisk(root)) return []
  const test = since.mark ? ['-newer', since.mark] : ['-newermt', `@${(since.ms / MS_PER_S).toFixed(3)}`]
  const prune = pruneArgs(root, ignored.filter(p => inside(root, p)).slice(0, IGNORED_LIMIT))
  try {
    const run = await h.run(['find', '-H', root, '-xdev', ...(depth ? ['-maxdepth', String(depth)] : []), ...prune, ...test, '-print0'], { timeoutMs: FIND_MS })
    return run.stdout.split('\0').filter(p => p && p !== root)
  } catch {
    return []
  }
}

// On Windows there is no `find`: git's own list of changed files, by their mtimes, stands in for it.
export async function changedInRepo(h: Host, scan: Scan, before: Record<string, Change>): Promise<{ hits: string[]; gone: string[] }> {
  const { root, since } = scan
  if (since.os !== 'win32') return { hits: await changedSince(h, { root, since, depth: 0, ignored: scan.ignored ?? [] }), gone: [] }
  if (mem.dirty.root !== root) return { hits: [], gone: [] }
  const entries = Object.entries(mem.dirty.files)
  const gone = entries.filter(([p, c]) => c === 'del' && before[p] !== 'del').map(([p]) => p)
  const live = entries.filter(([, c]) => c !== 'del').map(([p]) => p)
  return { hits: await newer(h, live.slice(0, STAT_LIMIT), since.ms), gone }
}

export async function sinceNow(h: Host, writes: boolean): Promise<Since> {
  const ms = await h.now()
  const os = await osName(h)
  if (os !== 'darwin' || !writes) return { ms, mark: '', os }
  const mark = `${((await h.tmpdir()) || '/tmp').replace(/\/+$/, '')}/filetree-${await h.sessionId()}-${++markId}.mark`
  try {
    await h.run(['touch', mark], { timeoutMs: TOUCH_MS })
    return { ms, mark, os }
  } catch {
    return { ms, mark: '', os }
  }
}
