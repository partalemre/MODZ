export type PrState = 'open' | 'merged' | 'closed'
export type Review = 'approved' | 'changes' | 'required' | 'none'
// `unknown` is honest: GitHub answers it until it has worked mergeability out.
export type Merge = 'ready' | 'conflict' | 'blocked' | 'behind' | 'draft' | 'unknown'

export type ChangedFile = { path: string; additions: number; deletions: number }
export type Checks = { passed: number; failed: number; pending: number; skipped: number; failing: string[] }

export type PrView = {
  title: string
  state: PrState
  isDraft: boolean
  additions: number
  deletions: number
  changedFiles: number
  files: ChangedFile[]
  checks: Checks
  review: Review
  merge: Merge
}

// `no-gh`: the command would not start; `failed`: gh answered with an error.
export type Problem = 'no-gh' | 'failed'

export type PrEntry = {
  url: string
  repo: string
  number: number
  // The tool call that opened it: a Bash result that merely mentions the link draws no card.
  callId: string | null
  // Null until gh first answers. Kept when a later refresh fails, which the card says.
  view: PrView | null
  problem: Problem | null
  checkedAt: number | null
}

// What pr-card reads of test-badge's CI watch, the one poller of a PR's checks (DESIGN.md §9: mods talk through $.state).
export type SharedCi = {
  url: string
  phase: string
  checkedAt: number | null
  checks: { name: string; state: 'pass' | 'fail' | 'pending' | 'skipped' }[]
}

declare module 'claude-code' {
  interface PluginState {
    'pr-card': { prs: Record<string, PrEntry> }
    'test-badge': { ci: SharedCi | null }
  }
}
