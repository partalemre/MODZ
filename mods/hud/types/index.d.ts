export type HudGauge = {
  id: string
  label: string
  percent: number
  resetsAt: string | null
}

export type HudUsage = {
  gauges: HudGauge[]
  costUsd: number | null
}

export type HudTurn = {
  requests: number
  input: number
  output: number
  cacheRead: number
  outputs: number[]
}

declare module 'claude-code' {
  interface PluginState {
    hud: {
      usage: HudUsage | null
      turn: HudTurn
      lastTurn: HudTurn | null
      previous: Record<string, number>
      isHidden: boolean
    }
  }
}
