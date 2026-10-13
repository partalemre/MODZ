// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0
//
// How the original Replay Theater turns an edit call into steps. Modified 2026 (MODZ): typed, Turkish notes,
// the call's id and loop kept so its narration can be found later, and the tool's own description kept.

import { diffLines } from './diff'
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

// The steps one edit call makes, read before it runs (a Write's old text is on disk only until then).
export async function stepsFor(io: { cwd: string; before: ReadBefore }, e: EditCall): Promise<ReplayStep[]> {
  const file = relPath(io.cwd, e.tool === 'NotebookEdit' ? e.notebook_path : e.file_path)
  const said = typeof e.description === 'string' && e.description.trim() !== '' ? e.description.trim() : undefined
  const base = { tool: e.tool, file, toolUseId: e.tool_use_id, agentId: e.agentId, ...(said === undefined ? {} : { said }) }
  const w = words()
  if (e.tool === 'Edit') {
    return [{ ...base, diff: diffLines(e.old_string, e.new_string), note: e.replace_all === true ? w.replaceAll : '' }]
  }
  if (e.tool === 'MultiEdit' && Array.isArray(e.edits)) {
    const total = e.edits.length

    return e.edits.map((edit, k) => ({ ...base, diff: diffLines(edit.old_string, edit.new_string), note: w.editOf(k + 1, total) }))
  }
  if (e.tool === 'Write') {
    const old = await io.before(e.file_path)

    return [{ ...base, diff: diffLines(old.text, e.content), note: writeNote(old) }]
  }
  if (e.tool === 'NotebookEdit') {
    return [{ ...base, diff: e.edit_mode === 'delete' ? [] : diffLines('', e.new_source), note: notebookNote(e.edit_mode) }]
  }

  return []
}

export function isAnswered(result: { deny?: unknown; isError?: unknown }): boolean {
  return result.deny === undefined && result.isError !== true
}
