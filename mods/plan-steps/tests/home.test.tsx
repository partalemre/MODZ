import { expect, mock, test } from 'claude-code/testing'
import type { CommandRunInput } from 'claude-code'

// The Plan pane opens with a "← modz" button while the hub runs; pressing it writes this mod's own `home` value.
// While the hub runs the pane also takes turns in its one panel (kit/stage.ts).

const SURFACES = ['terminal', 'desktop'] as const

// A slash command as the person types it.
const run = (command: string, args = ''): CommandRunInput => ({ command, args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })

// Stands for the MODZ hub: it says it runs, and records the home values it hears.
const modz = {
  name: 'modz',
  register(on: any) {
    const homes: unknown[] = []
    on('command.run', { command: 'hub-on' }, async ($: any) => {
      await $.state.set({ plugin: 'modz', key: 'isOn' }, true)

      return {}
    })
    on('command.run', { command: 'hub-open' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'open' }, { pane: e.args, at: 1 })

      return {}
    })
    on('command.run', { command: 'hub-stage' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'stage' }, { pane: e.args, at: 1 })

      return {}
    })
    on('state.set', { key: 'home' }, async ($: any, e: any, next: any) => {
      homes.push({ from: e.plugin, value: e.value })

      return next(e)
    })
    on('command.run', { command: 'heard-home' }, async () => ({ text: JSON.stringify(homes) }))
  },
}

function paneOf(surface: (typeof SURFACES)[number]) {
  return {
    plugin: 'plan-steps', component: 'Pane', requestId: 'plan-steps', surface,
    viewport: { columns: 160, rows: 40 },
    props: { title: 'Plan', isFocused: false, bodyColumns: 52, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
  } as const
}

async function setup($: any, on: any, options: { isHubOn: boolean }) {
  const clock = mock.clock(on)
  mock.env(on, {})
  for (const name of ['command.register', 'ui.log', 'ui.status']) on(name, () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/w' }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.render', () => ({ type: 'engine', ref: 1 }))
  on('fs.read', () => ({ value: '' }))
  on('tool.call', () => ({ result: 'ok' }))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })
  await $.tool.call({ tool: 'TodoWrite', todos: [{ content: 'Write types', status: 'in_progress', activeForm: 'Writing types' }, { content: 'Parser', status: 'pending', activeForm: 'Parsing' }] })
  if (options.isHubOn) await $.command.run({ command: 'hub-on', args: '' })

  return clock
}

for (const surface of SURFACES) {
  test(`${surface}: with the hub off the Plan pane draws no way back`, { plugins: [modz] }, async ($, on) => {
    await setup($, on, { isHubOn: false })
    const pane = await $.ui.mount(paneOf(surface))

    expect(await pane.find({ key: 'modz-home' })).toBeUndefined()
  })

  test(`${surface}: with the hub on "← modz" comes first, and pressing it writes this mod's home`, { plugins: [modz] }, async ($, on) => {
    const clock = await setup($, on, { isHubOn: true })
    const pane = await $.ui.mount(paneOf(surface))
    const [first] = await pane.findAll({ type: 'Button' })

    expect(first?.props.label).toBe('← modz')
    await pane.press({ key: 'modz-home' })
    const heard = JSON.parse((await $.command.run({ command: 'heard-home', args: '' } as never)).text ?? '[]')

    expect(heard).toEqual([{ from: 'plan-steps', value: { at: await clock.now() } }])
  })
}

test('with the hub on the opened Plan pane reports itself shown, and steps aside when another pane takes the panel', { plugins: [modz] }, async ($, on) => {
  const shown: unknown[] = []
  const closed: unknown[] = []
  on('state.set', { plugin: 'plan-steps', key: 'shown' }, (_: any, e: any, next: any) => (shown.push(e.value?.pane), next(e)))
  on('ui.close', (_: any, e: any) => (closed.push(e.id), { value: undefined }))
  await setup($, on, { isHubOn: false })
  await $.command.run(run('steps'))
  // The hub is off: nothing to step aside for.
  expect(shown).toEqual([])
  await $.command.run(run('hub-on'))
  await $.command.run(run('hub-open', 'plan'))
  expect(shown).toEqual(['plan'])
  await $.command.run(run('hub-stage', 'plan'))
  expect(closed).toEqual([])
  await $.command.run(run('hub-stage', 'tests'))
  expect(closed).toEqual(['plan-steps'])
})
