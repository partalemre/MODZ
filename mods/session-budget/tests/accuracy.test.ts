import { expect, mock, test } from 'claude-code/testing'

import { advance, raise, spentOf, spendText, startBudget } from '../hooks/budget'
import { setLang } from '../hooks/lang'

// Accounts whose readings carry `seven_day` but never `five_hour`, notices that wait their turn,
// reset times that move a few seconds, and dollars on a subscription.

const RESETS = '2026-11-12T14:00:00.000Z'
const reading = (percent: number, resetsAt = RESETS, usd: number | null = null) => ({ percent, resetsAt, usd })

type World = { asked: string[]; answer: string; submitted: string[] }

async function setup($: any, on: any, world: World) {
  const clock = mock.clock(on)
  mock.env(on, {})
  on('session.start', () => ({ cwd: '/w' }))
  on('session.usage', () => ({ value: { startedAt: 0, context: {}, rateLimits: [{ kind: 'seven_day', percentUsed: 30, resetsAt: RESETS }], cost: { usd: 1 } } }))
  on('session.measure', (_: any, e: any) => ({ changed: e.changed }))
  on('session.surfaces', () => ({ value: ['terminal'] }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('command.register', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('ui.render', () => ({ type: 'engine', ref: 1 }))
  on('prompt.submit', (_: any, e: any) => {
    world.submitted.push(e.text)

    return { text: e.text }
  })
  on('tool.call', (_: any, e: any) => {
    if (e.tool !== 'AskUserQuestion') return { result: 'done' }
    const question = e.questions[0].question
    world.asked.push(question)

    return { result: { answers: { [question]: world.answer } } }
  })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })

  return clock
}

const weekly = ($: any, percentUsed: number, usd = 1) =>
  $.session.measure({ context: {}, rateLimits: [{ kind: 'seven_day', percentUsed, resetsAt: RESETS }], cost: { usd }, changed: ['rateLimits'] })
const band = {
  plugin: 'session-budget', component: 'AbovePrompt', requestId: 'band', surface: 'terminal', viewport: { columns: 120, rows: 40 },
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120, scroll: { offset: 0, bodyRows: 10 }, view: {} },
} as const

test('without a five_hour reading /budget 20% counts the weekly window and says so', async ($: any, on: any) => {
  const world: World = { asked: [], answer: 'Stop', submitted: [] }
  await setup($, on, world)
  expect(await $.command.run({ command: 'budget', args: '20%' })).toMatchObject({ text: 'Session budget set: 20% of the weekly usage allowance.' })
  await weekly($, 36)
  expect(await $.command.run({ command: 'budget', args: 'status' })).toMatchObject({ text: 'Session budget: weekly 6% / 20% (30%)' })
})

test('without a five_hour reading the spawn brake reads the weekly window', async ($: any, on: any) => {
  const world: World = { asked: [], answer: 'Stop', submitted: [] }
  await setup($, on, world)
  await weekly($, 90)
  await $.tool.call({ tool: 'Agent', description: 'one', prompt: 'look', subagent_type: 'Explore' })
  expect(world.asked[0]).toMatch(/^weekly usage allowance 90% used/)
})

// A stand-in for reflect whose notice owns the line for the first 30 seconds.
const LOUDER = {
  name: 'reflect',
  register(on: any) {
    on('session.start', async ($: any, e: any, next: any) => {
      const expiresAt = (await $.clock.now()) + 30_000
      await $.state.set({ plugin: 'reflect', key: 'notice' }, { id: 1, text: 'rule', priority: 2, expiresAt })

      return next(e)
    })
  },
}

test('the 80% warning waits while a louder notice owns the line, then shows', { plugins: [LOUDER] }, async ($: any, on: any) => {
  const world: World = { asked: [], answer: 'Stop', submitted: [] }
  const clock = await setup($, on, world)
  await $.command.run({ command: 'budget', args: '10%' })
  await weekly($, 38.5)
  expect(JSON.stringify(await (await $.ui.mount(band)).drawn())).not.toContain('Budget')
  await clock.advance(31_000)
  expect(JSON.stringify(await (await $.ui.mount({ ...band, requestId: 'band-2' })).drawn())).toContain('Budget 85%')
})

test('a reset time that moves a few seconds is the same window, not a reset', () => {
  let budget = startBudget('percent', 10, reading(30))
  budget = advance(budget, reading(34, '2026-11-12T14:00:07.000Z'))
  budget = advance(budget, reading(35, '2026-11-12T14:00:00Z'))
  expect(spentOf(budget)).toBe(5)
  budget = advance(budget, reading(2, '2026-11-19T15:00:00.000Z'))
  expect(spentOf(budget)).toBe(7)
})

test('on a subscription dollars are a list-price estimate; going on raises a share, not $1', () => {
  setLang('en')
  const subscribed = advance(startBudget('usd', 20, reading(30, RESETS, 0)), reading(31, RESETS, 21))
  expect(spendText(subscribed)).toBe('$21.00 / $20.00 at list price')
  expect(raise(subscribed).limit).toBe(25)
  const api = advance(startBudget('usd', 20, { percent: null, resetsAt: null, usd: 0 }), { percent: null, resetsAt: null, usd: 21 })
  expect(spendText(api)).toBe('$21.00 / $20.00')
})
