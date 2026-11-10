// A secret as the card shows it: never the raw value, only its masked form.
export type ShownSecret = {
  label: string
  // The detector's short name for the chip: `Anthropic`, `Stripe`, `DB_PASSWORD`.
  chip: string
  masked: string
  // Where the card's terminal column puts it: `satır 4` for a file write, `src/pay.ts` for git.
  where: string
  // The full spot, `src/lib/supabase.ts:4`; for git, the file the staged line lands in.
  at: string
}

// One answer of the dialog with the line under it.
export type GuardOption = { label: string; description: string }

export type GuardPending = {
  // What is written or committed: the file's path, or the git command.
  subject: string
  // Where the secrets would land: a file write, a `git add`, a `git commit`.
  source: 'write' | 'add' | 'commit'
  secrets: ShownSecret[]
  envFiles: string[]
  options: GuardOption[]
}

// The one-line card the MODZ main panel collects from every mod (DESIGN.md §9). This mod has no pane: what it
// holds is answered in its question, so the card says `isBandOnly` and its row shows only while a write waits.
export type HubCard = { pane: string; detail: string; tone: 'idle' | 'warn'; at: number; title: string; icon: string; section: 'safety'; isBandOnly: true }

declare module 'claude-code' {
  interface PluginState {
    // isRecording: recording mode masks secrets, env values and e-mail addresses on screen, for this session.
    'secret-guard': { pending: GuardPending | null; isEnabled: boolean; isRecording: boolean; hub: HubCard }
  }
}
