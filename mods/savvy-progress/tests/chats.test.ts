import { expect, test } from 'claude-code/testing'

import { HEARTBEAT_MS, STALE_MS, TITLE_MAX, isHeartbeat, scanOf, titleOf } from '../hooks/chats'
import { SECOND, mainEnd, mainStart, setup, tool } from './fixtures'

// Other chats on this machine: each session's heartbeat in the shared store, who waits on the
// person, and the gone pruned. The store stands for the machine: a test writes the others' keys.

const MINUTE = 60 * SECOND
const OWN = 'sessions/S1'
const beat = (over: Record<string, unknown> = {}) => ({ project: 'shop', title: 'Fix checkout', state: 'idle', since: 0, at: 0, ...over })
// A stand-in that reads what this mod keeps for the pane, as the pane does.
const READER = {
  name: 'reader',
  register(on: any) {
    on('command.run', { command: 'read-chats' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'savvy-progress', key: 'chats' })).value) }))
  },
}
const WITH_READER = { plugins: [READER] }
const chatsOf = async ($: any) => JSON.parse((await $.command.run({ command: 'read-chats', args: '' })).text)

test('a session writes its heartbeat under its own key at start: its project, idle, no title yet', async ($, on) => {
  const { world } = await setup($, on)
  expect(world.store.get(OWN)).toEqual({ project: 'w', title: '', state: 'idle', since: 0, at: 0 })
})

test('the first prompt names the chat; a turn makes it working and its end idle again', async ($, on) => {
  const { world, clock } = await setup($, on)
  await clock.advance(5 * SECOND)
  await mainStart($, '\n  Fix the hub row   in the panel\nand more')
  expect(world.store.get(OWN)).toMatchObject({ title: 'Fix the hub row in the panel', state: 'working', since: 5 * SECOND })
  await mainEnd($)
  await mainStart($, 'Something else', 'main-2')
  expect(world.store.get(OWN)).toMatchObject({ title: 'Fix the hub row in the panel', state: 'working' })
  await mainEnd($, 'answer', 'main-2')
  expect(world.store.get(OWN)).toMatchObject({ state: 'idle' })
})

test('the heartbeat is written again only when it changes, and on each beat', async ($, on) => {
  const { world, clock } = await setup($, on)
  await clock.advance(10 * SECOND)
  await tool($, { tool: 'Read', file_path: '/w/a.ts' })
  expect(world.store.get(OWN)).toMatchObject({ at: 0 })
  await clock.advance(HEARTBEAT_MS - 10 * SECOND)
  expect(world.store.get(OWN)).toMatchObject({ at: HEARTBEAT_MS, state: 'idle' })
})

test('a permission ask makes the chat wait until the turn is over', async ($, on) => {
  const { world, clock } = await setup($, on, { ask: ['Bash'] })
  await mainStart($, 'Deploy')
  await clock.advance(MINUTE)
  await $.tool.check({ tool: 'Bash', input: { command: 'npm publish' }, tool_use_id: 'u1' })
  expect(world.store.get(OWN)).toMatchObject({ state: 'waiting', since: MINUTE })
  await $.tool.check({ tool: 'Read', input: { file_path: '/w/a.ts' }, tool_use_id: 'u2' })
  expect(world.store.get(OWN)).toMatchObject({ state: 'waiting' })
  await mainEnd($)
  expect(world.store.get(OWN)).toMatchObject({ state: 'idle' })
})

test('a permission ask stops waiting once its call has resolved', async ($, on) => {
  const { world } = await setup($, on, { ask: ['Bash'] })
  await mainStart($, 'Deploy')
  await $.tool.check({ tool: 'Bash', input: { command: 'npm publish' }, tool_use_id: 'u1' })
  expect(world.store.get(OWN)).toMatchObject({ state: 'waiting' })
  await tool($, { tool: 'Bash', command: 'npm publish', tool_use_id: 'u1' })
  expect(world.store.get(OWN)).toMatchObject({ state: 'working' })
})

