// What a measurement found, as data: the drawing turns it into words, and
// `summary` is the sentence Claude reads when the command is refused.

export type FileRow = { name: string; bytes: number }

// Files grouped by the folder they sit in, biggest first; `files` is the head of the list.
export type Group = { dir: string; count: number; bytes: number; files: FileRow[] }

// One line of any other report: a changed file, a commit, a migration.
export type Item = { name: string; tag: string; meta: string; weight: number }

export type ReportKind = 'files' | 'changes' | 'commits' | 'migrations' | 'unknown'

export type Report = {
  kind: ReportKind
  summary: string
  count: number
  bytes: number | null
  groups: Group[]
  items: Item[]
  // How many of `count` are not in `items` (for `files`, not in any group's `files`).
  more: number
  // `files`: how many of them git tracks, so they could be restored.
  tracked: number | null
  // `commits`: the remote branch; `changes`: lines added and removed.
  where: string | null
  added: number
  removed: number
  // A Turkish line for the person when something could not be measured.
  note: string | null
}

export type RunResult = { exitCode: number; stdout: string; stderr: string }

// `$.process.run`, handed in by the hooks module: measuring never touches `$` itself.
export type Run = (argv: string[], options: { cwd?: string; timeoutMs?: number }) => Promise<RunResult>

export const LIST_MAX = 10

export function emptyReport(kind: ReportKind, summary: string, note: string | null): Report {
  return { kind, summary, count: 0, bytes: null, groups: [], items: [], more: 0, tracked: null, where: null, added: 0, removed: 0, note }
}

export const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`

export const lines = (text: string): string[] => text.split('\n').filter(line => line !== '')
