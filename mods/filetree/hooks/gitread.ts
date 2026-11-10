import { mapper, parseGit, parseNumstat, rollCounts, rollUp } from './gitstatus'
import { type Host, patch } from './host'
import { mem } from './session'
import { resolve } from './shell'
import { dirname, join, posix } from './tree'
import { syncHub } from './turn'

const GIT_TIMEOUT_MS = 20_000
const QUICK_MS = 5_000
// Upward from the session's folder, deeper than any real checkout.
const GIT_DIR_LEVELS = 64

let gitRun: Promise<void> | null = null
let gitNext: Promise<void> | null = null

export function git(h: Host, cwd: string, call: { args: string[]; timeoutMs?: number }) {
  const { args, timeoutMs = GIT_TIMEOUT_MS } = call
  return h.run(['git', '--no-optional-locks', '-C', cwd, ...args], { timeoutMs, env: { GIT_OPTIONAL_LOCKS: '0' } })
}

export async function detectRepo(h: Host): Promise<void> {
  const t = await h.tree()
  if (!t.root) return
  let top = ''
  let prefix = ''
  try {
    const run = await git(h, t.root, { args: ['rev-parse', '--show-prefix', '--show-toplevel'], timeoutMs: QUICK_MS })
    const [p = '', tl = ''] = run.exitCode === 0 ? run.stdout.split('\n') : []
    prefix = p.trim()
    top = tl.trim()
  } catch {
    top = ''
  }
  await patch(h, cur => (cur.root === t.root ? { top, prefix } : {}))
}

async function untracked(h: Host, root: string, dirs: string[]): Promise<string[]> {
  if (!dirs.length) return []
  const others = await git(h, root, { args: ['ls-files', '-o', '--exclude-standard', '-z', '--', ...dirs.map(d => d.slice(root.length + 1) || '.')] })
  return others.exitCode === 0 ? others.stdout.split('\0').filter(Boolean) : []
}

async function readGit(h: Host): Promise<void> {
  const t = await h.tree()
  if (!t.root || !t.top) return
  const root = t.root
  try {
    const status = await git(h, root, { args: ['status', '--porcelain=v1', '-b', '-z', '--ignored=traditional', '--untracked-files=normal', '--', '.'] })
    if (status.exitCode !== 0) return
    const parsed = parseGit(status.stdout, root, t.prefix)
    const head = await git(h, root, { args: ['diff', 'HEAD', '--numstat', '-z', '--', '.'] })
    const diff = head.exitCode === 0 ? parseNumstat(head.stdout, mapper(root, t.prefix)) : {}
    const files = { ...parsed.files }
    for (const rel of await untracked(h, root, parsed.untrackedDirs)) files[join(root, rel)] = 'new'
    for (const path of Object.keys(diff)) if (files[path] === 'new') delete diff[path]
    mem.dirty = { root, files }
    const { git: marks, ignored, untrackedDirs, branch } = parsed
    await patch(h, cur => (cur.root === root ? { git: marks, ignored, untrackedDirs, branch, counts: rollCounts(files, root), diff: rollUp(diff, root) } : {}))
    await syncHub(h)
  } catch {
    return
  }
}

// One porcelain entry per changed path; a rename's second (old) path has no status letters before it.
const STATUS_ENTRY = /^[ MTADRCU?!]{2} /

// The hub's line while the pane was never opened: one status where the session runs, counted, nothing listed.
export async function quickStatus(h: Host): Promise<void> {
  if (mem.isLooked) return
  try {
    const run = await git(h, posix(await h.cwd()), { args: ['status', '--porcelain=v1', '-z', '--untracked-files=normal'], timeoutMs: QUICK_MS })
    mem.quick = run.exitCode === 0 ? { hasRepo: true, changed: run.stdout.split('\0').filter(entry => STATUS_ENTRY.test(entry)).length } : { hasRepo: false, changed: 0 }
  } catch {
    mem.quick = { hasRepo: false, changed: 0 }
  }
  await syncHub(h)
}

// A pane never opened learns what the turn left in git once, at its end, not after each command.
export const hubAfterTurn = (h: Host): Promise<void> => (mem.isLooked ? syncHub(h) : quickStatus(h))

export function refreshGit(h: Host): Promise<void> {
  if (!gitRun) {
    gitRun = readGit(h).finally(() => {
      gitRun = null
    })
    return gitRun
  }
  const rerun = () => {
    gitNext = null
    return refreshGit(h)
  }
  gitNext ??= gitRun.then(rerun, rerun)
  return gitNext
}

export async function headOf(h: Host, cwd: string): Promise<string> {
  try {
    const run = await git(h, cwd, { args: ['rev-parse', 'HEAD'], timeoutMs: QUICK_MS })
    return run.exitCode === 0 ? run.stdout.trim() : ''
  } catch {
    return ''
  }
}

// The files the last commit holds, or what is staged; as absolute paths under the tree's root.
export async function gitPaths(h: Host, at: { root: string; prefix: string }, isCommitted: boolean): Promise<string[]> {
  const map = mapper(at.root, at.prefix)
  try {
    const args = isCommitted ? ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', '-z', 'HEAD'] : ['diff', '--cached', '--name-only', '-z']
    const run = await git(h, at.root, { args, timeoutMs: QUICK_MS })
    return run.exitCode === 0 ? run.stdout.split('\0').filter(Boolean).flatMap(rel => map(rel) ?? []) : []
  } catch {
    return []
  }
}

export async function gitDir(h: Host, cwd: string): Promise<string> {
  for (let dir = cwd, i = 0; i < GIT_DIR_LEVELS; i++) {
    try {
      const dot = join(dir, '.git')
      const st = await h.stat(dot)
      if (st.kind === 'dir') return dot
      const ref = /^gitdir:\s*(.+)$/m.exec(String(await h.read(dot)))?.[1]?.trim()
      if (ref) return resolve(dir, ref, mem.home)
    } catch {
      const up = dirname(dir)
      if (up === dir) return ''
      dir = up
      continue
    }
    return ''
  }
  return ''
}
