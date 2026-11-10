// The hub's "Now" area: what fails, waits or runs is read on the hub itself, without opening a mod's pane.
import { expect, mock, test } from 'claude-code/testing'

import { cardOf, rowsOf } from '../hooks/hub'
import { elapsedText, nowOf } from '../hooks/now'
import { setLang } from '../hooks/kit/lang'
import type { HubCard } from '../types'
import { stubWorld } from './world'

const PANE = { plugin: 'modz', component: 'Pane', requestId: 'modz', viewport: { columns: 100, rows: 40 }, props: { bodyColumns: 50 } } as const
const MINUTE = 60_000
const START = 10 * MINUTE

// Stand-ins for the mods that report to the hub; each spells its own state reference, as the engine requires.
const reporters = [
  {
    name: 'savvy-progress',
    register(on: any) {
      on('command.run', { command: 'agents' }, async ($: any, e: any, next: any) => {
        await $.state.set({ plugin: 'savvy-progress', key: 'hub' }, JSON.parse(e.args))

        return next(e)
      })
    },
  },
  {
    name: 'plan-steps',
    register(on: any) {
      on('command.run', { command: 'plan' }, async ($: any, e: any, next: any) => {
        await $.state.set({ plugin: 'plan-steps', key: 'hub' }, JSON.parse(e.args))

        return next(e)
      })
    },
  },
  {
    name: 'test-badge',
    register(on: any) {
      on('command.run', { command: 'tests' }, async ($: any, e: any, next: any) => {
        await $.state.set({ plugin: 'test-badge', key: 'hub' }, JSON.parse(e.args))

        return next(e)
      })
    },
  },
  {
    name: 'hud-pro',
    register(on: any) {
      on('command.run', { command: 'usage' }, async ($: any, e: any, next: any) => {
        await $.state.set({ plugin: 'hud-pro', key: 'hub' }, JSON.parse(e.args))

        return next(e)
      })
    },
  },
]

const agents = (since: number): HubCard => ({
  pane: 'agents', detail: '5 ajan', tone: 'live', at: 1,
  live: { lines: [{ label: 'auth akışını incele', since, value: '$0,31' }, { label: 'testleri yaz', since }, { label: 'hub dosyasını böl', since }], more: 2 },
})
const plan: HubCard = { pane: 'plan', detail: '3/9 adım', tone: 'live', at: 1, live: { lines: [{ label: 'register dosyasını böl' }] } }
const tests: HubCard = { pane: 'tests', detail: '41/42 geçti', tone: 'bad', at: 1 }
const usage: HubCard = { pane: 'usage', detail: '5 saat %44 · 7 gün %17', tone: 'idle', at: 1 }

const say = ($: any, command: string, card: HubCard) => $.command.run({ command, args: JSON.stringify(card) })

async function busyHub($: any, on: any, surface: 'desktop' | 'terminal') {
  stubWorld(on, { hasOwnClock: true })
  const clock = mock.clock(on, { now: START })
  await $.session.start({ surface, isInteractive: true, cwd: '/work' })
  await say($, 'agents', agents(START - 4 * MINUTE))
  await say($, 'plan', plan)
  await say($, 'tests', tests)
  await say($, 'usage', usage)

  return { clock, ui: await $.ui.mount({ ...PANE, surface }) }
}

const alts = async (ui: any): Promise<string[]> => (await ui.findAll({ type: 'Svg' })).map((svg: any) => String(svg.props.alt))

test('a card keeps its live lines when they are well formed, four at most, and drops the rest', () => {
  const lines = [{ label: 'a', since: 5, value: '$1' }, { label: '' }, 'x', { label: 'b', since: 'soon' }, { label: 'c' }, { label: 'd' }, { label: 'e' }]
  const card = cardOf({ pane: 'agents', detail: '', tone: 'live', at: 1, live: { lines, more: 2 } })

  expect(card?.live).toEqual({ lines: [{ label: 'a', since: 5, value: '$1' }, { label: 'b' }, { label: 'c' }, { label: 'd' }], more: 2 })
  expect(cardOf({ pane: 'agents', detail: '', tone: 'live', at: 1, live: { lines: [] } })?.live).toBeUndefined()
  expect(cardOf({ pane: 'agents', detail: '', tone: 'live', at: 1, live: 'busy' })?.live).toBeUndefined()
})

test('a running time is told as short as a glance needs', () => {
  setLang(undefined)

  expect([4_000, 47_000, 4 * MINUTE + 30_000, 65 * MINUTE].map(elapsedText)).toEqual(['now', '40s', '4m', '1h 05m'])
})

