import type { FileTree } from '../types'
import { detectRepo, refreshGit } from './gitread'
import { type Host, patch } from './host'
import { loadDirs } from './listing'
import { cwdOf, reset } from './pane'
import { dropIndex, search } from './search'
import { mem } from './session'
import { staleSizes } from './sizes'
import type { ToolKey } from './toolbar'
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

// The toolbar's actions, shared by both surfaces and the tree's single-key shortcuts.
export function actionsOf(h: Host, t: FileTree) {
  return {
    refresh: () => void refresh(h),
    collapse: () => void patch(h, cur => ({ expanded: [], nodes: dropBelow(cur.nodes, cur.nodes.filter(x => x.parent === cur.root && x.kind === 'dir').map(x => x.id)) })),
    size: () => void patch(h, cur => ({ showSize: !cur.showSize })),
    up: () => void up(h, t),
    cwd: () => void home(h),
    hidden: () => void patch(h, cur => ({ showHidden: !cur.showHidden })),
    unselect: () => void patch(h, () => ({ selected: '' })),
    more: () => void patch(h, cur => ({ showTools: !cur.showTools })),
  } satisfies Record<ToolKey, () => void>
}
