// What the band card shows. `ask` is not a stage: it is drawn from `idle` once the context passes the threshold.
// `writing` while the note is built, `saved` until the person dismisses it, `failed` when it could not be written,
// `done` once this conversation's handoff was seen (no second ask in the same conversation).
export type HandoffStage = 'idle' | 'writing' | 'saved' | 'failed' | 'done'

// The latest note of one repo, kept in `$.store` under `latest:<root>` and mirrored here for drawing.
export type HandoffNote = {
  // Absolute path of the note file, `<root>/.claude/handoff/<yyyy-mm-dd-hhmm>.md`.
  path: string
  root: string
  // The note's markdown, as written to the file.
  text: string
  // When it was written, in $.clock.now() ms.
  at: number
  // The conversation (session id) that wrote it: it never hands the note to itself.
  writtenBy: string
  // Whether the next fresh conversation in this repo gets it; the pane's toggle.
  isInjectOn: boolean
  // The conversation that took it in; null until one did. It goes to one conversation only.
  consumedBy: string | null
  // Whether the model's summary made it into the note (false: the deterministic note alone).
  isSummarized: boolean
}

// The shared notice line (DESIGN.md §6, slot 2): one at a time, the highest priority wins.
// you-should-know 3, handoff 3, reflect 2, session-budget 1, test-badge 1; an `expiresAt` of 0 never expires.
export type HandoffNotice = { priority: number; expiresAt: number }

// The MODZ main panel's summary card (DESIGN.md §9): lo · Iris · Moss · Amber · Flare. The hub does not know
// this mod yet, so the card names its own row (title, hint, icon, section).
export type HubTone = 'idle' | 'live' | 'ok' | 'warn' | 'bad'
export type HubCard = {
  pane: string
  detail: string
  tone: HubTone
  at: number
  title?: string
  hint?: string
  icon?: string
  section?: 'work' | 'safety' | 'meter'
  badge?: string
}

// The task list plan-steps keeps; read only, for the note's open steps.
export type PlanTask = { id: string; subject: string; status: 'pending' | 'in_progress' | 'completed' }

declare module 'claude-code' {
  interface PluginState {
    handoff: {
      // The context window's fill as the last measurement said, 0 to 100; null before the first response.
      percent: number | null
      // "Not now" pressed: the ask waits until the fill reaches this point; null when not snoozed.
      snoozeUntil: number | null
      stage: HandoffStage
      // Why the last write failed, one short line; null otherwise.
      failure: string | null
      latest: HandoffNote | null
      // Paths Claude wrote or edited in this conversation (Write, Edit, NotebookEdit), oldest first.
      files: string[]
      // The last failed tool call of this conversation, as "<tool>: <first line>"; null when none failed.
      lastError: string | null
      notice: HandoffNotice | null
      hub: HubCard
      // The person pressed "← MODZ" in the Handoff pane; the hub hears it and comes forward.
      home: { at: number }
    }
    // The MODZ main panel's open request this mod listens for (DESIGN.md §9); modz owns and writes it.
    modz: { open: { pane: string; at: number }; isOn: boolean }
    // Read for the note's open plan steps; plan-steps owns and writes it.
    'plan-steps': { tasks: PlanTask[] }
  }
}
