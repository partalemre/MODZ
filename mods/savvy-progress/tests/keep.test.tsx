// The Agents pane never stays blank. The engine refuses a whole tree for one text it cannot draw (an escape
// sequence, half an emoji) or for a tree too large, and the desktop then reads "Nothing to show yet" while the agents
// run on. A draw that failed or never came is asked for again while the engine lists the pane, a desktop that comes
// back gets a fresh drawing, and the notes and names the heartbeat keeps follow the session as it is now.
import { expect } from 'claude-code/testing'

import { PANE, SECOND, SURFACES, finish, setup, spawn, test } from './fixtures'

const DESKTOP = { surface: 'desktop', clientId: 'desktop:default' }
const WATCH_MS = 5 * SECOND
const DAY_MS = 24 * 60 * 60 * SECOND

// Chats the drawing cannot read, so the pane's drawing throws, until /mend.
const CHATS_BREAKER = {
  name: 'chats-breaker',
  register(on: any) {
    let isBroken = true
    on('command.run', { command: 'mend' }, () => {
      isBroken = false
      return { text: '' }
    })
    on('state.set', { plugin: 'savvy-progress', key: 'chats' }, ($: any, e: any, next: any) => next(isBroken ? { ...e, value: 5 } : e))
  },
}

const redraws = (on: any): { count: number } => {
  const seen = { count: 0 }
  on('ui.invalidate', () => ((seen.count += 1), { value: undefined }))
  return seen
}

const drawnText = async (ui: any): Promise<string> => JSON.stringify(await ui.drawn())

for (const surface of SURFACES) {
  test(`${surface}: a task with an escape sequence or half an emoji in it still gets its pane, the characters dropped`, async ($: any, on: any) => {
    await setup($, on)
    await spawn($, 'Run \u001b[31mthe tests\u001b[0m now')
    await spawn($, `Ship it ${'🧪'.slice(0, 1)}`)
    const drawn = await drawnText(await $.ui.mount({ ...PANE, surface }))
    expect(drawn).toContain('the tests')
    expect(drawn).toContain('Ship it')
    expect(drawn).not.toMatch(/\\u001b|\\ud83e/i)
    expect(drawn).not.toContain('Panel çizilemedi')
  })

  test(`${surface}: a machine crowded with other chats and their agents still gets its pane`, async ($: any, on: any) => {
    const agents = Array.from({ length: 30 }, (_, i) => ({ id: `a${i}`, name: 'Pip', title: `Task ${i}`, startedAt: 0, costUsd: 0 }))
    const store = Object.fromEntries(Array.from({ length: 400 }, (_, i) => [`sessions/s${i}`, { project: 'P', title: `Chat ${i}`, state: 'working', since: 0, at: 0, agents }]))
    await setup($, on, { store })
    await spawn($, 'Mine')
    const drawn = await drawnText(await $.ui.mount({ ...PANE, surface }))
    expect(drawn).toContain('Mine')
    expect(drawn).toContain('+392 daha')
  })
}

test('a draw opens no pane and writes no state while it draws: the kept tab opens after it', async ($: any, on: any) => {
  const { clock, world } = await setup($, on)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.redraw(PANE.props)
  expect(world.opened).toEqual([])
  await clock.advance(1)
  expect(world.opened).toEqual([PANE.requestId])
})

test('a failed draw is asked for again on the next look, and a good one is left alone', { plugins: [CHATS_BREAKER] }, async ($: any, on: any) => {
  const seen = redraws(on)
  on('session.attach', (_: any, e: any) => ({ clientId: e.clientId }))
  const { clock } = await setup($, on, { store: { 'sessions/X0': { project: 'other', title: 'other work', state: 'idle', since: 0, at: 0 } } })
  await $.command.run({ command: 'agents-info', args: '' })
  await $.session.attach(DESKTOP)
  await clock.advance(WATCH_MS)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await drawnText(ui)).toContain('Panel çizilemedi')
  const before = seen.count
  await clock.advance(WATCH_MS)
  expect(seen.count).toBeGreaterThan(before)

  await $.command.run({ command: 'mend', args: '' })
  await clock.advance(WATCH_MS)
  await ui.redraw(PANE.props)
  expect(await drawnText(ui)).not.toContain('Panel çizilemedi')
  const settled = seen.count
  await clock.advance(WATCH_MS)
  expect(seen.count).toBe(settled)
})

test('a pane the engine lists is drawn again on every slow beat, and a desktop that attaches gets a redraw', async ($: any, on: any) => {
  const seen = redraws(on)
  on('session.attach', (_: any, e: any) => ({ clientId: e.clientId }))
  const { clock } = await setup($, on)
  await $.command.run({ command: 'agents-info', args: '' })
  await $.session.attach(DESKTOP)
  expect(seen.count).toBeGreaterThan(0)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.redraw(PANE.props)
  const before = seen.count
  await clock.advance(30 * SECOND)
  expect(seen.count).toBeGreaterThan(before)
})

test('notes of panes left open by sessions long gone are dropped; a recent one and this session\'s stay', async ($: any, on: any) => {
  on('session.attach', (_: any, e: any) => ({ clientId: e.clientId }))
  const { clock, world } = await setup($, on)
  // The session's own heartbeat says what time the test's clock reads.
  const now = (world.store.get('sessions/S1') as { at: number }).at
  const notes = { 'pane-open/old': true, 'pane-open/aged': now - 8 * DAY_MS, 'pane-open/recent': now - DAY_MS, 'pane-open/S1': true }
  for (const [key, value] of Object.entries(notes)) world.store.set(key, value)
  await $.session.attach(DESKTOP)
  await clock.advance(WATCH_MS)
  expect([...world.store.keys()].filter(key => key.startsWith('pane-open/')).sort()).toEqual(['pane-open/S1', 'pane-open/recent'])
  expect(typeof world.store.get('pane-open/S1')).toBe('number')
})

test('the heartbeat names the folder the session works in now, not the one it started in', async ($: any, on: any) => {
  let cwd = '/Users/me/.claude/spares/spare-abc'
  on('session.cwd', () => ({ value: cwd }))
  const { clock, world } = await setup($, on)
  cwd = '/Users/me/Projects/Shop'
  await clock.advance(30 * SECOND)
  expect((world.store.get('sessions/S1') as any).project).toBe('Shop')
})

test('finished agents fold away while others run, open by themselves once all are done, and the rows drawn are capped', async ($: any, on: any) => {
  await setup($, on)
  for (let i = 1; i <= 16; i++) await spawn($, `Task ${i}`)
  await finish($, 'a1')
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.find({ key: 'done' }))?.props?.label).toBe('▸ Bitti · 1')
  expect((await ui.findAll({ type: 'Button' })).filter((b: any) => String(b.props?.key).startsWith('open-')).length).toBe(12)
  expect(await drawnText(ui)).toContain('+3 ajan daha')

  for (let i = 2; i <= 16; i++) await finish($, `a${i}`)
  await ui.redraw(PANE.props)
  expect((await ui.find({ key: 'done' }))?.props?.label).toBe('▾ Bitti · 16')
})
