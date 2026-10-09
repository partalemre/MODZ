import { rootOfDisk } from './changes'
import { type Host, patch } from './host'
import { osName } from './platform'
import { mem } from './session'
import type { FileTree } from '../types'
import { inside, join, type Row } from './tree'

const SIZE_TIMEOUT_MS = 15_000
const SIZE_JOBS = 2
const SIZE_WALK_LIMIT = 50_000
const BYTES_PER_KB = 1024

let sizeActive = 0
const sizing = new Set<string>()

async function walkSize(h: Host, dir: string): Promise<number> {
  let total = 0
  let seen = 0
  let level = [dir]
  while (level.length) {
    const next: string[] = []
    for (const d of level) {
      let entries
      try {
        entries = await h.list(d)
      } catch {
        continue
      }
      for (const e of entries) {
        if (++seen > SIZE_WALK_LIMIT) return -1
        if (e.kind === 'dir' && !e.isLink) next.push(join(d, e.name))
        else if (e.kind === 'file') total += e.size
      }
    }
    level = next
  }
  return total
}

async function dirSize(h: Host, dir: string): Promise<number> {
  if (rootOfDisk(dir)) return -1
  if ((await osName(h)) === 'win32') return walkSize(h, dir)
  try {
    const run = await h.run(['du', '-skxH', dir], { timeoutMs: SIZE_TIMEOUT_MS })
    const kb = Number(run.stdout.trim().split(/\s/)[0] || NaN)
    return Number.isFinite(kb) ? kb * BYTES_PER_KB : -1
  } catch {
    return -1
  }
}

// A size measured for an older tree goes back in the queue if the folder still wants one.
async function settle(h: Host, dir: string, at: { epoch: number; bytes: number }): Promise<void> {
  if (at.epoch === mem.sizeEpoch) return patch(h, cur => (inside(cur.root, dir) ? { dirSizes: { ...cur.dirSizes, [dir]: at.bytes } } : {}))
  const cur = await h.tree()
  if (cur.showSize && inside(cur.root, dir) && !(dir in cur.dirSizes) && !mem.sizeQueue.includes(dir)) mem.sizeQueue.push(dir)
}

function pumpSizes(h: Host): void {
  while (sizeActive < SIZE_JOBS && mem.sizeQueue.length) {
    const dir = mem.sizeQueue.shift() ?? ''
    const epoch = mem.sizeEpoch
    sizing.add(dir)
    sizeActive += 1
    void dirSize(h, dir)
      .then(bytes => settle(h, dir, { epoch, bytes }))
      .catch(() => undefined)
      .finally(() => {
        sizing.delete(dir)
        sizeActive -= 1
        pumpSizes(h)
      })
  }
}

// The listed folders in view whose size is not known yet.
export const unsized = (t: FileTree, rows: Row[]): string[] => rows.filter(r => r.node.kind === 'dir' && !(r.node.id in t.dirSizes)).map(r => r.node.id)

export function wantSizes(h: Host, dirs: string[]): void {
  for (const dir of dirs) if (!sizing.has(dir) && !mem.sizeQueue.includes(dir)) mem.sizeQueue.push(dir)
  pumpSizes(h)
}

export function forgetSizes(): void {
  mem.sizeEpoch += 1
  mem.sizeQueue = []
}

export async function staleSizes(h: Host, paths?: string[]): Promise<void> {
  forgetSizes()
  await patch(h, cur => {
    if (!paths) return { dirSizes: {} }
    const keep: Record<string, number> = {}
    for (const [dir, bytes] of Object.entries(cur.dirSizes)) if (!paths.some(p => inside(dir, p))) keep[dir] = bytes
    return { dirSizes: keep }
  })
}
