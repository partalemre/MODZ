// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0
//
// How the original Replay Theater turns an edit call into steps. Modified 2026 (MODZ): typed, Turkish notes,
// the call's id and loop kept so its narration can be found later, and the tool's own description kept.

import { diffLines } from './diff'
import type { DiffLine } from './diff'
import { words } from './words'
import type { ReplayStep } from '../types'

export const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])

export type EditCall = {
  tool: string
  file_path?: string
  old_string?: unknown
  new_string?: unknown
  replace_all?: boolean
  content?: unknown
  edits?: { old_string?: unknown; new_string?: unknown }[]
  notebook_path?: string
  new_source?: unknown
  edit_mode?: unknown
  description?: unknown
  tool_use_id?: string
  agentId?: string
}

export function relPath(cwd: string, path: string | undefined): string {
  if (path === undefined || path === '') return words().unknownFile
  if (cwd !== '' && path.startsWith(`${cwd}/`)) return path.slice(cwd.length + 1)

  return path
}

// A file's text before a Write; `isKnown: false` when nothing holds it (a transcript that kept no earlier text).
export type Before = { text: string; isNew: boolean; isKnown?: boolean }
export type ReadBefore = (path: string | undefined) => Promise<Before>

function writeNote(old: Before): string {
  const w = words()
  if (old.isKnown === false) return w.beforeUnknown

  return old.isNew ? w.newFile : w.rewrite
}

// A notebook call holds the cell's new source only: an insert is all new, a replace or delete keeps no old text.
function notebookNote(mode: unknown): string {
  const w = words()
  if (mode === 'insert') return w.newCell

  return mode === 'delete' ? w.cellDeleted : w.cellReplaced
}

// Lines of the file shown above and below an edit's change, where the file before it is known.
const AROUND = 3
const lineOf = (text: string, at: number): number => text.slice(0, at).split('\n').length - 1

// An edit's change and the lines around it in the file, and the file after it; where the old text is not found
// in a known file (or none is known), the changed strings alone, and `text` null.
export function inFile(text: string | null, change: { old: unknown; new: unknown }): { diff: DiffLine[]; text: string | null } {
  const at = text === null || typeof change.old !== 'string' || change.old === '' ? -1 : text.indexOf(change.old)
  if (text === null || at < 0 || typeof change.old !== 'string') return { diff: diffLines(change.old, change.new), text: null }
  const after = `${text.slice(0, at)}${String(change.new ?? '')}${text.slice(at + change.old.length)}`
  const first = Math.max(0, lineOf(text, at) - AROUND)
  const last = lineOf(text, at + change.old.length) + AROUND
  const grown = lineOf(after, at + String(change.new ?? '').length) - lineOf(text, at + change.old.length)
  const window = (whole: string, end: number) => whole.split('\n').slice(first, end + 1).join('\n')

  return { diff: diffLines(window(text, last), window(after, last + grown), AROUND), text: after }
}

const knownText = (old: Before): string | null => (old.isKnown === false || old.isNew ? null : old.text)

// A MultiEdit's edits apply in order, each to the text the one before it left.
function multiSteps(base: Omit<ReplayStep, 'diff' | 'note'>, edits: NonNullable<EditCall['edits']>, start: string | null): ReplayStep[] {
  let text = start

  return edits.map((edit, k) => {
    const made = inFile(text, { old: edit.old_string, new: edit.new_string })
    text = made.text

    return { ...base, diff: made.diff, note: words().editOf(k + 1, edits.length), hasContext: made.text !== null }
  })
}

// The steps one edit call makes, read before it runs (a Write's old text is on disk only until then).
export async function stepsFor(io: { cwd: string; before: ReadBefore }, e: EditCall): Promise<ReplayStep[]> {
  const file = relPath(io.cwd, e.tool === 'NotebookEdit' ? e.notebook_path : e.file_path)
  const said = typeof e.description === 'string' && e.description.trim() !== '' ? e.description.trim() : undefined
  const base = { tool: e.tool, file, toolUseId: e.tool_use_id, agentId: e.agentId, ...(said === undefined ? {} : { said }) }
  const w = words()
  if (e.tool === 'Edit') {
    // replace_all changes every place, so one window around the first would mislead.
    const made = inFile(e.replace_all === true ? null : knownText(await io.before(e.file_path)), { old: e.old_string, new: e.new_string })

    return [{ ...base, diff: made.diff, note: e.replace_all === true ? w.replaceAll : '', hasContext: made.text !== null }]
  }
  if (e.tool === 'MultiEdit' && Array.isArray(e.edits)) return multiSteps(base, e.edits, knownText(await io.before(e.file_path)))
  if (e.tool === 'Write') {
    const old = await io.before(e.file_path)

    return [{ ...base, diff: diffLines(old.text, e.content), note: writeNote(old) }]
  }
  if (e.tool === 'NotebookEdit') {
    return [{ ...base, diff: e.edit_mode === 'delete' ? [] : diffLines('', e.new_source), note: notebookNote(e.edit_mode) }]
  }

  return []
}

// A shell command that may write files: a redirect into a file, in-place edits, moves, copies, deletes, patches,
// git commands that rewrite the tree, formatters' write flags.
// shortcut: a script that writes files under another name goes unseen; read the whole turn to catch those.
const CHANGING = [
  />>?\s*(?!&|\/dev\/null)[^\s|&;]/,
  /(^|[\s;&|(])(sed|perl)\s+(-\w+\s+)*-\w*i/,
  /(^|[\s;&|(])(mv|cp|rm|touch|tee|patch|truncate|ln)\s/,
  /(^|[\s;&|(])git\s+(apply|checkout|restore|reset|stash|merge|rebase|cherry-pick|am|pull|mv|rm)\b/,
  /\s--(write|fix)\b/,
]

export const isChangingCommand = (command: string): boolean => CHANGING.some(pattern => pattern.test(command))

export function isAnswered(result: { deny?: unknown; isError?: unknown }): boolean {
  return result.deny === undefined && result.isError !== true
}
