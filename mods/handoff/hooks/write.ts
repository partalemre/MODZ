import type { SessionMessage } from 'claude-code'

import { reasonOf } from './io'
import type { Io } from './io'
import { PROCESS_TIMEOUT_MS, SUMMARY_MAX_TOKENS, SUMMARY_MODEL, SUMMARY_TIMEOUT_MS } from './limits'
import type { Settings } from './limits'
import { SUMMARY_SYSTEM, buildNote, cleanSummary, goalsOf, noteDir, notePath, openSteps, relativeTo, stampOf, transcriptOf } from './note'
import { saveNote } from './state'
import type { HandoffNote, PlanTask } from '../types'

// Writing a handoff: the deterministic facts first, then at most one Haiku call for the summary. Whatever fails
// on the way (git, the plan, the model) leaves its part out; only the file write itself can fail the note.

async function gitLines(io: Io, root: string): Promise<string[]> {
  try {
    const out = await io.run(['git', 'status', '--short', '--branch'], { cwd: root, timeoutMs: PROCESS_TIMEOUT_MS })

    return out.exitCode === 0 ? out.stdout.split('\n').filter(line => line.trim() !== '') : []
  } catch (error) {
    io.log(`git status skipped (${reasonOf(error)})`)

    return []
  }
}

const isTask = (value: unknown): value is PlanTask =>
  typeof value === 'object' && value !== null && typeof (value as PlanTask).subject === 'string' && typeof (value as PlanTask).status === 'string'

// plan-steps' task list, where that mod runs; nothing where it does not.
async function planSteps(io: Io): Promise<string[]> {
  try {
    const value = await io.tasks()

    return Array.isArray(value) ? openSteps(value.filter(isTask)) : []
  } catch (error) {
    io.log(`plan steps skipped (${reasonOf(error)})`)

    return []
  }
}

async function summarize(io: Io, messages: readonly SessionMessage[]): Promise<string | null> {
  const transcript = transcriptOf(messages)
  if (transcript === '') return null
  try {
    const reply = await io.complete({
      model: SUMMARY_MODEL, system: SUMMARY_SYSTEM, prompt: transcript, maxTokens: SUMMARY_MAX_TOKENS, effort: 'low', timeoutMs: SUMMARY_TIMEOUT_MS,
    })
    if (!reply.isAnswered) io.log(`summary skipped (${reply.reason})`)

    return reply.isAnswered ? cleanSummary(reply.text) : null
  } catch (error) {
    io.log(`summary skipped (${reasonOf(error)})`)

    return null
  }
}

async function messagesOf(io: Io): Promise<readonly SessionMessage[]> {
  try {
    return await io.messages()
  } catch (error) {
    io.log(`transcript unread (${reasonOf(error)})`)

    return []
  }
}

// Builds, writes and keeps the note; rejects only when the file could not be written.
export async function writeHandoff(io: Io, settings: Settings): Promise<HandoffNote> {
  const root = await io.root()
  const now = await io.now()
  const messages = await messagesOf(io)
  const summary = settings.isSummarizing ? await summarize(io, messages) : null
  const text = buildNote({
    stamp: stampOf(now).label, root, percent: await io.get('percent'), goals: goalsOf(messages), steps: await planSteps(io),
    files: (await io.get('files')).map(path => relativeTo(root, path)), git: await gitLines(io, root),
    lastError: await io.get('lastError'), summary,
  })
  const path = notePath(root, now)
  await io.writeFile(path, text)
  const note: HandoffNote = { path, root, text, at: now, writtenBy: await io.sessionId(), isInjectOn: true, consumedBy: null, isSummarized: summary !== null }
  await saveNote(io, note)

  return note
}

// The note file goes too, but only the one this mod wrote, inside its own folder.
export async function deleteNote(io: Io, note: HandoffNote): Promise<void> {
  const isOurs = note.path.startsWith(`${noteDir(note.root)}/`) && note.path.endsWith('.md') && !note.path.includes('/../')
  if (!isOurs) return
  const out = await io.run(['rm', '-f', '--', note.path], { timeoutMs: PROCESS_TIMEOUT_MS })
  if (out.exitCode !== 0) io.log(`note file kept (rm exited ${out.exitCode})`)
}
