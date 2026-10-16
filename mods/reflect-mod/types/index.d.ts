/** One learning the check found: a rule, where it belongs, and what happened to it. */
export type Learning = {
  id: string
  /** The rule, one imperative line in the language it was said in. */
  rule: string
  scope: 'global' | 'project'
  /** The session root it was said in. */
  project: string
  /** How many times it was said (the check merges repeats). */
  count: number
  firstAt: number
  lastAt: number
  status: 'pending' | 'saved' | 'skipped'
  /** The model's own confidence, 0-1; 1 for a rule the person stated with "remember:". */
  confidence: number
  /** True when the person stated it with "remember:" (no model was asked). */
  isExplicit?: boolean
  /** The person's words it came from, cut to 200 characters, quoted back on the card. */
  said?: string
}

/** A rule saved in this session, with where it applies. */
export type SavedRule = { rule: string; scope: 'global' | 'project'; project: string }

/** The card's closing state: what was saved where, shown for a few seconds. */
export type JustSaved = { rule: string; scope: 'global' | 'project'; path: string; isNew: boolean }

/** A recurring friction signal the local prefilter found in past chats. */
export type Candidate = {
  kind: 'correction' | 'ask' | 'held' | 'failing' | 'repeat'
  /** What repeats: a prompt, a tool name, or a command, cut short. */
  sample: string
  /** How often it was seen, and in how many chats. */
  count: number
  chats: number
}

/** One proposal the model made from the candidates, with the local evidence behind it. */
export type Idea = {
  type: 'rule' | 'hook' | 'skill' | 'mod'
  text: string
  why: string
  count: number
  chats: number
  /** For a rule sent to the card: waiting there, or already in a CLAUDE.md. */
  offer?: 'waiting' | 'known'
}

/**
 * What `/mine` read: chats read (`partial` of them only from their end, being large), chats that could not be
 * read, and whether the project has a transcript folder.
 */
export type Scan = { read: number; partial: number; skipped: number; hasFolder: boolean }

/**
 * The Ideas pane: reading, asking the model, or done. `failure` 'model': the answer was unusable, so the local
 * candidates show alone; 'read': the past chats could not be read at all.
 */
export type IdeasView = {
  status: 'reading' | 'thinking' | 'done'
  ideas: Idea[]
  candidates: Candidate[]
  failure: 'model' | 'read' | null
  scan: Scan
}

declare module 'claude-code' {
  interface PluginState {
    'reflect-mod': {
      /** Pending learnings for this project and global ones, as the band draws them. */
      pending: Learning[]
      /** Rules saved in this session: the system prompt carries them until CLAUDE.md is read again. */
      savedThisSession: SavedRule[]
      /** The destination row the person picked, by learning id; absent, the scope the check suggested. */
      picked: Record<string, 'global' | 'project'>
      /** The learning whose rule is being reworded in the card's field. */
      editing: string | null
      /** The rule just saved, until the card closes. */
      justSaved: JustSaved | null
      /** The Ideas pane `/mine` fills; null before it first runs. */
      ideas: IdeasView | null
      /** The idea whose text was just copied, by its key, for a few seconds. */
      copied: string | null
      /** Written when the person presses "← MODZ" in the Ideas pane (DESIGN.md §9). */
      home: { at: number }
      // The Ideas pane is open: the MODZ hub puts it in its one panel and closes the rest (kit/stage.ts).
      shown: { pane: string; at: number }
    }
    // The MODZ main panel's values this mod reads (DESIGN.md §9); modz owns and writes them.
    modz: { open: { pane: string; at: number }; isOn: boolean; stage: { pane: string; at: number } }
  }
}
