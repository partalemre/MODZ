import type { PromptComposeSection } from 'claude-code'

import { isAskDue, rearmed, snoozeFrom } from './gate'
import { hubCard, hubOf } from './hub'
import { injectMove, sectionText } from './inject'
import { reasonOf } from './io'
import type { Io } from './io'
import { NOTICE_FOREVER, NOTICE_PRIORITY, SECTION_ID } from './limits'
import type { Settings } from './limits'
import { forgetNote, loadNote, saveNote } from './state'
import { words } from './words'
import { deleteNote, writeHandoff } from './write'

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

// The shared notice line holds this mod's place while the ask is due, and lets go once it is answered.
async function syncNotice(io: Io, settings: Settings): Promise<void> {
  const isDue = isAskDue({ percent: await io.get('percent'), threshold: settings.threshold, snoozeUntil: await io.get('snoozeUntil'), stage: await io.get('stage') })
  await io.put('notice', isDue ? { priority: NOTICE_PRIORITY, expiresAt: NOTICE_FOREVER } : null)
}

export async function measured(io: Io, settings: Settings, percent: number | null): Promise<void> {
  await io.put('percent', percent)
  const next = rearmed({ percent, threshold: settings.threshold, snoozeUntil: await io.get('snoozeUntil'), stage: await io.get('stage') })
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

// Compaction runs between turns only, and the band offers it only then. The ask is done for this climb.
export async function compact(io: Io, settings: Settings): Promise<void> {
  await dismiss(io, settings)
  try {
    await io.compact()
  } catch (error) {
    io.log(`compaction refused (${reasonOf(error)})`)
  }
}

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
  try {
    await deleteNote(io, note)
  } catch (error) {
    io.log(`note file kept (${reasonOf(error)})`)
  }
  await forgetNote(io, note.root)
  await writeHub(io, settings)
}

// The note's section for this conversation, or null: a fresh one claims it once, then keeps it for every request,
// so its system prompt stays the same from the first request on.
export async function noteSection(io: Io, settings: Settings): Promise<PromptComposeSection | null> {
  const note = await loadNote(io, await io.root())
  const sessionId = await io.sessionId()
  const move = injectMove({ note, sessionId, now: await io.now() })
  if (note === null || move === 'skip') return null
  if (move === 'claim') {
    const isFresh = (await io.messages()).every(message => message.role !== 'assistant')
    if (!isFresh) return null
    await saveNote(io, { ...note, consumedBy: sessionId })
    await writeHub(io, settings)
  }

  return { id: SECTION_ID, text: sectionText(note), scope: 'session' }
}
