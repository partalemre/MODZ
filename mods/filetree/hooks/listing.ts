import type { FileNode, FileTree } from '../types'
import { type Host, patch } from './host'
import { mem } from './session'
import { ancestorsOf, type Entry, inside, join, replaceChildren, toNodes } from './tree'
import { words } from './words'

// Each pass loads one more level towards every path; deeper than this is never a tree the pane shows.
const REVEAL_PASSES = 32

let listSeq = 0
const listLatest = new Map<string, number>()
const unreadable = new Set<string>()

export function shortPath(path: string): string {
  return mem.home && inside(mem.home, path) ? `~${path.slice(mem.home.length)}` : path
}

export async function exists(h: Host, path: string): Promise<boolean> {
  try {
    await h.stat(path)
    return true
  } catch {
    return false
  }
}

async function entryOf(h: Host, dir: string, e: Entry): Promise<Entry> {
  if (!e.isLink) return { name: e.name, kind: e.kind, mtimeMs: e.mtimeMs, size: e.size, isLink: false }
  try {
    const target = await h.stat(join(dir, e.name))
    return target.kind === 'dir'
      ? { name: e.name, kind: 'dir' as const, mtimeMs: target.mtimeMs, size: 0, isLink: false }
      : { name: e.name, kind: 'file' as const, mtimeMs: target.mtimeMs, size: target.size, isLink: true }
  } catch {
    return { name: e.name, kind: 'other' as const, mtimeMs: 0, size: 0, isLink: true }
  }
}

export async function list(h: Host, dir: string): Promise<FileNode[] | null> {
  try {
    const entries = await h.list(dir)
    const resolved = await Promise.all(entries.map(e => entryOf(h, dir, e)))
    unreadable.delete(dir)
    return toNodes(dir, resolved)
  } catch (err) {
    if (!(await exists(h, dir))) return []
    if (!unreadable.has(dir)) {
      unreadable.add(dir)
      h.toast(words().notListed(shortPath(dir), err instanceof Error ? err.message : String(err)))
    }
    return null
  }
}

export async function loadDirs(h: Host, dirs: string[]): Promise<Map<string, FileNode[]>> {
  const root = (await h.tree()).root
  const seq = ++listSeq
  for (const dir of dirs) listLatest.set(dir, seq)
  const results = await Promise.all(dirs.map(async dir => [dir, await list(h, dir)] as const))
  const listed = new Map<string, FileNode[]>()
  for (const [dir, kids] of results) {
    if (listLatest.get(dir) !== seq) continue
    listLatest.delete(dir)
    if (kids) listed.set(dir, kids)
  }
  await patch(h, t => (t.root === root ? { nodes: replaceChildren(t.nodes, listed) } : {}))
  return listed
}

// The first folder on the way to each path that is not listed yet, unless it was tried already.
function unloaded(t: FileTree, paths: string[], tried: Set<string>): Set<string> {
  const loaded = new Set(t.nodes.filter(n => n.loaded).map(n => n.id))
  if (t.nodes.some(n => n.parent === t.root)) loaded.add(t.root)
  const need = new Set<string>()
  for (const p of paths) {
    for (const dir of [t.root, ...ancestorsOf(p, t.root).reverse()]) {
      if (!loaded.has(dir)) {
        if (!tried.has(dir)) need.add(dir)
        break
      }
    }
  }
  return need
}

export async function revealPaths(h: Host, paths: string[]): Promise<void> {
  const tried = new Set<string>()
  for (let pass = 0; pass < REVEAL_PASSES; pass++) {
    const need = unloaded(await h.tree(), paths, tried)
    if (need.size === 0) return
    for (const dir of need) tried.add(dir)
    await loadDirs(h, [...need])
  }
}

export function openDirs(t: FileTree): string[] {
  const open = new Set(t.expanded)
  return t.nodes.filter(n => n.kind === 'dir' && n.loaded && open.has(n.id)).map(n => n.id)
}
