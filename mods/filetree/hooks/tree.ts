import type { FileNode, FileTree, Theme } from '../types'
import { words } from './words'

export type Entry = { name: string; kind: 'file' | 'dir' | 'other'; mtimeMs: number; size: number; isLink: boolean }
export type Row = { node: FileNode; depth: number; open: boolean }

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

export const DEFAULT_THEME: Theme = {
  fg: '',
  accent: '#5b9bd5',
  muted: '#808a96',
  urgent: '#d0605e',
  selection: '#6b7280',
  bg: '',
}

export function emptyTree(root: string): FileTree {
  return {
    root,
    nodes: [],
    expanded: [],
    cursor: '',
    selected: '',
    query: '',
    showHidden: true,
    showSize: false,
    dirSizes: {},
    git: {},
    diff: {},
    ignored: [],
    untrackedDirs: [],
    top: '',
    prefix: '',
    branch: null,
    counts: {},
    flash: [],
    flashDim: [],
    flashOn: false,
    flashTones: {},
    scroll: null,
    showTools: false,
  }
}

export function parseTheme(toml: string): Theme {
  const get = (k: string) => toml.match(new RegExp(`^${k}\\s*=\\s*"(#[0-9a-fA-F]{6})"`, 'm'))?.[1]
  return {
    fg: get('foreground') ?? get('color7') ?? DEFAULT_THEME.fg,
    accent: get('accent') ?? get('color4') ?? DEFAULT_THEME.accent,
    muted: get('muted') ?? get('color8') ?? DEFAULT_THEME.muted,
    urgent: get('red') ?? get('color1') ?? DEFAULT_THEME.urgent,
    selection: get('selection') ?? DEFAULT_THEME.selection,
    bg: get('dark_background') ?? get('background') ?? DEFAULT_THEME.bg,
  }
}

export function join(dir: string, name: string): string {
  return dir.endsWith('/') ? dir + name : `${dir}/${name}`
}

let drives = false

export function dirname(path: string): string {
  if (drives && /^[A-Za-z]:\/[^/]*$/.test(path)) return path.slice(0, 3)
  const i = path.lastIndexOf('/')
  return i <= 0 ? '/' : path.slice(0, i)
}

export function useDrives(on: boolean): void {
  drives = on
}

export function drivesOn(): boolean {
  return drives
}

export function posix(path: string): string {
  if (!drives) return path
  return path.replace(/\\/g, '/').replace(/^\/([A-Za-z])(\/|$)/, (_, d: string) => `${d.toUpperCase()}:/`)
}

export function dropBelow(nodes: FileNode[], dirs: string[]): FileNode[] {
  if (dirs.length === 0) return nodes
  const under = (id: string) => dirs.some(d => id !== d && inside(d, id))
  const gone = new Set(dirs)
  return nodes.filter(n => !under(n.id)).map(n => (gone.has(n.id) && n.loaded ? { ...n, loaded: false } : n))
}

