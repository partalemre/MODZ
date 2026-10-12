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

/** A file an agent read or changed: how often each, and when it last touched it. */
export type TouchedFile = {
  path: string
  reads: number
  edits: number
  at: number
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
  /** The latest call's target in full (a whole path, a command's first line), for the open card. */
  lastDetail?: string
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
  /** The files its calls read or changed, the latest last. */
  files?: TouchedFile[]
  /** When it was last heard from: a tool call opened or closed, a model request answered. */
  heardAt?: number
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

/** The "Yeni görev" form: open or not, the agent type picked, and why the last start was refused. */
export type Draft = {
  isOpen: boolean
  type: string
  notice?: string
}

export type Panel = {
  isCompact: boolean
  isDoneCollapsed: boolean
  /** The agent whose work history is open. */
  selected?: string
  /** The agent whose task text is shown whole rather than cut short. */
  briefOpen?: string
  isTimelineHidden?: boolean
  draft?: Draft
}

/** An agent type the panel can start: a built-in, one the engine offered, or an agents/*.md file. */
export type AgentType = {
  name: string
  description: string
  /** `built-in`, `plugin`, `project`, `user` or the settings source the engine named. */
  source: string
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
      types: AgentType[]
      // The person pressed "← MODZ" in the Agents pane; the hub hears it and comes forward.
      home: { at: number }
    }
    // The MODZ main panel's open request this mod listens for (DESIGN.md §9); modz owns and writes it.
    modz: { open: { pane: string; at: number }; isOn: boolean }
  }
}
