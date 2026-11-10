// `show` only records each turn's effort (no tokens); `auto` also routes it; `off` does neither.
export type EffortMode = 'show' | 'auto' | 'off'

// What the judge made of a prompt.
export type RouteClass = 'light' | 'normal' | 'deep'

// A level the engine names, or a thinking budget in tokens.
export type StepEffort = 'low' | 'medium' | 'high' | 'xhigh' | 'max' | number

// One main-loop turn as it was sent.
export type TurnRow = {
  turnId: string
  // When the turn started, ms since the epoch.
  at: number
  // The prompt's first line, masked and cut short; '' for a turn without one (a continuation).
  snippet: string
  // The routing the turn ran under; null when nothing judged it (show mode, a skipped prompt, a failed judge).
  cls: RouteClass | null
  // The session's own effort on the turn's first step, and what it was sent with; absent before a step or
  // for a model that takes none.
  asked?: StepEffort
  sent?: StepEffort
  // The model the step named; '' before its first step.
  model: string
}

// The one-line card the MODZ main panel collects from every mod (DESIGN.md §9); this mod names its own row.
export type HubTone = 'idle' | 'live' | 'ok' | 'warn' | 'bad'
export type HubCard = {
  pane: string
  detail: string
  tone: HubTone
  at: number
  title?: string
  hint?: string
  icon?: string
  section?: 'work' | 'safety' | 'meter'
  badge?: string
}

// This mod's section of hud-pro's Usage pane (hud-pro types/index.d.ts): the mode with its buttons and the newest turns.
export type UsageSection = {
  id: string
  title: string
  lines: string[]
  tone: 'neutral' | 'warn' | 'danger'
  isEmpty?: boolean
  actions?: Array<{ id: string; label: string; isOn?: boolean }>
  at: number
}

// This mod's notice in the shared line above the prompt (DESIGN.md §6): a lowered turn, live until cleared.
export type SlotNotice = { id: number; text: string; expiresAt: number }

declare module 'claude-code' {
  interface PluginState {
    // `mode` is the one in force (the person's pick, else the option); `turns` the newest main-loop turns, newest first.
    'effort-router': {
      mode: EffortMode
      turns: TurnRow[]
      hub: HubCard
      home: { at: number }
      shown: { pane: string; at: number }
      section: UsageSection
      openUsage: { section: string; at: number }
      notice: SlotNotice | null
    }
    // Written by hud-pro, which owns them: true while it runs (its Usage pane then stands in for this mod's pane and hub
    // row), and a press on a button of this mod's section there.
    'hud-pro': { host: boolean; press: { section: string; action: string; at: number } }
    // The louder notices this mod's lowered-turn row waits behind.
    'session-budget': { notice: unknown }
    reflect: { notice: unknown }
    'you-should-know': { notice: unknown }
    'cache-tax': { notice: unknown }
    // The MODZ main panel's values this mod reads (DESIGN.md §9); modz owns and writes them.
    modz: { open: { pane: string; at: number }; isOn: boolean; stage: { pane: string; at: number } }
  }
}
