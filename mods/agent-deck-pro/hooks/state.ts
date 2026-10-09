import type { DeckUi } from '../types'

export const UI_START: DeckUi = { selected: null, tab: 'crew', lines: [], notice: null, draftType: 'general-purpose', drawer: 'none', isDoneOpen: false }

// Process-local facts for the beat and the Svg's theme; a reload resets them to these defaults.
export const flags = { isOpen: false, hasLive: false, theme: 'auto' as 'light' | 'dark' | 'auto' }

export const PANE = 'agent-deck-pro'
export const COMMAND = 'deck'
// The pane's one redraw beat while it is open.
export const BEAT_MS = 1_000
export const ANSWER_MAX = 160
export const DESCRIPTION_MAX = 40
export const AGENT_DIRS = ['.claude/agents']
