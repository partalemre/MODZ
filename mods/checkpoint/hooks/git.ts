import type { ProcessRunInit, ProcessRunResult } from 'claude-code'

import { keyOf } from './key'
import type { CheckpointEntry } from '../types'

export { slug } from './key'

export type Run = (argv: readonly string[], init?: ProcessRunInit) => Promise<ProcessRunResult>

// A real repository, or a shadow one (bare git dir + work tree) for a folder that is not a repo.
export type Repo = { root: string; gitDir: string; isShadow: boolean; bin: string }
// A repository as one session sees it: `scope` is where its checkpoint refs live (key.ts scopeOf).
export type Scoped = Repo & { scope: string }

// What a checkpoint holds beyond its files: HEAD and the staging area as they were when it was taken.
export type TakenWith = { head: string | null; index: string | null }

export type RestorePlan = { restore: string[]; remove: string[] }

// Lines an undo would add and drop in one file (binary files count none).
export type FileStat = { path: string; added: number; removed: number }

export const KEEP = 30
const HEAD_TRAILER = 'Checkpoint-Head'
const INDEX_TRAILER = 'Checkpoint-Index'
// A shadow repo has no .gitignore of its own: what a folder's tools rebuild stays out (info/exclude).
const SHADOW_SKIP = ['node_modules/', '.venv/', 'venv/', '__pycache__/', '.next/', '.nuxt/', 'dist/', 'build/', 'target/', '.gradle/', '.dart_tool/', 'Pods/', '.cache/', '.DS_Store']
const BIG_FILE = '+5M'
// macOS: /usr/bin/git is an Xcode shim that fails until the Xcode license is accepted.
const GIT_BINARIES = ['git', '/Library/Developer/CommandLineTools/usr/bin/git']
const ARGV_CHUNK = 200
const IDENTITY = {
  GIT_AUTHOR_NAME: 'checkpoint', GIT_AUTHOR_EMAIL: 'checkpoint@localhost',
  GIT_COMMITTER_NAME: 'checkpoint', GIT_COMMITTER_EMAIL: 'checkpoint@localhost',
}

function argvOf(repo: Repo, args: string[]): string[] {
  return repo.isShadow ? [repo.bin, `--git-dir=${repo.gitDir}`, `--work-tree=${repo.root}`, ...args] : [repo.bin, ...args]
}

export async function gitBinary(run: Run, cwd: string): Promise<string | null> {
  for (const bin of GIT_BINARIES) {
    const out = await run([bin, '--version'], { cwd }).catch(() => null)
    if (out !== null && out.exitCode === 0) return bin
  }

  return null
}

async function gitWith(run: Run, repo: Repo, call: { args: string[]; init: ProcessRunInit }): Promise<string> {
  const { args, init } = call
  const out = await run(argvOf(repo, args), { cwd: repo.root, ...init })
  if (out.exitCode !== 0) throw new Error(`git ${args[0]} failed: ${out.stderr.trim().slice(0, 200)}`)

  return out.stdout.trim()
}

const git = (run: Run, repo: Repo, args: string[]): Promise<string> => gitWith(run, repo, { args, init: {} })

function chunks<T>(items: T[]): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += ARGV_CHUNK) out.push(items.slice(i, i + ARGV_CHUNK))

  return out
}

const literal = (path: string) => `:(literal)${path}`

// `isProbeOnly` finds a shadow repo made before but never makes one (a look at what exists, not a snapshot).
export async function locate(run: Run, opts: { cwd: string; home: string; bin: string; isProbeOnly?: boolean }): Promise<Repo | null> {
  const { cwd, home, bin } = opts
  const found = await run([bin, 'rev-parse', '--show-toplevel', '--absolute-git-dir'], { cwd })
  const [root, gitDir] = found.stdout.trim().split('\n')
  if (found.exitCode === 0 && root !== undefined && gitDir !== undefined) return { root, gitDir, isShadow: false, bin }
  // A shadow repo of a home folder or the disk root would copy far too much.
  if (home === '' || cwd === home || cwd === '/') return null
  const repo: Repo = { root: cwd, gitDir: `${home}/.cache/claude-checkpoint/${keyOf(cwd)}.git`, isShadow: true, bin }
  const probe = await run([bin, `--git-dir=${repo.gitDir}`, 'rev-parse', '--git-dir'], { cwd })
  if (probe.exitCode !== 0 && opts.isProbeOnly === true) return null
  if (probe.exitCode !== 0) {
    await git(run, { ...repo, isShadow: false }, ['init', '-q', '--bare', repo.gitDir])
    await git(run, { ...repo, isShadow: false }, [`--git-dir=${repo.gitDir}`, 'config', 'core.bare', 'false'])
    await run(['sh', '-c', 'mkdir -p "$(dirname "$1")" && cat > "$1"', 'sh', `${repo.gitDir}/info/exclude`], { cwd, stdin: SHADOW_SKIP.join('\n') + '\n' })
  }

  return repo
}

