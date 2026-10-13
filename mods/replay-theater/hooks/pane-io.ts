import type { ArchiveIo } from './archive'
import type { Replay, ReplayBrowse, ReplaySessions, ReplayTurns, ReplayView } from '../types'

// What the pane's actions need from the engine, as closures the hooks module makes: only it holds `$`.

// How many rows a list shows before "More", and the tallest the pane opens.
export const LIST_PAGE = 8
export const PANE_ROWS_MAX = 30

// One session value: read it, or change it from what it holds.
export type Cell<T> = { get: () => Promise<T>; set: (change: (value: T) => T) => Promise<unknown> }

// Where the transcripts are: their folder ('' when the session keeps none), this session's id, its folder.
export type Where = { dir: string; current: string; cwd: string }

export type PaneIo = {
  browse: Cell<ReplayBrowse>
  view: Cell<ReplayView>
  index: Cell<number>
  offered: Cell<boolean>
  replay: Cell<Replay | null>
  past: Cell<Replay | null>
  turns: Cell<ReplayTurns | null>
  sessions: Cell<ReplaySessions>
  // The session list lines kept across sessions (`$.store`), as stored: checked where they are read.
  kept: { get: () => Promise<unknown>; set: (value: unknown) => Promise<void> }
  // Opens the pane `rows` tall, or with none only brings it forward; false when it found no room.
  open: (rows?: number) => Promise<boolean>
  close: () => Promise<void>
  sleep: (ms: number) => Promise<void>
  // Fills the live replay's step lines the first time it is opened.
  explain: (id: string) => void
  archive: ArchiveIo
  where: () => Where
}
