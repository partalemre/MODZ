export type GuardPending = {
  command: string
  risks: string[]
  branch: string | null
}

declare module 'claude-code' {
  interface PluginState {
    'git-guard': { pending: GuardPending | null }
  }
}
