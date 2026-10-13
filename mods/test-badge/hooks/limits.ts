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

// The CI watch: a poll a minute, then one every three after ten polls; never longer than ninety minutes.
export const CI_POLL_MS = 60_000
export const CI_SLOW_POLL_MS = 180_000
export const CI_BACKOFF_AFTER_POLLS = 10
export const CI_MAX_WATCH_MS = 90 * 60_000
// After a push the first polls may still show the last commit's finished run: such a finish counts only
// once a check was seen pending, or after this many polls (then quietly, as nothing was heard finishing).
export const CI_GRACE_POLLS = 3
// A PR with no check reported after this many polls has no CI to watch.
export const CI_NO_CHECKS_POLLS = 5
export const GH_TIMEOUT_MS = 20_000
