import { expect, test } from 'claude-code/testing'

import { HEARTBEAT_MS } from '../hooks/chats'
import { isOwnOpen } from '../hooks/hub'
import { SECOND, finish, setup, spawn, tool } from './fixtures'

// The MODZ data path (DESIGN.md §9): the hub card this mod keeps, and the hub's open request.

const TASKS = [1, 2, 3, 4].map(n => ({ title: `Task ${n}`, tier: 'medium' }))

// A stand-in for the MODZ hub: it reads this mod's card and writes the open request, as the hub does.
const HUB_STAND_IN = {
  name: 'modz',
  register(on: any) {
    on('command.run', { command: 'hub-card' }, async ($: any) => {
      const read = await $.state.get({ plugin: 'savvy-progress', key: 'hub' })
      return { text: JSON.stringify(read) }
    })
    on('command.run', { command: 'hub-open' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'open' }, { pane: e.args, at: Date.now() })
      return { text: 'ok' }
    })
    on('command.run', { command: 'hub-on' }, async ($: any) => {
      await $.state.set({ plugin: 'modz', key: 'isOn' }, true)
      return { text: 'ok' }
    })
    on('command.run', { command: 'hub-stage' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'stage' }, { pane: e.args, at: Date.now() })
      return { text: 'ok' }
    })
  },
}
const WITH_HUB = { plugins: [HUB_STAND_IN] }

const reading = async ($: any) => JSON.parse((await $.command.run({ command: 'hub-card', args: '' })).text)
const card = async ($: any) => (await reading($)).value
const openFromHub = ($: any, pane: string) => $.command.run({ command: 'hub-open', args: pane })
const stageFromHub = ($: any, pane: string) => $.command.run({ command: 'hub-stage', args: pane })

test('the card stands from session start: idle, nothing to say', WITH_HUB, async ($, on) => {
  await setup($, on)
  expect(await card($)).toMatchObject({ pane: 'agents', detail: '', tone: 'idle' })
})

test('a reported flow reads "Görevler 3/4 · 2 ajan" while two agents run, then Bitti', WITH_HUB, async ($, on) => {
  await setup($, on)
  await tool($, { tool: 'mcp__savvy-progress__progress', title: 'Launch kit', tasks: TASKS, phase: 'delegate' })
  await spawn($, 'Task 3')
  await spawn($, 'Task 4')
  await tool($, { tool: 'mcp__savvy-progress__progress', done: 2 })
  expect(await card($)).toMatchObject({ detail: 'Görevler 2/4 · 2 ajan', tone: 'live' })
  await finish($, 'a1')
  await tool($, { tool: 'mcp__savvy-progress__progress', done: 3 })
  expect(await card($)).toMatchObject({ detail: 'Görevler 3/4 · 1 ajan', tone: 'live' })
  await finish($, 'a2')
  await tool($, { tool: 'mcp__savvy-progress__progress', done: 4, finished: true })
  expect(await card($)).toMatchObject({ detail: 'Bitti', tone: 'ok' })
})

test('a job that ended with a failure turns the card amber', WITH_HUB, async ($, on) => {
  await setup($, on)
  await spawn($, 'One')
  await finish($, 'a1', 'error')
  expect(await card($)).toMatchObject({ detail: 'Bitti · 1 hata', tone: 'warn' })
})

test('the card is not written again while what it says holds', WITH_HUB, async ($, on) => {
  const { clock } = await setup($, on)
  await spawn($, 'One')
  const before = await reading($)
  await clock.advance(5 * SECOND)
  await tool($, { tool: 'Read', file_path: '/w/a.ts', agentId: 'a1' })
  const after = await reading($)
  expect(after.version).toBe(before.version)
  expect(after.value).toEqual(before.value)
})

test("the hub's open request opens the Ajanlar pane, and only for its own key", WITH_HUB, async ($, on) => {
  const { world } = await setup($, on)
  await openFromHub($, 'files')
  expect(world.opened).toEqual([])
  await openFromHub($, 'agents')
  await openFromHub($, 'agents')
  // Open, never toggle: a second request leaves it open.
  expect(world.opened).toEqual(['savvy-agents', 'savvy-agents'])
  expect(world.closed).toEqual([])
})

test('with the hub on the opened pane reports itself shown, and steps aside when another pane takes the panel', WITH_HUB, async ($, on) => {
  const shown: unknown[] = []
  on('state.set', { plugin: 'savvy-progress', key: 'shown' }, (_: any, e: any, next: any) => (shown.push(e.value?.pane), next(e)))
  const { world } = await setup($, on)
  await openFromHub($, 'agents')
  // The hub is off: nothing to step aside for.
  expect(shown).toEqual([])
  await $.command.run({ command: 'hub-on', args: '' })
  await openFromHub($, 'agents')
  expect(shown).toEqual(['agents'])
  await stageFromHub($, 'agents')
  expect(world.closed).toEqual([])
  await stageFromHub($, 'files')
  expect(world.closed).toEqual(['savvy-agents'])
})

const waitingElsewhere = (at: number) => ({ project: 'shop', title: 'Fix checkout', state: 'waiting', since: 0, at })

test('a chat elsewhere adds itself to the card while it waits or works, and leaves once idle', WITH_HUB, async ($, on) => {
  const { world, clock } = await setup($, on, { store: { 'sessions/S2': waitingElsewhere(0) } })
  expect(await card($)).toMatchObject({ detail: '1 sohbet bekliyor', tone: 'idle' })
  world.store.set('sessions/S2', { ...waitingElsewhere(HEARTBEAT_MS), state: 'working' })
  await clock.advance(HEARTBEAT_MS)
  expect(await card($)).toMatchObject({ detail: '1 sohbet çalışıyor', tone: 'live' })
  world.store.set('sessions/S2', { ...waitingElsewhere(2 * HEARTBEAT_MS), state: 'idle' })
  await clock.advance(HEARTBEAT_MS)
  expect(await card($)).toMatchObject({ detail: '', tone: 'idle' })
})

test('beside a job the waiting chats keep their words and the card stays within 40 characters', WITH_HUB, async ($, on) => {
  await setup($, on, { store: { 'sessions/S2': waitingElsewhere(0), 'sessions/S3': waitingElsewhere(0) } })
  await tool($, { tool: 'mcp__savvy-progress__progress', title: 'Launch kit', tasks: TASKS, phase: 'delegate' })
  await spawn($, 'Task 3')
  await spawn($, 'Task 4')
  await tool($, { tool: 'mcp__savvy-progress__progress', done: 2 })
  const { detail } = await card($)
  expect(detail).toBe('Görevler 2/4 · 2 sohbet bekliyor')
  expect(detail.length).toBeLessThanOrEqual(40)
})

test('only a request naming "agents" is ours', () => {
  expect(isOwnOpen({ pane: 'agents', at: 1 })).toBe(true)
  expect(isOwnOpen({ pane: 'progress', at: 1 })).toBe(false)
  expect(isOwnOpen(undefined)).toBe(false)
  expect(isOwnOpen('agents')).toBe(false)
})
