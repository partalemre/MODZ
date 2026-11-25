import type { FileTree } from '../types'
import { detectRepo, refreshGit } from './gitread'
import { type Host, patch } from './host'
import { loadDirs } from './listing'
import { cwdOf, reset } from './pane'
import { dropIndex, jump, search } from './search'
import { mem } from './session'
import { staleSizes, wantSizes } from './sizes'
import type { FilesActs, ToolKey } from './toolbar'
import { dirname, dropBelow } from './tree'

async function refresh(h: Host): Promise<void> {
  const cur = await h.tree()
  dropIndex()
  await staleSizes(h)
  await loadDirs(h, [cur.root, ...cur.expanded])
  await detectRepo(h)
  await refreshGit(h)
  if (cur.query.trim()) await search(h, cur.query)
}

async function up(h: Host, t: FileTree): Promise<void> {
  mem.follow = false
  await reset(h, dirname(t.root))
}

async function home(h: Host): Promise<void> {
  mem.follow = true
  await reset(h, await cwdOf(h))
}

// The toolbar's work, awaited where a press on the hub's page waits for it before asking for sizes (hubact.ts).
export function toolWork(h: Host, t: FileTree): Record<ToolKey, () => Promise<void>> {
  return {
    refresh: () => refresh(h),
    collapse: () => patch(h, cur => ({ expanded: [], nodes: dropBelow(cur.nodes, cur.nodes.filter(x => x.parent === cur.root && x.kind === 'dir').map(x => x.id)) })),
    size: () => patch(h, cur => ({ showSize: !cur.showSize })),
    up: () => up(h, t),
    cwd: () => home(h),
    hidden: () => patch(h, cur => ({ showHidden: !cur.showHidden })),
    unselect: () => patch(h, () => ({ selected: '' })),
    more: () => patch(h, cur => ({ showTools: !cur.showTools })),
  }
}

// The toolbar's actions, shared by both surfaces and the tree's single-key shortcuts.
export function actionsOf(h: Host, t: FileTree): Record<ToolKey, () => void> {
  const work = toolWork(h, t)
  return Object.fromEntries(Object.entries(work).map(([key, run]) => [key, () => void run()])) as Record<ToolKey, () => void>
}

// What this mod's own pane hands its drawing (FilesActs, toolbar.tsx).
export function filesActs(h: Host, t: FileTree): FilesActs {
  return { tool: actionsOf(h, t), find: v => void search(h, v), jump: v => void jump(h, v), sizes: dirs => wantSizes(h, dirs) }
}
