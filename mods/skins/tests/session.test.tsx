import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

import { DESIGN_TOOL } from '../hooks/designer'

// Each new session loads the saved look again, whichever of its hooks reaches skins first.

type World = { store: Record<string, unknown>; cards: string[]; logs: string[]; session: string }

function stubEngine(on: On, world: World) {
  const clock = mock.clock(on, { now: 10_000 })
  on('session.cwd', () => ({ value: '/work' }))
  on('session.id', () => ({ value: world.session }))
  on('env.get', () => ({ value: undefined }))
  on('store.get', ($, e) => ({ value: world.store[e.key] }))
  on('store.set', ($, e) => {
    world.store[e.key] = e.value
    return { value: undefined }
  })
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000, percent: 42 }, rateLimits: [] } }))
  on('session.start', () => ({ cwd: '/work' }))
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('command.register', () => ({ value: { command: 'skin' } }))
  on('ui.log', ($, e) => {
    world.logs.push(e.text)
    return { value: undefined }
  })
  // The MODZ hub card names the skin in use and the background it is drawn for.
  on('state.set', { plugin: 'skins', key: 'hub' }, ($, e, next) => {
    world.cards.push((e.value as { detail: string }).detail)
    return next(e)
  })

  return clock
}

const worldOf = (): World => ({ store: {}, cards: [], logs: [], session: 's1' })
const start = ($: Engine) => $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
const turn = ($: Engine) => $.turn.start({ text: 'hi', turnId: 't' })

// On a Team or Enterprise plan the built-in guard holds classic.SessionStart back from user-tier mods.
test('the first turn of a new session loads the saved prefs again, without classic.SessionStart', async ($, on) => {
  const world = worldOf()
  stubEngine(on, world)
  on('tool.register', () => ({ value: { tool: 'mcp__skins__design' } }))
  on('config.list', () => ({ value: [] }))

  await start($)
  expect(world.cards.at(-1)).toContain('tidemark')

  // Saved by another session: the same session's turns leave the loaded prefs alone.
  world.store.prefs = { skin: 'dracula' }
  await turn($)
  expect(world.cards.at(-1)).toContain('tidemark')

  world.session = 's2'
  await turn($)
  expect(world.cards.at(-1)).toContain('dracula')
})

// A terminal /resume starts no turn until the next prompt, and the engine can still answer the old session's id.
test('/resume loads the saved prefs from the hook session id', async ($, on) => {
  const world = worldOf()
  stubEngine(on, world)
  on('tool.register', () => ({ value: { tool: 'mcp__skins__design' } }))
  on('config.list', () => ({ value: [] }))
  on('classic.SessionStart', () => ({}) as never)

  await start($)
  world.store.prefs = { skin: 'dracula' }
  await $.classic.SessionStart({ source: 'resume', session_id: 's2' } as never)

  expect(world.cards.at(-1)).toContain('dracula')
})

// A resumed session can start before Claude Code binds it, and $.config.list rejects until then.
test('a resume before the session is bound keeps the prefs, and the next turn reads the theme', async ($, on) => {
  const world = worldOf()
  let isBound = false
  stubEngine(on, world)
  on('tool.register', () => ({ value: { tool: 'mcp__skins__design' } }))
  on('config.list', () => {
    if (!isBound) throw new Error('no session is bound in this process')
    return { value: [{ key: 'theme', label: 'Theme', kind: 'enum', value: 'light', provider: { kind: 'engine' }, isLocked: false }] as never }
  })
  on('classic.SessionStart', () => ({}) as never)
  world.store.prefs = { skin: 'dracula' }

  await $.classic.SessionStart({ source: 'resume', session_id: 's1' } as never)
  expect(world.logs.filter(text => text.includes('not loaded yet'))).toHaveLength(0)
  expect(world.logs.filter(text => text.includes('theme not read yet'))).toHaveLength(1)

  isBound = true
  await turn($)
  expect(world.cards.at(-1), 'the turn after the bind reads the theme').toMatch(/dracula · light/)
})

test('a session start waits at most a second for a design tool that is never listed, and still registers it', async ($, on) => {
  const world = worldOf()
  const clock = stubEngine(on, world)
  const registered: unknown[] = []
  let listed = () => {}
  let isStarted = false
  on('config.list', () => ({ value: [] }))
  on('tool.register', ($, e) => {
    registered.push(e)
    return new Promise<{ value: { tool: string } }>(resolve => {
      listed = () => resolve({ value: { tool: 'mcp__skins__design' } })
    })
  })

  const started = start($).then(() => {
    isStarted = true
  })
  await clock.settle()
  expect(isStarted, 'the start waits while the tool is not listed yet').toBe(false)
  await clock.advance(1000)
  expect(isStarted, 'a second on, the start goes on without the tool').toBe(true)
  listed()
  await started

  expect(registered).toEqual([{ name: DESIGN_TOOL.name, description: DESIGN_TOOL.description, inputSchema: DESIGN_TOOL.inputSchema }])
})

test('a design tool that fails to register is logged, and the rest of the start still runs', async ($, on) => {
  const world = worldOf()
  stubEngine(on, world)
  on('config.list', () => ({ value: [] }))
  on('tool.register', () => ({ deny: 'refused in a test' }))

  await start($)

  expect(world.logs.filter(text => text.startsWith('skins: design tool:') && text.includes('refused in a test'))).toHaveLength(1)
  expect(world.cards.at(-1)).toContain('tidemark')
})
