import { expect, test } from 'claude-code/testing'

import { planState, stateNote } from '../hooks/freshness'
import { replayDesk } from '../hooks/tasks'
import { isTickedUnseen, observe } from '../hooks/progress'

const items = (statuses: string[]) => statuses.map((status, i) => ({ content: `step ${i + 1}`, status }))
const call = (plan: Record<string, unknown>) => ({ isWrapUp: false, plan })

test('the desktop list is rebuilt from its calls, so `advance` never empties a plan the store lost', () => {
  const tasks = replayDesk([call({ items: items(['in_progress', 'pending', 'pending']) }), call({ advance: true }), call({ done: [2], start: 3 })])
  expect(tasks.map(task => task.status)).toEqual(['completed', 'completed', 'in_progress'])
})

test('a wrap-up ticks the list off and a new list replaces it', () => {
  const tasks = replayDesk([call({ items: items(['in_progress', 'pending']) }), { isWrapUp: true, plan: {} }, call({ items: items(['in_progress']) })])
  expect(tasks.map(task => task.status)).toEqual(['in_progress'])
})

test('a plan with a helper at work is not "waiting", and an unknown wait has no made-up age', () => {
  const plan = { source: 'tasks', steps: [{ status: 'completed' }, { status: 'in_progress' }] } as never
  const hour = 60 * 60_000
  expect(planState(plan, { now: hour * 5, touchedAt: hour, isBusy: true })).toBe('live')
  expect(planState(plan, { now: hour * 5, touchedAt: hour })).toBe('stale')
  // A restart leaves the last move unknown: it waits, but no age since 1970 is printed.
  expect(stateNote('stale', { now: hour * 5, touchedAt: -1 })).toBe('waiting')
})

test('a step ticked off without being seen under way is told apart from one that was worked', () => {
  const steps = (statuses: string[]) => statuses.map((status, i) => ({ key: `s${i}`, status })) as never
  let tracks = observe({}, steps(['in_progress', 'pending', 'pending']), 0)
  tracks = observe(tracks, steps(['completed', 'in_progress', 'pending']), 60_000)
  tracks = observe(tracks, steps(['completed', 'completed', 'completed']), 120_000)
  expect(isTickedUnseen(tracks.s0)).toBe(false)
  expect(isTickedUnseen(tracks.s1)).toBe(false)
  expect(isTickedUnseen(tracks.s2)).toBe(true)
  // A plan first seen already done says nothing either way.
  expect(isTickedUnseen(observe({}, steps(['completed']), 0).s0)).toBe(false)
})
