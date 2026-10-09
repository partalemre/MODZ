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

declare module 'claude-code' {
  interface PluginState {
    'hud-pro': {
      usage: HudUsage | null
      turn: HudTurn
      lastTurn: HudTurn | null
      isHidden: boolean
      history: HudSample[]
      isCompacting: boolean
    }
  }
}
