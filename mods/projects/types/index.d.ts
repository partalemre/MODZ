export type ModelSum = { input: number; cacheWrite: number; cacheRead: number; output: number; replies: number }

// One transcript added up; `agent` only on a subagent's.
export type FileSum = {
  path: string
  size: number
  mtimeMs: number
  cwd: string
  title: string
  first: string
  last: string
  tools: number
  models: Record<string, ModelSum>
  agent?: { type: string; description: string }
}

export type PlanStep = { title: string; isDone: boolean }
export type PlanRow = { path: string; mtimeMs: number; title: string; done: number; total: number; steps: PlanStep[] }

export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type TaskItem = { subject: string; status: TaskStatus }
export type LeftOff = { title: string; prompt: string; reply: string; recap: string; tasks: TaskItem[]; at: string }

export type Estimate = { percent: number; done: string; next: string; basis: string; at: number; head: string }

export type Percent = { kind: 'estimate' | 'ticks' | 'none'; value: number | null; at: number; isStale: boolean; basis: string }

export type Tokens = { input: number; cacheWrite: number; cacheRead: number; output: number }

export type AgentRun = { type: string; description: string; tokens: number; tools: number; first: string; last: string; isLive: boolean }
export type AgentKind = { type: string; runs: number; tokens: number; tools: number; ms: number }

export type Git = { branch: string; head: string; subject: string; commitAt: number; dirty: number; commits: number }

export type Project = {
  // Other folders of this project: clones and plain copies, read as one.
  also?: readonly string[]
  root: string
  name: string
  isGit: boolean
  isLive: boolean
  lastAt: string
  sessions: number
  tokens: Tokens
  byModel: Record<string, Tokens>
  week: number
  git: Git | null
  plans: PlanRow[]
  percent: Percent
  estimate: Estimate | null
  leftOff: LeftOff | null
  kinds: AgentKind[]
  runs: AgentRun[]
}

export type Snapshot = { at: number; projects: Project[]; other: { folders: number; tokens: number }; hidden: number }

export type Busy = { label: string; done: number; total: number }

export type HubTone = 'idle' | 'live' | 'ok' | 'warn' | 'bad'
export type HubCard = { pane: string; detail: string; tone: HubTone; at: number; title?: string; hint?: string; icon?: string; section?: string }

declare module 'claude-code' {
  interface PluginState {
    projects: {
      snapshot: Snapshot | null
      selected: string
      openPlan: string
      busy: Busy | null
      error: string
      shown: { pane: string; at: number } | null
      home: { at: number } | null
      hub: HubCard | null
    }
    // The MODZ main panel's values this mod reads (DESIGN.md §9); modz owns and writes them.
    modz: { open: { pane: string; at: number }; isOn: boolean; stage: { pane: string; at: number } }
  }
}
