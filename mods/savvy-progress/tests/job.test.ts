import { expect, test } from 'claude-code/testing'

import { deriveJob, joinJob, percentText, sealJob } from '../hooks/job'
import type { AgentRun, Flow } from '../types'

const run = (id: string, over: Partial<AgentRun> = {}): AgentRun => ({
  id, agentId: id, type: 'general-purpose', description: `job ${id}`, model: 'claude-opus-5-5', status: 'running',
  startedAt: 0, contextTokens: 0, contextMax: 1e6, tokens: 0, costUsd: 0, steps: 0, round: 1, toolCount: 0, ...over,
})
const job = (ids: string[]) => ({ agentIds: ids, startedAt: 0, isSealed: false, isHidden: false })
const view = (agents: AgentRun[], over: Record<string, unknown> = {}) =>
  deriveJob({ flow: null, agents, job: job(agents.map(a => a.id)), tasks: [], ...over })

test('three running agents with no report read 0/3 and "—", never 0%', () => {
  const v = view([run('a'), run('b'), run('c')])
  expect(v?.label).toBe('Ajanlar 0/3')
  expect(v?.ratio).toBeNull()
  expect(percentText(v!)).toBe('—')
  expect(v?.launched).toBe(1)
  expect(v?.isWorking).toBe(true)
})

test('finished agents count exactly', () => {
  const v = view([run('a', { status: 'done' }), run('b'), run('c')])
  expect(v?.label).toBe('Ajanlar 1/3')
  expect(percentText(v!)).toBe('%33')
})

test('a running agent that reports steps adds partial credit, marked ~', () => {
  const v = view([run('a', { status: 'done' }), run('b', { stepDone: 1, stepTotal: 2 }), run('c')])
  expect(percentText(v!)).toBe('~%50')
  expect(v?.isEstimate).toBe(true)
})

test('an agent own task list is a basis for credit too', () => {
  const todos = [{ id: '1', title: 'x', status: 'completed' as const }, { id: '2', title: 'y', status: 'pending' as const }]
  expect(percentText(view([run('a', { todos }), run('b')])!)).toBe('~%25')
})

test('all ended: Bitti %100, failures named', () => {
  expect(view([run('a', { status: 'done' })])?.label).toBe('Bitti')
  const v = view([run('a', { status: 'done' }), run('b', { status: 'failed' })])
  expect(v?.label).toBe('Bitti · 1 hata')
  expect(percentText(v!)).toBe('%100')
  expect(v?.failed).toBe(1)
})

test('the main task list wins over agent counts', () => {
  const tasks = [
    { id: '1', title: 'a', status: 'completed' as const },
    { id: '2', title: 'b', status: 'in_progress' as const },
    { id: '3', title: 'c', status: 'pending' as const },
    { id: '4', title: 'd', status: 'pending' as const },
  ]
  const v = view([run('a'), run('b')], { tasks })
  expect(v?.label).toBe('Görevler 1/4')
  expect(percentText(v!)).toBe('%25')
  expect(v?.launched).toBe(0.5)
})

test('a report wins over everything and names its phase', () => {
  const flow: Flow = { title: 'Launch kit', total: 4, done: 2, phase: 'delegate', isFinished: false, tasks: [] }
  const v = view([run('a')], { flow })
  expect(v?.title).toBe('Launch kit')
  expect(v?.label).toBe('Görevler 2/4')
  expect(percentText(v!)).toBe('%50')
  expect(view([], { flow: { ...flow, phase: 'review', done: 3 } })?.label).toBe('Gözden geçirme 3/4')
  expect(percentText(view([], { flow: { ...flow, done: 0, phase: 'plan' } })!)).toBe('—')
  expect(view([], { flow: { ...flow, isFinished: true } })?.label).toBe('Bitti')
})

test('nothing launched and nothing reported: no band', () => {
  expect(deriveJob({ flow: null, agents: [run('a')], job: null, tasks: [] })).toBeNull()
})

test('a sealed job starts over; a busy one keeps going', () => {
  const sealed = { ...job(['a']), isSealed: true }
  expect(joinJob(sealed, 'b', 5).agentIds).toEqual(['b'])
  expect(joinJob(job(['a']), 'b', 5).agentIds).toEqual(['a', 'b'])
  expect(sealJob(job(['a']), [run('a')])?.isSealed).toBe(false)
  expect(sealJob(job(['a']), [run('a', { status: 'done' })])).toEqual({ ...job(['a']), isSealed: true })
})
