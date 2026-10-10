import type { AgentRun, TouchedFile } from '../types'
import { toolName } from './format'
import type { CallFacts } from './history'

// The files an agent's calls read or changed. Only tools that name one file count: a Grep's
// `path` is a folder to search, not a file it touched.

const FILES_MAX = 40
const READS = ['Read', 'NotebookRead']
const EDITS = ['Edit', 'Write', 'MultiEdit', 'NotebookEdit']

const pathOf = (call: Record<string, unknown>): string => {
  const value = call.file_path ?? call.notebook_path
  return typeof value === 'string' ? value.trim() : ''
}

export const touchFile = (a: AgentRun, facts: CallFacts): AgentRun => {
  const tool = toolName(String(facts.call.tool ?? ''))
  const isRead = READS.includes(tool)
  const path = pathOf(facts.call)
  if (!path || (!isRead && !EDITS.includes(tool))) return a
  const list = a.files ?? []
  const prev = list.find(f => f.path === path)
  const next: TouchedFile = {
    path,
    reads: (prev?.reads ?? 0) + (isRead ? 1 : 0),
    edits: (prev?.edits ?? 0) + (isRead ? 0 : 1),
    at: facts.at,
  }
  return { ...a, files: [...list.filter(f => f.path !== path), next].slice(-FILES_MAX) }
}

/** Changed files first, then the ones only read; the latest first within each. */
export const filesShown = (files: TouchedFile[]): TouchedFile[] => {
  const latest = [...files].sort((x, y) => y.at - x.at)
  return [...latest.filter(f => f.edits > 0), ...latest.filter(f => f.edits === 0)]
}

const EXT = /\.([a-z0-9]{1,5})$/i

/** "TS", "MD", "JSON": the extension a file badge shows, or "" for none. */
export const extOf = (path: string): string => (EXT.exec(path)?.[1] ?? '').toUpperCase()
