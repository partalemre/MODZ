import type { Args } from 'claude-code'

import type { FileTree } from '../types'
import type { Host } from './host'
import { exists } from './listing'
import { cwdOf, followCwd, reveal, sync } from './pane'
import { settleBackground } from './scan'
import { mem } from './session'
import { resolve } from './shell'
import { inside } from './tree'

// A pick older than this is a click from earlier work, not what "this" in the prompt means.
const PICK_FRESH_MS = 2 * 60_000

// The tree's paths a prompt names with `@`, trailing punctuation dropped.
function mentionsOf(text: string, t: FileTree): string[] {
  return [...text.matchAll(/@([^\s"'`]+)/g)]
    .map(m => (m[1] ?? '').replace(/[.,;:!?)]+$/, ''))
    .filter(Boolean)
    .map(p => resolve(t.root, p, mem.home))
    .filter(p => inside(t.root, p))
}

async function revealMentions(h: Host, mentions: string[]): Promise<void> {
  const found: string[] = []
  for (const p of mentions) {
    try {
      await h.stat(p)
      found.push(p.replace(/\/$/, ''))
    } catch {
      continue
    }
  }
  if (found.length) await reveal(h, found)
}

// The prompt's context with a file picked since the last prompt named, so "this" in the prompt can mean it.
export async function promptContext(h: Host, e: Args<'prompt.submit'>) {
  void settleBackground(h, e.text)
  const context = [...(e.context ?? [])]
  if (!mem.isLooked) return context
  // The tree follows the folder in the background: a slow or failing listing never holds the prompt back.
  void followCwd(h).then(moved => (moved ? undefined : sync(h))).catch(() => undefined)
  const t = await h.tree()
  const isMoving = mem.follow && t.root !== (await cwdOf(h))
  const pick = mem.freshPick
  const isRecent = (await h.now()) - mem.freshPickAt <= PICK_FRESH_MS
  mem.freshPick = ''
  if (!isMoving && isRecent && t.selected && pick === t.selected && (await exists(h, t.selected))) context.push(`The user has this file selected in the file tree; "this" or "it" in the prompt likely refers to it: ${t.selected}`)
  const mentions = mentionsOf(e.text, t)
  if (mentions.length) void revealMentions(h, mentions)
  return context
}
