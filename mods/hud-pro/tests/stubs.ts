import { mock } from 'claude-code/testing'

// Shared fixtures for the hud-pro tests: the band and pane sites and a stubbed engine.

export const MS_PER_HOUR = 3_600_000

export const BAND = {
  plugin: 'hud-pro',
  component: 'AbovePrompt',
  requestId: 'band',
  viewport: { columns: 120, rows: 30 },
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 5,
    bodyColumns: 120,
    scroll: { offset: 0, bodyRows: 5 },
    view: {},
  },
} as const

export const PANE = {
  plugin: 'hud-pro',
  component: 'Pane',
  requestId: 'hud-pro',
  viewport: { columns: 120, rows: 40 },
  props: { title: 'HUD', isFocused: true, bodyColumns: 80, placement: 'inline', scroll: { offset: 0, bodyRows: 24 }, view: {} },
} as const

export const USAGE: any = {
  startedAt: 0,
  context: { window: 200_000, tokens: 82_000, percent: 41 },
  rateLimits: [
    { kind: 'five_hour', percentUsed: 32, resetsAt: new Date(2 * MS_PER_HOUR).toISOString() },
    { kind: 'seven_day', percentUsed: 91.4, resetsAt: new Date(94 * MS_PER_HOUR).toISOString() },
  ],
  cost: { usd: 1.234 },
}

const TURN_USAGE = {
  input_tokens: 400,
  output_tokens: 640,
  cache_read_input_tokens: 11_900,
  cache_creation_input_tokens: 100,
  model: 'claude-test',
}

// The existing tests read the owner's Turkish; the English tests pass ENGLISH, an empty environment.
export const TURKISH = { MODZ_LANG: 'tr' } as const
export const ENGLISH = {} as const

export const toasts: string[] = []
export const opens: Array<{ id: string; title?: string; focus?: boolean }> = []
// How many times the mod asked for a redraw.
export const invalidations = { count: 0 }
// How many compactions the mod asked for, and what the engine answers each with.
export const compactions = { count: 0 }
// Each breakdown the mod asked `session.usage` for, by its detail (`summary` or `full`).
export const breakdowns: string[] = []
export const COMPACTED = { messages: [{ role: 'user', text: 'Summary', toolUses: [] }], tokensBefore: 152_000, tokensAfter: 38_000 }

export function stubSession(on: any, usage: any = USAGE, env: Record<string, string> = TURKISH) {
  toasts.length = 0
  opens.length = 0
  invalidations.count = 0
  compactions.count = 0
  breakdowns.length = 0
  const clock = mock.clock(on)
  mock.env(on, env)
  on('session.usage', (_: any, e: any) => {
    if (e?.breakdown !== undefined) breakdowns.push(e.breakdown)

    return { value: usage }
  })
  on('command.register', () => ({ value: undefined }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('ui.toast', (_: any, e: any) => {
    toasts.push(e.text)

    return { value: undefined }
  })
  on('ui.open', (_: any, e: any) => {
    opens.push(e)

    return { value: { isPlaced: true } }
  })
  // Counted, then answered by the kit beneath, so a mounted drawing follows the redraw.
  on('ui.invalidate', (_: any, e: any, next: any) => {
    invalidations.count += 1

    return next(e)
  })
  on('session.measure', (_: any, e: any) => ({ changed: e.changed }))
  on('session.compact', () => {
    compactions.count += 1

    return COMPACTED
  })
  on('ui.log', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/work' }))
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['theirs'] }))
  on('turn.start', (_: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('turn.step', async function* (_: any, e: any) {
    return { turnId: e.turnId, index: e.index, answer: 'ok', toolUses: [], stopReason: 'end_turn', usage: TURN_USAGE }
  })

  return clock
}

// The window by category as a `summary` breakdown reads it: 82k used of a 200k window.
export const BREAKDOWN = {
  categories: [
    { name: 'System prompt', tokens: 3_000, color: 'promptBorder', isDeferred: false, kind: 'used' },
    { name: 'System tools', tokens: 18_000, color: 'inactive', isDeferred: false, kind: 'used' },
    { name: 'MCP tools', tokens: 9_000, color: 'permission', isDeferred: false, kind: 'used' },
    { name: 'Memory files', tokens: 4_000, color: 'claude', isDeferred: false, kind: 'used' },
    { name: 'Skills', tokens: 2_000, color: 'warning', isDeferred: false, kind: 'used' },
    { name: 'Messages', tokens: 46_000, color: 'purple', isDeferred: false, kind: 'used' },
    { name: 'MCP tools (deferred)', tokens: 30_000, color: 'inactive', isDeferred: true, kind: 'deferred' },
    { name: 'Free space', tokens: 85_000, color: 'promptBorder', isDeferred: false, kind: 'free' },
    { name: 'Autocompact buffer', tokens: 33_000, color: 'inactive', isDeferred: false, kind: 'buffer' },
  ],
  totalTokens: 82_000,
  maxTokens: 200_000,
  rawMaxTokens: 200_000,
  autocompactSource: 'auto',
  percentage: 41,
  gridRows: [],
  model: 'claude-test',
  memoryFiles: [],
  mcpTools: [],
  agents: [],
  autoCompactThreshold: 167_000,
  isAutoCompactEnabled: true,
  apiUsage: null,
}

export const withBreakdown = (usage: any = USAGE) => ({ ...usage, context: { ...usage.context, breakdown: BREAKDOWN } })

export async function start($: any, surface: string) {
  await $.session.start({ surface, isInteractive: true, cwd: '/work' })
}
