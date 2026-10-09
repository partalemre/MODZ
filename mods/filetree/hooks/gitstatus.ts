import type { Branch } from '../types'
import { stronger } from './icons'
import { dirname, join } from './tree'

export type GitStatus = {
  git: Record<string, string>
  ignored: string[]
  untrackedDirs: string[]
  branch: Branch | null
  files: Record<string, Change>
}

export type Change = 'new' | 'mod' | 'del'

// The letters a porcelain record's XY can carry, strongest-first as `git status` shows them.
const LETTERS = ['D', 'M', 'R', 'C', 'A', 'T']
// A record shorter than "XY p" names no path.
const MIN_RECORD = 4
const PATH_AT = 3

export function parseBranch(record: string): Branch {
  const body = record.replace(/^## /, '')
  if (body.startsWith('HEAD (no branch)')) return { head: 'detached', upstream: '', ahead: 0, behind: 0 }
  const head = body.match(/^(?:No commits yet on |Initial commit on )?(.+?)(?:\.\.\.|\s|$)/)?.[1] ?? body
  const upstream = body.match(/\.\.\.(\S+)/)?.[1] ?? ''
  const ahead = Number(body.match(/ahead (\d+)/)?.[1] ?? 0)
  const behind = Number(body.match(/behind (\d+)/)?.[1] ?? 0)
  return { head, upstream, ahead, behind }
}

export function mapper(root: string, prefix: string): (rel: string) => string | null {
  return rel => (rel.startsWith(prefix) ? join(root, rel.slice(prefix.length).replace(/\/$/, '')).replace(/\/$/, '') : null)
}

function changeOf(xy: string): Change {
  if (xy === '??' || (xy.includes('A') && !xy.includes('D'))) return 'new'
  return xy.includes('D') && !/U/.test(xy) ? 'del' : 'mod'
}

function letterOf(xy: string): string {
  if (xy === '??') return '?'
  if (/U/.test(xy) || xy === 'AA' || xy === 'DD') return 'U'
  return LETTERS.find(c => xy.includes(c)) ?? ''
}

function markUp(git: Record<string, string>, at: { path: string; root: string }, letter: string): void {
  git[at.path] = stronger(git[at.path], letter)
  let dir = dirname(at.path)
  while (dir.length >= at.root.length && dir !== '/') {
    git[dir] = stronger(git[dir], letter)
    if (dir === at.root) break
    dir = dirname(dir)
  }
}

type Porcelain = { xy: string; path: string; isDir: boolean }

function addRecord(out: GitStatus, rec: Porcelain, root: string): void {
  const { xy, path } = rec
  if (xy === '!!') {
    out.ignored.push(path)
    return
  }
  if (xy === '??' && rec.isDir) out.untrackedDirs.push(path)
  else out.files[path] = changeOf(xy)
  const letter = letterOf(xy)
  if (letter) markUp(out.git, { path, root }, letter)
}

export function parseGit(stdout: string, root: string, prefix: string): GitStatus {
  const map = mapper(root, prefix)
  const out: GitStatus = { git: {}, ignored: [], untrackedDirs: [], branch: null, files: {} }
  const parts = stdout.split('\0')
  for (let i = 0; i < parts.length; i++) {
    const rec = parts[i] ?? ''
    if (rec.startsWith('## ')) {
      out.branch = parseBranch(rec)
      continue
    }
    if (rec.length < MIN_RECORD) continue
    const xy = rec.slice(0, 2)
    const raw = rec.slice(PATH_AT)
    if (xy[0] === 'R' || xy[0] === 'C') i++
    const path = map(raw)
    if (!path) continue
    addRecord(out, { xy, path, isDir: raw.endsWith('/') }, root)
  }
  return out
}

// `git diff --numstat -z` lines into `[added, deleted]` per absolute path; a rename's two paths follow its counts.
export function parseNumstat(stdout: string, map: (rel: string) => string | null): Record<string, [number, number]> {
  const into: Record<string, [number, number]> = {}
  const parts = stdout.split('\0')
  for (let i = 0; i < parts.length; i++) {
    const rec = parts[i] ?? ''
    if (!rec) continue
    const m = rec.match(/^(-|\d+)\t(-|\d+)\t(.*)$/s)
    if (!m) continue
    let path = m[3] ?? ''
    if (path === '') {
      i += 2
      path = parts[i] ?? ''
    }
    if (!path) continue
    const add = m[1] === '-' ? 0 : Number(m[1])
    const del = m[2] === '-' ? 0 : Number(m[2])
    const abs = map(path)
    if (!abs) continue
    const prev = into[abs] ?? [0, 0]
    into[abs] = [prev[0] + add, prev[1] + del]
  }
  return into
}

export function rollUp(diff: Record<string, [number, number]>, root: string): Record<string, [number, number]> {
  const out: Record<string, [number, number]> = { ...diff }
  for (const [path, [add, del]] of Object.entries(diff)) {
    let dir = dirname(path)
    while (dir.length >= root.length && dir !== '/') {
      const prev = out[dir] ?? [0, 0]
      out[dir] = [prev[0] + add, prev[1] + del]
      if (dir === root) break
      dir = dirname(dir)
    }
  }
  return out
}

export function rollCounts(files: Record<string, Change>, root: string): Record<string, [number, number, number]> {
  const out: Record<string, [number, number, number]> = {}
  const slot = { new: 0, mod: 1, del: 2 } as const
  for (const [path, change] of Object.entries(files)) {
    let dir = dirname(path)
    while (dir.length >= root.length && dir !== '/') {
      const cur = out[dir] ?? [0, 0, 0]
      cur[slot[change]] += 1
      out[dir] = cur
      if (dir === root) break
      dir = dirname(dir)
    }
  }
  return out
}
