import { mock } from 'claude-code/testing'

export const SURFACES = ['terminal', 'desktop'] as const
export const MINUTE = 60_000

export const PANE = {
  plugin: 'agent-deck-pro',
  component: 'Pane',
  requestId: 'agent-deck-pro',
  viewport: { columns: 120, rows: 40 },
  props: {
    title: 'Ajanlar',
    isFocused: true,
    bodyColumns: 70,
    placement: 'inline',
    scroll: { offset: 0, bodyRows: 24 },
    view: {},
  },
} as const

export const LIST = [
  { id: 'a1', description: 'find auth code', type: 'Explore', status: 'running' },
  { id: 'a2', description: 'plan the ui', type: 'Plan', status: 'completed' },
]

export const MESSAGES = [
  { role: 'user', text: 'Find where login is handled', toolUses: [] },
  { role: 'assistant', text: 'Looking in src/auth', toolUses: [{ tool: 'Grep', input: { pattern: 'login' } }] },
]

const STEP_USAGE = { input_tokens: 1_000, output_tokens: 1_000, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }

export type Spy = { spawned: any[]; sent: any[]; tools?: any[] }

function toolAnswer(e: any, spy: Spy) {
  if (e.tool === 'TaskCreate') return { result: { task: { id: `t${spy.tools?.filter(entry => entry.tool === 'TaskCreate').length ?? 0}`, subject: 's' } } }
  if (e.tool === 'Bash' && String(e.command).includes('test')) return { isError: true, result: 'exit 1', text: '1 fail' }

  return { result: 'ok' }
}

export async function setup($: any, on: any, spy: Spy, list: any[] = LIST, theme = 'dark') {
  const clock = mock.clock(on)
  on('agent.list', () => ({ value: list }))
  on('session.messages', () => ({ value: MESSAGES }))
  on('session.send', (_: any, e: any) => {
    spy.sent.push(e)

    return { isDelivered: true }
  })
  on('agent.spawn', (_: any, e: any) => {
    spy.spawned.push(e)

    return { model: 'test', agentId: 'a3' }
  })
  on('env.get', () => ({ value: undefined }))
  on('fs.list', () => ({ value: [] }))
  on('config.list', () => ({ value: [{ key: 'theme', value: theme }] }))
  on('command.register', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/work' }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.toast', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('tool.call', (_: any, e: any) => {
    spy.tools?.push(e)

    return toolAnswer(e, spy)
  })
  on('turn.step', async function* (_: any, e: any) {
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [{ tool: 'Read' }], stopReason: 'tool_use', usage: STEP_USAGE }
  })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'deck', args: '' } as any)

  return clock
}

export function call($: any, input: Record<string, unknown>) {
  return $.tool.call(input)
}

export const spy = (): Spy => ({ spawned: [], sent: [], tools: [] })


function matches(value: string, text: string | RegExp): boolean {
  return typeof text === 'string' ? value.includes(text) : text.test(value)
}

// The terminal says it in a Text; the desktop may say it in an Svg's alt, its words for the drawing.
export async function shows(ui: any, surface: string, text: string | RegExp): Promise<boolean> {
  if ((await ui.find({ type: 'Text', text })) !== undefined) return true
  if (surface !== 'desktop') return false
  const svgs = await ui.findAll({ type: 'Svg' })

  return svgs.some((svg: any) => matches(String(svg.props?.alt ?? ''), text))
}
