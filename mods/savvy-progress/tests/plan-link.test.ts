import { expect } from 'claude-code/testing'
import { test } from './fixtures'

import type { AgentRun } from '../types'
import { movedOn } from '../hooks/agents'
import { agentLogPath } from '../hooks/about'

const plan = (statuses: string[]) => statuses.map((status, i) => ({ subject: `step ${i + 1}`, status }))
const run = (patch: Partial<AgentRun>): AgentRun => ({
  id: 'r', type: 'general-purpose', description: 'x', model: 'claude-opus-5-5', status: 'running', startedAt: 0,
  contextTokens: 0, contextMax: 1, tokens: 0, costUsd: 0, steps: 0, round: 1, toolCount: 0,
  planStep: { subject: 'step 1', at: 1, of: 3 }, ...patch,
})

test('helpers sent out before the plan moved on serve the step under way once their step is ticked off', () => {
  const list = [run({ id: 'a' }), run({ id: 'b', status: 'done' })]
  const moved = movedOn(list, plan(['completed', 'in_progress', 'pending']), 60_000)
  expect(moved[0]?.planStep).toEqual({ subject: 'step 2', at: 2, of: 3 })
  expect(moved[1]?.planStep).toEqual({ subject: 'step 1', at: 1, of: 3 })
})

test('nothing moves while their step is still under way', () => {
  const list = [run({ id: 'a' })]
  expect(movedOn(list, plan(['in_progress', 'pending', 'pending']), 60_000)).toBe(list)
})

test('a helper launched during its step stays on it when the step is ticked off later', () => {
  const list = [run({ id: 'a', startedAt: 0 })]
  expect(movedOn(list, plan(['completed', 'in_progress', 'pending']), 11 * 60_000)).toBe(list)
})

test("a helper's record is found beside the session's own transcript", () => {
  expect(agentLogPath('/h/.claude/projects/-p/abc.jsonl', 'a1')).toBe('/h/.claude/projects/-p/abc/subagents/agent-a1.jsonl')
  expect(agentLogPath('', 'a1')).toBe('')
  expect(agentLogPath('/h/abc.jsonl', undefined)).toBe('')
})
