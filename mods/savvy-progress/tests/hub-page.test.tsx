import { expect } from 'claude-code/testing'

import { pageActOf, pageHandlers, runPageAct } from '../hooks/page-act'
import { test, PANE, setup, threeRunning } from './fixtures'

// The MODZ hub draws the Agents page in its own pane (modz/hooks/pages/agents.tsx): this mod's own pane stays shut,
// the ways in ask the hub for the page, and a press on the page reaches this mod as `modz.act`.

// Stands for the MODZ hub that draws the page: it says so, records the home values it hears, and hands on a press.
const DRAWING_HUB = {
  name: 'modz',
  register(on: any) {
    const homes: unknown[] = []
    on('command.run', { command: 'hub-draws' }, async ($: any) => {
      await $.state.set({ plugin: 'modz', key: 'isOn' }, true)
      await $.state.set({ plugin: 'modz', key: 'drawn' }, ['plan', 'agents'])
      return {}
    })
    on('state.set', { key: 'home' }, async ($: any, e: any, next: any) => {
      homes.push(e.value)
      return next(e)
    })
    on('command.run', { command: 'heard-home' }, async () => ({ text: JSON.stringify(homes) }))
    on('command.run', { command: 'hub-press' }, async ($: any, e: any) => {
      const [action, arg] = JSON.parse(e.args)
      await $.state.set({ plugin: 'modz', key: 'act' }, { page: 'agents', action, ...(arg === undefined ? {} : { arg }), at: 1 })
      return {}
    })
  },
}
const WITH_HUB = { plugins: [DRAWING_HUB] }

const press = ($: any, action: string, arg?: string) => $.command.run({ command: 'hub-press', args: JSON.stringify([action, arg]) } as never)

test('every press the page hands on comes back as the same handler, the agent and text of a message too', () => {
  const heard: unknown[][] = []
  const acts: [string, string?][] = []
  const page = pageHandlers((action, arg) => void acts.push([action, arg]))
  page.onCompact()
  page.onToggle('a1')
  page.onSend('a1', 'look again')
  const own = new Proxy({}, { get: (_, name) => (...args: unknown[]) => void heard.push([name, ...args]) }) as any

  for (const [action, arg] of acts) expect(runPageAct(own, action, arg)).toBe(true)
  expect(heard).toEqual([['onCompact'], ['onToggle', 'a1'], ['onSend', 'a1', 'look again']])
  expect(runPageAct(own, 'onSend', '"broken"')).toBe(false)
  expect(runPageAct(own, 'onWhatever')).toBe(false)
  expect(pageActOf({ page: 'plan', action: 'onCompact' })).toBeNull()
})

test('with the hub drawing the page, /agents-info asks the hub for it and opens no pane of its own', WITH_HUB, async ($, on) => {
  const { world } = await setup($, on)
  await $.command.run({ command: 'hub-draws', args: '' } as never)
  await $.command.run({ command: 'agents-info', args: '' } as never)
  const heard = JSON.parse((await $.command.run({ command: 'heard-home', args: '' } as never)).text ?? '[]')

  expect(heard.map((home: any) => home.pane)).toEqual(['agents'])
  expect(world.opened).toEqual([])
})

test('a press on the hub\'s page does what the pane\'s own button does', WITH_HUB, async ($, on) => {
  const { clock, world } = await setup($, on)
  await threeRunning($)
  await $.command.run({ command: 'hub-draws', args: '' } as never)

  await press($, 'onCompact')
  await clock.advance(1)
  // This mod's own pane reads the same state: the toggle there now offers to widen again.
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.find({ key: 'compact' }))?.props?.label).toBe('Genişlet')

  await press($, 'onSend', JSON.stringify(['a1', 'look at the footer too']))
  await clock.advance(1)
  expect(world.sent.at(-1)?.text).toBe('look at the footer too')
})
