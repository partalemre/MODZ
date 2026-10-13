export type StepStatus = 'pending' | 'in_progress' | 'completed'

// One item of the session's task list (TodoWrite, or TaskCreate/TaskUpdate).
export type PlanTask = {
  id: string
  subject: string
  status: StepStatus
}

// One step parsed from a plan's markdown.
export type DocStep = {
  title: string
  // The step's own number when its heading names one (`### Task 3:`).
  number: number | null
  // A step that is itself a checkbox (`- [x] Step`) and is ticked.
  isChecked: boolean
  checksDone: number
  checksTotal: number
}

export type PlanDoc = {
  kind: 'file' | 'approved'
  // File name, or the words for an approved plan.
  label: string
  path: string | null
  // How sure the parse is that this is a plan; a weaker doc never replaces a stronger one.
  strength: number
  steps: DocStep[]
}

export type AgentRun = {
  key: string
  description: string
  isRunning: boolean
  agentId: string | null
}

// What was seen of one step while the session ran; times in ms since the epoch.
export type StepTrack = {
  status: StepStatus
  startedAt: number | null
  finishedAt: number | null
  files: string[]
  agents: AgentRun[]
}

// A plan kept on disk ($.store, key `plans`, one entry per project root) so it outlives /clear, a
// compaction or the session; `at` is when its steps last changed.
export type StoredStep = { title: string; status: StepStatus }
export type StoredPlan = { title: string; steps: StoredStep[]; at: number }

// The system prompt section that carries an open plan into a conversation that no longer holds it,
// frozen when it was armed so the prompt cache stays warm; `signature` names the plan it speaks for.
export type CarriedPlan = { text: string; signature: string; at: number }

export type StepMark = 'done' | 'open'

// The card above the prompt after an answer that left steps of the plan open.
export type FinishNotice = {
  signature: string
  done: number
  total: number
  // One per step, in order, for the step dots.
  marks: StepMark[]
  next: string
  source: string
  at: number
}

// Strict mode's automatic continues, counted per plan.
export type HeldFinish = { signature: string; count: number }

// The MODZ main panel's summary card (DESIGN.md §9): lo · Iris · Moss · Amber · Flare.
export type HubTone = 'idle' | 'live' | 'ok' | 'warn' | 'bad'
export type HubCard = { pane: string; detail: string; tone: HubTone; at: number }

declare module 'claude-code' {
  interface PluginState {
    'plan-steps': {
      tasks: PlanTask[]
      doc: PlanDoc | null
      tracks: Record<string, StepTrack>
      // Bumped by a timer while the pane is open, so elapsed times move.
      tick: number
      hub: HubCard
      // The person pressed "← MODZ" in the Plan pane; the hub hears it and comes forward.
      home: { at: number }
      carried: CarriedPlan | null
      // Read by other mods' band hooks: one notification above the prompt at a time.
      notice: FinishNotice | null
      // The plan the person marked done: no card, no carrying, not kept.
      dismissed: string | null
      held: HeldFinish | null
    }
    // The MODZ main panel's open request this mod listens for (DESIGN.md §9); modz owns and writes it.
    modz: { open: { pane: string; at: number }; isOn: boolean }
  }
}
