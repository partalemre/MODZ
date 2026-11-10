// This mod's section of hud-pro's Usage pane (hud-pro types/index.d.ts): the /cache-tax card's rows.
export type UsageSection = {
  id: string
  title: string
  lines: string[]
  tone: 'neutral' | 'warn' | 'danger'
  isEmpty?: boolean
  at: number
}

declare module 'claude-code' {
  interface PluginState {
    // Written by hud-pro, which owns it: true while it runs, so /cache-tax opens its Usage pane at this mod's section.
    'hud-pro': { host: boolean }
    'cache-tax': { section: UsageSection; openUsage: { section: string; at: number } }
  }
}
