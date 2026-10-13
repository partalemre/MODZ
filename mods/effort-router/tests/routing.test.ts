import { expect, test } from 'claude-code/testing'

import { begin, sentTo, spy, stateOf, step, stub, turn, worldOf } from './stubs'

// What reaches the engine per mode: `show` sees and spends nothing, `auto` lowers only a light prompt's turn,
// and nothing is ever raised or touched in a subagent's loop.
const AUTO = { options: { mode: 'auto' }, plugins: [spy] }
const SHOW = { plugins: [spy] }

test('show mode records each turn\'s effort and model and makes no model call', SHOW, async ($: any, on: any) => {
  const world = worldOf({ reply: 'light' })
  stub(on, world)
  await begin($)
  await turn($, { text: 'Rename foo to bar', turnId: 't1', effort: 'high' })
  await turn($, { text: 'Plan the auth rewrite', turnId: 't2', effort: 'medium' })

  expect(world.judged).toEqual([])
  expect(sentTo(world, 't1')).toEqual(['high'])
  const turns = await stateOf($, 'turns')
  expect(turns.map((t: any) => [t.turnId, t.sent, t.asked, t.model, t.cls])).toEqual([
    ['t2', 'medium', 'medium', 'claude-opus-5-5', null],
    ['t1', 'high', 'high', 'claude-opus-5-5', null],
  ])
  expect(turns[1].snippet).toBe('Rename foo to bar')
})

test('auto: a light prompt\'s main-loop steps go at low; normal and deep keep the session\'s effort', AUTO, async ($: any, on: any) => {
  const world = worldOf({ reply: 'light' })
  stub(on, world)
  await begin($)
  await turn($, { text: 'What does this regex match?', turnId: 'light', effort: 'high' })
  await step($, { turnId: 'light', effort: 'high', index: 1 })
  world.reply = 'normal'
  await turn($, { text: 'Add a retry to the fetch client', turnId: 'normal', effort: 'high' })
  world.reply = 'deep'
  await turn($, { text: 'Find why the cache corrupts under load', turnId: 'deep', effort: 'high' })

  expect(sentTo(world, 'light')).toEqual(['low', 'low'])
  expect(sentTo(world, 'normal')).toEqual(['high'])
  expect(sentTo(world, 'deep')).toEqual(['high'])
  expect(world.judged).toHaveLength(3)
  expect(world.judged.every(call => call.model === 'haiku')).toBe(true)
  const rows = await stateOf($, 'turns')
  expect(rows.map((t: any) => [t.turnId, t.cls, t.asked, t.sent])).toEqual([
    ['deep', 'deep', 'high', 'high'],
    ['normal', 'normal', 'high', 'high'],
    ['light', 'light', 'high', 'low'],
  ])
})

test('auto never raises an effort: low stays low, deep keeps medium, a budget or no effort is left alone', AUTO, async ($: any, on: any) => {
  const world = worldOf({ reply: 'light' })
  stub(on, world)
  await begin($)
  await turn($, { text: 'Fix the typo in the README', turnId: 'low', effort: 'low' })
  await turn($, { text: 'Fix the other typo in the README', turnId: 'budget', effort: 4096 })
  await $.prompt.submit({ text: 'And the third typo', wait: false, origin: { kind: 'composer' } })
  await $.turn.start({ text: 'And the third typo', turnId: 'none' })
  await step($, { turnId: 'none' })
  world.reply = 'deep'
  await turn($, { text: 'Redesign the storage layer', turnId: 'deep', effort: 'medium' })

  expect(sentTo(world, 'low')).toEqual(['low'])
  expect(sentTo(world, 'budget')).toEqual([4096])
  expect(sentTo(world, 'none')).toEqual([undefined])
  expect(sentTo(world, 'deep')).toEqual(['medium'])
})

test('a subagent\'s steps go on as they came and are not listed, even under a light prompt', AUTO, async ($: any, on: any) => {
  const world = worldOf({ reply: 'light' })
  stub(on, world)
  await begin($)
  await turn($, { text: 'Look up where the config is read', turnId: 't1', effort: 'high' })
  await step($, { turnId: 't1', effort: 'xhigh', agentId: 'a1' })

  expect(world.sent.filter(s => s.agentId === 'a1').map(s => s.effort)).toEqual(['xhigh'])
  expect((await stateOf($, 'turns')).map((t: any) => t.sent)).toEqual(['low'])
})

test('slash commands, follow-ups in both languages and non-person prompts ask no judge and keep the last routing', AUTO, async ($: any, on: any) => {
  const world = worldOf({ reply: 'light' })
  stub(on, world)
  await begin($)
  await turn($, { text: 'Rename the helper', turnId: 't0' })
  world.reply = 'deep'
  const skipped = ['/compact', 'yes', 'Go on.', 'devam et', 'Tamam!', 'a task finished']
  for (const [i, text] of skipped.entries()) {
    await turn($, { text, turnId: `s${i}`, origin: i === skipped.length - 1 ? 'task-notification' : 'composer' })
  }

  expect(world.judged).toHaveLength(1)
  expect(skipped.map((_, i) => sentTo(world, `s${i}`)[0])).toEqual(skipped.map(() => 'low'))
})

test('a prompt delivered into a running turn asks no judge', AUTO, async ($: any, on: any) => {
  const world = worldOf({ reply: 'light' })
  stub(on, world)
  await begin($)
  await $.prompt.submit({ text: 'Also update the changelog please', wait: false, origin: { kind: 'composer' }, turnId: 'running' })

  expect(world.judged).toEqual([])
})

test('a failed judge, or one naming no class, leaves the effort as the session set it', AUTO, async ($: any, on: any) => {
  const world = worldOf({ isRefused: true })
  stub(on, world)
  await begin($)
  await turn($, { text: 'Rename the helper', turnId: 'refused', effort: 'high' })
  world.isRefused = false
  world.reply = 'I think this is quite simple'
  await turn($, { text: 'Rename the other helper', turnId: 'rambled', effort: 'high' })

  expect(sentTo(world, 'refused')).toEqual(['high'])
  expect(sentTo(world, 'rambled')).toEqual(['high'])
  expect((await stateOf($, 'turns')).map((t: any) => t.cls)).toEqual([null, null])
  expect(world.judged).toHaveLength(2)
})

test('the judge reads the prompt masked and cut short', AUTO, async ($: any, on: any) => {
  const world = worldOf({ reply: 'normal' })
  stub(on, world)
  await begin($)
  const key = ['sk', 'ant', 'abcdefghijklmnopqrstuvwxyz0123456789'].join('-')
  await turn($, { text: `Use API_KEY=${key} and ${'x '.repeat(3000)}`, turnId: 't1' })

  const asked = world.judged[0]?.prompt ?? ''
  expect(asked).not.toContain(key)
  expect(asked).toContain('API_KEY=****')
  expect(asked.length).toBeLessThan(2100)
  expect(JSON.stringify(await stateOf($, 'turns'))).not.toContain(key)
})

test('off: nothing judged, listed or changed', { options: { mode: 'off' }, plugins: [spy] }, async ($: any, on: any) => {
  const world = worldOf({ reply: 'light' })
  stub(on, world)
  await begin($)
  await turn($, { text: 'Rename the helper', turnId: 't1', effort: 'high' })

  expect(world.judged).toEqual([])
  expect(sentTo(world, 't1')).toEqual(['high'])
  expect((await stateOf($, 'turns')) ?? []).toEqual([])
})
