import { MAX_NOTE_AGE_MS } from './limits'
import { words } from './words'
import type { HandoffNote } from '../types'

// Which conversation gets the note. Pure: one fresh conversation takes it, keeps it for every request it sends
// (so its system prompt stays the same and its cache holds), and no other conversation ever sees it.

export type InjectFacts = {
  note: HandoffNote | null
  sessionId: string
  now: number
}

// `inject`: this conversation took it already. `claim`: it may take it now, if it is fresh. `skip`: not here.
export type InjectMove = 'inject' | 'claim' | 'skip'

export const isTooOld = (note: HandoffNote, now: number): boolean => now - note.at > MAX_NOTE_AGE_MS

// Waiting for a next conversation: not taken, handing on switched on, not too old.
export const isReady = (note: HandoffNote | null, now: number): boolean =>
  note !== null && note.consumedBy === null && note.isInjectOn && !isTooOld(note, now)

export function injectMove(facts: InjectFacts): InjectMove {
  const { note, sessionId, now } = facts
  if (note === null) return 'skip'
  if (note.consumedBy === sessionId) return 'inject'
  if (!isReady(note, now) || note.writtenBy === sessionId) return 'skip'

  return 'claim'
}

export const sectionText = (note: HandoffNote): string => `${words().noteIntro}\n\n${note.text}`
