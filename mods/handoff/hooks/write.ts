import type { SessionMessage } from 'claude-code'

import { reasonOf } from './io'
import type { Io } from './io'
import { PROCESS_TIMEOUT_MS, SUMMARY_MAX_TOKENS, SUMMARY_MODEL, SUMMARY_TIMEOUT_MS } from './limits'
import type { Settings } from './limits'
import { SUMMARY_SYSTEM, buildNote, cleanSummary, goalsOf, notePath, openSteps, relativeTo, stampOf, transcriptOf } from './note'
import { addEntry } from './notes'
import { repoOf, saveNote } from './state'
import type { HandoffNote, NoteEntry, PlanTask } from '../types'

// Writing a note: the deterministic facts first, then, for a handoff only, at most one Haiku call for the summary. Whatever fails
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

type NoteMade = { repo: string; path: string; text: string; at: number }
type NoteInput = { messages: readonly SessionMessage[]; summary: string | null; isCompaction: boolean }

// Builds and writes a note's file: the deterministic facts, and the summary when there is one.
async function writeNoteFile(io: Io, input: NoteInput): Promise<NoteMade> {
  const { messages, summary, isCompaction } = input
  const root = await io.root()
  const now = await io.now()
  const text = buildNote({
    isCompaction, stamp: stampOf(now).label, root, percent: await io.get('percent'), goals: goalsOf(messages), steps: await planSteps(io),
    files: (await io.get('files')).map(path => relativeTo(root, path)), git: await gitLines(io, root),
    lastError: await io.get('lastError'), summary,
  })
  // Kept in the main repo, so the note outlives a worktree and the next session in any of them finds it.
  const repo = await repoOf(io)
  const path = notePath(repo, now, isCompaction)
  await io.writeFile(path, text)

  return { repo, path, text, at: now }
}

// Builds, writes and keeps the handoff for the next chat; rejects only when the file could not be written.
export async function writeHandoff(io: Io, settings: Settings): Promise<HandoffNote> {
  const messages = await messagesOf(io)
  const summary = settings.isSummarizing ? await summarize(io, messages) : null
  const { repo, path, text, at } = await writeNoteFile(io, { messages, summary, isCompaction: false })
  const note: HandoffNote = { path, root: repo, text, at, writtenBy: await io.sessionId(), isInjectOn: true, consumedBy: null, isSummarized: summary !== null }
  await saveNote(io, note)
  await addEntry(io, repo, { path, at, kind: 'handoff', text })

  return note
}

// The working notes a compaction would otherwise take with it: no model call, never the next chat's handoff.
export async function writeWorkingNotes(io: Io, trigger: string): Promise<NoteEntry> {
  const { repo, path, text, at } = await writeNoteFile(io, { messages: await messagesOf(io), summary: null, isCompaction: true })
  const entry: NoteEntry = { path, at, kind: 'compact', trigger, text }
  await addEntry(io, repo, entry)

  return entry
}
