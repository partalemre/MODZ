import { expect, test } from 'claude-code/testing'

import { planState, stateNote } from '../hooks/freshness'
import { replayDesk } from '../hooks/tasks'

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
