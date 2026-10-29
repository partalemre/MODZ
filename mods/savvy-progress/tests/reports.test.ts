import { expect, test } from 'claude-code/testing'

import { setup, spawn, tool } from './fixtures'

const PROGRESS = 'mcp__savvy-progress__progress'
const STEP = 'mcp__savvy-progress__step'

test('a progress call from a subagent changes nothing', async ($, on) => {
  await setup($, on)
  await tool($, { tool: PROGRESS, title: 'Launch kit', total: 4, phase: 'delegate' })
  const answer = await tool($, { tool: PROGRESS, title: 'Hijacked', finished: true, agentId: 'a1' })
  expect(answer.result).toBe('ignored: only the main session reports the flow')
  expect((await tool($, { tool: PROGRESS, done: 1 })).result).toBe('ok: Görevler 1/4')
})

test('a step call with no panel row says so instead of ok', async ($, on) => {
  await setup($, on)
  await spawn($, 'One')
  expect((await tool($, { tool: STEP, done: 0, total: 3, agentId: 'a1' })).result).toBe('ok')
  expect((await tool($, { tool: STEP, done: 0, total: 3, agentId: 'a9' })).result).toBe('ignored: no panel row for agent a9')
})

test('a savvy worker gets the step request at the end of its brief, once', async ($, on) => {
  const { world } = await setup($, on)
  await spawn($, 'Plain')
  await spawn($, 'Careful', 'savvy-flow:savvy-careful')
  await $.agent.spawn({ prompt: `already asks for ${STEP}`, description: 'Briefed', subagentType: 'savvy-light' })
  const prompts = world.spawns.map(s => String(s.prompt))
  expect(prompts[0]).toBe('do it')
  expect(prompts[1]).toContain(`call \`${STEP}\``)
  expect(prompts[1]?.startsWith('do it')).toBe(true)
  expect(prompts[2]).toBe(`already asks for ${STEP}`)
})
