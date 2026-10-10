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

// The MODZ main panel's summary card (DESIGN.md §9): lo · Iris · Moss · Amber · Flare.
export type HubTone = 'idle' | 'live' | 'ok' | 'warn' | 'bad'
export type HubCard = { pane: string; detail: string; tone: HubTone; at: number }

declare module 'claude-code' {
  interface PluginState {
    'test-badge': { badge: TestBadge; notice: BadgeNotice | null; isEnabled: boolean; filter: SuiteFilter; theme: BadgeTheme; hub: HubCard }
    // The MODZ main panel's open request this mod listens for (DESIGN.md §9); modz owns and writes it.
    modz: { open: { pane: string; at: number } }
  }
}
