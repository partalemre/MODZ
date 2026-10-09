// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0
//
// How the original Replay Theater turns an edit call into steps. Modified 2026 (MODZ): typed, Turkish notes,
// the call's id and loop kept so its narration can be found later, and the tool's own description kept.

import { diffLines } from './diff'
import type { ReplayStep } from '../types'

export const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit'])

export type EditCall = {
  tool: string
  file_path?: string
  old_string?: unknown
  new_string?: unknown
  replace_all?: boolean
  content?: unknown
  edits?: { old_string?: unknown; new_string?: unknown }[]
  description?: unknown
  tool_use_id?: string
  agentId?: string
}

export function relPath(cwd: string, path: string | undefined): string {
  if (path === undefined || path === '') return '(bilinmeyen dosya)'
  if (cwd !== '' && path.startsWith(`${cwd}/`)) return path.slice(cwd.length + 1)

  return path
}

export type ReadBefore = (path: string | undefined) => Promise<{ text: string; isNew: boolean }>

// The steps one edit call makes, read before it runs (a Write's old text is on disk only until then).
export async function stepsFor(io: { cwd: string; before: ReadBefore }, e: EditCall): Promise<ReplayStep[]> {
  const file = relPath(io.cwd, e.file_path)
  const said = typeof e.description === 'string' && e.description.trim() !== '' ? e.description.trim() : undefined
  const base = { tool: e.tool, file, toolUseId: e.tool_use_id, agentId: e.agentId, ...(said === undefined ? {} : { said }) }
  if (e.tool === 'Edit') {
    return [{ ...base, diff: diffLines(e.old_string, e.new_string), note: e.replace_all === true ? 'tümünü değiştir' : '' }]
  }
  if (e.tool === 'MultiEdit' && Array.isArray(e.edits)) {
    const total = e.edits.length

    return e.edits.map((edit, k) => ({ ...base, diff: diffLines(edit.old_string, edit.new_string), note: `düzenleme ${k + 1}/${total}` }))
  }
  if (e.tool === 'Write') {
    const old = await io.before(e.file_path)

    return [{ ...base, diff: diffLines(old.text, e.content), note: old.isNew ? 'yeni dosya' : 'yeniden yazım' }]
  }

  return []
}

export function isAnswered(result: { deny?: unknown; isError?: unknown }): boolean {
  return result.deny === undefined && result.isError !== true
}
