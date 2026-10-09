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

export const toasts: string[] = []
export const opens: Array<{ id: string; title?: string; focus?: boolean }> = []
// How many times the mod asked for a redraw.
export const invalidations = { count: 0 }

export function stubSession(on: any, usage: any = USAGE) {
  toasts.length = 0
  opens.length = 0
  invalidations.count = 0
  const clock = mock.clock(on)
  on('session.usage', () => ({ value: usage }))
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
  on('ui.invalidate', () => {
    invalidations.count += 1

    return { value: undefined }
  })
  on('session.measure', (_: any, e: any) => ({ changed: e.changed }))
  on('ui.log', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/work' }))
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['theirs'] }))
  on('turn.start', (_: any, e: any) => ({ turnId: e.turnId }))
  on('turn.step', async function* (_: any, e: any) {
    return { turnId: e.turnId, index: e.index, answer: 'ok', toolUses: [], stopReason: 'end_turn', usage: TURN_USAGE }
  })

  return clock
}

export async function start($: any, surface: string) {
  await $.session.start({ surface, isInteractive: true, cwd: '/work' })
}
