export type ReplayDiffLine = { op: ' ' | '-' | '+' | '~'; t: string; span?: { start: number; end: number } }

// The plan item that was in progress when an edit ran: "Plan adımı index/total · title".
export type ReplayPlanStep = { index: number; total: number; title: string }

export type ReplayStep = {
  tool: string
  // Relative to the session's folder when inside it.
  file: string
  // "yeni dosya", "tümünü değiştir", "düzenleme 2/3"; '' when nothing to add.
  note: string
  diff: ReplayDiffLine[]
  toolUseId?: string
  agentId?: string
  // One short line on what the change does; absent until found, or when nothing explains it.
  said?: string
  plan?: ReplayPlanStep
}

// 'none' until first opened; 'done' caches the lines (one model call at most).
export type ReplayExplain = 'none' | 'pending' | 'done'

export type Replay = {
  id: string
  steps: ReplayStep[]
  explain: ReplayExplain
  // The first sentence of Claude's answer that ended the turn; '' when it had none.
  quote: string
  // The person's own words that started the turn, one short line; absent before this was kept.
  ask?: string
  // When the turn ended (ms), for "3 dk önce": the replay stays after turns without edits.
  at?: number
}

export type ReplayPlanStatus = 'pending' | 'in_progress' | 'completed'

// One item of the session's task list (TodoWrite, or TaskCreate / TaskUpdate).
export type ReplayPlanItem = { id: string; title: string; status: ReplayPlanStatus }

export type ReplayView = { isOpen: boolean; inBand: boolean; theme: 'light' | 'dark' | 'auto' }

// The one-line card the MODZ main panel collects from every mod (DESIGN.md §9).
export type HubTone = 'idle' | 'live' | 'ok' | 'warn' | 'bad'
export type HubCard = { pane: string; detail: string; tone: HubTone; at: number }

declare module 'claude-code' {
  interface PluginState {
    'replay-theater': {
      // Edits of the turn under way; they become the replay when it ends.
      pending: ReplayStep[]
      replay: Replay | null
      index: number
      // The offer card above the prompt: shown after a turn with edits, until the next turn or a dismissal.
      isOffered: boolean
      view: ReplayView
      plan: ReplayPlanItem[]
      hub: HubCard
    }
    // The MODZ main panel's open request this mod listens for (DESIGN.md §9); modz owns and writes it.
    modz: { open: { pane: string; at: number } }
  }
}
