import { expect, test } from 'claude-code/testing'

import { stuckReason } from '../hooks/insight'
import { blankAgent } from '../hooks/roster'
import { MINUTE, PANE, call, setup, spy } from './fixtures'

test('a TodoWrite list shows the step and the item in progress', async ($, on) => {
  await setup($, on, spy())

  const todos = [
    { content: 'a', status: 'completed', activeForm: 'a' },
    { content: 'b', status: 'in_progress', activeForm: 'writing b' },
  ]
  await call($, { tool: 'Grep', pattern: 'login', agentId: 'a1' })
  await call($, { tool: 'TodoWrite', todos, agentId: 'a1' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })

  expect(await ui.find({ type: 'Text', text: 'adım 2/2' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '› writing b · Grep login' })).toBeDefined()
})

test('TaskCreate and TaskUpdate drive the step', async ($, on) => {
  await setup($, on, spy())

  for (const subject of ['one', 'two', 'three', 'four']) await call($, { tool: 'TaskCreate', subject, description: 'x', agentId: 'a1' })
  await call($, { tool: 'TaskUpdate', taskId: 't1', status: 'completed', agentId: 'a1' })
  await call($, { tool: 'TaskUpdate', taskId: 't2', status: 'in_progress', agentId: 'a1' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })

  expect(await ui.find({ type: 'Text', text: 'adım 2/4' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '› two' })).toBeDefined()
})

test('a subagent step adds tokens to the row and cost to the header and the card', async ($, on) => {
  await setup($, on, spy())

  const stream = $.turn.step({ turnId: 't', index: 0, model: 'claude-sonnet-5-5', messageCount: 1, agentId: 'a1' } as any)
  let step = await stream.next()
  while (step.done !== true) step = await stream.next()
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'pick-a1' })

  expect(await ui.find({ type: 'Text', text: '2,0k tok' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /en uzun 0 sn · ≈\$0,02/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'Explore · sonnet-5-5 · ≈$0,02' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'Toplam 2,0k tok' })).toBeDefined()
})

test('Stop and Message sit in a running agent card, not in a finished one', async ($, on) => {
  const seen = spy()
  await setup($, on, seen)

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'pick-a1' })
  await ui.press({ key: 'stop-a1' })
  expect(seen.tools?.find(entry => entry.tool === 'TaskStop')?.task_id).toBe('a1')

  await ui.press({ key: 'msg-a1' })
  await ui.input({ key: 'send', text: 'focus on the oauth flow' })
  expect(seen.sent[0]?.text).toBe('focus on the oauth flow')

  await ui.press({ key: 'pick-a2' })
  expect(await ui.find({ key: 'stop-a2' })).toBeUndefined()
  expect(await ui.find({ key: 'msg-a2' })).toBeUndefined()
})

test('finished agents fold after three', async ($, on) => {
  const list = Array.from({ length: 5 }, (_, index) => ({ id: `d${index}`, description: `done ${index}`, type: 'Plan', status: 'completed' }))
  await setup($, on, spy(), list)

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.find({ key: 'more-done' }))?.props?.label).toBe('+2 daha')
  expect(await ui.find({ key: 'pick-d4' })).toBeUndefined()

  await ui.press({ key: 'more-done' })
  expect(await ui.find({ key: 'pick-d4' })).toBeDefined()
})

test('Give task opens the dispatch tab with that agent chosen and dispatches it', async ($, on) => {
  const seen = spy()
  await setup($, on, seen, [])

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'give-Plan' })
  await ui.input({ key: 'task', text: 'plan the settings page' })

  expect(seen.spawned[0]?.subagent_type).toBe('Plan')
})

test('the dispatch tab starts the chosen agent type', async ($, on) => {
  const seen = spy()
  await setup($, on, seen)

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'tab-dispatch' })
  await ui.select({ key: 'type', value: 'Explore' })
  await ui.input({ key: 'task', text: 'audit the login flow' })

  expect(seen.spawned[0]?.subagent_type).toBe('Explore')
  expect(seen.spawned[0]?.prompt).toBe('audit the login flow')
})

test('one tool call open for over fifteen minutes reads as stuck, a shorter one does not', () => {
  const agent = { ...blankAgent('x', 0), tool: 'Bash', toolSince: 0 }

  expect(stuckReason(agent, 10 * MINUTE)).toBeNull()
  expect(stuckReason(agent, 16 * MINUTE)).toBe('Bash 16 dk sürüyor')
})

test('a finished agent keeps its total duration; one first seen finished shows none', async ($, on) => {
  const list = [
    { id: 'r1', description: 'watched job', type: 'general-purpose', status: 'running' },
    { id: 'o1', description: 'old job', type: 'general-purpose', status: 'completed' },
  ]
  const clock = await setup($, on, spy(), list)

  await clock.advance(90_000)
  list[0] = { ...list[0], status: 'completed' }
  await clock.advance(1_000)
  await clock.advance(MINUTE)
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })

  expect(await ui.find({ type: 'Text', text: '1 dk 31 sn' })).toBeDefined()
  expect((await ui.findAll({ type: 'Text', text: /\d sn/ })).length).toBe(1)
})