export function isAbsolute(path: string): boolean {
  return path.startsWith('/') || (drives && /^[A-Za-z]:\//.test(path))
}

export function inside(root: string, path: string): boolean {
  return path === root || path.startsWith(root.endsWith('/') ? root : `${root}/`)
}

function kindOf(e: Entry): FileNode['kind'] {
  if (e.isLink) return 'link'
  return e.kind === 'dir' ? 'dir' : 'file'
}

export function toNodes(dir: string, list: Entry[]): FileNode[] {
  return list
    .map(e => ({
      id: join(dir, e.name),
      parent: dir,
      name: e.name,
      kind: kindOf(e),
      hidden: e.name.startsWith('.'),
      mtime: e.mtimeMs,
      size: e.size,
      loaded: false,
    }))
    .sort((a, b) => (a.kind === 'dir' ? 0 : 1) - (b.kind === 'dir' ? 0 : 1) || collator.compare(a.name, b.name))
}

export function replaceChildren(nodes: FileNode[], listed: Map<string, FileNode[]>): FileNode[] {
  if (listed.size === 0) return nodes
  const keep = new Map<string, FileNode>()
  for (const n of nodes) if (listed.has(n.parent)) keep.set(n.id, n)
  const freshIds = new Set<string>()
  for (const kids of listed.values()) for (const k of kids) freshIds.add(k.id)
  const gone = new Set([...keep.keys()].filter(id => !freshIds.has(id)))
  const under = (id: string) => {
    if (gone.size === 0) return false
    for (let dir = dirname(id), prev = id; dir !== prev; prev = dir, dir = dirname(dir)) if (gone.has(dir)) return true
    return false
  }
  const fresh: FileNode[] = []
  for (const kids of listed.values()) {
    for (const k of kids) {
      if (under(k.id)) continue
      const old = keep.get(k.id)
      fresh.push(old && old.kind === 'dir' && k.kind === 'dir' ? { ...k, loaded: old.loaded } : k)
    }
  }
  const out = nodes.filter(n => !listed.has(n.parent) && !under(n.id))
  return [...out.map(n => (listed.has(n.id) ? { ...n, loaded: true } : n)), ...fresh]
}

export function underAny(id: string, set: ReadonlySet<string>, root: string): boolean {
  if (set.size === 0) return false
  let cur = id
  while (cur.length >= root.length) {
    if (set.has(cur)) return true
    const up = dirname(cur)
    if (up === cur) break
    cur = up
  }
  return false
}

export function ancestorsOf(id: string, root: string): string[] {
  const out: string[] = []
  if (!root) return out
  for (let dir = dirname(id), prev = id; dir !== prev && dir !== root && inside(root, dir); prev = dir, dir = dirname(dir)) out.push(dir)
  return out
}

export function relative(root: string, path: string): string {
  return path === root ? '' : path.slice(root.endsWith('/') ? root.length : root.length + 1)
}

export function visibleRows(t: FileTree): Row[] {
  const kids = new Map<string, FileNode[]>()
  for (const n of t.nodes) {
    if (!t.showHidden && n.hidden) continue
    const list = kids.get(n.parent)
    if (list) list.push(n)
    else kids.set(n.parent, [n])
  }
  const q = t.query.trim().toLowerCase()
  let keep: Set<string> | null = null
  if (q) {
    keep = new Set()
    for (const n of t.nodes) {
      if (!relative(t.root, n.id).toLowerCase().includes(q)) continue
      keep.add(n.id)
      for (const a of ancestorsOf(n.id, t.root)) keep.add(a)
    }
  }
  const open = new Set(t.expanded)
  const rows: Row[] = []
  const walk = (dir: string, depth: number) => {
    for (const n of kids.get(dir) ?? []) {
      if (keep && !keep.has(n.id)) continue
      const isOpen = n.kind === 'dir' && (keep ? kids.has(n.id) : open.has(n.id))
      rows.push({ node: n, depth, open: isOpen })
      if (isOpen) walk(n.id, depth + 1)
    }
  }
  walk(t.root, 0)
  return rows
}

// "15:40" today, "Sep 3" this year, "Sep 3, 2024" before; Turkish "3 Eyl", "3 Eyl 2024".
export function stamp(ms: number, now = Date.now()): string {
  if (!ms) return ''
  const d = new Date(ms)
  const today = new Date(now)
  const p = (v: number) => String(v).padStart(2, '0')
  if (d.toDateString() === today.toDateString()) return `${p(d.getHours())}:${p(d.getMinutes())}`
  const w = words()
  const day = w.day(d.getDate(), w.months[d.getMonth()] ?? '')
  return d.getFullYear() === today.getFullYear() ? day : w.dayOfYear(day, d.getFullYear())
}

export function formatSize(bytes: number): string {
  if (bytes < 0) return '?'
  if (bytes < 1024) return `${bytes} B`
  const units = ['K', 'M', 'G', 'T']
  let v = bytes / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v < 100 ? v.toFixed(1).replace('.', words().decimal) : Math.round(v)} ${units[i]}`
}
