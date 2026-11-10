import type { PromptComposeSection, SessionCompactResult } from 'claude-code'

import { autoPercentOf, isAskDue, rearmed, snoozeFrom } from './gate'
import type { AskFacts } from './gate'
import { hubCard, hubOf } from './hub'
import { injectMove, sectionText } from './inject'
import { reasonOf } from './io'
import type { Io } from './io'
import { NOTICE_FOREVER, NOTICE_PRIORITY, SECTION_ID } from './limits'
import type { Settings } from './limits'
import { dropEntry } from './notes'
import { loadNote, repoOf, saveNote } from './state'
import { words } from './words'
import { writeHandoff, writeWorkingNotes } from './write'
import type { NoteEntry } from '../types'

// What a press, the command, a measurement and the prompt do. Each runs from a handler or an event, never
// while drawing.

// The MODZ main panel's card, written only when what it shows changes (DESIGN.md §9).
export async function writeHub(io: Io, settings: Settings): Promise<void> {
  const shown = hubOf({
    percent: await io.get('percent'), threshold: settings.threshold, note: await io.get('latest'), stage: await io.get('stage'), now: await io.now(),
  })
  const before = await io.hub.get()
  const isUnchanged = before !== undefined && before.detail === shown.detail && before.tone === shown.tone && before.title === words().title
  if (!isUnchanged) await io.hub.set(hubCard(shown, await io.now()))
}

export const askFactsOf = async (io: Io, settings: Settings): Promise<AskFacts> => ({
  percent: await io.get('percent'), threshold: settings.threshold, snoozeUntil: await io.get('snoozeUntil'), stage: await io.get('stage'), autoAt: await io.get('autoAt'),
})

// The shared notice line holds this mod's place while the ask is due, and lets go once it is answered.
async function syncNotice(io: Io, settings: Settings): Promise<void> {
  const isDue = isAskDue(await askFactsOf(io, settings))
  await io.put('notice', isDue ? { priority: NOTICE_PRIORITY, expiresAt: NOTICE_FOREVER } : null)
}

// Where auto-compaction fires, read once per conversation (the engine's own estimate); unread, the setting alone.
async function readAutoAt(io: Io): Promise<void> {
  if ((await io.get('autoAt')) !== null) return
  try {
    await io.put('autoAt', autoPercentOf(await io.autoCompact()) ?? 'off')
  } catch (error) {
    io.log(`auto-compaction point unread (${reasonOf(error)})`)
  }
}

export async function measured(io: Io, settings: Settings, percent: number | null): Promise<void> {
  await io.put('percent', percent)
  if (percent !== null) await readAutoAt(io)
  const next = rearmed({ ...(await askFactsOf(io, settings)), percent })
  await io.put('snoozeUntil', next.snoozeUntil)
  await io.put('stage', next.stage)
  await syncNotice(io, settings)
  await writeHub(io, settings)
}

// A /clear starts a new conversation in the same process: what the last one tracked starts over.
export async function resetConversation(io: Io, settings: Settings): Promise<void> {
  await io.put('percent', null)
  await io.put('snoozeUntil', null)
  await io.put('stage', 'idle')
  await io.put('failure', null)
  await io.put('files', [])
  await io.put('lastError', null)
  await io.put('notice', null)
  await io.put('declined', null)
  await io.put('compacted', null)
  await io.put('autoAt', null)
  await writeHub(io, settings)
}

// Writes the note; a second press while one is being written does nothing. Resolves the note's path, or null.
export async function write(io: Io, settings: Settings): Promise<string | null> {
  if ((await io.get('stage')) === 'writing') return null
  await io.put('stage', 'writing')
  await syncNotice(io, settings)
  await writeHub(io, settings)
  try {
    const note = await writeHandoff(io, settings)
    await io.put('failure', null)
    await io.put('stage', 'saved')

    return note.path
  } catch (error) {
    io.log(`note not written (${reasonOf(error)})`)
    await io.put('failure', reasonOf(error))
    await io.put('stage', 'failed')
    throw new Error(reasonOf(error), { cause: error })
  } finally {
    await writeHub(io, settings)
  }
}

export async function snooze(io: Io, settings: Settings): Promise<void> {
  await io.put('snoozeUntil', snoozeFrom((await io.get('percent')) ?? settings.threshold))
  await io.put('stage', 'idle')
  await syncNotice(io, settings)
}

// Set while this mod's own compaction runs, so its notes are written once, by the press.
let isCompactingHere = false
export const isOwnCompaction = (): boolean => isCompactingHere

