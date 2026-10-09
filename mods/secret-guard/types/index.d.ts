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

declare module 'claude-code' {
  interface PluginState {
    'secret-guard': { pending: GuardPending | null; isEnabled: boolean }
  }
}
