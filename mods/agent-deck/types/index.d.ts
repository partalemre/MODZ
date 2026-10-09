export type DeckAgent = {
  id: string
  type: string
  description: string
  status: string
  name: string | null
  startedAt: number
  endedAt: number | null
  tool: string | null
  detail: string | null
  steps: number
  tokens: number
  answer: string | null
}

export type DeckType = {
  name: string
  description: string
  source: string
}

export type DeckLine = {
  kind: 'task' | 'say' | 'tool'
  text: string
}

export type DeckTab = 'crew' | 'dispatch'

declare module 'claude-code' {
  interface PluginState {
    'agent-deck': {
      agents: DeckAgent[]
      types: DeckType[]
      selected: string | null
      tab: DeckTab
      lines: DeckLine[]
      notice: string | null
      draftType: string
    }
  }
}
