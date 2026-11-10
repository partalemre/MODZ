import type { Io } from './io'
import { PROCESS_TIMEOUT_MS } from './limits'
import type { HandoffNote } from '../types'

// The note kept across sessions in `$.store`, one per repo, mirrored into the session's `latest` value.

// Desktop sessions run in worktrees that come and go: the note belongs to the main repository they share.
const repos = new Map<string, string>()
const GIT_DIR = '/.git'

export async function repoOf(io: Io): Promise<string> {
  const root = await io.root()
  const known = repos.get(root)
  if (known !== undefined) return known
  const out = await io.run(['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: root, timeoutMs: PROCESS_TIMEOUT_MS }).catch(() => null)
  const common = out?.exitCode === 0 ? out.stdout.trim() : ''
  // A bare repo or no repo at all: the folder itself.
  const repo = common.endsWith(GIT_DIR) ? common.slice(0, -GIT_DIR.length) : root
  repos.set(root, repo)

  return repo
}

const storeKey = (root: string): string => `latest:${root}`

const isText = (value: unknown): value is string => typeof value === 'string'

// The store is read back across versions and by hand: a value of any other shape counts as none.
export function asNote(value: unknown): HandoffNote | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  const hasTexts = isText(v.path) && isText(v.root) && isText(v.text) && isText(v.writtenBy)
  const hasFlags = typeof v.at === 'number' && typeof v.isInjectOn === 'boolean' && typeof v.isSummarized === 'boolean'
  const hasConsumer = v.consumedBy === null || isText(v.consumedBy)

  return hasTexts && hasFlags && hasConsumer ? (v as unknown as HandoffNote) : null
}

export async function loadNote(io: Io, root: string): Promise<HandoffNote | null> {
  const note = asNote(await io.store.get(storeKey(root)))
  await io.put('latest', note)

  return note
}

export async function saveNote(io: Io, note: HandoffNote): Promise<void> {
  await io.store.set(storeKey(note.root), note)
  await io.put('latest', note)
}

export async function forgetNote(io: Io, root: string): Promise<void> {
  await io.store.delete(storeKey(root))
  await io.put('latest', null)
}