// Only files git would add can bloat a snapshot: untracked and not ignored. Sizes come from
// find on just those paths, so the walk never enters ignored trees (node_modules, build output).
async function bigFiles(run: Run, repo: Repo, env: Record<string, string>): Promise<string[]> {
  const listed = await run(argvOf(repo, ['ls-files', '-o', '--exclude-standard', '-z']), { cwd: repo.root, env })
  const untracked = listed.stdout.split('\0').filter(path => path !== '')
  const big: string[] = []
  for (const part of chunks(untracked)) {
    const out = await run(['find', ...part.map(path => `./${path}`), '-maxdepth', '0', '-type', 'f', '-size', BIG_FILE, '-print'], { cwd: repo.root })
    big.push(...out.stdout.split('\n').filter(line => line !== '').map(line => line.replace(/^\.\//, '')))
  }

  return big
}

// Writes the work tree as git sees it (ignores respected, big files left out) to a tree object,
// through a private index so the repository's own index and branch are never touched. `index` is the
// staging area as a tree, read from the same copy (null outside a repo, or mid-merge with conflicts).
export async function writeTree(run: Run, repo: Repo): Promise<{ tree: string; index: string | null }> {
  const index = `${repo.gitDir}/checkpoint.index`
  const env = { GIT_INDEX_FILE: index }
  await run(['rm', '-f', index], { cwd: repo.root })
  const copied = repo.isShadow ? null : await run(['cp', `${repo.gitDir}/index`, index], { cwd: repo.root })
  const staged = copied?.exitCode === 0 ? await run(argvOf(repo, ['write-tree']), { cwd: repo.root, env }) : null
  const big = await bigFiles(run, repo, env)
  await gitWith(run, repo, { args: ['add', '-A', '--', '.', ...big.map(path => `:(exclude,literal)${path}`)], init: { env } })
  for (const part of chunks(big)) {
    await gitWith(run, repo, { args: ['rm', '--cached', '-q', '--ignore-unmatch', '--', ...part.map(literal)], init: { env } })
  }
  const tree = await gitWith(run, repo, { args: ['write-tree'], init: { env } })
  await run(['rm', '-f', index], { cwd: repo.root })

  return { tree, index: staged?.exitCode === 0 ? staged.stdout.trim() : null }
}

// The staging area rides along as a second parent (so gc keeps it); trailers say which parent is which.
async function commitOf(run: Run, repo: Repo, spec: { label: string; tree: string; index: string | null }): Promise<string> {
  const found = await run(argvOf(repo, ['rev-parse', '--verify', '-q', 'HEAD']), { cwd: repo.root })
  const head = found.exitCode === 0 ? found.stdout.trim() : null
  const commitTree = (args: string[]) => gitWith(run, repo, { args: ['commit-tree', ...args], init: { env: IDENTITY } })
  const staged = spec.index === null ? null : await commitTree([spec.index, '-m', 'checkpoint index'])
  const parents = [head, staged].flatMap(parent => (parent === null ? [] : ['-p', parent]))
  const trailers = [head === null ? '' : `${HEAD_TRAILER}: ${head}`, staged === null ? '' : `${INDEX_TRAILER}: ${spec.index}`].filter(Boolean)
  const message = trailers.length === 0 ? [] : ['-m', trailers.join('\n')]

  return commitTree([spec.tree, ...parents, '-m', spec.label, ...message])
}

export async function snapshot(run: Run, repo: Scoped, opts: { ref: string; label: string }): Promise<string> {
  const commit = await commitOf(run, repo, { label: opts.label, ...(await writeTree(run, repo)) })
  await git(run, repo, ['update-ref', `${repo.scope}${opts.ref}`, commit])

  return commit
}

export async function takenWith(run: Run, repo: Repo, commit: string): Promise<TakenWith> {
  const body = await run(argvOf(repo, ['log', '-1', '--format=%B', commit]), { cwd: repo.root })
  const trailer = (name: string) => new RegExp(`^${name}: ([0-9a-f]+)$`, 'm').exec(body.stdout)?.[1] ?? null

  return { head: trailer(HEAD_TRAILER), index: trailer(INDEX_TRAILER) }
}

// Commits made on top of the checkpoint's HEAD since: an undo leaves them in history, and says so.
export async function madeSince(run: Run, repo: Repo, head: string | null): Promise<number> {
  if (repo.isShadow) return 0
  const out = await run(argvOf(repo, ['rev-list', '--count', head === null ? 'HEAD' : `${head}..HEAD`]), { cwd: repo.root })

  return out.exitCode === 0 ? Number(out.stdout.trim()) || 0 : 0
}

export async function list(run: Run, repo: Scoped): Promise<CheckpointEntry[]> {
  const format = '%(refname)%09%(objectname)%09%(committerdate:unix)%09%(subject)'
  const out = await git(run, repo, ['for-each-ref', '--sort=-committerdate', `--format=${format}`, repo.scope])

  return out.split('\n').filter(line => line !== '').map(line => {
    const [ref = '', commit = '', unix = '0', ...rest] = line.split('\t')

    return { ref, commit, at: Number(unix) * 1000, label: rest.join('\t') }
  })
}

// Drops this session's checkpoints in this work tree past `keep`, newest kept, and answers the ones left. A shadow repo, which no
// git command of the person's ever collects, is also asked to gc once refs were dropped.
export async function prune(run: Run, repo: Scoped, keep = KEEP): Promise<CheckpointEntry[]> {
  const all = await list(run, repo)
  const stale = all.slice(keep)
  if (stale.length === 0) return all
  const stdin = stale.map(entry => `delete ${entry.ref}\n`).join('')
  await gitWith(run, repo, { args: ['update-ref', '--stdin'], init: { stdin } })
  if (repo.isShadow) await run(argvOf(repo, ['gc', '--auto', '--quiet']), { cwd: repo.root })

  return all.slice(0, keep)
}

export function parseNameStatus(out: string): RestorePlan {
  const parts = out.split('\0').filter(part => part !== '')
  const plan: RestorePlan = { restore: [], remove: [] }
  for (let i = 0; i + 1 < parts.length; i += 2) {
    const path = parts[i + 1] ?? ''
    if (parts[i] === 'A') plan.remove.push(path)
    else plan.restore.push(path)
  }

  return plan
}

// What undoing to `commit` changes: files to bring back from it, and files made since to remove.
// `tree` is the work tree as written now, for a diffstat against the same state.
// `index` is the staging area now, to tell whether an undo would change it too.
export async function plan(run: Run, repo: Repo, commit: string): Promise<RestorePlan & { tree: string; index: string | null }> {
  const now = await writeTree(run, repo)
  const out = await run(argvOf(repo, ['diff', '--name-status', '--no-renames', '-z', `${commit}^{tree}`, now.tree]), { cwd: repo.root })
  if (out.exitCode !== 0) throw new Error(`git diff failed: ${out.stderr.trim().slice(0, 200)}`)

  return { ...parseNameStatus(out.stdout), ...now }
}

// `--numstat -z` rows: "added<TAB>removed<TAB>path" each ended by NUL; "-" for a binary file.
export function parseNumstat(out: string): FileStat[] {
  return out.split('\0').flatMap(row => {
    const found = /^(\d+|-)\t(\d+|-)\t(.+)$/.exec(row.replace(/^\n/, ''))
    if (found === null) return []

    return [{ path: found[3] ?? '', added: Number(found[1]) || 0, removed: Number(found[2]) || 0 }]
  })
}

// The lines undoing to `commit` changes per file: from the tree as it is now to the checkpoint's.
export async function numstat(run: Run, repo: Repo, spec: { tree: string; commit: string }): Promise<FileStat[]> {
  const out = await run(argvOf(repo, ['diff', '--numstat', '--no-renames', '-z', spec.tree, `${spec.commit}^{tree}`]), { cwd: repo.root })

  return out.exitCode === 0 ? parseNumstat(out.stdout) : []
}

// The files first, then the staging area as it was (what the turn staged is unstaged again).
export async function apply(run: Run, repo: Repo, opts: { commit: string; plan: RestorePlan; index: string | null }): Promise<void> {
  for (const part of chunks(opts.plan.restore)) {
    await git(run, repo, ['restore', `--source=${opts.commit}`, '--worktree', '--', ...part.map(literal)])
  }
  for (const part of chunks(opts.plan.remove)) {
    await run(['rm', '-f', '--', ...part.map(path => `${repo.root}/${path}`)], { cwd: repo.root })
  }
  if (opts.index !== null && !repo.isShadow) await git(run, repo, ['read-tree', opts.index])
}
