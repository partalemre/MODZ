export type PingNotice = {
  id: number
  // `done` draws the Moss bell tile, `wait` the Amber one.
  kind: 'done' | 'wait'
  // The outcome ("Tur bitti") and its facts ("2dk 14sn · 3 dosya değişti").
  title: string
  detail: string
  expiresAt: number
}

export type PingTheme = { mode: 'dark' | 'light' | 'auto'; isLight: boolean }

declare module 'claude-code' {
  interface PluginState {
    'done-ping': {
      isEnabled: boolean
      // Seconds a turn must run before its end pings; null keeps the configured default.
      thresholdSeconds: number | null
      notice: PingNotice | null
      theme: PingTheme
    }
  }
}
