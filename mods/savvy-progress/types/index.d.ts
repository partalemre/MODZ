export type Phase = 'plan' | 'design' | 'delegate' | 'review' | 'close'

export type PlannedTask = {
  title: string
  tier: string
  after: number[]
}

/** What the orchestrator reported through the `progress` tool. */
export type Flow = {
  title: string
  total: number
  done: number
  phase: Phase
  isFinished: boolean
  tasks: PlannedTask[]
}

export type AgentStatus = 'running' | 'done' | 'failed'

export type TaskStatus = 'pending' | 'in_progress' | 'completed'

/** One item of a task list (TodoWrite, or TaskCreate + TaskUpdate). */
export type TrackedTask = {
  id: string
  title: string
  status: TaskStatus
}

/** One tool call of an agent, as its work history lists it; `endAt` stays unset while it runs. */
export type ToolEvent = {
  id?: string
  tool: string
  target: string
  at: number
  endAt?: number
  isError?: boolean
}

export type AgentRun = {
  id: string
  agentId?: string
  toolUseId?: string
  parentId?: string
  type: string
  description: string
  model: string
  effort?: string
  status: AgentStatus
  /** Why a failed run ended: interrupted, an API error or a refusal. */
  endReason?: string
  startedAt: number
  endedAt?: number
  contextTokens: number
  contextMax: number
  tokens: number
  costUsd: number
  steps: number
  round: number
  /** Arrival order among the session's agents: picks its shell, eyes and name. */
  look?: number
  toolCount: number
  lastTool?: string
  lastTarget?: string
  /** Self-reported by the worker through the `step` tool. */
  stepDone?: number
  stepTotal?: number
  stepNote?: string
  /** The worker's own task list, when it keeps one. */
  todos?: TrackedTask[]
  /** The task it was handed (the Agent call's prompt), cut short. */
  brief?: string
  /** Its final report once it answered, cut short. */
  answer?: string
  /** Its latest tool calls, oldest first. */
  history?: ToolEvent[]
}

/** The agents the main loop launched for the current request. */
export type Job = {
  agentIds: string[]
  startedAt: number
  isSealed: boolean
  isHidden: boolean
}

/** The 5h window and the session's dollars: where this session started and where it is now. */
export type LimitTrack = {
  basePercent: number
  baseUsd: number
  percent: number
  usd: number
  resetsAt?: string
  /** Points per dollar learned before the window last reset. */
  carriedRate?: number
}

export type Panel = {
  isCompact: boolean
  isDoneCollapsed: boolean
  /** The agent whose work history is open. */
  selected?: string
}

/** The MODZ hub's tone for this mod's card (DESIGN.md §9): lo · Iris · Moss · Amber · Flare. */
export type HubTone = 'idle' | 'live' | 'ok' | 'warn' | 'bad'

/** This mod's one-line summary on the MODZ hub; `pane` is the key the hub's open request names. */
export type HubCard = { pane: string; detail: string; tone: HubTone; at: number }

declare module 'claude-code' {
  interface PluginState {
    'savvy-progress': {
      flow: Flow | null
      agents: AgentRun[]
      panel: Panel
      now: number
      job: Job | null
      tasks: TrackedTask[]
      limit: LimitTrack | null
      hub: HubCard
    }
  }
}
