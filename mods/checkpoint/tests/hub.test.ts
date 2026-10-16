import { expect, mock, test } from 'claude-code/testing'

import { hubOf, isOpenFor } from '../hooks/hub'
import { setLang } from '../hooks/lang'

// The MODZ main panel's side (DESIGN.md §9): the hub card this mod writes and the open requests it answers.
const NOW_S = 10_000
const MIN_S = 60
const ok = (stdout = '', exitCode = 0) => ({ value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })
const refsOf = (count: number) => Array.from({ length: count }, (_, i) => `refs/checkpoints/s/${i}\tc${i}\t${NOW_S - (3 + i) * MIN_S}\tturn ${i}`).join('\n')

// Stands for the MODZ main panel: it writes open requests and reads the card, as `modz` does.
const modz = {
  name: 'modz',
  register(on: any) {
    on('command.run', { command: 'modz-open' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'open' }, { pane: e.args, at: 1 })

      return {}
    })
    on('command.run', { command: 'modz-on' }, async ($: any) => {
      await $.state.set({ plugin: 'modz', key: 'isOn' }, true)

      return {}
    })
    on('command.run', { command: 'modz-stage' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'stage' }, { pane: e.args, at: 1 })

      return {}
    })
    on('command.run', { command: 'modz-hub' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'checkpoint', key: 'hub' })).value ?? null) }))
  },
}

type World = { isRepo: boolean; refs: string; argv: string[]; opened: any[] }

async function start($: any, on: any, world: World) {
  const clock = mock.clock(on)
  await clock.advance(NOW_S * 1000)
  mock.env(on, { HOME: '/Users/x', MODZ_LANG: 'tr' })
  for (const name of ['ui.log', 'ui.toast', 'store.set', 'store.get', 'command.register']) on(name, () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/w' }))
  on('session.cwd', () => ({ value: '/w' }))
  on('ui.open', (_: any, e: any) => (world.opened.push(e), { value: { isPlaced: true } }))
  on('process.run', (_: any, e: any) => {
    const line = e.argv.join(' ')
    world.argv.push(line)
    if (line.includes('rev-parse --show-toplevel')) return world.isRepo ? ok('/w\n/w/.git\n') : ok('', 128)
    if (line.includes('rev-parse --git-dir')) return ok('', 128)
    if (line.includes('for-each-ref')) return ok(world.refs)

    return ok()
  })
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/w' })
}

const hub = async ($: any) => JSON.parse((await $.command.run({ command: 'modz-hub', args: '' })).text)
const worldOf = (over: Partial<World> = {}): World => ({ isRepo: true, refs: '', argv: [], opened: [], ...over })

test('the hub card counts the checkpoints there at session start, and is rewritten only when it changes', { plugins: [modz] }, async ($: any, on: any) => {
  const world = worldOf({ refs: refsOf(12) })
  await start($, on, world)
  const first = await hub($)
  expect(first).toMatchObject({ pane: 'checkpoints', detail: '12 nokta · son 3 dk önce', tone: 'ok' })

  await $.command.run({ command: 'checkpoints', args: '' })
  expect((await hub($)).at).toBe(first.at)
})

test('with no checkpoints the card is idle and empty, and a folder without a repo gets none made at start', { plugins: [modz] }, async ($: any, on: any) => {
  const world = worldOf({ isRepo: false })
  await start($, on, world)
  expect(await hub($)).toMatchObject({ pane: 'checkpoints', detail: '', tone: 'idle' })
  expect(world.argv.some(line => line.includes('init'))).toBe(false)
})

test('a MODZ open request for checkpoints opens the pane in front; one for another pane does not', { plugins: [modz] }, async ($: any, on: any) => {
  const world = worldOf({ refs: refsOf(2) })
  await start($, on, world)
  await $.command.run({ command: 'modz-open', args: 'tests' })
  expect(world.opened).toEqual([])

  await $.command.run({ command: 'modz-open', args: 'checkpoints' })
  expect(world.opened).toEqual([expect.objectContaining({ id: 'checkpoints', title: 'Kontrol noktaları', focus: true })])
})

test('with the hub on the opened pane reports itself shown, and steps aside when another pane takes the panel', { plugins: [modz] }, async ($: any, on: any) => {
  const shown: unknown[] = []
  const closed: unknown[] = []
  on('state.set', { plugin: 'checkpoint', key: 'shown' }, (_: any, e: any, next: any) => (shown.push(e.value?.pane), next(e)))
  on('ui.close', (_: any, e: any) => (closed.push(e.id), { value: undefined }))
  await start($, on, worldOf({ refs: refsOf(2) }))
  await $.command.run({ command: 'checkpoints', args: '' })
  // The hub is off: nothing to step aside for.
  expect(shown).toEqual([])
  await $.command.run({ command: 'modz-on', args: '' })
  await $.command.run({ command: 'modz-open', args: 'checkpoints' })
  expect(shown).toEqual(['checkpoints'])
  await $.command.run({ command: 'modz-stage', args: 'checkpoints' })
  expect(closed).toEqual([])
  await $.command.run({ command: 'modz-stage', args: 'replay' })
  expect(closed).toEqual(['checkpoints'])
})

test('the card and the open match are pure', () => {
  setLang('tr')
  expect(hubOf([], 0)).toEqual({ detail: '', tone: 'idle' })
  expect(hubOf([{ ref: 'r', commit: 'c', at: 0, label: 'x' }], 45 * 1000)).toEqual({ detail: '1 nokta · son 45 sn önce', tone: 'ok' })
  expect(isOpenFor({ pane: 'checkpoints', at: 1 }, 'checkpoints')).toBe(true)
  expect(isOpenFor({ pane: 'replay' }, 'checkpoints')).toBe(false)
  expect(isOpenFor(null, 'checkpoints')).toBe(false)
})
