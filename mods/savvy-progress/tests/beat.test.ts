import { expect } from 'claude-code/testing'
import { test, SECOND, modelStep, setup, spawn } from './fixtures'

// The one-second beat: the engine's roster is asked each beat only while an agent runs.

const READER = {
  name: 'reader',
  register(on: any) {
    on('command.run', { command: 'read-agents' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'savvy-progress', key: 'agents' })).value ?? []) }))
  },
}
const WITH_READER = { plugins: [READER] }
const agentsOf = async ($: any) => JSON.parse((await $.command.run({ command: 'read-agents', args: '' })).text)

test('idle, an agent only the engine knows shows within five beats, not on the next one', WITH_READER, async ($, on) => {
  const { world, clock } = await setup($, on)
  world.roster.push({ id: 'x1', type: 'general-purpose', description: 'Elsewhere', status: 'running' })
  await clock.advance(SECOND)
  expect(await agentsOf($)).toEqual([])
  await clock.advance(4 * SECOND)
  expect((await agentsOf($)).map((a: any) => a.id)).toEqual(['x1'])
})

test('while an agent runs, the roster is folded in on the next beat', WITH_READER, async ($, on) => {
  const { world, clock } = await setup($, on)
  await spawn($, 'Work')
  world.roster.push({ id: 'a1', type: 'general-purpose', description: 'Work', status: 'completed' })
  await clock.advance(SECOND)
  expect((await agentsOf($))[0]).toMatchObject({ id: 'a1', status: 'done' })
})

test('a model request that ended leaves none in flight', WITH_READER, async ($, on) => {
  await setup($, on)
  await spawn($, 'Work')
  await modelStep($, 'a1')
  expect((await agentsOf($))[0]?.stepAt).toBeUndefined()
})
