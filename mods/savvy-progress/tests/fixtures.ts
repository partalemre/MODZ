import { mock } from 'claude-code/testing'

export const SURFACES = ['terminal', 'desktop'] as const
export const SECOND = 1000

export const BAND = {
  plugin: 'savvy-progress',
  component: 'AbovePrompt',
  requestId: 'band',
  viewport: { columns: 120, rows: 30 },
  props: { hasSurvey: false, isWorking: true, maxRows: 6, bodyColumns: 110, scroll: { offset: 0, bodyRows: 6 }, view: {} },
} as const

export const PANE = {
  plugin: 'savvy-progress',
  component: 'Pane',
  requestId: 'savvy-agents',
  viewport: { columns: 140, rows: 40 },
  props: { title: 'Ajanlar', isFocused: true, bodyColumns: 52, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const

export const OTHERS = { type: 'engine', ref: 1 }

const USAGE = { input_tokens: 120_000, output_tokens: 4_000, cache_read_input_tokens: 5_000, cache_creation_input_tokens: 0 }

export type World = { opened: string[]; closed: string[]; panes: { id: string }[] }

export async function setup($: any, on: any) {
  const world: World = { opened: [], closed: [], panes: [] }
  const clock = mock.clock(on)
  let spawned = 0
  let created = 0
  on('env.get', () => ({ value: undefined }))
  on('settings.read', () => ({ value: {} }))
  on('command.register', () => ({ value: undefined }))
  on('tool.register', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/w' }))
  on('ui.log', () => ({ value: undefined }))
  on('ui.panes', () => ({ value: world.panes }))
  on('ui.open', (_: any, e: any) => (world.opened.push(e.id), world.panes.push({ id: e.id }), { value: { isPlaced: true } }))
  on('ui.close', (_: any, e: any) => (world.closed.push(e.id), (world.panes = []), { value: undefined }))
  on('ui.render', () => OTHERS)
  on('agent.spawn', () => ({ model: 'claude-opus-5-5', agentId: `a${++spawned}` }))
  on('tool.call', (_: any, e: any) => (e.tool === 'TaskCreate' ? { result: { task: { id: `t${++created}`, subject: e.subject } } } : { result: 'ok' }))
  on('turn.step', async function* (_: any, e: any) {
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: 'end_turn', usage: { ...USAGE, model: e.model } }
  })
  on('turn.complete', (_: any, e: any) => ({ text: e.answer }))
  on('prompt.submit', (_: any, e: any) => ({ text: e.text }))
  on('session.usage', () => ({ value: { startedAt: 0, context: {}, rateLimits: [{ kind: 'five_hour', percentUsed: 20, resetsAt: 'r1' }], cost: { usd: 0 } } }))
  on('session.measure', (_: any, e: any) => ({ changed: e.changed }))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })
  return { clock, world }
}

export const spawn = ($: any, description: string, subagentType = 'general-purpose') =>
  $.agent.spawn({ prompt: 'do it', description, subagentType })

export async function modelStep($: any, agentId: string, effort?: string) {
  const stream = $.turn.step({ turnId: `turn-${agentId}`, index: 0, model: 'claude-opus-5-5', effort, messageCount: 1, agentId })
  let step = await stream.next()
  while (step.done !== true) step = await stream.next()
}

export const finish = ($: any, agentId: string, reason = 'answer') =>
  $.turn.complete({ answer: 'ok', durationMs: 1, isAborted: reason === 'aborted', turnId: `turn-${agentId}`, agentId, reason })

/** The 5h window at `percentUsed` after the session spent `usd`. */
export const measure = ($: any, percentUsed: number, usd: number, resetsAt = 'r1') =>
  $.session.measure({ context: {}, rateLimits: [{ kind: 'five_hour', percentUsed, resetsAt }], cost: { usd }, changed: ['rateLimits', 'cost'] })

export const tool = ($: any, input: Record<string, unknown>) => $.tool.call(input)

export const prompt = ($: any, text: string, kind = 'composer') => $.prompt.submit({ text, wait: false, origin: { kind } })

export const svgOf = async (ui: any): Promise<string> => (await ui.findAll({ type: 'Svg' })).map((s: any) => `${s.props.source}\n${s.props.alt}`).join('\n')

/** Three agents at work: the case the band once showed as "0/3 · 0%". */
export async function threeRunning($: any) {
  for (const name of ['Research competitors', 'Design the graphics', 'Build the landing page']) await spawn($, name)
  await modelStep($, 'a1', 'xhigh')
  await modelStep($, 'a2', 'medium')
  await modelStep($, 'a3', 'low')
  await tool($, { tool: 'Edit', file_path: '/w/site/src/hero.tsx', old_string: 'a', new_string: 'b', agentId: 'a3' })
  await tool($, { tool: 'Grep', pattern: 'launch', agentId: 'a1' })
}
