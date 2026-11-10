import { reasonOf } from './io'
import type { Io } from './io'
import { NOTES_MAX, NOTES_MAX_AGE_MS, PROCESS_TIMEOUT_MS } from './limits'
import { noteDir } from './note'
import { forgetNote } from './state'
import type { NoteEntry } from '../types'

// Every note this mod keeps for a repo, listed in `$.store` under `notes:<repo>` and mirrored into `notes` for the
// pane: added as each is written, pruned after a week, deleted one by one from the pane.

const listKey = (repo: string): string => `notes:${repo}`

const isEntry = (value: unknown): value is NoteEntry => {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>

  return typeof v.path === 'string' && typeof v.at === 'number' && typeof v.text === 'string' && (v.kind === 'handoff' || v.kind === 'compact')
}

// Newest first, one entry per file (a later write of the same file replaces it), at most NOTES_MAX.
export const withEntry = (entries: readonly NoteEntry[], entry: NoteEntry): NoteEntry[] =>
  [entry, ...entries.filter(e => e.path !== entry.path)].slice(0, NOTES_MAX)

export function pruned(entries: readonly NoteEntry[], now: number): { kept: NoteEntry[]; dropped: NoteEntry[] } {
  const isFresh = (e: NoteEntry) => now - e.at <= NOTES_MAX_AGE_MS

  return { kept: entries.filter(isFresh), dropped: entries.filter(e => !isFresh(e)) }
}

async function readList(io: Io, repo: string): Promise<NoteEntry[]> {
  const raw = await io.store.get(listKey(repo))

  return Array.isArray(raw) ? raw.filter(isEntry) : []
}

// A note file goes, but only one this mod wrote, inside its own folder.
export async function deleteFile(io: Io, repo: string, path: string): Promise<void> {
  const isOurs = path.startsWith(`${noteDir(repo)}/`) && path.endsWith('.md') && !path.includes('/../')
  if (!isOurs) return
  const out = await io.run(['rm', '-f', '--', path], { timeoutMs: PROCESS_TIMEOUT_MS })
  if (out.exitCode !== 0) io.log(`note file kept (rm exited ${out.exitCode})`)
}

async function saveList(io: Io, repo: string, entries: NoteEntry[]): Promise<void> {
  await io.store.set(listKey(repo), entries)
  await io.put('notes', entries)
}

// The repo's list as the store has it, the stale notes (and their files) gone.
export async function loadNotes(io: Io, repo: string): Promise<NoteEntry[]> {
  const { kept, dropped } = pruned(await readList(io, repo), await io.now())
  for (const entry of dropped) await deleteFile(io, repo, entry.path)
  if (dropped.length > 0) await io.store.set(listKey(repo), kept)
  await io.put('notes', kept)

  return kept
}

export async function addEntry(io: Io, repo: string, entry: NoteEntry): Promise<void> {
  await saveList(io, repo, withEntry(await readList(io, repo), entry))
}

// The note's file and its row go; the handoff waiting for the next chat too, when it is that note.
export async function dropEntry(io: Io, repo: string, path: string): Promise<void> {
  await deleteFile(io, repo, path).catch(error => io.log(`note file kept (${reasonOf(error)})`))
  await saveList(io, repo, (await readList(io, repo)).filter(e => e.path !== path))
  if ((await io.get('latest'))?.path === path) await forgetNote(io, repo)
}
