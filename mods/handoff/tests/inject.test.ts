import { expect, test } from 'claude-code/testing'

import { COMPOSE, MINUTE, hubCardOf, measure, modz, newWorld, paneOf, said, start, stub } from './stubs'

// The note reaches the system prompt of one fresh conversation in the repo, from its first request on, and no other.

const SECTION = 'handoff:note'
const idsOf = async ($: any) => (await $.prompt.compose(COMPOSE)).sections.map((section: any) => section.id)
const DAY_MINUTES = 24 * 60

async function written($: any, on: any, world: any) {
  stub(on, world)
  await start($, 'terminal')
  await $.command.run({ command: 'handoff', args: '' })
}

test('the conversation that wrote the note never gets it', async ($: any, on: any) => {
  const world = newWorld({ messages: [said('user', 'go'), said('assistant', 'done')] })
  await written($, on, world)

  expect(await idsOf($)).not.toContain(SECTION)
})

test('the next fresh conversation gets it once, and keeps it for each of its requests', async ($: any, on: any) => {
  const world = newWorld({ messages: [said('user', 'go'), said('assistant', 'done')] })
  await written($, on, world)
  world.sessionId = 's2'
  world.messages = [said('user', 'carry on')]

  const sections = (await $.prompt.compose(COMPOSE)).sections
  expect(sections.map((section: any) => section.id)).toEqual(['intro', SECTION])
  expect(sections[1].scope).toBe('session')
  expect(sections[1].text).toContain('# Handoff ·')
  expect((world.store['latest:/w'] as any).consumedBy).toBe('s2')

  world.messages = [said('user', 'carry on'), said('assistant', 'ok')]
  expect(await idsOf($)).toContain(SECTION)

  world.sessionId = 's3'
  world.messages = []
  expect(await idsOf($)).not.toContain(SECTION)
})

test('a conversation already under way does not take it', async ($: any, on: any) => {
  const world = newWorld()
  await written($, on, world)
  world.sessionId = 's2'
  world.messages = [said('user', 'hi'), said('assistant', 'hello')]

  expect(await idsOf($)).not.toContain(SECTION)
  expect((world.store['latest:/w'] as any).consumedBy).toBe(null)
})

test('a note switched off in the pane is not handed on', async ($: any, on: any) => {
  const world = newWorld()
  await written($, on, world)
  const pane = await $.ui.mount(paneOf('terminal'))
  await pane.press({ key: 'handoff-toggle' })
  world.sessionId = 's2'

  expect(await idsOf($)).not.toContain(SECTION)
  expect((world.store['latest:/w'] as any).isInjectOn).toBe(false)
})

test('the hub line says a note is ready until a conversation takes it', { plugins: [modz] }, async ($: any, on: any) => {
  const world = newWorld()
  await written($, on, world)
  await measure($, 42)
  const card = await hubCardOf($)

  expect(card).toMatchObject({ pane: 'handoff', detail: 'Context 42% · note ready', tone: 'ok', title: 'Handoff', icon: 'flag', section: 'meter' })
  expect(card.detail.length).toBeLessThanOrEqual(40)

  world.sessionId = 's2'
  world.messages = []
  await idsOf($)
  expect((await hubCardOf($)).detail).toBe('Context 42%')
})

test('a stale note is skipped', async ($: any, on: any) => {
  const world = newWorld()
  const clock = stub(on, world)
  await start($, 'terminal')
  await $.command.run({ command: 'handoff', args: '' })
  await clock.advance((DAY_MINUTES + 1) * MINUTE)
  world.sessionId = 's2'

  expect(await idsOf($)).not.toContain(SECTION)
})
