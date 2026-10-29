import { expect, mock, test } from 'claude-code/testing'

import { clockOf } from '../hooks/brake'

const RESETS_AT_MS = 5 * 60 * 60_000
const RESETS_AT = new Date(RESETS_AT_MS).toISOString()
const MINUTE = 60_000

// `answer` is what the person picks; null is a -p run, where nobody can be asked.
type World = { asked: string[]; answer: string | null; spawned: string[]; stored: Record<string, unknown> }

async function setup($: any, on: any, world: World) {
  const clock = mock.clock(on)
  mock.env(on, {})
  on('session.start', () => ({ cwd: '/w' }))
  on('session.usage', () => ({ value: { startedAt: 0, context: {}, rateLimits: [], cost: { usd: 0 } } }))
  on('session.measure', (_: any, e: any) => ({ changed: e.changed }))
  on('session.surfaces', () => ({ value: ['terminal'] }))
  on('store.get', (_: any, e: any) => ({ value: world.stored[e.key] }))
  on('store.set', (_: any, e: any) => {
    world.stored[e.key] = e.value

    return { value: undefined }
  })
  on('command.register', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('tool.call', (_: any, e: any) => {
    if (e.tool !== 'AskUserQuestion') {
      world.spawned.push(e.description ?? e.command)

      return { result: 'done' }
    }
    const question = e.questions[0].question
    world.asked.push(question)
    if (world.answer === null) return { deny: 'no one to ask' }

    return { result: { answers: { [question]: world.answer } } }
  })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })

  return clock
}

const measure = ($: any, percentUsed: number) =>
  $.session.measure({ context: {}, rateLimits: [{ kind: 'five_hour', percentUsed, resetsAt: RESETS_AT }], cost: { usd: 0 }, changed: ['rateLimits'] })
const spawn = ($: any, description: string) => $.tool.call({ tool: 'Agent', description, prompt: 'look around', subagent_type: 'Explore' })
const world = (answer: string | null = 'Stop'): World => ({ asked: [], answer, spawned: [], stored: {} })

test('below the brake line a spawn goes through without a question', async ($: any, on: any) => {
  const w = world()
  await setup($, on, w)
  await measure($, 84)
  await spawn($, 'one')
  expect(w.asked).toEqual([])
  expect(w.spawned).toEqual(['one'])
})

test('at the line a spawn asks; Stop refuses it with the reason the model reads', async ($: any, on: any) => {
  const w = world('Stop')
  await setup($, on, w)
  await measure($, 88)
  const refused = await spawn($, 'one')
  const reset = clockOf(RESETS_AT_MS)
  expect(w.asked).toEqual([`Spawn brake: 5-hour window at 88%, resets ${reset}. Start the subagent anyway?`])
  expect(JSON.stringify(refused)).toContain(`spawn brake: 5-hour window at 88%, resets ${reset}`)
  expect(w.spawned).toEqual([])
})

test('Continue lets spawns through until the window moves 5 more points; other tools are never braked', async ($: any, on: any) => {
  const w = world('Continue')
  await setup($, on, w)
  await measure($, 88)
  await spawn($, 'one')
  await measure($, 92.5)
  await spawn($, 'two')
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  expect(w.asked).toHaveLength(1)
  await measure($, 93)
  await spawn($, 'three')
  expect(w.asked).toHaveLength(2)
  expect(w.spawned).toEqual(['one', 'two', 'ls', 'three'])
})

test('a fan-out at the line asks once for all its spawns', async ($: any, on: any) => {
  const w = world('Stop')
  await setup($, on, w)
  await measure($, 90)
  await Promise.all([spawn($, 'a'), spawn($, 'b'), spawn($, 'c')])
  expect(w.asked).toHaveLength(1)
  expect(w.spawned).toEqual([])
})

test('headless (nobody to ask) never blocks a spawn', async ($: any, on: any) => {
  const w = world(null)
  await setup($, on, w)
  await measure($, 99)
  await spawn($, 'one')
  expect(w.spawned).toEqual(['one'])
})

test('a pace that fills the window before it resets asks below the line', async ($: any, on: any) => {
  const w = world('Stop')
  const clock = await setup($, on, w)
  await measure($, 50)
  await clock.advance(5 * MINUTE)
  await measure($, 55)
  await clock.advance(5 * MINUTE)
  await measure($, 60)
  await spawn($, 'one')
  expect(w.asked[0]).toBe(`Spawn brake: 5-hour window at 60%, full by ${clockOf(50 * MINUTE)} at this pace, resets ${clockOf(RESETS_AT_MS)}. Start the subagent anyway?`)
  expect(w.spawned).toEqual([])
})

test('the pace alone stays quiet early in a window', async ($: any, on: any) => {
  const w = world('Stop')
  const clock = await setup($, on, w)
  await measure($, 10)
  await clock.advance(5 * MINUTE)
  await measure($, 15)
  await clock.advance(5 * MINUTE)
  await measure($, 20)
  await spawn($, 'one')
  expect(w.asked).toEqual([])
  expect(w.spawned).toEqual(['one'])
})

test('/budget brake sets the line or turns it off, and the choice is saved', async ($: any, on: any) => {
  const w = world('Stop')
  await setup($, on, w)
  expect(await $.command.run({ command: 'budget', args: 'brake' })).toMatchObject({ text: 'Spawn brake on: asks before a subagent at 85% of the 5-hour window.' })
  expect(await $.command.run({ command: 'budget', args: 'brake 95' })).toMatchObject({ text: 'Spawn brake on: asks before a subagent at 95% of the 5-hour window.' })
  await measure($, 90)
  await spawn($, 'one')
  expect(await $.command.run({ command: 'budget', args: 'brake off' })).toMatchObject({ text: 'Spawn brake off.' })
  await measure($, 99)
  await spawn($, 'two')
  expect(w.asked).toEqual([])
  expect(w.stored['session-budget.brake']).toBe(false)
  expect(await $.command.run({ command: 'budget', args: 'brake 0' })).toMatchObject({ text: 'Usage: /budget brake <percent, e.g. 85> | brake off' })
})

test('a saved brake setting comes back at session start', async ($: any, on: any) => {
  const w = { ...world('Stop'), stored: { 'session-budget.brake': false } }
  await setup($, on, w)
  await measure($, 99)
  await spawn($, 'one')
  expect(w.asked).toEqual([])
  expect(w.spawned).toEqual(['one'])
})
