import type { FileNode, FileTree } from '../types'
import { actionsOf } from './actions'
import { type Host, patch } from './host'
import { copyPath, openNode, press, sync, toggle } from './pane'
import { mem } from './session'
import { TOOL_KEYS, type ToolKey } from './toolbar'
import { visibleRows } from './tree'

// What the rows Client posts: a press, a key, a scrollbar drag or a copy.
export type RowsMessage = { press?: unknown; key?: unknown; ctrl?: unknown; shift?: unknown; scrollTo?: unknown; copy?: unknown }
type Key = { key: string; ctrl: unknown; shift: unknown; surface?: string }

const PAGE = 10
const STEPS = new Map<string, number>([
  ['up', -1],
  ['k', -1],
  ['down', 1],
  ['j', 1],
  ['pageup', -PAGE],
  ['pagedown', PAGE],
])
// A wheel tick scrolls at least this many rows.
const MIN_SCROLL = 3

async function pressed(h: Host, t: FileTree, data: RowsMessage): Promise<void> {
  const n = t.nodes.find(x => x.id === data.press)
  if (!n) return
  if (t.scroll === null) await patch(h, () => ({ scroll: mem.view.from }))
  if (data.ctrl || data.shift) await openNode(h, n)
  else await press(h, n)
}

// A key on the row under the cursor; false when it is not one of the row keys.
async function onNode(h: Host, t: FileTree, at: { cur: FileNode; k: Key }): Promise<boolean> {
  const { cur, k } = at
  const { key } = k
  if (key === 'y' || key === 'Y') await copyPath(h, cur.id, { isAbsolute: key === 'Y' || Boolean(k.shift), surface: k.surface })
  else if ((key === 'right' || key === 'l') && cur.kind === 'dir' && !t.expanded.includes(cur.id)) await toggle(h, cur)
  else if (key === 'left' || key === 'h') {
    if (cur.kind === 'dir' && t.expanded.includes(cur.id)) await toggle(h, cur)
    else if (cur.parent !== t.root) await patch(h, () => ({ cursor: cur.parent }))
  } else if (key === 'return') await (cur.kind !== 'dir' ? openNode(h, cur) : toggle(h, cur))
  else if (key === ' ') await toggle(h, cur)
  else return false
  return true
}

async function onKey(h: Host, t: FileTree, k: Key): Promise<void> {
  const rows = visibleRows(t)
  const at = rows.findIndex(r => r.node.id === t.cursor)
  const cur = rows[at]?.node
  const move = (d: number) => {
    const target = rows[Math.max(0, Math.min(rows.length - 1, (at < 0 ? 0 : at) + d))]
    return target ? patch(h, () => ({ cursor: target.node.id, scroll: null })) : Promise.resolve()
  }
  const step = STEPS.get(k.key)
  if (step !== undefined) await move(step)
  else if (k.key === 'home') await move(-rows.length)
  else if (k.key === 'end') await move(rows.length)
  else if (cur && (await onNode(h, t, { cur, k }))) return
  else if (TOOL_KEYS[k.key] && !k.ctrl) actionsOf(h, t)[TOOL_KEYS[k.key] as ToolKey]()
}

export async function onRows(h: Host, data: RowsMessage, surface?: string): Promise<void> {
  void sync(h)
  const t = await h.tree()
  if (typeof data.copy === 'string') return copyPath(h, data.copy, { isAbsolute: Boolean(data.shift), surface })
  if (typeof data.scrollTo === 'number') {
    const to = Math.round(Math.max(0, Math.min(1, data.scrollTo)) * mem.view.max)
    if (to !== t.scroll) await patch(h, () => ({ scroll: to }))
    return
  }
  if (typeof data.press === 'string') return pressed(h, t, data)
  if (typeof data.key === 'string') await onKey(h, t, { key: data.key, ctrl: data.ctrl, shift: data.shift, surface })
}

export async function scrollBy(h: Host, by: number): Promise<void> {
  const t = await h.tree()
  const to = Math.max(0, Math.min(mem.view.max, (t.scroll ?? mem.view.from) + Math.sign(by) * Math.max(MIN_SCROLL, Math.abs(by))))
  if (to !== t.scroll) await patch(h, () => ({ scroll: to }))
}