test('what fails leads, then what waits, then what runs, then the usage; a quiet row stays below', () => {
  setLang(undefined)
  const held: HubCard = { pane: 'checkpoints', detail: 'snapshot failed', tone: 'warn', at: 1 }
  const quiet: HubCard = { pane: 'skins', detail: 'tidemark', tone: 'idle', at: 1 }
  const rows = rowsOf({ 'savvy-progress': agents(START - 4 * MINUTE), 'test-badge': tests, checkpoint: held, 'hud-pro': usage, skins: quiet, 'plan-steps': plan }, () => 'listed')
  const now = nowOf(rows, START)

  expect(now.map(item => item.row.entry.pane)).toEqual(['tests', 'checkpoints', 'agents', 'plan', 'usage'])
  expect(now[2]?.lines).toEqual([{ label: 'auth akışını incele', value: '4m · $0,31' }, { label: 'testleri yaz', value: '4m' }, { label: 'hub dosyasını böl', value: '4m' }])
  expect(now[2]?.more).toBe(2)
  expect(now[3]?.lines).toEqual([{ label: 'register dosyasını böl', value: '' }])
})

test('desktop: the hub itself shows each running agent, the plan step, the failure and the usage', { plugins: reporters }, async ($: any, on: any) => {
  const { ui } = await busyHub($, on, 'desktop')
  const seen = await alts(ui)

  expect(seen).toContain('auth akışını incele: 4 dk · $0,31')
  expect(seen).toContain('testleri yaz: 4 dk')
  expect(seen).toContain('+2 tane daha')
  expect(seen).toContain('register dosyasını böl')
  // The failure is the first row under "Şu an", and a lifted row says its value once, not again in its section.
  expect(seen.slice(1, 3)).toEqual(['Şu an', 'Testler: 41/42 geçti'])
  expect(seen.filter(alt => /41\/42 geçti/.test(alt))).toHaveLength(1)
  expect(seen.filter(alt => /%44/.test(alt))).toHaveLength(1)
  expect(seen).toContain('Testler')
})

test('desktop: a press on a live line opens its mod\'s pane for the detail', { plugins: reporters }, async ($: any, on: any) => {
  const asked: unknown[] = []
  on('state.set', { plugin: 'modz', key: 'open' }, (_: unknown, e: any, next: any) => {
    asked.push(e.value?.pane)

    return next(e)
  })
  const { ui } = await busyHub($, on, 'desktop')

  await ui.press({ key: 'now-open-agents-1' })
  await ui.press({ key: 'now-open-plan' })

  expect(asked).toEqual(['agents', 'plan'])
})

test('terminal: the same lines are read as text under "Şu an"', { plugins: reporters }, async ($: any, on: any) => {
  const { ui } = await busyHub($, on, 'terminal')

  for (const text of [/^Şu an$/, /auth akışını incele/, /4 dk · \$0,31/, /\+2 tane daha/, /register dosyasını böl/]) expect(await ui.find({ type: 'Text', text })).toBeDefined()
  expect(await ui.findAll({ type: 'Text', text: /41\/42 geçti/ })).toHaveLength(1)
})

test('a running time moves on the hub\'s own beat without one state write; with none running nothing is drawn again', { plugins: reporters }, async ($: any, on: any) => {
  const { seen } = stubWorld(on, { hasOwnClock: true })
  const clock = mock.clock(on, { now: START })
  let writes = 0
  on('state.set', (_: unknown, e: any, next: any) => {
    writes++

    return next(e)
  })
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await say($, 'usage', usage)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const [quietDraws, quietWrites] = [seen.draws, writes]
  await clock.advance(2 * MINUTE)
  expect([seen.draws, writes]).toEqual([quietDraws, quietWrites])

  await say($, 'agents', agents(START + 2 * MINUTE))
  expect(await alts(ui)).toContain('testleri yaz: şimdi')
  const [busyDraws, busyWrites] = [seen.draws, writes]
  await clock.advance(3 * MINUTE)

  expect(seen.draws).toBeGreaterThan(busyDraws)
  expect(await alts(ui)).toContain('testleri yaz: 3 dk')
  expect(writes).toBe(busyWrites)

  // Behind a mod's pane the hub tells nothing, so the beat draws nothing.
  await ui.press({ key: 'open-modz-mods' })
  const awayDraws = seen.draws
  await clock.advance(2 * MINUTE)
  expect(seen.draws).toBe(awayDraws)
  await $.command.run({ command: 'modz', args: '' })

  // The agents are done: the card comes without lines and the beat stops.
  await say($, 'agents', { pane: 'agents', detail: '', tone: 'idle', at: 2 })
  expect(await alts(ui)).not.toContain('testleri yaz: 3 dk')
  const restDraws = seen.draws
  await clock.advance(2 * MINUTE)
  expect(seen.draws).toBe(restDraws)
})

test('with only the hub installed it says so and leads to the install lines', async ($: any, on: any) => {
  const world = stubWorld(on, { enabled: ['modz'] })
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  expect(await ui.find({ type: 'Text', text: /Yalnızca ana panel kurulu/ })).toBeDefined()
  await ui.press({ key: 'add-mods' })
  expect(world.up).toEqual(['modz-mods'])
})
