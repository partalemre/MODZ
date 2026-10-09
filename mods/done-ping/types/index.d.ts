export type PingNotice = {
  id: number
  // `done` draws the Moss bell tile, `fail` (the turn's tests failed) the Flare one, `wait` the Amber one.
  kind: 'done' | 'fail' | 'wait'
  // The outcome ("Tur bitti") and its facts ("testler geçti · 3 dosya değişti · 2dk 14sn").
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
