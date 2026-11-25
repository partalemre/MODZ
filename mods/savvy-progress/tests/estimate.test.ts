import { expect } from 'claude-code/testing'
import { test } from './fixtures'

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

test('an unreported agent has no made-up percent: its bar stays empty, however many calls it made', () => {
  const start = agentProgress(run())
  const many = agentProgress(run({ toolCount: 200, history: [...calls('Edit', 30), ...calls('Bash', 1, 'npm test')] }))
  expect(start).toEqual({ value: 0, isEstimate: true })
  expect(many).toEqual(start)
})
