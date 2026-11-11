import { expect, test } from 'claude-code/testing'

import { begin, sentTo, spy, step, stub, turn, worldOf } from './stubs'

// A route belongs to the one prompt it was judged for; a short follow-up inside a task is never lowered; and a
// lowered turn says so where the person looks, with a way to send it again at their own setting.
const AUTO = { options: { mode: 'auto' }, plugins: [spy] }

test('a notification, a scheduled prompt or a peer after a light prompt runs at the person\'s own effort', AUTO, async ($: any, on: any) => {
  const world = worldOf({ reply: 'light' })
  stub(on, world)
  await begin($)
  await turn($, { text: 'What does this regex match?', turnId: 'light' })
  for (const origin of ['task-notification', 'scheduled-trigger', 'peer']) await turn($, { text: `from ${origin}`, turnId: origin, origin })
  await step($, { turnId: 'continuation', effort: 'high' })

  expect(sentTo(world, 'light')).toEqual(['low'])
  expect(['task-notification', 'scheduled-trigger', 'peer', 'continuation'].map(id => sentTo(world, id)[0])).toEqual(['high', 'high', 'high', 'high'])
})

test('a short follow-up inside a task is never lowered, and asks no judge', AUTO, async ($: any, on: any) => {
  const world = worldOf({ reply: 'normal' })
  stub(on, world)
  await begin($)
  await turn($, { text: 'Migrate the config loader to the new schema and update its callers', turnId: 'task' })
  world.reply = 'light'
  await turn($, { text: 'fix it', turnId: 'fix' })
  await turn($, { text: 'now do the other 12 files', turnId: 'more' })

  expect(world.judged).toHaveLength(1)
  expect([sentTo(world, 'fix')[0], sentTo(world, 'more')[0]]).toEqual(['high', 'high'])
})

const band = { plugin: 'effort-router', component: 'AbovePrompt', requestId: 'band', surface: 'terminal', viewport: { columns: 100, rows: 30 },
  props: { hasSurvey: false, isWorking: false, maxRows: 5, bodyColumns: 100, scroll: { offset: 0, bodyRows: 5 }, view: {} } } as const

test('a lowered turn says so above the prompt, and the button sends it again at the person\'s effort', AUTO, async ($: any, on: any) => {
  const world = worldOf({ reply: 'light' })
  stub(on, world)
  on('ui.render', () => ({ type: 'Text', props: {}, children: ['theirs'] }))
  await begin($)
  await turn($, { text: 'What does this regex match?', turnId: 'light' })
  const ui = await $.ui.mount(band)
  expect(await ui.find({ type: 'Text', text: /Sent at low thinking \(yours: high\)/ })).toBeDefined()

  await ui.press({ key: 'effort-router:resend' })
  await $.turn.start({ text: 'What does this regex match?', turnId: 'again' })
  await step($, { turnId: 'again', effort: 'high' })

  expect(sentTo(world, 'again')).toEqual(['high'])
  expect(await ui.find({ type: 'Text', text: /Sent at low thinking/ })).toBeUndefined()
})
