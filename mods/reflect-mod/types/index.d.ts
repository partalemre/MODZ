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
    }
  }
}
