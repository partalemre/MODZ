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

/** What the session around the mod saw: panes, toasts, sends, tool calls; and what it answers. */
export type World = {
  opened: string[]
  closed: string[]
  panes: { id: string }[]
  toasts: string[]
  sent: { to: string; text: string }[]
  calls: Record<string, unknown>[]
  spawns: Record<string, unknown>[]
  /** What `$.agent.list()` answers; a test may change it. */
  roster: Record<string, unknown>[]
}

/**
 * `deny` refuses a spawn of the named agent types; `files` are folders of agent files by path,
 * each `{ name: text }`; `undelivered` refuses every send with that reason; `refuse` names tools
 * whose calls a permission hook refuses.
 */
export type SetupOptions = {
  deny?: Record<string, string>
  files?: Record<string, Record<string, string>>
  undelivered?: string
  refuse?: string[]
}

// Folders are found by the end of their path, so a relative `.claude/agents` matches wherever the test runs.
function fsHooks(on: any, files: Record<string, Record<string, string>>) {
  const entry = (name: string) => ({ name, kind: 'file', size: 1, mtimeMs: 1, isLink: false })
  const folder = (path: string) => Object.entries(files).find(([dir]) => path.endsWith(dir))?.[1]
  on('fs.list', (_: any, e: any) => ({ value: Object.keys(folder(e.path) ?? {}).map(entry) }))
  on('fs.read', (_: any, e: any) => {
    const cut = e.path.lastIndexOf('/')
    return { value: folder(e.path.slice(0, cut))?.[e.path.slice(cut + 1)] ?? '' }
  })
}

export async function setup($: any, on: any, opts: SetupOptions = {}) {
  const world: World = { opened: [], closed: [], panes: [], toasts: [], sent: [], calls: [], spawns: [], roster: [] }
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
  on('agent.spawn', (_: any, e: any) => {
    world.spawns.push(e)
    const reason = opts.deny?.[e.subagentType ?? e.subagent_type]
    return reason ? { deny: reason } : { model: 'claude-opus-5-5', agentId: `a${++spawned}` }
  })
  on('tool.call', (_: any, e: any) => {
    world.calls.push(e)
    if (opts.refuse?.includes(e.tool)) return { deny: 'not allowed here' }
    return e.tool === 'TaskCreate' ? { result: { task: { id: `t${++created}`, subject: e.subject } } } : { result: 'ok' }
  })
  on('ui.toast', (_: any, e: any) => (world.toasts.push(e.text), { value: undefined }))
  on('session.send', (_: any, e: any) => {
    world.sent.push({ to: e.to, text: e.text })
    return opts.undelivered ? { isDelivered: false, reason: opts.undelivered } : { isDelivered: true }
  })
  on('agent.list', () => ({ value: world.roster }))
  on('agent.offer', () => ({ isOffered: true }))
  fsHooks(on, opts.files ?? {})
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