test('an open question waits while it is asked and not after the answer', async ($, on) => {
  let during: unknown
  // The dialog stands where the engine would draw it: beneath the plugin, while the call is open.
  on('tool.call', { tool: 'AskUserQuestion' }, () => {
    during = world.store.get(OWN)
    return { result: { answers: {} } }
  })
  const { world } = await setup($, on)
  await mainStart($, 'Pick a name')
  await tool($, { tool: 'AskUserQuestion', questions: [{ question: 'Which?', header: 'Name', options: [{ label: 'A', description: '' }, { label: 'B', description: '' }], multiSelect: false }] })
  expect(during).toMatchObject({ state: 'waiting' })
  expect(world.store.get(OWN)).toMatchObject({ state: 'working' })
})

test('the others are read back on the beat; the gone and the unreadable are pruned', WITH_READER, async ($, on) => {
  const store = {
    'sessions/S2': beat({ state: 'waiting' }),
    'sessions/S3': beat({ at: -STALE_MS - 1 }),
    'sessions/S4': 'not a heartbeat',
    'crab/turns': 4,
  }
  const { world, clock } = await setup($, on, { store })
  expect(await chatsOf($)).toEqual([{ id: 'S2', project: 'shop', title: 'Fix checkout', state: 'waiting', minutes: 0 }])
  expect([...world.store.keys()].sort()).toEqual(['crab/turns', 'sessions/S1', 'sessions/S2'])
  world.store.set('sessions/S5', beat({ project: 'blog', state: 'working', at: 3 * MINUTE }))
  world.store.set('sessions/S2', beat({ state: 'waiting', at: 3 * MINUTE }))
  await clock.advance(3 * MINUTE)
  expect(await chatsOf($)).toEqual([
    { id: 'S2', project: 'shop', title: 'Fix checkout', state: 'waiting', minutes: 3 },
    { id: 'S5', project: 'blog', title: 'Fix checkout', state: 'working', minutes: 3 },
  ])
})

test('a session that stopped beating drops off after the stale age', WITH_READER, async ($, on) => {
  const { world, clock } = await setup($, on, { store: { 'sessions/S2': beat() } })
  expect(await chatsOf($)).toHaveLength(1)
  await clock.advance(STALE_MS + HEARTBEAT_MS)
  expect(await chatsOf($)).toEqual([])
  expect(world.store.has('sessions/S2')).toBe(false)
  expect(world.store.has(OWN)).toBe(true)
})

test('session end removes its own key and writes it no more', async ($, on) => {
  const { world, clock } = await setup($, on)
  await $.session.end({ reason: 'prompt_input_exit', sessionId: 'S1', resume: { id: 'S1' } })
  expect(world.store.has(OWN)).toBe(false)
  await clock.advance(2 * HEARTBEAT_MS)
  expect(world.store.has(OWN)).toBe(false)
})

// Built at run time: a literal key-like word in this file would itself be taken for a secret.
const KEY_LIKE = ['tok', 'A1b2C3d4E5f6G7h8J9k0'].join('_')

test('a title is the first line, key-like words masked, cut to its length', () => {
  expect(titleOf(`  \n  Use ${KEY_LIKE} for the call`)).toBe('Use ••• for the call')
  expect(titleOf('a'.repeat(60))).toHaveLength(TITLE_MAX)
  expect(titleOf('')).toBe('')
})

test('a heartbeat is read only in its own shape', () => {
  expect(isHeartbeat(beat())).toBe(true)
  expect(isHeartbeat({ ...beat(), state: 'busy' })).toBe(false)
  expect(isHeartbeat({ ...beat(), at: 'now' })).toBe(false)
  expect(isHeartbeat(null)).toBe(false)
})

test('waiting chats come first, the longest wait on top; the own key and other keys are skipped', () => {
  const now = 10 * MINUTE
  const found = scanOf([
    ['sessions/A', beat({ state: 'idle', since: 0, at: now })],
    ['sessions/B', beat({ state: 'waiting', since: 8 * MINUTE, at: now })],
    ['sessions/C', beat({ state: 'waiting', since: 2 * MINUTE, at: now })],
    ['sessions/ME', beat({ state: 'waiting', at: now })],
    ['crab/turns', 3],
  ], 'sessions/ME', now)
  expect(found.chats.map(chat => `${chat.id}:${chat.minutes}`)).toEqual(['C:8', 'B:2', 'A:10'])
  expect(found.gone).toEqual([])
})
