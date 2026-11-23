import { expect, mock, test } from 'claude-code/testing'

// The Tests page the MODZ hub draws in its own pane: /test-badge details asks the hub for it, the hub's stage closes
// this mod's own pane, and a press on the page (modz.act) does what the pane's own button does.

const VITEST_FAIL = ' FAIL  src/a.test.ts > a > b\nAssertionError: x\n ❯ src/a.test.ts:4:2\n Tests  1 failed | 41 passed (42)'
const pkg = JSON.stringify({ scripts: { test: 'vitest run' } })
const result = (stdout: string, exitCode: number) => ({ value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })

// Stands for a hub that draws the Tests page itself: it says so, stages pages, hands presses on, and hears `home`.
const modz = {
  name: 'modz',
  register(on: any) {
    const heard: unknown[] = []
    on('command.run', { command: 'hub-draws' }, async ($: any) => {
      await $.state.set({ plugin: 'modz', key: 'isOn' }, true)
      await $.state.set({ plugin: 'modz', key: 'drawn' }, ['plan', 'tests'])

      return {}
    })
    on('command.run', { command: 'hub-stage' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'stage' }, { pane: e.args, at: 1 })

      return {}
    })
    on('command.run', { command: 'hub-act' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'act' }, { page: 'tests', ...JSON.parse(e.args), at: 1 })

      return {}
    })
    on('state.set', { key: 'home' }, async (_: any, e: any, next: any) => (heard.push(e.value), next(e)))
    on('command.run', { command: 'hub-heard' }, async () => ({ text: JSON.stringify(heard) }))
    // Spelled out: the engine admits a state read by literal plugin and key only.
    on('command.run', { command: 'tb-badge' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'test-badge', key: 'badge' })).value ?? null) }))
    on('command.run', { command: 'tb-filter' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'test-badge', key: 'filter' })).value ?? null) }))
  },
}

const run = async ($: any, command: string, args = '') => (await $.command.run({ command, args })).text

async function start($: any, on: any) {
  const world = { opened: [] as string[], closed: [] as string[], runs: [] as string[] }
  const clock = mock.clock(on)
  mock.env(on, { MODZ_LANG: 'tr' })
  for (const name of ['store.get', 'store.set', 'command.register', 'ui.log', 'ui.status', 'ui.toast']) on(name, () => ({ value: undefined }))
  on('prompt.suggest', () => ({ isShown: false }))
  on('ui.open', (_: any, e: any) => (world.opened.push(e.id), { value: { isPlaced: true } }))
  on('ui.close', (_: any, e: any) => (world.closed.push(e.id), { value: undefined }))
  on('session.start', () => ({ cwd: '/w' }))
  on('session.cwd', () => ({ value: '/w' }))
  on('fs.list', (_: any, e: any) => ({ value: e.path === '/w' ? [{ name: 'package.json', kind: 'file', size: 10 }] : [] }))
  on('fs.read', () => ({ value: pkg }))
  on('fs.exists', () => ({ value: false }))
  // The CI watch's version-control probe is not a check this page runs.
  on('process.run', async (_: any, e: any) => (e.argv[0] === 'git' ? result('', 1) : (world.runs.push(e.argv.join(' ')), result(VITEST_FAIL, e.argv[0] === 'code' ? 0 : 1))))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/w' })
  await run($, 'hub-draws')

  return { clock, world }
}

const press = async ($: any, clock: any, action: object) => (await run($, 'hub-act', JSON.stringify(action)), await clock.advance(1))

test('/test-badge details asks a hub that draws the page for it, and opens no pane of its own', { plugins: [modz] }, async ($: any, on: any) => {
  const { clock, world } = await start($, on)
  await run($, 'test-badge', 'details')
  await clock.advance(1)

  expect(world.opened).toEqual([])
  expect(JSON.parse(await run($, 'hub-heard'))).toEqual([{ pane: 'tests', at: expect.any(Number) }])
})

test('the hub staging the Tests page closes this mod\'s own pane', { plugins: [modz] }, async ($: any, on: any) => {
  const { world } = await start($, on)
  await run($, 'hub-stage', 'tests')

  expect(world.closed).toEqual(['test-badge'])
})

test('presses on the hub\'s page: rerun runs the checks, a chip filters, a failure opens at its line', { plugins: [modz] }, async ($: any, on: any) => {
  const { clock, world } = await start($, on)
  await press($, clock, { action: 'rerun' })
  // The run goes on in its own dispatch: a few ticks let it finish.
  for (let tick = 0; tick < 20 && JSON.parse(await run($, 'tb-badge'))?.finishedAt == null; tick++) await clock.advance(1)
  expect(world.runs.some(line => line.includes('test'))).toBe(true)
  expect(JSON.parse(await run($, 'tb-badge')).finishedAt).not.toBeNull()

  await press($, clock, { action: 'filter', arg: 'unit' })
  expect(JSON.parse(await run($, 'tb-filter'))).toBe('unit')

  world.runs.length = 0
  await press($, clock, { action: 'open', arg: JSON.stringify([0, 'desktop']) })
  expect(world.runs).toEqual(['code -g /w/src/a.test.ts:4'])
})

test('a press for another page, a failure nobody keeps, or a filter that does not exist does nothing', { plugins: [modz] }, async ($: any, on: any) => {
  const { clock, world } = await start($, on)
  await press($, clock, { page: 'plan', action: 'rerun' })
  await press($, clock, { action: 'open', arg: JSON.stringify([5, 'desktop']) })
  await press($, clock, { action: 'filter', arg: '/etc' })

  expect(world.runs).toEqual([])
  expect(JSON.parse(await run($, 'tb-filter'))).toBeNull()
})
