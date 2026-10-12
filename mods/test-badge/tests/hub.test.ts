import { expect, mock, test } from 'claude-code/testing'

import { hubOf } from '../hooks/hub'
import { setLang } from '../hooks/lang'

const VITEST_FAIL = ' FAIL  src/a.test.ts > a > b\nAssertionError: x\n ❯ src/a.test.ts:4:2\n Tests  1 failed | 41 passed (42)'
const ESLINT_FAIL = "/w/src/u.ts\n   3:7  error  'x' is unused  no-unused-vars\n   9:1  error  Unexpected any  no-explicit-any\n✖ 2 problems (2 errors, 0 warnings)"
const PASS = ' Tests  42 passed (42)'
const pkg = JSON.stringify({ scripts: { test: 'vitest run', lint: 'eslint .' } })
const result = (stdout: string, exitCode: number) => ({ value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })

type World = { opened: string[]; test: string; lint: string; code: number; hold?: Promise<void> }

// Stands for the MODZ main panel: it writes open requests and reads the cards, as `modz` does.
const modz = {
  name: 'modz',
  register(on: any) {
    on('command.run', { command: 'modz-open' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'open' }, { pane: e.args, at: 1 })

      return {}
    })
    on('command.run', { command: 'modz-hub' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'test-badge', key: 'hub' })).value ?? null) }))
  },
}

async function setup($: any, on: any, world: World) {
  const clock = mock.clock(on)
  mock.env(on, { MODZ_LANG: 'tr' })
  for (const name of ['store.get', 'store.set', 'command.register', 'ui.log', 'ui.status', 'ui.toast']) on(name, () => ({ value: undefined }))
  on('ui.open', (_: any, e: any) => (world.opened.push(e.id), { value: { isPlaced: true } }))
  on('session.start', () => ({ cwd: '/w' }))
  on('session.cwd', () => ({ value: '/w' }))
  on('fs.list', () => ({ value: [{ name: 'package.json', kind: 'file', size: 10 }] }))
  on('fs.read', () => ({ value: pkg }))
  on('fs.exists', () => ({ value: false }))
  on('tool.call', () => ({ result: 'ok' }))
  on('turn.complete', (_: any, e: any) => ({ text: e.answer }))
  on('process.run', async (_: any, e: any) => {
    await world.hold
    const isLint = e.argv.at(-1) === 'lint'

    return result(isLint ? world.lint : world.test, isLint && world.lint === '' ? 0 : world.code)
  })
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/w' })

  return clock
}

async function editAndWait($: any, clock: any) {
  await $.tool.call({ tool: 'Edit', file_path: '/w/src/a.ts', old_string: 'a', new_string: 'b' })
  await $.turn.complete({ answer: 'ok', durationMs: 1, isAborted: false, turnId: 't', reason: 'answer' })
  await clock.advance(5_500)
}

const cardOf = async ($: any) => JSON.parse((await $.command.run({ command: 'modz-hub', args: '' })).text)

test('the hub card is idle before a run, live while one goes, then says what failed', { plugins: [modz] }, async ($: any, on: any) => {
  let release = () => {}
  const world: World = { opened: [], test: VITEST_FAIL, lint: ESLINT_FAIL, code: 1 }
  world.hold = new Promise<void>(resolve => { release = resolve })
  const clock = await setup($, on, world)
  expect(await cardOf($)).toMatchObject({ pane: 'tests', detail: '', tone: 'idle' })

  await editAndWait($, clock)
  expect(await cardOf($)).toMatchObject({ detail: 'çalışıyor', tone: 'live' })

  world.hold = undefined
  release()
  await clock.advance(1)
  expect(await cardOf($)).toMatchObject({ detail: '41/42 geçti · lint 2 hata', tone: 'bad' })
})

test('a green run reads 42/42 geçti; an unchanged card is not written again', { plugins: [modz] }, async ($: any, on: any) => {
  const world: World = { opened: [], test: PASS, lint: '', code: 0 }
  const clock = await setup($, on, world)
  await editAndWait($, clock)
  const first = await cardOf($)
  expect(first).toMatchObject({ detail: '42/42 geçti', tone: 'ok' })

  await clock.advance(60_000)
  await $.command.run({ command: 'test-badge', args: 'off' })
  expect((await cardOf($)).at).toBe(first.at)
})

test('a MODZ open request for tests opens the details pane; one for another pane does not', { plugins: [modz] }, async ($: any, on: any) => {
  const world: World = { opened: [], test: PASS, lint: '', code: 0 }
  await setup($, on, world)
  await $.command.run({ command: 'modz-open', args: 'plan' })
  expect(world.opened).toEqual([])

  await $.command.run({ command: 'modz-open', args: 'tests' })
  expect(world.opened).toEqual(['test-badge'])
})

test('a check that could not run is a warning, not a failure', () => {
  setLang('tr')
  const timedOut = { status: 'timeout' as const, passed: null, total: null, errors: null, failures: [], tail: [] }
  const badge = { tests: timedOut, lint: null, root: '/w', finishedAt: 1, durationMs: 1, isRunning: false }

  expect(hubOf(badge)).toEqual({ detail: 'test zaman aşımı', tone: 'warn' })
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: with no run yet the pane says so in one sentence and offers to run`, async ($: any, on: any) => {
    on('ui.render', () => ({ type: 'engine', ref: 1 }))
    await setup($, on, { opened: [], test: PASS, lint: '', code: 0 })
    const pane = await $.ui.mount({
      plugin: 'test-badge', component: 'Pane', requestId: 'test-badge', surface, viewport: { columns: 60, rows: 30 },
      props: { title: 'Testler', isFocused: true, bodyColumns: 52, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
    })
    const sentence = 'Henüz test koşusu yok · kaynak dosya değişince kendiliğinden çalışır'
    if (surface === 'desktop') expect((await pane.find({ type: 'Svg' }))?.props?.alt).toBe(`Testler: ${sentence}`)
    else expect((await pane.find({ key: 'tb-empty' }))?.text).toBe(sentence)
    expect((await pane.find({ key: 'tb-rerun' }))?.props?.label).toBe('Şimdi çalıştır')
  })
}
