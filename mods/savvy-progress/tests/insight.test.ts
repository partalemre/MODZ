import { expect, test } from 'claude-code/testing'

import { LONG_TOOL_MS, QUIET_MS, attentionOf, roughSpan, stuckOf } from '../hooks/insight'
import { laneCells, runsOf, timelineOf } from '../hooks/timeline'
import { timelineSvg } from '../hooks/timeline-svg'
import type { AgentRun, ToolEvent } from '../types'

// The quiet-agent check, the attention line's pick and the timeline's facts, as pure functions.

const SECOND = 1000
const MINUTE = 60 * SECOND

const run = (id: string, patch: Partial<AgentRun> = {}): AgentRun => ({
  id, agentId: id, type: 'general-purpose', description: `Work ${id}`, model: 'm', status: 'running', startedAt: 0,
  contextTokens: 0, contextMax: 1, tokens: 0, costUsd: 0, steps: 0, round: 1, toolCount: 0, look: Number(id.slice(1)) - 1, ...patch,
})

const call = (tool: string, at: number, endAt?: number): ToolEvent => ({ tool, target: '', at, endAt })

test('a running agent unheard for two minutes is quiet; a minute and a half is fine', () => {
  const a = run('a1', { heardAt: 10 * SECOND })
  expect(stuckOf(a, 10 * SECOND + QUIET_MS - SECOND)).toBeNull()
  expect(stuckOf(a, 10 * SECOND + QUIET_MS + 40 * SECOND)).toMatchObject({ reason: 'sessiz 2 dk', since: 10 * SECOND })
  // Never heard from: its start counts.
  expect(stuckOf(run('a2'), QUIET_MS)?.reason).toBe('sessiz 2 dk')
})

test('one call open fifteen minutes is worth a look; a shorter open call is not quiet', () => {
  const open = run('a1', { history: [call('Read', 0, SECOND), call('Bash', MINUTE)] })
  expect(stuckOf(open, MINUTE + 5 * MINUTE)).toBeNull()
  expect(stuckOf(open, MINUTE + LONG_TOOL_MS)?.reason).toBe('Bash 15 dk sürüyor')
})

test('an agent that ended is never stuck', () => {
  expect(stuckOf(run('a1', { status: 'done', endedAt: SECOND }), 30 * MINUTE)).toBeNull()
  expect(stuckOf(run('a1', { status: 'failed', endedAt: SECOND }), 30 * MINUTE)).toBeNull()
})

test('the attention line picks the longest stuck, then the latest fresh failure, never a stop', () => {
  const at = 20 * MINUTE
  const quiet = [run('a1', { heardAt: 15 * MINUTE }), run('a2', { heardAt: 12 * MINUTE }), run('a3', { heardAt: at })]
  expect(attentionOf(quiet, at)).toMatchObject({ agentId: 'a2', name: 'Mako', reason: 'sessiz 8 dk', role: 'warn', title: 'Work a2' })
  const ended = [
    run('a1', { status: 'failed', endReason: 'error', endedAt: at - 12 * MINUTE }),
    run('a2', { status: 'failed', endReason: 'aborted', endedAt: at - MINUTE }),
    run('a3', { status: 'failed', endReason: 'error', endedAt: at - 2 * MINUTE }),
    run('a4', { status: 'done', endedAt: at }),
  ]
  expect(attentionOf(ended, at)).toMatchObject({ agentId: 'a3', reason: 'hata verdi', role: 'danger' })
  expect(attentionOf(ended.slice(0, 2), at)).toBeNull()
})

test('a rough span reads seconds, minutes, then hours', () => {
  expect(roughSpan(40 * SECOND)).toBe('40 sn')
  expect(roughSpan(3 * MINUTE + 59 * SECOND)).toBe('3 dk')
  expect(roughSpan(125 * MINUTE)).toBe('2 sa')
})

test('the timeline keeps the latest eight lanes oldest first, from the first start to now', () => {
  const crew = Array.from({ length: 10 }, (_, i) => run(`a${i + 1}`, { startedAt: i * SECOND }))
  const tl = timelineOf(crew, 50 * SECOND)
  expect(tl?.lanes.map(lane => lane.name)).toEqual(['Nori', 'Kiko', 'Sol', 'Fenn', 'Coral', 'Rio', 'Zuzu', 'Moss'])
  expect(tl).toMatchObject({ t0: 2 * SECOND, t1: 50 * SECOND, span: 48 * SECOND, isLive: true })
  expect(timelineOf([], 1)).toBeNull()
  // A young crew still gets half a minute of room, now short of the right edge.
  expect(timelineOf([run('a1')], 5 * SECOND)).toMatchObject({ t1: 5 * SECOND, span: 30 * SECOND })
})

test('a lane reads as cells: its calls by kind, idle stretches between, nothing outside its life', () => {
  const a = run('a1', { startedAt: 10 * SECOND, history: [call('Read', 10 * SECOND, 20 * SECOND), call('Edit', 30 * SECOND, 31 * SECOND)] })
  const tl = timelineOf([a, run('a2', { startedAt: 0, status: 'done', endedAt: 40 * SECOND })], 40 * SECOND)!
  const lane = tl.lanes.find(l => l.id === 'a1')!
  const kinds = laneCells(lane, tl, 8).map(cell => cell.kind)
  expect(kinds).toEqual(['none', 'none', 'read', 'read', 'idle', 'idle', 'edit', 'idle'])
  expect(runsOf(laneCells(lane, tl, 8))).toEqual([
    { kind: 'none', length: 2 }, { kind: 'read', length: 2 }, { kind: 'idle', length: 2 }, { kind: 'edit', length: 1 }, { kind: 'idle', length: 1 },
  ])
})

test('the timeline drawing names every lane, marks a quiet one and only the kinds it holds', () => {
  const crew = [run('a1', { history: [call('Read', 0, SECOND)] }), run('a2', { status: 'done', endedAt: MINUTE }), run('a3', { heardAt: 0 })]
  const drawing = timelineSvg(400, timelineOf(crew, 3 * MINUTE)!)
  expect(drawing.alt).toBe('Zaman çizelgesi: Pip 3:00 çalışıyor, Mako 1:00 bitti, Nori 3:00 çalışıyor')
  expect(drawing.source).toContain('okuma')
  expect(drawing.source).not.toContain('düzenleme')
  expect(drawing.source).toContain('class="f-warn"')
  expect(drawing.source).toContain('şimdi')
})
