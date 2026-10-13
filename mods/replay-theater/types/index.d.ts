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
  // A turn read back from a transcript: which session and which of its turns.
  origin?: ReplayOrigin
}

export type ReplayOrigin = { session: string; turn: number; title: string }

// One session of this project, as the session list shows it.
export type ReplaySession = {
  id: string
  // The transcript's last change (ms).
  at: number
  // The person's first prompt, one short line; '' until read or when it had none.
  title: string
  // Prompts and recorded edits in it; null until its transcript has been read.
  turns: number | null
  edits: number | null
  isCurrent: boolean
  // Only the newest part of a very large transcript was read.
  isCut: boolean
  // Its transcript could not be read; tried again on the next listing.
  isUnreadable?: boolean
}

// One turn of a session that edited files.
export type ReplayTurnRow = { n: number; ask: string; at: number; edits: number; files: number }

export type ReplayLoad = 'loading' | 'ready' | 'unavailable'

// `older`: sessions past the newest ones listed.
export type ReplaySessions = { status: ReplayLoad; rows: ReplaySession[]; older: number }

export type ReplayTurns = { session: string; status: ReplayLoad; title: string; isCurrent: boolean; isCut: boolean; prompts: number; rows: ReplayTurnRow[] }

// What the pane shows: a replay (the live last turn or one read back), a session's turns, or the sessions.
export type ReplayBrowse = { mode: 'replay' | 'turns' | 'sessions'; source: 'live' | 'past'; shown: number }

// A session's list line kept across sessions in `$.store`, valid while its transcript's size and time match.
export type ReplaySummary = { size: number; mtimeMs: number; title: string; turns: number; edits: number; isCut: boolean }

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
      browse: ReplayBrowse
      sessions: ReplaySessions
      turns: ReplayTurns | null
      // A turn read back from a transcript; the live last turn stays in `replay`.
      past: Replay | null
      hub: HubCard
      home: { at: number }
    }
    // The MODZ main panel's open request this mod listens for (DESIGN.md §9); modz owns and writes it.
    modz: { open: { pane: string; at: number }; isOn: boolean }
  }
}
