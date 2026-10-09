import { expect, test } from 'claude-code/testing'

import { lookAt, nextLook } from '../hooks/identity'
import { reconcile } from '../hooks/roster'
import type { AgentRun } from '../types'

const info = (id: string, status: string, description = 'Work') => ({ id, type: 'general-purpose', description, status }) as any

const run = (id: string, patch: Partial<AgentRun> = {}): AgentRun => ({
  id, agentId: id, type: 'general-purpose', description: 'Work', model: 'm', status: 'running', startedAt: 1,
  contextTokens: 0, contextMax: 1, tokens: 0, costUsd: 0, steps: 0, round: 1, toolCount: 0, ...patch,
})

test('an agent only the engine knows is added as running, an ended unknown one is not', () => {
  const next = reconcile([], [info('a1', 'running'), info('a2', 'completed')], 5)
  expect(next.map(a => a.id)).toEqual(['a1'])
  expect(next[0]).toMatchObject({ status: 'running', startedAt: 5, look: 0 })
})

test('a run whose end event never came is closed by the roster', () => {
  const next = reconcile([run('a1')], [info('a1', 'killed')], 9)
  expect(next[0]).toMatchObject({ status: 'failed', endReason: 'aborted', endedAt: 9 })
})

test('nothing moved returns the same list; a run without an agent id adopts the roster id', () => {
  const list = [run('a1')]
  expect(reconcile(list, [info('a1', 'running')], 2)).toBe(list)
  const waiting = [run('toolu_1', { agentId: undefined })]
  expect(reconcile(waiting, [info('a7', 'running')], 2)[0]).toMatchObject({ id: 'toolu_1', agentId: 'a7' })
})

test('looks are handed out in order and 32 of them are all different', () => {
  expect(nextLook([run('a', { look: 3 }), run('b')])).toBe(4)
  const seen = new Set(Array.from({ length: 32 }, (_, i) => JSON.stringify(lookAt(i))))
  expect(seen.size).toBe(32)
})
