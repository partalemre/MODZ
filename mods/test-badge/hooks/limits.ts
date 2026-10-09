import type { TestBadge } from '../types'

// When and how the checks run, and how long their results stay on the band.

export const WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit'])
export const DEBOUNCE_MS = 5_000
export const TIMEOUT_MS = 120_000
export const TIMEOUT_SLACK_MS = 1_000
export const REFRESH_MS = 15_000
export const DISMISS_AFTER_MS = 20_000
export const PRIORITY = 1
export const NICE = ['nice', '-n', '10']
export const OPEN_TIMEOUT_MS = 10_000
export const VENDOR_TOOLS = ['phpunit', 'phpstan']
export const EMPTY: TestBadge = { tests: null, lint: null, root: null, finishedAt: null, durationMs: 0, isRunning: false }
