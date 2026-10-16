export type CheckpointEntry = {
  ref: string
  commit: string
  // Commit time in ms since the epoch.
  at: number
  label: string
}

// What the mod learned about a checkpoint's turn, kept by ref in $.store (git keeps only the label).
export type CheckpointMeta = {
  // The turn's number in its session.
  turn?: number
  // Files the turn's write tools changed.
  files?: number
  // Monogram of each tool kind the turn used (E, W, $, R, S, G, A, T).
  tools?: string[]
  // An undo went back to this turn or an earlier one: its work is no longer in the files.
  isUndone?: boolean
  // The snapshot an undo took of the files just before it.
  isSafety?: boolean
}

export type UndoFile = { path: string; isRemoved: boolean; added: number; removed: number }

// An undo waiting for the person's yes in the pane: what it would change, counted and sampled.
export type PendingUndo = {
  entry: CheckpointEntry
  turn: number | null
  restore: number
  remove: number
  // Lines the undo adds and drops over every file.
  added: number
  removed: number
  // The first few files it touches.
  files: UndoFile[]
}

export type CheckpointStatus = {
  text: string
  tone: 'busy' | 'success' | 'error' | 'info'
  // After an undo: the snapshot taken before it, which "Yinele" goes back to.
  redo?: CheckpointEntry
}

export type CheckpointView = {
  entries: CheckpointEntry[]
  status: CheckpointStatus | null
  isBusy: boolean
  pending: PendingUndo | null
}

export type CheckpointTheme = { mode: 'dark' | 'light' | 'auto'; isLight: boolean }

// The one-line card the MODZ main panel collects from every mod (DESIGN.md §9).
export type HubTone = 'idle' | 'live' | 'ok' | 'warn' | 'bad'
export type HubCard = { pane: string; detail: string; tone: HubTone; at: number }

declare module 'claude-code' {
  interface PluginState {
    checkpoint: { view: CheckpointView; isEnabled: boolean; meta: Record<string, CheckpointMeta>; theme: CheckpointTheme; hub: HubCard; home: { at: number }; shown: { pane: string; at: number } }
    // The MODZ main panel's open request this mod listens for (DESIGN.md §9); modz owns and writes it.
    modz: { open: { pane: string; at: number }; isOn: boolean; stage: { pane: string; at: number } }
  }
}
