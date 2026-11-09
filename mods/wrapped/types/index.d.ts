export type ProjectKind = 'claude' | 'game' | 'mobile' | 'web' | 'tool' | 'writing' | 'other'

export type Persona = 'commander' | 'owl' | 'marathoner' | 'director' | 'sprinter' | 'builder'

export type Named = { name: string; count: number }

export type AgentRow = { type: string; runs: number; tools: number; tokens: number }
export type Hardest = { type: string; tools: number; tokens: number; description: string }
export type MonthStat = { month: string; prompts: number; runs: number; project: string | null; agent: string | null }

// One year of transcripts, boiled down. Kept in `$.store`, so it holds only figures and two short names.
export type Wrapped = {
  year: number
  readAt: number
  firstDay: string
  lastDay: string
  prompts: number
  sessions: number
  replies: number
  outputTokens: number
  activeDays: number
  streak: number
  busiestDay: Named | null
  topHour: number | null
  nightShare: number
  stops: number
  rightCount: number
  toolCalls: number
  agentCalls: number
  topTool: Named | null
  topFile: Named | null
  topProject: Named | null
  longestChat: number
  linesAdded: number
  costUsd: number
  days: Record<string, number>
  hours: number[]
  weekdays: number[]
  projects: Named[]
  tools: Named[]
  files: Named[]
  models: Named[]
  agentRuns: number
  agentTools: number
  agentTokens: number
  agents: AgentRow[]
  hardest: Hardest | null
  months: MonthStat[]
  persona: Persona
  // By a project's short name: what the card says in place of that name.
  projectKinds: Record<string, ProjectKind>
}

export type WrappedView =
  | { status: 'idle' }
  | { status: 'reading'; year: number }
  | { status: 'empty'; year: number }
  | { status: 'failed'; year: number; reason: string }
  | { status: 'ready'; wrapped: Wrapped }

export type Film = { status: 'making'; made: number; total: number } | { status: 'ready'; path: string } | { status: 'failed'; reason: string }

export type Shared = { kind: 'copied' | 'copyFailed' | 'posted'; path: string } | { kind: 'failed'; reason: string }

export type Saved = { path: string; isImage: boolean } | { error: string }

declare module 'claude-code' {
  interface PluginState {
    'wrapped': {
      // Kept under a shape tag (the atom's `shape`), so a value an older build stored reads as absent.
      view: Shaped<WrappedView>
      root: string
      isNamed: Shaped<boolean>
      saved: Saved | null
      copied: boolean
      film: Film | null
      page: number
      shared: Shared | null
      // The MODZ hub's card, its way back and its one-panel note; the values it reads are its own contract.
      hub: { pane: string; detail: string; tone: 'idle' | 'ok' | 'live'; at: number; title: string; hint: string; icon: string; section: 'meter' }
      home: { at: number }
      shown: { pane: string; at: number }
    }
    // The MODZ hub's value this mod reads (kit/home.tsx); modz owns and writes it.
    modz: { isOn: boolean }
  }
}
