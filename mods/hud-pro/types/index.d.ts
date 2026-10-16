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

// The MODZ main panel's card for this mod (DESIGN.md §9).
export type HubTone = 'idle' | 'live' | 'ok' | 'warn' | 'bad'
export type HubCard = { pane: string; detail: string; tone: HubTone; at: number }

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
    }
    // Written by the MODZ hub, which owns both: true while the hub runs, so this pane draws its way back; and
    // which pane holds the hub's one panel.
    modz: { isOn: boolean; stage: { pane: string; at: number } }
  }
}
