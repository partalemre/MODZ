export type CheckStatus = 'pass' | 'fail' | 'timeout' | 'error'

// Which kind of check a failure belongs to: told apart by path (e2e) or by tool (tsc → typecheck).
export type Suite = 'unit' | 'e2e' | 'lint' | 'typecheck'

export type Failure = {
  suite: Suite
  // Relative to the project root where the output allowed it; null where the output named no file.
  file: string | null
  line: number | null
  // The test's name, or the lint message.
  name: string
  // The error's first line, or the lint rule.
  message: string
  // How long the test ran, where the runner printed it (vitest, jest, go, bun); null elsewhere.
  durationMs?: number | null
}

// Which failures the details pane lists: all, or one suite's.
export type SuiteFilter = 'all' | Suite

// The Tidemark theme: pinned by MODZ_THEME, or `auto` (Svg follows the surface's color scheme).
export type BadgeTheme = { mode: 'dark' | 'light' | 'auto'; isLight: boolean }

export type CheckOutcome = {
  status: CheckStatus
  // Tests: passed and run (passed + failed); null where the output gave no counts.
  passed: number | null
  total: number | null
  // Lint: error count; null where the output gave none.
  errors: number | null
  failures: Failure[]
  // The output's last lines, kept only for a failing run whose failures could not be read.
  tail: string[]
}

export type TestBadge = {
  tests: CheckOutcome | null
  lint: CheckOutcome | null
  // The project root the run used; failure paths are relative to it.
  root: string | null
  // When the last run finished, in $.clock.now() ms.
  finishedAt: number | null
  durationMs: number
  isRunning: boolean
}

export type BadgeNotice = {
  id: number
  text: string
  isFailing: boolean
  hasDetails: boolean
  // Shared notice line, top wins: cache-tax 4, you-should-know 3, reflect 2, session-budget 1, test-badge 1
  // (gives way to session-budget too).
  priority: number
  // Epoch ms after which the line clears itself.
  expiresAt: number
}

// A pull request's CI as `gh pr checks` reports it, bucketed: pass, fail (cancel counts here), pending, skipped.
export type CiCheckState = 'pending' | 'pass' | 'fail' | 'skipped'
export type CiCheck = { name: string; state: CiCheckState; link: string | null }

// watching: polling · passed / failed: every check done · merged / closed: the PR left the open state ·
// ended: the longest watch ran out with checks still going · none: no check ever reported.
export type CiPhase = 'watching' | 'passed' | 'failed' | 'merged' | 'closed' | 'ended' | 'none'

export type CiWatch = {
  number: number
  url: string
  title: string
  checks: CiCheck[]
  phase: CiPhase
  // Reviews plus comments, counted only: at the watch's start, and at the last poll.
  talkAtStart: number
  talk: number
  // In $.clock.now() ms; checkedAt is null before the first poll answered.
  startedAt: number
  checkedAt: number | null
  polls: number
  // A push or a new PR expects a fresh run: a finish counts only once a check was seen pending, or after a grace.
  isFreshRun: boolean
  hasSeenPending: boolean
}

// The one-time card a red finish leaves on the band, until pressed or dismissed.
export type CiCard = { id: number; number: number; url: string; failing: CiCheck[] }

// The MODZ main panel's summary card (DESIGN.md §9): lo · Iris · Moss · Amber · Flare.
export type HubTone = 'idle' | 'live' | 'ok' | 'warn' | 'bad'
export type HubCard = { pane: string; detail: string; tone: HubTone; at: number }

declare module 'claude-code' {
  interface PluginState {
    'test-badge': { badge: TestBadge; notice: BadgeNotice | null; isEnabled: boolean; filter: SuiteFilter; theme: BadgeTheme; hub: HubCard; home: { at: number }
      ci: CiWatch | null; ciCard: CiCard | null }
    // The MODZ main panel's open request this mod listens for (DESIGN.md §9); modz owns and writes it.
    modz: { open: { pane: string; at: number }; isOn: boolean }
  }
}
