import type { PluginOptions } from 'claude-code'

// Every number the mod decides by, named once.

export const PANE = 'handoff'
export const COMMAND = 'handoff'
export const SECTION_ID = 'handoff:note'

// The ask's default threshold and the range a setting is held to, in percent of the context window.
export const DEFAULT_THRESHOLD = 80
const MIN_THRESHOLD = 50
const MAX_THRESHOLD = 99
// "Not now" waits until the fill has grown this many points.
export const SNOOZE_POINTS = 10

// A note older than this is not handed to a new conversation.
export const MAX_NOTE_AGE_MS = 24 * 60 * 60 * 1000
// The user prompts the note quotes as the goal, newest last, each cut to this many characters.
export const GOAL_PROMPTS = 3
export const GOAL_CHARS = 280
// Files and git status lines listed at most; the rest is counted.
export const FILES_MAX = 40
export const GIT_LINES_MAX = 30
// git status (best effort) and the note's removal get this long.
export const PROCESS_TIMEOUT_MS = 5000
// The last error line kept, in characters.
export const ERROR_CHARS = 200
// What a note may hand to the next conversation, in characters.
export const NOTE_MAX_CHARS = 8000

// The summary: one Haiku call over the newest messages, at most this much transcript, a short reply.
export const SUMMARY_MODEL = 'haiku'
export const SUMMARY_MESSAGES = 30
export const SUMMARY_INPUT_CHARS = 12_000
export const SUMMARY_MAX_TOKENS = 500
export const SUMMARY_LINES = 12
export const SUMMARY_TIMEOUT_MS = 30_000

// The pane's preview of the note, in lines.
export const PREVIEW_LINES = 24
// The hub's detail line, in characters (DESIGN.md §9).
export const HUB_DETAIL_MAX = 40
// The notice's place on the shared line; 0 never expires (the card stays until it is answered).
export const NOTICE_PRIORITY = 3
export const NOTICE_FOREVER = 0

export const MS_PER_MINUTE = 60_000
export const MINUTES_PER_HOUR = 60

export type Settings = { threshold: number; isSummarizing: boolean }

// A threshold outside the range, or no number at all, falls back to the default.
export function settingsOf(options: PluginOptions): Settings {
  const raw = Number(options.threshold)
  const isInRange = Number.isFinite(raw) && raw >= MIN_THRESHOLD && raw <= MAX_THRESHOLD
  const threshold = isInRange ? Math.round(raw) : DEFAULT_THRESHOLD

  return { threshold, isSummarizing: options.summarize !== false }
}
