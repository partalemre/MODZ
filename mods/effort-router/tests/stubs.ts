import { mock } from 'claude-code/testing'

// The engine stand-ins the effort-router tests share: the judge's model, the store, and the turn's steps.

const USAGE = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }
export const MODEL = 'claude-opus-5-5'

// `reply` is what the judge's model says (a thrown call when `isRefused`); `sent` collects the effort each
// step reached the engine with; `stored` the store as the mod left it; `opened` the panes it asked for.
export type World = {
  env: Record<string, string>
  stored: Record<string, unknown>
  reply: string
  isRefused: boolean
  judged: { prompt: string; model: string }[]
  sent: { turnId: string; effort: unknown; agentId?: string }[]
  opened: { id: string; focus?: boolean }[]
}

export const worldOf = (over: Partial<World> = {}): World => ({
  env: {}, stored: {}, reply: 'normal', isRefused: false, judged: [], sent: [], opened: [], ...over,
})

export function stub(on: any, world: World) {
  const clock = mock.clock(on)
  mock.env(on, world.env)
  for (const name of ['ui.log', 'ui.toast', 'command.register']) on(name, () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/w' }))
  on('ui.open', (_: any, e: any) => (world.opened.push(e), { value: { isPlaced: true } }))
  on('store.get', (_: any, e: any) => ({ value: world.stored[e.key] }))
  on('store.set', (_: any, e: any) => ((world.stored[e.key] = e.value), { value: undefined }))
  on('model.complete', (_: any, e: any) => {
    world.judged.push({ prompt: e.prompt, model: e.model })
    if (world.isRefused) throw new Error('model not allowed')

    return { value: { isAnswered: true, text: world.reply, usage: USAGE } }
  })
  on('prompt.submit', (_: any, e: any) => ({ text: e.text }))
  on('turn.start', (_: any, e: any) => ({ turnId: e.turnId }))
  on('turn.step', async function* (_: any, e: any) {
    world.sent.push({ turnId: e.turnId, effort: e.effort, ...(e.agentId ? { agentId: e.agentId } : {}) })

    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: 'end_turn', usage: { ...USAGE, model: e.model } }
  })

  return clock
}

export const begin = ($: any, surface = 'terminal') => $.session.start({ surface, isInteractive: true, cwd: '/w' })

export type Step = { turnId: string; effort?: unknown; model?: string; agentId?: string; index?: number }

export async function step($: any, s: Step) {
  const stream = $.turn.step({ turnId: s.turnId, index: s.index ?? 0, model: s.model ?? MODEL, effort: s.effort, messageCount: 1, agentId: s.agentId })
  let item = await stream.next()
  while (item.done !== true) item = await stream.next()
}

// A person's prompt and the turn it starts, with its first main-loop step at the session's `effort`.
export async function turn($: any, o: { text: string; turnId: string; effort?: unknown; origin?: string }) {
  await $.prompt.submit({ text: o.text, wait: false, origin: { kind: o.origin ?? 'composer' } })
  await $.turn.start({ text: o.text, turnId: o.turnId })
  await step($, { turnId: o.turnId, effort: o.effort ?? 'high' })
}

export const sentTo = (world: World, turnId: string) => world.sent.filter(s => s.turnId === turnId && s.agentId === undefined).map(s => s.effort)

// Reads this mod's state as another plugin would: the test's own `$` has no state noun, and a reference is literal.
export const spy = {
  name: 'spy',
  register(on: any) {
    const said = (value: unknown) => ({ text: JSON.stringify(value ?? null) })
    on('command.run', { command: 'er-turns' }, async ($: any) => said((await $.state.get({ plugin: 'effort-router', key: 'turns' })).value))
    on('command.run', { command: 'er-mode' }, async ($: any) => said((await $.state.get({ plugin: 'effort-router', key: 'mode' })).value))
    on('command.run', { command: 'er-hub' }, async ($: any) => said((await $.state.get({ plugin: 'effort-router', key: 'hub' })).value))
  },
}

export const stateOf = async ($: any, key: 'turns' | 'mode' | 'hub') => JSON.parse((await $.command.run({ command: `er-${key}`, args: '' })).text)

export const paneOf = (surface: string, columns = 80) => ({
  plugin: 'effort-router', component: 'Pane', requestId: 'effort', surface,
  viewport: { columns: columns + 10, rows: 40 },
  props: { title: 'Effort', isFocused: true, bodyColumns: columns, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
})
