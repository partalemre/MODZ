// A hub press never vanishes: a row whose mod does not put its pane up says so and the hub stays; a hub whose
// drawing throws still lists its rows, pressable under the keys they had; and one odd character in a mod's card
// (an escape sequence out of a command's output) does not cost the whole hub.
import { expect, mock, test } from 'claude-code/testing'

import { stubWorld } from './world'

const PANE = { plugin: 'modz', component: 'Pane', requestId: 'modz', surface: 'desktop', props: {}, viewport: { columns: 100, rows: 40 } } as const
const ANSWER_MS = 1_500

// A mod that reports a row and never opens anything.
const mute = {
  name: 'mute',
  register(on: any) {
    on('command.run', { command: 'report' }, async ($: any) => {
      await $.state.set({ plugin: 'mute', key: 'hub' }, { pane: 'mute', detail: 'ready', tone: 'idle', at: 1, title: 'Mute', section: 'meter' })

      return { text: '' }
    })
  },
}
// A mod that opens its pane as soon as it is asked.
const guest = {
  name: 'guest',
  register(on: any) {
    on('state.set', { plugin: 'modz', key: 'open' }, async ($: any, e: any, next: any) => {
      const done = await next(e)
      if (e.value.pane === 'guest') {
        await $.ui.open({ id: 'guest', title: 'Guest' })
        await $.state.set({ plugin: 'guest', key: 'shown' }, { pane: 'guest', at: 1 })
      }

      return done
    })
    on('command.run', { command: 'report' }, async ($: any) => {
      await $.state.set({ plugin: 'guest', key: 'hub' }, { pane: 'guest', detail: 'run \u001b[31mfailed\u001b[0m', tone: 'bad', at: 1, title: 'Guest', section: 'meter' })

      return { text: '' }
    })
  },
}
// A mod with no pane of its own: what it holds is answered on its card above the prompt.
const band = {
  name: 'band',
  register(on: any) {
    on('command.run', { command: 'report' }, async ($: any, e: any) => {
      const isClear = e.args === 'clear'
      await $.state.set({ plugin: 'band', key: 'hub' }, { pane: 'band', detail: isClear ? '' : 'rm -rf build is waiting', tone: isClear ? 'idle' : 'warn', at: 1, title: 'Band', section: 'safety', isBandOnly: true })

      return { text: '' }
    })
  },
}
// An arrangement the drawing cannot read, so the hub's drawing throws.
const layoutBreaker = {
  name: 'layout-breaker',
  register(on: any) {
    on('state.set', { plugin: 'modz', key: 'layout' }, ($: any, e: any, next: any) => next({ ...e, value: 5 }))
  },
}

async function hubWith($: any, on: any, surface: 'desktop' | 'terminal' = 'desktop') {
  const world = stubWorld(on, { hasOwnClock: true, env: {} })
  const clock = mock.clock(on)
  await $.session.start({ surface, isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'report', args: '' })

  return { world, clock, ui: await $.ui.mount({ ...PANE, surface }) }
}

const drawnText = async (ui: any): Promise<string> => JSON.stringify(await ui.drawn())

for (const surface of ['desktop', 'terminal'] as const) {
  test(`${surface}: a row whose mod does not answer leaves the hub up and says the pane did not open`, { plugins: [mute] }, async ($: any, on: any) => {
    const { world, clock, ui } = await hubWith($, on, surface)
    await ui.press({ key: 'open-mute' })
    expect(await drawnText(ui)).not.toContain('did not answer')

    await clock.advance(ANSWER_MS)
    expect(world.up).toEqual(['modz'])
    expect(await drawnText(ui)).toContain('did not answer')
  })

  test(`${surface}: a row whose mod answers swaps the panel and leaves no such word behind`, { plugins: [guest] }, async ($: any, on: any) => {
    const { world, clock, ui } = await hubWith($, on, surface)
    await ui.press({ key: 'open-guest' })
    await clock.advance(ANSWER_MS)
    expect(world.up).toEqual(['guest'])

    await $.command.run({ command: 'modz', args: '' })
    expect(await drawnText(ui)).not.toContain('did not answer')
  })

  test(`${surface}: a mod with no pane has a row only while it says something, and a press points to the prompt`, { plugins: [band] }, async ($: any, on: any) => {
    const toasts: string[] = []
    on('ui.toast', (_: any, e: any) => (toasts.push(e.text), { value: undefined }))
    const { world, clock, ui } = await hubWith($, on, surface)
    expect(await drawnText(ui)).toContain('rm -rf build is waiting')

    await ui.press({ key: 'open-band' })
    await clock.advance(ANSWER_MS)
    expect(world.up).toEqual(['modz'])
    expect(await drawnText(ui)).not.toContain('did not answer')
    expect(toasts).toEqual(['Band has no pane: its question is waiting by the prompt.'])

    await $.command.run({ command: 'report', args: 'clear' })
    expect(await drawnText(ui)).not.toContain('Band')
  })

  test(`${surface}: a hub whose drawing throws still lists its rows, and a row pressed there opens its pane`, { plugins: [guest, layoutBreaker] }, async ($: any, on: any) => {
    const { world, ui } = await hubWith($, on, surface)
    expect(await drawnText(ui)).toContain('plain view')
    expect(await ui.find({ key: 'open-guest' })).toBeDefined()

    await ui.press({ key: 'open-guest' })
    expect(world.up).toEqual(['guest'])
  })

  test(`${surface}: an escape sequence in a mod's card does not cost the hub`, { plugins: [guest] }, async ($: any, on: any) => {
    const { ui } = await hubWith($, on, surface)
    const drawn = await drawnText(ui)
    expect(drawn).toContain('failed')
    expect(drawn).not.toMatch(/\\u001b/i)
  })
}
