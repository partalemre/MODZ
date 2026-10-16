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

/** One line of an agent's conversation: a question the person sent from its card, or an answer. */
export type ThreadTurn = {
  from: 'you' | 'agent'
  text: string
  at: number
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
  /** Started from the panel's form: its task is the person's own question. */
  isAsked?: boolean
  /** Each answer and each follow-up sent from its card, oldest first; the task comes before them. */
  thread?: ThreadTurn[]
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
  /** The quiet list of other chats (working or idle) is folded until the person opens it. */
  isChatsOpen?: boolean
}

/** An agent type the panel can start: a built-in, one the engine offered, or an agents/*.md file. */
export type AgentType = {
  name: string
  description: string
  /** `built-in`, `plugin`, `project`, `user` or the settings source the engine named. */
  source: string
}

/** What a chat is doing: a turn runs, it waits on the person (a permission ask, a question), or neither. */
export type ChatState = 'working' | 'waiting' | 'idle'

/** What each session tells the others on this machine, under `sessions/<sessionId>` in this plugin's store. */
export type Heartbeat = {
  project: string
  title: string
  state: ChatState
  /** When `state` last changed. */
  since: number
  /** When it was written; an old one means the session is gone. */
  at: number
}

/** This session's own side: what it tells the others and what it last wrote. */
export type SelfChat = {
  id: string
  project: string
  title: string
  isWorking: boolean
  /** The tool calls waiting on the person: permission asks and open questions. */
  asks: string[]
  since: number
  /** The heartbeat last written, less its time: a beat that says the same is not written early. */
  sent?: Omit<Heartbeat, 'at'>
  /** The id whose session.end came: no beat is written for it again. */
  endedId?: string
}

/** Another session on this machine, as the panel draws it; `minutes` is how long it has been in `state`. */
export type OtherChat = { id: string; project: string; title: string; state: ChatState; minutes: number }

/** The home crab's mood: no turn yet or rested, a turn runs, the last one answered, or it errored or was stopped. */
export type CrabMood = 'sleeping' | 'working' | 'happy' | 'worried'

/** The Agents pane's own crab: its mood, every completed turn on this machine, and when the last one ended. */
export type HomeCrab = { mood: CrabMood; turns: number; endedAt: number }

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
      // The Agents pane is open: the MODZ hub puts it in its one panel and closes the rest (kit/stage.ts).
      shown: { pane: string; at: number }
      self: SelfChat | null
      chats: OtherChat[]
      crab: HomeCrab
    }
    // The MODZ main panel's open request this mod listens for (DESIGN.md §9); modz owns and writes it.
    modz: { open: { pane: string; at: number }; isOn: boolean; stage: { pane: string; at: number } }
  }
}
