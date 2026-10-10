import type { FileStat, RestorePlan } from './git'
import type { CheckpointEntry, CheckpointMeta, PendingUndo } from '../types'

// What the timeline knows beyond git's label: turn numbers, files, tools, undone turns.
export type MetaMap = Record<string, CheckpointMeta>

export const SAMPLE_MAX = 5

const TOOL_GLYPH: Record<string, string> = {
  Edit: 'E', MultiEdit: 'E', NotebookEdit: 'E', Write: 'W', Bash: '$', Read: 'R', Grep: 'S', Glob: 'S',
  WebFetch: 'G', WebSearch: 'G', Task: 'A', Agent: 'A', TodoWrite: 'T',
}
const GLYPH_ORDER = ['E', 'W', '$', 'R', 'S', 'G', 'A', 'T']

export const glyphOf = (tool: string): string | undefined => TOOL_GLYPH[tool]

export function sortGlyphs(glyphs: Iterable<string>): string[] {
  return [...new Set(glyphs)].sort((a, b) => GLYPH_ORDER.indexOf(a) - GLYPH_ORDER.indexOf(b))
}

// Only the refs git still has keep their notes.
export function keepListed(meta: MetaMap, entries: CheckpointEntry[]): MetaMap {
  return Object.fromEntries(entries.filter(entry => meta[entry.ref] !== undefined).map(entry => [entry.ref, meta[entry.ref] as CheckpointMeta]))
}

// After going back to `target`: its turn and every later one are undone, earlier ones are not.
export function markUndone(meta: MetaMap, spec: { entries: CheckpointEntry[]; target: CheckpointEntry; safetyRef: string }): MetaMap {
  const out: MetaMap = { ...meta, [spec.safetyRef]: { ...meta[spec.safetyRef], isSafety: true } }
  for (const entry of spec.entries) {
    if (entry.ref === spec.safetyRef || out[entry.ref]?.isSafety === true) continue
    out[entry.ref] = { ...out[entry.ref], isUndone: entry.at >= spec.target.at }
  }

  return out
}

export function pendingOf(entry: CheckpointEntry, spec: { changes: RestorePlan; stats: FileStat[]; turn: number | null }): PendingUndo {
  const { changes, stats } = spec
  const statOf = (path: string) => stats.find(stat => stat.path === path)
  const files = [...changes.restore.map(path => ({ path, isRemoved: false })), ...changes.remove.map(path => ({ path, isRemoved: true }))]
    .slice(0, SAMPLE_MAX)
    .map(file => ({ ...file, added: statOf(file.path)?.added ?? 0, removed: statOf(file.path)?.removed ?? 0 }))
  const sum = (key: 'added' | 'removed') => stats.reduce((total, stat) => total + stat[key], 0)

  return { entry, turn: spec.turn, restore: changes.restore.length, remove: changes.remove.length, added: sum('added'), removed: sum('removed'), files }
}
