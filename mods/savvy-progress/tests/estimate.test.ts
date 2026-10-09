import { expect, test } from 'claude-code/testing'

import type { AgentRun, ToolEvent } from '../types'
import { agentProgress } from '../hooks/estimate'

const run = (patch: Partial<AgentRun> = {}): AgentRun => ({
  id: 'r', type: 'general-purpose', description: 'x', model: 'claude-opus-5-5', status: 'running', startedAt: 0,
  contextTokens: 0, contextMax: 1, tokens: 0, costUsd: 0, steps: 0, round: 1, toolCount: 0, ...patch,
})

const calls = (tool: string, n: number, target = ''): ToolEvent[] => Array.from({ length: n }, (_, i) => ({ tool, target, at: i }))

test('a finished or failed agent is 100%, measured', () => {
  expect(agentProgress(run({ status: 'done' }))).toEqual({ value: 1, isEstimate: false })
  expect(agentProgress(run({ status: 'failed' }))).toEqual({ value: 1, isEstimate: false })
})

test("a worker's own steps are measured, not estimated", () => {
  expect(agentProgress(run({ stepDone: 2, stepTotal: 5 }))).toEqual({ value: 0.4, isEstimate: false })
})

test('an unreported agent gets an estimate that grows with its calls and never reaches the end', () => {
  const start = agentProgress(run())
  const some = agentProgress(run({ toolCount: 4, history: calls('Read', 4) }))
  const many = agentProgress(run({ toolCount: 200, history: calls('Read', 60) }))
  expect(start.isEstimate).toBe(true)
  expect(start.value).toBeGreaterThan(0)
  expect(some.value).toBeGreaterThan(start.value)
  expect(many.value).toBeLessThanOrEqual(0.9)
})

test('editing, then testing, lift the estimate', () => {
  const reading = agentProgress(run({ toolCount: 2, history: calls('Read', 2) })).value
  const editing = agentProgress(run({ toolCount: 3, history: [...calls('Read', 2), ...calls('Edit', 1)] })).value
  const testing = agentProgress(run({ toolCount: 4, history: [...calls('Read', 2), ...calls('Edit', 1), ...calls('Bash', 1, 'npm test')] })).value
  expect(editing).toBeGreaterThan(reading)
  expect(testing).toBeGreaterThan(editing)
})
