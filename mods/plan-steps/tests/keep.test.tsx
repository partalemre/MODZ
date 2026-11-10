// The Plan pane never stays blank (kit/pane-keep.tsx): a step the engine cannot draw as written still gets its pane,
// a drawing that throws costs a plain list, a tab the desktop kept from before a restart opens again after the draw,
// and a desktop that comes back finds the pane it left. The strict finish guard waits while background work runs.
import { expect, test } from 'claude-code/testing'

import { MIN, UNDER_WAY, bandProps, drawnText, mountBand, seen, todos, turn, world } from './world'

const PANE = {
  plugin: 'plan-steps', component: 'Pane', requestId: 'plan-steps',
  viewport: { columns: 160, rows: 40 },
  props: { title: 'Plan', isFocused: false, bodyColumns: 52, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const
const DESKTOP = { surface: 'desktop', clientId: 'desktop:default' }
const WATCH_MS = 5_000
const CONTINUE = 'Continue the plan with the next open step: Draw the band. Keep the task list current as you go.'

type Panes = { up: string[]; opened: string[]; redraws: number }

// The panes the engine lists, and the store's other half: world.ts answers get and set.
function panes(on: any): Panes {
  const state: Panes = { up: [], opened: [], redraws: 0 }
  on('ui.open', (_: any, e: any) => (state.opened.push(e.id), state.up.push(e.id), { value: { isPlaced: true } }))
  on('ui.close', (_: any, e: any) => ((state.up = state.up.filter(id => id !== e.id)), { value: undefined }))
  on('ui.panes', () => ({ value: state.up.map(id => ({ id })) }))
  on('ui.invalidate', () => ((state.redraws += 1), { value: undefined }))
  on('store.keys', () => ({ value: Object.keys(seen.store) }))
  on('store.delete', (_: any, e: any) => (delete seen.store[e.key], { value: undefined }))
  on('session.id', () => ({ value: 'S1' }))
  on('session.attach', (_: any, e: any) => ({ clientId: e.clientId }))
  return state
}

// Tracks the drawing cannot read, so the pane's drawing throws.
const TRACKS_BREAKER = {
  name: 'tracks-breaker',
  register(on: any) {
    on('state.set', { plugin: 'plan-steps', key: 'tracks' }, ($: any, e: any, next: any) =>
      next({ ...e, value: Object.fromEntries(Object.keys(e.value).map(key => [key, { files: 5, agents: 5 }])) }))
  },
}

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: a step with an escape sequence in its title still gets the pane, the characters dropped`, async ($: any, on: any) => {
    panes(on)
    await world($, on)
    await $.tool.call(todos([['Run \u001b[31mthe tests\u001b[0m', 'in_progress'], ['Ship', 'pending']]))
    const drawn = await drawnText(await $.ui.mount({ ...PANE, surface }))
    expect(drawn).toContain('the tests')
    expect(drawn).not.toMatch(/\\u001b/i)
  })

  test(`${surface}: a drawing that throws leaves the steps as a plain list, not a blank tab`, { plugins: [TRACKS_BREAKER] }, async ($: any, on: any) => {
    panes(on)
    await world($, on)
    await $.tool.call(UNDER_WAY)
    const drawn = await drawnText(await $.ui.mount({ ...PANE, surface }))
    expect(drawn).toContain('The plan could not be drawn')
    for (const step of ['✓ Write the types', '▸ Draw the band', '○ Write the README']) expect(drawn).toContain(step)
  })
}

test('a tab kept from before a restart opens the pane again, after the draw and once', async ($: any, on: any) => {
  const state = panes(on)
  await world($, on)
  const pane = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(state.opened).toEqual([])
  await seen.clock.advance(1)
  expect(state.opened).toEqual(['plan-steps'])

  await $.command.run({ command: 'steps', args: '' })
  state.up = []
  await pane.redraw(PANE.props)
  await seen.clock.advance(1)
  expect(state.opened).toEqual(['plan-steps', 'plan-steps'])
})

test('a desktop that comes back finds the pane it left open, and gets a fresh drawing', async ($: any, on: any) => {
  const state = panes(on)
  await world($, on, { store: { 'pane-open/S1': 1, 'pane-open/gone': true } })
  await $.session.attach(DESKTOP)
  expect(state.up).toEqual(['plan-steps'])
  expect(state.redraws).toBeGreaterThan(0)
  expect(Object.keys(seen.store).filter(key => key.startsWith('pane-open/'))).toEqual(['pane-open/S1'])
})

test('a pane the person closed is noted closed, so the next desktop does not bring it back', async ($: any, on: any) => {
  const state = panes(on)
  await world($, on)
  await $.session.attach(DESKTOP)
  await $.command.run({ command: 'steps', args: '' })
  await seen.clock.advance(WATCH_MS)
  expect(typeof seen.store['pane-open/S1']).toBe('number')

  state.up = []
  await seen.clock.advance(WATCH_MS)
  expect(seen.store['pane-open/S1']).toBeUndefined()
})

test('strict mode waits while a background agent still runs, and goes on once it is done', { options: { holdFinish: true } }, async ($: any, on: any) => {
  let roster: unknown[] = [{ id: 'a1', type: 'general-purpose', status: 'running' }]
  on('agent.list', () => ({ value: roster }))
  await world($, on)
  const band = await mountBand($, 'terminal')
  await turn($, () => $.tool.call(UNDER_WAY))
  expect(seen.submitted).toEqual([])
  expect(await drawnText(band)).not.toContain('still open')

  roster = [{ id: 'a1', type: 'general-purpose', status: 'completed' }]
  await turn($, () => $.tool.call(UNDER_WAY))
  expect(seen.submitted).toEqual([CONTINUE])
})

test('strict mode waits while a background command still runs, until its notification arrives', { options: { holdFinish: true } }, async ($: any, on: any) => {
  on('tool.call', { tool: 'Bash' }, () => ({ result: { backgroundTaskId: 'sh1' } }))
  await world($, on)
  await turn($, async () => {
    await $.tool.call(UNDER_WAY)
    await $.tool.call({ tool: 'Bash', command: 'bun test', run_in_background: true, tool_use_id: 'tu1' })
  })
  expect(seen.submitted).toEqual([])

  await $.turn.start({ text: '<task-notification>\n<task-id>sh1</task-id>\n<status>completed</status>\n</task-notification>', turnId: 'note-1' })
  await seen.clock.advance(MIN)
  await $.tool.call(UNDER_WAY)
  await $.turn.complete({ answer: 'ok', durationMs: MIN, isAborted: false, turnId: 'note-1', reason: 'answer' })
  expect(seen.submitted).toEqual([CONTINUE])
})

test('strict mode waits when the engine says background work is in flight as the turn stops', { options: { holdFinish: true } }, async ($: any, on: any) => {
  on('classic.Stop', () => ({}))
  await world($, on)
  await $.turn.start({ text: 'go on', turnId: 'stop-1' })
  await seen.clock.advance(MIN)
  await $.tool.call(UNDER_WAY)
  await $.classic.Stop({ stop_hook_active: false, background_tasks: [{ id: 'b1', type: 'shell', status: 'running', description: 'bun test' }] })
  await $.turn.complete({ answer: 'ok', durationMs: MIN, isAborted: false, turnId: 'stop-1', reason: 'answer' })
  expect(seen.submitted).toEqual([])
  expect(bandProps().isWorking).toBe(false)
})
