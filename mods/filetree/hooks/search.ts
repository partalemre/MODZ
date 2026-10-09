import type { FileTree } from '../types'
import { PRUNE, pruneArgs, rootOfDisk } from './changes'
import { git } from './gitread'
import { type Host, patch } from './host'
import { list, loadDirs, revealPaths } from './listing'
import { osName } from './platform'
import { mem } from './session'
import { ancestorsOf, dirname, inside, isAbsolute, join, relative } from './tree'

const SEARCH_REVEAL_LIMIT = 60
const JUMP_LIMIT = 10
const LIST_MS = 10_000
const WALK_LIMIT = 20_000
// How deep the file index looks outside a repository: shallower from a disk's root.
const DISK_DEPTH = 3
const DEPTH = 6

export function dropIndex(): void {
  mem.searchIndex = null
}

async function walk(h: Host, root: string, at: { depth: number; limit: number }): Promise<string[]> {
  const out: string[] = []
  let level = [root]
  for (let d = 0; d < at.depth && level.length && out.length < at.limit; d++) {
    const next: string[] = []
    for (const dir of level) {
      for (const n of (await list(h, dir)) ?? []) {
        if (n.kind === 'dir') {
          if (!PRUNE.includes(n.name)) next.push(n.id)
        } else out.push(n.id)
      }
      if (out.length >= at.limit) break
    }
    level = next
  }
  return out
}

async function listAll(h: Host, t: FileTree): Promise<string[] | null> {
  const depth = rootOfDisk(t.root) ? DISK_DEPTH : DEPTH
  try {
    if (!t.top && (await osName(h)) === 'win32') return await walk(h, t.root, { depth, limit: WALK_LIMIT })
    const run = t.top
      ? await git(h, t.root, { args: ['ls-files', '-co', '--exclude-standard', '-z'], timeoutMs: LIST_MS })
      : await h.run(['find', '-H', t.root, '-xdev', '-maxdepth', String(depth), ...pruneArgs(t.root), '-type', 'f', '-print0'], { timeoutMs: LIST_MS })
    if (t.top && run.exitCode !== 0) return null
    const paths = run.stdout.split('\0').filter(Boolean)
    if (run.isStdoutTruncated) paths.pop()
    return paths.map(p => (isAbsolute(p) ? p : join(t.root, p)))
  } catch {
    return null
  }
}

function indexPaths(h: Host, t: FileTree): Promise<string[]> {
  if (mem.searchIndex?.root !== t.root) {
    const index: { root: string; paths: Promise<string[]> } = {
      root: t.root,
      paths: listAll(h, t).then(paths => {
        if (paths === null && mem.searchIndex === index) mem.searchIndex = null
        return paths ?? []
      }),
    }
    mem.searchIndex = index
  }
  return mem.searchIndex.paths
}

export async function search(h: Host, query: string): Promise<string[]> {
  if (!(await h.tree()).query.trim()) mem.searchIndex = null
  await patch(h, () => ({ query }))
  const q = query.trim().toLowerCase()
  if (!q) return []
  const t = await h.tree()
  const hits = (await indexPaths(h, t)).filter(p => relative(t.root, p).toLowerCase().includes(q)).slice(0, SEARCH_REVEAL_LIMIT)
  if ((await h.tree()).query !== query) return []
  await revealPaths(h, hits)
  const shown = await h.tree()
  const ids = new Set(shown.nodes.map(n => n.id))
  const stale = [...new Set(hits.filter(p => !ids.has(p)).map(dirname))].filter(d => inside(shown.root, d))
  if (stale.length) await loadDirs(h, stale)
  return hits
}

export async function jump(h: Host, query: string): Promise<void> {
  const hits = (await search(h, query)).slice(0, JUMP_LIMIT)
  await patch(h, cur => {
    const open = new Set(cur.expanded)
    for (const p of hits) for (const a of ancestorsOf(p, cur.root)) open.add(a)
    return { query: '', expanded: [...open], cursor: hits[0] ?? cur.cursor, scroll: null }
  })
}