// Before any compaction: the working notes on disk first. A failure is logged and the compaction goes on.
export async function notesBefore(io: Io, trigger: string): Promise<NoteEntry | null> {
  try {
    return await writeWorkingNotes(io, trigger)
  } catch (error) {
    io.log(`working notes not written (${reasonOf(error)})`)

    return null
  }
}

// After one that stands: the line that says what was compacted and offers the notes back.
export async function noteCompacted(io: Io, done: { trigger: string; result: SessionCompactResult; entry: NoteEntry | null }): Promise<void> {
  const { trigger, result, entry } = done
  if (result.messages === undefined || entry === null) return
  const sizes = { ...(result.tokensBefore === undefined ? {} : { tokensBefore: result.tokensBefore }), ...(result.tokensAfter === undefined ? {} : { tokensAfter: result.tokensAfter }) }
  await io.put('compacted', { at: await io.now(), trigger, path: entry.path, ...sizes })
  // The conversation went on here: a handoff card still up is old news, and the line takes its place.
  const stage = await io.get('stage')
  if (stage === 'saved' || stage === 'failed') await io.put('stage', 'done')
}

// "Compact now, keep notes": the notes, then the compaction, between turns only. The ask is done for this climb.
export async function compact(io: Io, settings: Settings): Promise<void> {
  await dismiss(io, settings)
  isCompactingHere = true
  try {
    const entry = await notesBefore(io, 'plugin')
    await noteCompacted(io, { trigger: 'plugin', result: await io.compact(), entry })
  } catch (error) {
    io.log(`compaction refused (${reasonOf(error)})`)
  } finally {
    isCompactingHere = false
  }
}

// "Restore working notes": the notes go back into this conversation once, and the line goes.
export async function restore(io: Io): Promise<void> {
  const shown = await io.get('compacted')
  if (shown === null) return
  await io.put('compacted', null)
  const entry = (await io.get('notes')).find(e => e.path === shown.path)
  if (entry !== undefined) await io.append(`${words().restoreIntro}\n\n${entry.text}`)
}

export const forgetCompacted = (io: Io): Promise<void> => io.put('compacted', null)

export async function dismiss(io: Io, settings: Settings): Promise<void> {
  await io.put('stage', 'done')
  await syncNotice(io, settings)
}

export async function toggleInject(io: Io, settings: Settings): Promise<void> {
  const note = await io.get('latest')
  if (note === null) return
  await saveNote(io, { ...note, isInjectOn: !note.isInjectOn })
  await writeHub(io, settings)
}

export async function remove(io: Io, settings: Settings): Promise<void> {
  const note = await io.get('latest')
  if (note === null) return
  await dropEntry(io, note.root, note.path)
  await writeHub(io, settings)
}

// One row of the pane's list.
export async function drop(io: Io, settings: Settings, path: string): Promise<void> {
  await dropEntry(io, await repoOf(io), path)
  await writeHub(io, settings)
}

// Whether this conversation may take the note: one another conversation wrote, still waiting.
export const canTake = async (io: Io): Promise<boolean> =>
  injectMove({ note: await io.get('latest'), sessionId: await io.sessionId(), now: await io.now() }) === 'claim'

// The band offers the note while this conversation may take it and has not passed it over.
export async function isOffered(io: Io): Promise<boolean> {
  const note = await io.get('latest')

  return note !== null && (await io.get('declined')) !== note.at && (await canTake(io))
}

export async function decline(io: Io): Promise<void> {
  await io.put('declined', (await io.get('latest'))?.at ?? null)
}

// The person chose to carry on from the note: this conversation takes it, and no other will.
export async function take(io: Io, settings: Settings): Promise<void> {
  const note = await loadNote(io, await repoOf(io))
  if (note === null || !(await canTake(io))) return
  await saveNote(io, { ...note, consumedBy: await io.sessionId() })
  await writeHub(io, settings)
}

// The note's section for this conversation, or null: only once the person took it here (the band's Continue), and
// then for every request, so its system prompt stays the same from then on.
export async function noteSection(io: Io): Promise<PromptComposeSection | null> {
  const note = await loadNote(io, await repoOf(io))
  const move = injectMove({ note, sessionId: await io.sessionId(), now: await io.now() })
  if (note === null || move !== 'inject') return null

  return { id: SECTION_ID, text: sectionText(note), scope: 'session' }
}

// `/handoff` writes a note now; `/handoff show` opens the pane.
export async function runCommand(io: Io, settings: Settings, arg: string): Promise<string> {
  if (arg === 'show') {
    await io.openPane()

    return words().commandShown
  }
  try {
    const path = await write(io, settings)

    return path === null ? words().writingHeadline : words().commandSaved(path)
  } catch (error) {
    return words().commandFailed(reasonOf(error))
  }
}
