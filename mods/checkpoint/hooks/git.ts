import type { ProcessRunInit, ProcessRunResult } from 'claude-code'

import type { CheckpointEntry } from '../types'

export type Run = (argv: readonly string[], init?: ProcessRunInit) => Promise<ProcessRunResult>

// A real repository, or a shadow one (bare git dir + work tree) for a folder that is not a repo.
export type Repo = { root: string; gitDir: string; isShadow: boolean; bin: string }

export type RestorePlan = { restore: string[]; remove: string[] }

// Lines an undo would add and drop in one file (binary files count none).
export type FileStat = { path: string; added: number; removed: number }

export const KEEP = 30
const REF_ROOT = 'refs/checkpoints/'
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

async function git(run: Run, repo: Repo, args: string[], init: ProcessRunInit = {}): Promise<string> {
  const out = await run(argvOf(repo, args), { cwd: repo.root, ...init })
  if (out.exitCode !== 0) throw new Error(`git ${args[0]} failed: ${out.stderr.trim().slice(0, 200)}`)

  return out.stdout.trim()
}

function chunks<T>(items: T[]): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += ARGV_CHUNK) out.push(items.slice(i, i + ARGV_CHUNK))

  return out
}

const literal = (path: string) => `:(literal)${path}`

export function slug(text: string): string {
  return text.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 120) || 'root'
}

// `isProbeOnly` finds a shadow repo made before but never makes one (a look at what exists, not a snapshot).
export async function locate(run: Run, opts: { cwd: string; home: string; bin: string; isProbeOnly?: boolean }): Promise<Repo | null> {
  const { cwd, home, bin } = opts
  const found = await run([bin, 'rev-parse', '--show-toplevel', '--absolute-git-dir'], { cwd })
  const [root, gitDir] = found.stdout.trim().split('\n')
  if (found.exitCode === 0 && root !== undefined && gitDir !== undefined) return { root, gitDir, isShadow: false, bin }
  // A shadow repo of a home folder or the disk root would copy far too much.
  if (home === '' || cwd === home || cwd === '/') return null
  const repo: Repo = { root: cwd, gitDir: `${home}/.cache/claude-checkpoint/${slug(cwd)}.git`, isShadow: true, bin }
  const probe = await run([bin, `--git-dir=${repo.gitDir}`, 'rev-parse', '--git-dir'], { cwd })
  if (probe.exitCode !== 0 && opts.isProbeOnly === true) return null
  if (probe.exitCode !== 0) {
    await git(run, { ...repo, isShadow: false }, ['init', '-q', '--bare', repo.gitDir])
    await git(run, { ...repo, isShadow: false }, [`--git-dir=${repo.gitDir}`, 'config', 'core.bare', 'false'])
  }

  return repo
}

async function bigFiles(run: Run, repo: Repo): Promise<string[]> {
  const argv = ['find', '.', '(', '-name', '.git', '-o', '-name', 'node_modules', ')', '-prune', '-o', '-type', 'f', '-size', BIG_FILE, '-print']
  const out = await run(argv, { cwd: repo.root })

  return out.stdout.split('\n').filter(line => line !== '').map(line => line.replace(/^\.\//, ''))
}

// Writes the work tree as git sees it (ignores respected, big files left out) to a tree object,
// through a private index so the repository's own index and branch are never touched.
export async function writeTree(run: Run, repo: Repo): Promise<string> {
  const index = `${repo.gitDir}/checkpoint.index`
  const env = { GIT_INDEX_FILE: index }
  await run(['rm', '-f', index], { cwd: repo.root })
  if (!repo.isShadow) await run(['cp', `${repo.gitDir}/index`, index], { cwd: repo.root })
  const big = await bigFiles(run, repo)
  await git(run, repo, ['add', '-A', '--', '.', ...big.map(path => `:(exclude,literal)${path}`)], { env })
  for (const part of chunks(big)) {
    await git(run, repo, ['rm', '--cached', '-q', '--ignore-unmatch', '--', ...part.map(literal)], { env })
  }
  const tree = await git(run, repo, ['write-tree'], { env })
  await run(['rm', '-f', index], { cwd: repo.root })

  return tree
}

export async function snapshot(run: Run, repo: Repo, opts: { ref: string; label: string }): Promise<string> {
  const tree = await writeTree(run, repo)
  const head = await run(argvOf(repo, ['rev-parse', '--verify', '-q', 'HEAD']), { cwd: repo.root })
  const parent = head.exitCode === 0 ? ['-p', head.stdout.trim()] : []
  const commit = await git(run, repo, ['commit-tree', tree, ...parent, '-m', opts.label], { env: IDENTITY })
  await git(run, repo, ['update-ref', `${REF_ROOT}${opts.ref}`, commit])

  return commit
}

export async function list(run: Run, repo: Repo): Promise<CheckpointEntry[]> {
  const format = '%(refname)%09%(objectname)%09%(committerdate:unix)%09%(subject)'
  const out = await git(run, repo, ['for-each-ref', '--sort=-committerdate', `--format=${format}`, REF_ROOT])

  return out.split('\n').filter(line => line !== '').map(line => {
    const [ref = '', commit = '', unix = '0', ...rest] = line.split('\t')

    return { ref, commit, at: Number(unix) * 1000, label: rest.join('\t') }
  })
}

// Drops checkpoints past `keep`, newest kept, and answers the ones left. A shadow repo, which no
// git command of the person's ever collects, is also asked to gc once refs were dropped.
export async function prune(run: Run, repo: Repo, keep = KEEP): Promise<CheckpointEntry[]> {
  const all = await list(run, repo)
  const stale = all.slice(keep)
  if (stale.length === 0) return all
  const stdin = stale.map(entry => `delete ${entry.ref}\n`).join('')
  await git(run, repo, ['update-ref', '--stdin'], { stdin })
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
export async function plan(run: Run, repo: Repo, commit: string): Promise<RestorePlan & { tree: string }> {
  const now = await writeTree(run, repo)
  const out = await run(argvOf(repo, ['diff', '--name-status', '--no-renames', '-z', `${commit}^{tree}`, now]), { cwd: repo.root })
  if (out.exitCode !== 0) throw new Error(`git diff failed: ${out.stderr.trim().slice(0, 200)}`)

  return { ...parseNameStatus(out.stdout), tree: now }
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

export async function apply(run: Run, repo: Repo, opts: { commit: string; plan: RestorePlan }): Promise<void> {
  for (const part of chunks(opts.plan.restore)) {
    await git(run, repo, ['restore', `--source=${opts.commit}`, '--worktree', '--', ...part.map(literal)])
  }
  for (const part of chunks(opts.plan.remove)) {
    await run(['rm', '-f', '--', ...part.map(path => `${repo.root}/${path}`)], { cwd: repo.root })
  }
}
