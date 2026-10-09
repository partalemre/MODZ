export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'deleted'

// The coarse phase a tool pattern shows: explore (read, search), edit, test, report (the final answer).
export type WorkPhase = 'explore' | 'edit' | 'test' | 'report'

// What a tool call does, as the swimlane colors it: read (Tide), edit (Kiln), run (Iris).
export type ToolKind = 'read' | 'edit' | 'run'

// One tool call's stretch on the swimlane; `end` stays null while it runs.
export type DeckSpan = { kind: ToolKind; start: number; end: number | null; callId: string | null }

// One recent tool call for the drawer: what ran, on what, when, and whether it came back clean.
export type DeckCall = { tool: string; detail: string; kind: ToolKind; at: number; isOk: boolean | null; callId: string | null }

export type DeckAgent = {
  id: string
  type: string
  description: string
  status: string
  name: string | null
  startedAt: number
  endedAt: number | null
  tool: string | null
  detail: string | null
  // When the tool it is running now started; null between tools.
  toolSince: number | null
  // The last time anything was heard from it: a tool call, a tool result or a model step.
  lastActivityAt: number
  steps: number
  tokens: number
  answer: string | null
  model: string | null
  costUsd: number
  // Task-list progress the agent itself reported through TaskCreate/TaskUpdate or TodoWrite.
  tasks: Record<string, TaskStatus>
  subjects: Record<string, string>
  todos: { done: number; total: number; current: string | null } | null
  phase: WorkPhase | null
  // Paths it wrote or edited, each once.
  files: string[]
  // Whether its latest test or validate run failed; a later passing run clears it.
  hasFailingTest: boolean
  // The reasoning effort its model steps asked for, when the model takes one.
  effort: string | null
  spans: DeckSpan[]
  calls: DeckCall[]
}

export type DeckType = {
  name: string
  description: string
  source: string
}

export type DeckLine = {
  kind: 'task' | 'say' | 'tool'
  text: string
}

export type DeckTab = 'crew' | 'dispatch'

// What the selected agent's card has open beneath its actions.
export type DeckDrawer = 'none' | 'log' | 'message'

// What the person has open in the pane: one value, so a press writes it once.
export type DeckUi = {
  selected: string | null
  tab: DeckTab
  lines: DeckLine[]
  notice: string | null
  draftType: string
  drawer: DeckDrawer
  isDoneOpen: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'agent-deck-pro': {
      agents: DeckAgent[]
      types: DeckType[]
      ui: DeckUi
    }
  }
}
