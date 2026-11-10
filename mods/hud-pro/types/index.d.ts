export type HudGauge = {
  id: string
  label: string
  percent: number
  resetsAt: string | null
}

export type HudContext = { tokens: number; window: number }

export type HudUsage = {
  gauges: HudGauge[]
  costUsd: number | null
  // The context window's fill in tokens, when the engine reports it.
  context: HudContext | null
}

export type HudTurn = {
  requests: number
  input: number
  output: number
  cacheRead: number
}

// One reading of every gauge (and the session cost), kept for the /hud full history.
export type HudSample = {
  t: number
  percents: Record<string, number>
  cost?: number
}

// What the last "Compact now" press came to: the context's size before and after, when the engine recorded them.
export type HudCompacted = { before: number | null; after: number | null; at: number }

// One local day of past usage, read from the session transcripts: input + output tokens, cache reads and writes
// apart (they dwarf the rest), replies per model, the sessions active that day, and the hashed id of every reply
// counted, so a repeated reply (a fork's copy, a rescan) counts once.
export type HudDay = { tokens: number; cache: number; models: Record<string, number>; sessions: string[]; seen: string[] }
// What the transcripts came to by day (`YYYY-MM-DD`, local), when they were read, and each file's size and mtime then.
// `version` 2 counts cache apart; an older log is read again from the transcripts.
export type HudLog = { version: number; at: number; days: Record<string, HudDay>; files: Record<string, number[]> }

export type HudRange = 7 | 30
// One cell of the history heatmap: its day, weekday (0 = Sunday), tokens and shade (0 none … 4 the busiest day).
export type HudCell = { day: string; weekday: number; tokens: number; level: number }
export type HudPast = { range: HudRange; activeDays: number; sessions: number; tokens: number; cache: number; model: string | null; cells: HudCell[] }

// The MODZ main panel's card for this mod (DESIGN.md §9).
export type HubTone = 'idle' | 'live' | 'ok' | 'warn' | 'bad'
export type HubCard = { pane: string; detail: string; tone: HubTone; at: number }

// One section of the Usage pane that another meter mod (session-budget, cache-tax, effort-router) publishes under its
// own `{ plugin, key: 'section' }`, in its own words: a title, plain lines (the first one dim when `isEmpty`, which says
// what the section will show and when), a tone for the title, and buttons whose press this mod writes to its `press`.
export type UsageTone = 'neutral' | 'warn' | 'danger'
export type UsageAction = { id: string; label: string; isOn?: boolean }
export type UsageSection = { id: string; title: string; lines: string[]; tone: UsageTone; isEmpty?: boolean; actions?: UsageAction[]; at: number }
// A press on a section's button, for the mod that published it; and a mod's ask to open the pane at its section.
export type UsagePress = { section: string; action: string; at: number }
export type UsageOpen = { section: string; at: number }
// One main-loop turn's share of the limit window that exists (5-hour, else weekly), in percent points.
export type TurnShare = { window: string; share: number; percent: number }
// A notice in the one shared line above the prompt (DESIGN.md §6): live until `expiresAt`, or until cleared when 0.
export type SlotNotice = { id: number; text: string; expiresAt: number }

declare module 'claude-code' {
  interface PluginState {
    'hud-pro': {
      usage: HudUsage | null
      turn: HudTurn
      lastTurn: HudTurn | null
      isHidden: boolean
      history: HudSample[]
      isCompacting: boolean
      // A main-loop turn is running: the pane's meters shine.
      isLive: boolean
      // The context's tokens at the end of each main-loop turn, newest last: the "~N turns" forecast.
      contextTurns: number[]
      lastCompact: HudCompacted | null
      hub: HubCard
      home: { at: number }
      // The Usage pane is open: the MODZ hub puts it in its one panel and closes the rest (kit/stage.ts).
      shown: { pane: string; at: number }
      // The Usage pane's history: both ranges summed at the last transcript read, the range shown, and the
      // transcripts' folder (`<config>/projects`) from the session's own transcript path.
      past: { week: HudPast; month: HudPast } | null
      pastRange: HudRange
      pastRoot: string
      // True once this mod runs: the other meter mods then show through the Usage pane instead of their own.
      host: boolean
      press: UsagePress
      // The newest turns' shares of the window, newest last; the notices waiting for the line, oldest first.
      shares: TurnShare[]
      notices: SlotNotice[]
    }
    // The other meter mods' sections and asks, and the notices that outrank this mod's line (DESIGN.md §6).
    'session-budget': { section: UsageSection; openUsage: UsageOpen; notice: unknown }
    'cache-tax': { section: UsageSection; openUsage: UsageOpen; notice: unknown }
    'effort-router': { section: UsageSection; openUsage: UsageOpen; notice: SlotNotice | null }
    reflect: { notice: unknown }
    'you-should-know': { notice: unknown }
    // Written by the MODZ hub, which owns both: true while the hub runs, so this pane draws its way back; and
    // which pane holds the hub's one panel.
    modz: { isOn: boolean; stage: { pane: string; at: number } }
  }
}
