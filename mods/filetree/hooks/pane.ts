import type { FileNode } from '../types'
import { cancelFlash } from './flash'
import { detectRepo, refreshGit } from './gitread'
import { type Host, patch } from './host'
import { ancestorsOf, posix, emptyTree, inside } from './tree'
import { loadDirs, openDirs, revealPaths } from './listing'
import { openFile } from './platform'
import { dropIndex } from './search'
import { mem } from './session'
import { forgetSizes } from './sizes'

const DOUBLE_MS = 450
const SYNC_MS = 2_000

export async function cwdOf(h: Host): Promise<string> {
  return posix(await h.cwd())
}

// Calm: the pane opens when the person asks; on its own the mod only retitles an open pane.
export async function showPane(h: Host, isAsked: boolean): Promise<void> {
  if (isAsked) await h.openPane(true)
  else if (!mem.noDock && (await h.isPaneOpen())) await h.openPane(false)
}

export async function inApp(h: Host): Promise<boolean> {
  try {
    return (await h.surfaces()).some(s => s !== 'terminal')
  } catch {
    return false
  }
}

export async function reset(h: Host, root: string, focus = false): Promise<void> {
  const prev = await h.tree()
  cancelFlash()
  mem.lastRoot = root
  dropIndex()
  forgetSizes()
  await h.putTree(() => ({ ...emptyTree(root), showHidden: prev.showHidden, showTools: prev.showTools, showSize: prev.root ? prev.showSize : mem.sizeDefault }))
  await showPane(h, focus)
  await loadDirs(h, [root])
  await detectRepo(h)
  await refreshGit(h)
}

// A request from the MODZ main panel: opens (or brings forward) the pane, never closes it.
export async function openFromHub(h: Host): Promise<void> {
  mem.noDock = false
  const t = await h.tree()
  if (!t.root || t.nodes.length === 0) await reset(h, await cwdOf(h), true)
  else await showPane(h, true)
}

export async function followCwd(h: Host): Promise<boolean> {
  if (!mem.follow) return false
  const cwd = await cwdOf(h)
  const t = await h.tree()
  if (t.root === cwd) return false
  await reset(h, cwd)
  return true
}

export async function sync(h: Host, force = false): Promise<void> {
  const now = await h.now()
  if (!force && now - mem.lastSync < SYNC_MS) return
  mem.lastSync = now
  dropIndex()
  const t = await h.tree()
  if (!t.root) return
  await loadDirs(h, [t.root, ...openDirs(t)])
  if (t.top) await refreshGit(h)
}

export async function copyPath(h: Host, id: string, how: { isAbsolute: boolean; surface?: string }): Promise<void> {
  const t = await h.tree()
  const text = !how.isAbsolute && id !== t.root && inside(t.root, id) ? id.slice(t.root.endsWith('/') ? t.root.length : t.root.length + 1) : id
  const done = await h.copy({ text, ...(how.surface ? { surface: how.surface as 'terminal' } : {}) })
  h.toast(done.isCopied ? `Kopyalandı: ${text}` : 'Yol kopyalanamadı')
}

export async function toggle(h: Host, n: FileNode): Promise<void> {
  if (n.kind === 'dir' && !(await h.tree()).expanded.includes(n.id)) await loadDirs(h, [n.id])
  await patch(h, t => {
    const open = new Set(t.expanded)
    if (n.kind === 'dir') open.has(n.id) ? open.delete(n.id) : open.add(n.id)
    return { expanded: [...open], cursor: n.id, selected: n.kind === 'dir' ? t.selected : n.id }
  })
}

export async function openNode(h: Host, n: FileNode): Promise<void> {
  if (n.kind === 'dir') {
    mem.follow = false
    await reset(h, n.id)
  } else await openFile(h, n.id)
}

export async function press(h: Host, n: FileNode): Promise<void> {
  const now = await h.now()
  const isDouble = mem.lastPress.key === n.id && now - mem.lastPress.at < DOUBLE_MS
  mem.lastPress = { key: isDouble ? '' : n.id, at: now }
  if (!isDouble) {
    await toggle(h, n)
    return
  }
  await openNode(h, n)
}

export async function reveal(h: Host, paths: string[]): Promise<void> {
  if (await followCwd(h)) return
  await revealPaths(h, paths)
  await patch(h, cur => {
    const open = new Set(cur.expanded)
    for (const p of paths) for (const a of ancestorsOf(p, cur.root)) open.add(a)
    return { expanded: [...open], cursor: paths[paths.length - 1] ?? cur.cursor, scroll: null }
  })
}
