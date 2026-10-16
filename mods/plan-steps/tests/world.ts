import { mock } from 'claude-code/testing'

// The world beneath the mod for the plan-keeping tests. The store is the test's own map, so what the mod
// keeps can be read back; prompts the mod submits are recorded.

export const MIN = 60_000
export const HOUR = 60 * MIN
export const START = 1_000 * HOUR
export const SECTION = 'plan-steps:open-plan'

export type Status = 'pending' | 'in_progress' | 'completed'

export const seen = { store: {} as Record<string, unknown>, turns: 0, submitted: [] as string[], clock: null as any }

export function todos(list: [string, Status][]) {
  return { tool: 'TodoWrite', todos: list.map(([content, status]) => ({ content, status, activeForm: content })) }
}

export const UNDER_WAY = todos([['Write the types', 'completed'], ['Draw the band', 'in_progress'], ['Write the README', 'pending']])
export const ALL_DONE = todos([['Write the types', 'completed'], ['Draw the band', 'completed'], ['Write the README', 'completed']])
export const UNSTARTED = todos([['Write the types', 'pending'], ['Draw the band', 'pending'], ['Write the README', 'pending']])

export type Seed = { store?: Record<string, unknown>; turns?: number; theme?: string; lang?: string }

function answerStore(on: any): void {
  on('store.get', (_: any, e: any) => ({ value: seen.store[e.key] }))
  on('store.set', (_: any, e: any) => {
    seen.store[e.key] = JSON.parse(JSON.stringify(e.value))

    return { value: undefined }
  })
}

export async function world($: any, on: any, seed: Seed = {}) {
  seen.clock = mock.clock(on, { now: START })
  mock.env(on, seed.lang === undefined ? {} : { MODZ_LANG: seed.lang })
  seen.store = { ...(seed.store ?? {}) }
  seen.turns = seed.turns ?? 0
  seen.submitted = []
  answerStore(on)
  on('session.start', () => ({ cwd: '/w' }))
  on('session.root', () => ({ value: '/w' }))
  on('session.turns', () => ({ value: seen.turns }))
  for (const name of ['command.register', 'ui.log', 'ui.status']) on(name, () => ({ value: undefined }))
  on('config.list', () => ({ value: [{ key: 'theme', value: seed.theme ?? 'dark' }] }))
  on('ui.render', () => ({ type: 'engine', ref: 1 }))
  on('session.compact', (_: any, e: any) => ({ messages: e.messages }))
  on('session.end', (_: any, e: any) => ({ sessionId: e.sessionId }))
  on('prompt.compose', () => ({ sections: [{ id: 'base', text: 'You are Claude Code.', scope: 'shared' }] }))
  on('prompt.submit', (_: any, e: any) => {
    seen.submitted.push(e.text)

    return { text: e.text }
  })
  on('turn.start', (_: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('tool.call', () => ({ result: 'ok' }))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })
}

export const kept = () => (seen.store.plans as Record<string, any> | undefined)?.['/w']

const COMPOSE = { model: 'claude-opus-5-5', promptModel: 'claude-opus-5-5', surfaces: ['terminal'], tools: [], outputStyle: null, traits: [] }

export const compact = ($: any) => $.session.compact({ trigger: 'manual', messages: [{ role: 'user', text: 'summary', toolUses: [] }] })

export async function carried($: any): Promise<any> {
  const { sections } = await $.prompt.compose(COMPOSE)

  return sections.find((section: any) => section.id === SECTION)
}

export const clear = ($: any) => $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } })

// Stands for the MODZ main panel, which reads the hub card as `modz` does.
export const modz = {
  name: 'modz',
  register(on: any) {
    on('command.run', { command: 'modz-hub' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'plan-steps', key: 'hub' })).value?.detail ?? null) }))
  },
}

export const hub = async ($: any) => JSON.parse((await $.command.run({ command: 'modz-hub', args: '' })).text)

let turnSeq = 0

// One main-loop turn: it starts, the plan moves (or not), and it ends with an answer unless told otherwise.
export async function turn($: any, work: () => Promise<void>, end: { reason?: string; agentId?: string } = {}) {
  turnSeq += 1
  const turnId = `t${turnSeq}`
  await $.turn.start({ text: 'go on', turnId })
  await seen.clock.advance(MIN)
  await work()
  await seen.clock.advance(MIN)
  await $.turn.complete({ answer: 'ok', durationMs: MIN, isAborted: false, turnId, reason: end.reason ?? 'answer', ...(end.agentId === undefined ? {} : { agentId: end.agentId }) })
}

export const bandProps = (hasSurvey = false) => ({
  hasSurvey, isWorking: false, maxRows: 20, bodyColumns: 100, scroll: { offset: 0, bodyRows: 20 }, view: {},
})

export const mountBand = ($: any, surface: string, hasSurvey = false) =>
  $.ui.mount({ plugin: 'plan-steps', surface, component: 'AbovePrompt', props: bandProps(hasSurvey) })

export const drawnText = async (band: any): Promise<string> => JSON.stringify(await band.drawn())
