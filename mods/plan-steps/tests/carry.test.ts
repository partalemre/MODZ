import { expect, test } from 'claude-code/testing'

import { ALL_DONE, carried, clear, compact, HOUR, hub, kept, MIN, modz, seen, START, todos, UNDER_WAY, world } from './world'
import type { Status } from './world'

test('an open plan is kept per project with its steps, and dropped once every step is done', { plugins: [modz] }, async ($: any, on: any) => {
  await world($, on)
  await $.tool.call(UNDER_WAY)
  expect(kept()).toEqual({
    title: 'task list',
    steps: [{ title: 'Write the types', status: 'completed' }, { title: 'Draw the band', status: 'in_progress' }, { title: 'Write the README', status: 'pending' }],
    at: START,
  })

  await seen.clock.advance(5 * MIN)
  await $.tool.call(UNDER_WAY)
  expect(kept().at).toBe(START)

  await $.tool.call(ALL_DONE)
  expect(kept()).toBeUndefined()
})

test('after a compaction the system prompt carries the open steps in one short session section, the same each time', { plugins: [modz] }, async ($: any, on: any) => {
  await world($, on)
  await $.tool.call(UNDER_WAY)
  expect(await carried($)).toBeUndefined()

  await compact($)
  const section = await carried($)
  expect(section.scope).toBe('session')
  expect(section.text).toContain('compacted')
  expect(section.text).toContain('1 of 3 steps done')
  expect(section.text).toContain('- Draw the band (in progress)\n- Write the README')
  expect(section.text).not.toContain('- Write the types')
  expect(section.text.length).toBeLessThanOrEqual(600)

  await seen.clock.advance(MIN)
  await $.tool.call(todos([['Write the types', 'completed'], ['Draw the band', 'completed'], ['Write the README', 'in_progress']]))
  expect((await carried($)).text).toBe(section.text)

  await $.tool.call(ALL_DONE)
  expect(await carried($)).toBeUndefined()
})

test('a compaction of a finished plan, or of none, adds nothing', { plugins: [modz] }, async ($: any, on: any) => {
  await world($, on)
  await compact($)
  expect(await carried($)).toBeUndefined()
  await $.tool.call(ALL_DONE)
  await compact($)
  expect(await carried($)).toBeUndefined()
})

test('a long plan fits the section: as many open steps as fit, then how many more', { plugins: [modz] }, async ($: any, on: any) => {
  await world($, on)
  const long = Array.from({ length: 30 }, (_, k): [string, Status] => [`Step number ${k + 1} with a fairly long title to fill the room`, k === 0 ? 'in_progress' : 'pending'])
  await $.tool.call(todos(long))
  await compact($)
  const { text } = await carried($)
  expect(text.length).toBeLessThanOrEqual(600)
  expect(text).toMatch(/- and \d+ more/)
})

test('a /clear brings the open plan back: the task list, the hub line and the section', { plugins: [modz] }, async ($: any, on: any) => {
  await world($, on)
  await $.tool.call(UNDER_WAY)
  await clear($)
  expect(await hub($)).toBe('1 of 3 steps')
  expect((await carried($)).text).toContain('cleared')
})

test('a /clear with the plan finished brings nothing back', { plugins: [modz] }, async ($: any, on: any) => {
  await world($, on)
  await $.tool.call(ALL_DONE)
  await clear($)
  expect(await hub($)).toBe('')
  expect(await carried($)).toBeUndefined()
})

const seeded = (at: number, status: Status = 'pending') => ({
  plans: { '/w': { title: 'PLAN.md', steps: [{ title: 'Parse', status: 'completed' }, { title: 'Draw', status }], at } },
})

test('a new session in the project gets a young open plan back', { plugins: [modz] }, async ($: any, on: any) => {
  await world($, on, { store: seeded(START - 2 * HOUR) })
  const { text } = await carried($)
  expect(text).toContain('earlier session')
  expect(text).toContain('Plan: PLAN.md, 1 of 2 steps done')
  expect(await hub($)).toBe('1 of 2 steps · waiting')
})

test('a plan older than a day stays out', { plugins: [modz] }, async ($: any, on: any) => {
  await world($, on, { store: seeded(START - 25 * HOUR) })
  expect(await carried($)).toBeUndefined()
})

test('a finished kept plan is not brought back', { plugins: [modz] }, async ($: any, on: any) => {
  await world($, on, { store: seeded(START - HOUR, 'completed') })
  expect(await carried($)).toBeUndefined()
})

test('a resumed conversation already holds its plan, so nothing comes back', { plugins: [modz] }, async ($: any, on: any) => {
  await world($, on, { store: seeded(START - HOUR), turns: 4 })
  expect(await carried($)).toBeUndefined()
  expect(await hub($)).toBe('')
})

test('another project\'s plan older than a day is pruned when this one is kept', { plugins: [modz] }, async ($: any, on: any) => {
  await world($, on, { store: { plans: { '/old': { title: 'PLAN.md', steps: [{ title: 'Parse', status: 'pending' }], at: START - 25 * HOUR } } } })
  await $.tool.call(UNDER_WAY)
  expect(Object.keys(seen.store.plans as object)).toEqual(['/w'])
})

test('the model\'s first new task replaces a task list brought back from disk', { plugins: [modz] }, async ($: any, on: any) => {
  await world($, on, { store: seeded(START - HOUR) })
  await $.tool.call({ tool: 'TaskCreate', subject: 'Something else entirely' })
  expect(await hub($)).toBe('1 step · not started')
})
