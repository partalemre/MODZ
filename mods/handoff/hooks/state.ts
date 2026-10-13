import type { Io } from './io'
import type { HandoffNote } from '../types'

// The note kept across sessions in `$.store`, one per repo, mirrored into the session's `latest` value.

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
