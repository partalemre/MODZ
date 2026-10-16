import { expect, test } from 'claude-code/testing'

import { HEARTBEAT_MS } from '../hooks/chats'
import { REST_MS, TURNS_KEY, ended, levelOf, rested, restingCrab } from '../hooks/mood'
import { BAND, PANE, SURFACES, finish, mainEnd, mainStart, setup, spawn, svgOf } from './fixtures'

// The home crab: asleep until a turn runs, working through it, happy after an answer, worried
// after an error or a stop, asleep again once rested; its level counts answered turns machine-wide.

const READER = {
  name: 'reader',
  register(on: any) {
    on('command.run', { command: 'read-crab' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'savvy-progress', key: 'crab' })).value ?? null) }))
  },
}
const WITH_READER = { plugins: [READER] }
// A crab never written yet is the pane's default: asleep, no turns.
const crabOf = async ($: any) => JSON.parse((await $.command.run({ command: 'read-crab', args: '' })).text ?? 'null') ?? restingCrab(0)

test('levels open at 10, 50, 200 and 1000 answered turns', () => {
  expect([0, 9, 10, 49, 50, 199, 200, 999, 1000, 5000].map(levelOf)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5])
})

test('an answer cheers the crab and counts; anything else worries it; a rest puts it to sleep', () => {
  const happy = ended(restingCrab(3), { reason: 'answer', at: 100 })
  expect(happy).toEqual({ mood: 'happy', turns: 4, endedAt: 100 })
  expect(ended(happy, { reason: 'error', at: 200 })).toEqual({ mood: 'worried', turns: 4, endedAt: 200 })
  expect(rested(happy, 100 + REST_MS - 1).mood).toBe('happy')
  expect(rested(happy, 100 + REST_MS).mood).toBe('sleeping')
  expect(rested({ ...happy, mood: 'working' }, 100 + REST_MS).mood).toBe('working')
})

test('the main loop moves the crab and each answer adds to the shared count', WITH_READER, async ($, on) => {
  const { world, clock } = await setup($, on, { store: { [TURNS_KEY]: 12 } })
  expect(await crabOf($)).toMatchObject({ mood: 'sleeping', turns: 12 })
  await mainStart($, 'Build it')
  expect((await crabOf($)).mood).toBe('working')
  await mainEnd($)
  expect(await crabOf($)).toMatchObject({ mood: 'happy', turns: 13 })
  expect(world.store.get(TURNS_KEY)).toBe(13)
  await mainStart($, 'Again', 'main-2')
  await mainEnd($, 'aborted', 'main-2')
  expect(await crabOf($)).toMatchObject({ mood: 'worried', turns: 13 })
  expect(world.store.get(TURNS_KEY)).toBe(13)
  await clock.advance(REST_MS + HEARTBEAT_MS)
  expect((await crabOf($)).mood).toBe('sleeping')
})

test("a subagent's end leaves the home crab alone", WITH_READER, async ($, on) => {
  const { world } = await setup($, on)
  await spawn($, 'Task 1')
  await finish($, 'a1')
  expect((await crabOf($)).mood).toBe('sleeping')
  expect(world.store.has(TURNS_KEY)).toBe(false)
})

for (const surface of SURFACES) {
  const mount = ($: any) => $.ui.mount({ ...PANE, surface })
  const seen = async (ui: any) => {
    const words = (await ui.findAll({ type: 'Text' })).map((t: any) => t.text ?? '')
    const drawn = surface === 'desktop' ? await svgOf(ui) : ''
    return [...words, drawn].join('\n')
  }

  test(`${surface}: the empty pane's crab sleeps at Lv 1`, async ($, on) => {
    await setup($, on)
    const all = await seen(await mount($))
    expect(all).toContain(surface === 'terminal' ? '(-_-) zz · Sv 1' : 'Pip, uyuyor, Sv 1')
  })

  test(`${surface}: the header's crab shows the mood and the level`, async ($, on) => {
    await setup($, on, { store: { [TURNS_KEY]: 9 } })
    await spawn($, 'Task 1')
    await finish($, 'a1')
    await mainStart($, 'Ship it')
    await mainEnd($)
    const all = await seen(await mount($))
    expect(all).toContain('Sv 2')
    expect(all).toContain(surface === 'terminal' ? '(^_^)' : 'Pip, mutlu, Sv 2')
  })

  const band = ($: any, requestId = 'band') => $.ui.mount({ ...BAND, requestId, surface, props: { ...BAND.props, isWorking: false } })
  const worried = async ($: any, on: any) => {
    await setup($, on)
    await spawn($, 'Task 1')
    await finish($, 'a1')
    await mainStart($, 'Ship it')
    await mainEnd($, 'error')
  }
  // The terminal's face, the desktop's sweat drop: only the home crab draws either.
  const hasHomeCrab = async (ui: any) => (surface === 'terminal' ? (await seen(ui)).includes('(°_°;)') : (await svgOf(ui)).includes('fill="#7FB6E8"'))

  test(`${surface}: the progress row keeps its own crab unless crabInBand is on`, async ($, on) => {
    await worried($, on)
    expect(await hasHomeCrab(await band($))).toBe(false)
  })

  test(`${surface}: with crabInBand the idle progress row shows the home crab, never while a turn runs`, { options: { crabInBand: true } }, async ($, on) => {
    await worried($, on)
    const ui = await band($)
    expect(await hasHomeCrab(ui)).toBe(true)
    expect((await ui.findAll({ type: 'Svg' })).length).toBeLessThanOrEqual(1)
    await mainStart($, 'More', 'main-2')
    expect(await hasHomeCrab(await band($, 'band-2'))).toBe(false)
  })
}
