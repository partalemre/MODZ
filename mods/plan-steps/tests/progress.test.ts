import { expect, test } from 'claude-code/testing'

import type { Plan, Step } from '../hooks/match'
import { detailLines, filesText, headline } from '../hooks/pane'
import { statusText } from '../hooks/plan'
import { anchorIndex, currentIndex, durationOf, etaOf, formatDuration, observe, progressOf, windowOf } from '../hooks/progress'
import type { Tracks } from '../hooks/progress'
import type { StepStatus } from '../types'
import { setLang } from '../hooks/kit/lang'

const MIN = 60_000

setLang('tr')

function step(key: string, status: StepStatus, credit?: number): Step {
  const fallback = status === 'completed' ? 1 : status === 'in_progress' ? 0.5 : 0

  return { key, title: key, status, credit: credit ?? fallback, checksDone: 0, checksTotal: 0 }
}

function planOf(statuses: StepStatus[]): Plan {
  return { steps: statuses.map((status, index) => step(`s${index + 1}`, status)), source: 'görev listesi' }
}

test('status changes stamp start and finish; a step first seen done has no duration', () => {
  let tracks: Tracks = observe({}, planOf(['completed', 'in_progress', 'pending']).steps, 0)
  expect(tracks.s1).toMatchObject({ startedAt: null, finishedAt: null })
  expect(tracks.s2).toMatchObject({ startedAt: 0, finishedAt: null })

  tracks = observe(tracks, planOf(['completed', 'completed', 'in_progress']).steps, 4 * MIN)
  expect(durationOf(tracks.s2, 99 * MIN)).toBe(4 * MIN)
  expect(durationOf(tracks.s3, 6 * MIN)).toBe(2 * MIN)
  expect(durationOf(tracks.s1, 6 * MIN)).toBeNull()

  tracks = observe(tracks, planOf(['completed', 'completed', 'pending']).steps, 7 * MIN)
  expect(tracks.s3).toMatchObject({ status: 'pending', startedAt: null })
})

test('re-entering in progress keeps the first start', () => {
  let tracks = observe({}, planOf(['in_progress']).steps, MIN)
  tracks = observe(tracks, planOf(['in_progress']).steps, 5 * MIN)

  expect(tracks.s1?.startedAt).toBe(MIN)
})

test('progress counts done steps plus partial credit, marked as an estimate', () => {
  expect(progressOf(planOf(['completed', 'completed', 'completed', 'in_progress', 'pending', 'pending', 'pending', 'pending']))).toEqual({
    done: 3, total: 8, percent: 44, isEstimate: true,
  })
  expect(headline(planOf(['completed', 'pending']))).toBe('Plan · 1/2 adım · %50')
  expect(headline(planOf(['completed', 'in_progress', 'pending']))).toBe('Plan · 1/3 adım · ~%50')
})

test('ETA shows only once three finished steps have measured times', () => {
  const plan = planOf(['completed', 'completed', 'in_progress', 'pending', 'pending'])
  let tracks = observe({}, planOf(['in_progress', 'pending', 'pending', 'pending', 'pending']).steps, 0)
  tracks = observe(tracks, planOf(['completed', 'in_progress', 'pending', 'pending', 'pending']).steps, 2 * MIN)
  tracks = observe(tracks, plan.steps, 6 * MIN)
  expect(etaOf(plan, tracks)).toBeNull()

  const later = planOf(['completed', 'completed', 'completed', 'in_progress', 'pending'])
  tracks = observe(tracks, later.steps, 9 * MIN)
  // Steps took 2, 4 and 3 minutes: 3 on average, two steps left.
  expect(etaOf(later, tracks)).toBe(6 * MIN)
})

test('ETA ignores finished steps whose start was never seen', () => {
  const plan = planOf(['completed', 'completed', 'completed', 'pending'])
  const tracks = observe({}, plan.steps, 0)

  expect(etaOf(plan, tracks)).toBeNull()
})

test('durations read short and Turkish', () => {
  expect(formatDuration(12_000)).toBe('12sn')
  expect(formatDuration(12 * MIN)).toBe('12dk')
  expect(formatDuration(60 * MIN)).toBe('1sa')
  expect(formatDuration(95 * MIN)).toBe('1sa 35dk')
})

test('the current step is the one begun last; the anchor falls back to the next open step', () => {
  const plan = planOf(['completed', 'in_progress', 'in_progress', 'pending'])
  const tracks: Tracks = observe(observe({}, planOf(['completed', 'in_progress', 'pending', 'pending']).steps, 0), plan.steps, MIN)

  expect(currentIndex(plan.steps, tracks)).toBe(2)
  expect(anchorIndex(planOf(['completed', 'pending']).steps, {})).toBe(1)
  expect(anchorIndex(planOf(['completed', 'completed']).steps, {})).toBe(1)
})

test('the window keeps the anchor in view with a little done above it', () => {
  expect(windowOf(5, 3, 10)).toEqual({ start: 0, end: 5 })
  expect(windowOf(30, 20, 10)).toEqual({ start: 18, end: 26 })
  expect(windowOf(30, 29, 10)).toEqual({ start: 22, end: 30 })
  expect(windowOf(30, 0, 10)).toEqual({ start: 0, end: 8 })
})

test('the status line names the current step, says done when done, and is empty with no plan', () => {
  const plan: Plan = { steps: [step('a', 'completed'), { ...step('b', 'in_progress'), title: 'Markdown ayrıştırıcısını ve onay planı desteğini yaz' }], source: 'x' }
  const tracks = observe({}, plan.steps, 0)

  expect(statusText(plan, tracks)).toBe('plan 1/2 · Markdown ayrıştırıcısını ve onay…')
  expect(statusText(planOf(['completed', 'completed']), {})).toBe('plan 2/2 · tamam')
  expect(statusText(planOf(['completed', 'pending']), {})).toBe('plan 1/2')
  expect(statusText(null, {})).toBeUndefined()
})

test('the current step lists its files, newest first, and its agents', () => {
  expect(filesText(['hooks/a.ts', 'hooks/b.ts', 'tests/c.test.ts'])).toBe('3 dosya: c.test.ts, b.ts +1')
  const track = {
    status: 'in_progress' as const, startedAt: 0, finishedAt: null, files: ['src/x.ts'],
    agents: [{ key: '1', description: 'Testleri yaz', isRunning: true, agentId: 'a1' }, { key: '2', description: 'Tara', isRunning: false, agentId: 'a2' }],
  }

  expect(detailLines({ ...step('s', 'in_progress'), checksDone: 2, checksTotal: 5 }, track)).toEqual({
    summary: '2/5 madde · 1 dosya: x.ts · 1 ajan bitti',
    agents: ['Testleri yaz'],
  })
})

test('in English, durations, counts and the headline read short and plural', () => {
  setLang('en')
  try {
    expect(formatDuration(12_000)).toBe('12s')
    expect(formatDuration(95 * MIN)).toBe('1h 35m')
    expect(headline(planOf(['completed', 'in_progress', 'pending']))).toBe('Plan · 1/3 steps · ≈50%')
    expect(filesText(['src/x.ts'])).toBe('1 file: x.ts')
    expect(statusText(planOf(['completed', 'completed']), {})).toBe('plan 2/2 · done')
  } finally {
    setLang('tr')
  }
})
