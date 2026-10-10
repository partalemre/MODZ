import type { FileTree } from '../types'
import { type Host, patch } from './host'
import { mem } from './session'
import { ancestorsOf, visibleRows } from './tree'

export const BRANCH_ROW = '#branch'
const FLASH_MS = 2700

export function unlit(): Partial<FileTree> {
  return { flash: [], flashDim: [], flashOn: false, flashTones: {} }
}

export function cancelFlash(): void {
  mem.generation += 1
  mem.blink?.cancel()
  mem.blink = null
}

function keepTop(cur: FileTree, expanded: string[]): Partial<FileTree> {
  if (mem.followClaude) return { scroll: null }
  const top = visibleRows(cur)[cur.scroll ?? mem.view.from]?.node.id
  const at = top ? visibleRows({ ...cur, expanded }).findIndex(r => r.node.id === top) : -1
  return at < 0 ? {} : { scroll: at }
}

// Lights each row in its tone and opens the folders above it, the newly opened ones lit dim.
function lit(cur: FileTree, tones: Record<string, string>): Partial<FileTree> {
  const unique = Object.keys(tones)
  const open = new Set(cur.expanded)
  const bright = new Set([...(cur.flashOn ? cur.flash.filter(id => !unique.includes(id)) : []), ...unique])
  const dim = new Set<string>(cur.flashOn ? cur.flashDim : [])
  const all: Record<string, string> = cur.flashOn ? { ...cur.flashTones } : {}
  for (const id of unique) {
    const tone = tones[id] ?? 'orange'
    all[id] = tone
    if (id === BRANCH_ROW) continue
    const chain = ancestorsOf(id, cur.root)
    if (!chain.some(a => !open.has(a))) continue
    for (const a of chain) {
      if (!open.has(a)) {
        dim.add(a)
        all[a] = all[a] ?? tone
      }
      open.add(a)
    }
  }
  for (const id of bright) dim.delete(id)
  return { flash: [...bright], flashDim: [...dim], flashOn: true, flashTones: all, expanded: [...open], ...keepTop(cur, [...open]) }
}

export async function flash(h: Host, tones: Record<string, string>): Promise<void> {
  if (Object.keys(tones).length === 0) return
  const mine = ++mem.generation
  const root = (await h.tree()).root
  mem.blink?.cancel()
  mem.blink = null
  await patch(h, cur => (cur.root === root ? lit(cur, tones) : {}))
  if (mem.generation !== mine) return
  mem.blink = h.after(FLASH_MS, () => {
    if (mem.generation !== mine) return
    mem.blink = null
    void patch(h, () => (mem.generation === mine ? unlit() : {}))
  })
}
