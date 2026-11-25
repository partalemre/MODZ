import { expect } from 'claude-code/testing'
import { test } from './fixtures'

import type { AgentRun } from '../types'
import { movedOn } from '../hooks/agents'

const plan = (statuses: string[]) => statuses.map((status, i) => ({ subject: `step ${i + 1}`, status }))
const run = (patch: Partial<AgentRun>): AgentRun => ({
  id: 'r', type: 'general-purpose', description: 'x', model: 'claude-opus-5-5', status: 'running', startedAt: 0,
  contextTokens: 0, contextMax: 1, tokens: 0, costUsd: 0, steps: 0, round: 1, toolCount: 0,
  planStep: { subject: 'step 1', at: 1, of: 3 }, ...patch,
})

test('helpers sent out before the plan moved on serve the step under way once their step is ticked off', () => {
  const list = [run({ id: 'a' }), run({ id: 'b', status: 'done' })]
  const moved = movedOn(list, plan(['completed', 'in_progress', 'pending']))
  expect(moved[0].planStep).toEqual({ subject: 'step 2', at: 2, of: 3 })
  expect(moved[1].planStep).toEqual({ subject: 'step 1', at: 1, of: 3 })
})

test('nothing moves while their step is still under way', () => {
  const list = [run({ id: 'a' })]
  expect(movedOn(list, plan(['in_progress', 'pending', 'pending']))).toBe(list)
})
