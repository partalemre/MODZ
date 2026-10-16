export type FileNode = {
  id: string
  parent: string
  name: string
  kind: 'dir' | 'file' | 'link'
  hidden: boolean
  mtime: number
  size: number
  loaded: boolean
}

export type Branch = {
  head: string
  upstream: string
  ahead: number
  behind: number
}

export type Activity = {
  id: number
  kind: string
  label: string
  state: 'running' | 'done' | 'failed'
  detail: string
  at: number
  tone: string
  nerd: string
  plain: string
}

export type FileTree = {
  root: string
  nodes: FileNode[]
  expanded: string[]
  cursor: string
  selected: string
  query: string
  showHidden: boolean
  showSize: boolean
  dirSizes: Record<string, number>
  git: Record<string, string>
  diff: Record<string, [number, number]>
  ignored: string[]
  untrackedDirs: string[]
  top: string
  prefix: string
  branch: Branch | null
  counts: Record<string, [number, number, number]>
  flash: string[]
  flashDim: string[]
  flashOn: boolean
  flashTones: Record<string, string>
  scroll: number | null
  // The desktop toolbar's "Daha fazla" row is open.
  showTools: boolean
}

export type TouchRole = 'read' | 'edit' | 'commit'

export type Touch = {
  id: string
  role: TouchRole
  at: number
}

// How sure a read's token count is: measured by the API alone, a measured step shared by text length, or guessed.
export type CostKind = 'exact' | 'share' | 'guess'

export type ReadCost = {
  tokens: number
  kind: CostKind
  reads: number
}

export type TurnLog = {
  isRunning: boolean
  hasRun: boolean
  touches: Touch[]
  sha: string
  committed: number
  // What Claude's reads (a subagent's too) put into context this turn, by file.
  costs: Record<string, ReadCost>
}

export type Look = {
  isLight: boolean
  isAuto: boolean
}

export type Theme = {
  fg: string
  accent: string
  muted: string
  urgent: string
  selection: string
  bg: string
}

// The MODZ main panel's summary card (DESIGN.md §9): lo · Iris · Moss · Amber · Flare.
export type HubTone = 'idle' | 'live' | 'ok' | 'warn' | 'bad'
export type HubCard = { pane: string; detail: string; tone: HubTone; at: number }

declare module 'claude-code' {
  interface PluginState {
    filetree: {
      tree: FileTree
      theme: Theme
      activity: Activity[]
      turn: TurnLog
      // Every read's tokens this session.
      reads: ReadCost
      look: Look
      hub: HubCard
      // The person pressed "← MODZ" in the Files pane; the hub hears it and comes forward.
      home: { at: number }
      // The Files pane is open: the MODZ hub puts it in its one panel and closes the rest (kit/stage.ts).
      shown: { pane: string; at: number }
    }
    // The MODZ main panel's open request this mod listens for (DESIGN.md §9), whether the hub runs, and which pane holds its panel; modz owns and writes all three.
    modz: { open: { pane: string; at: number }; isOn: boolean; stage: { pane: string; at: number } }
  }
}
