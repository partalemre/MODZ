import { mock, test } from 'claude-code/testing'

import { failed, newGh, passed, pending, setupCi } from './ci-world'

/** The test runner's console: bin/preview reads the trees it prints. */
declare const console: { log: (text: string) => void }

// Draws each state on the desktop for bin/preview, once per pinned theme.
const VITEST = [
  ' FAIL  src/auth/login.test.ts > login > rejects an expired token 14ms',
  'AssertionError: expected 200 to be 401',
  ' ❯ src/auth/login.test.ts:42:22',
  ' FAIL  src/auth/login.test.ts > login > refreshes a token 9ms',
  "TypeError: Cannot read properties of undefined (reading 'exp')",
  ' ❯ src/auth/login.test.ts:61:9',
  ' FAIL  e2e/checkout.spec.ts > pays with a saved card 2310ms',
  'Error: Timed out 5000ms waiting for expect(locator).toBeVisible()',
  ' ❯ e2e/checkout.spec.ts:18:5',
  ' Tests  3 failed | 39 passed (42)',
].join('\n')
const ESLINT = ['/w/src/api/user.ts', "   3:7  error  'x' is assigned a value but never used  no-unused-vars", '   9:1  error  Unexpected any  @typescript-eslint/no-explicit-any', '✖ 2 problems (2 errors, 0 warnings)'].join('\n')
const PASS = ' Tests  42 passed (42)'
const pkg = JSON.stringify({ scripts: { test: 'vitest run', lint: 'eslint .' } })
const result = (stdout: string, exitCode: number) => ({ value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })
// About 400 px (the desktop's right pane) and 600 px.
const WIDTHS = { narrow: 52, wide: 84 }
const bandOf = { plugin: 'test-badge', component: 'AbovePrompt', requestId: 'band', surface: 'desktop', viewport: { columns: 110, rows: 40 }, props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100, scroll: { offset: 0, bodyRows: 10 }, view: {} } }
const paneOf = (bodyColumns: number) => ({ plugin: 'test-badge', component: 'Pane', requestId: 'test-badge', surface: 'desktop', viewport: { columns: 110, rows: 40 }, props: { title: 'Testler', isFocused: true, bodyColumns, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} } })
const narrowBand = { ...bandOf, requestId: 'band-narrow', props: { ...bandOf.props, bodyColumns: WIDTHS.narrow } }

type Run = { test: string; lint: string; code: number; hold?: Promise<void> }

async function setup($: any, on: any, spec: { theme: string; run: Run; isIdle?: boolean }) {
  const clock = mock.clock(on)
  mock.env(on, { MODZ_THEME: spec.theme, MODZ_LANG: 'tr' })
  for (const name of ['store.get', 'store.set', 'command.register', 'ui.log', 'ui.status', 'ui.toast', 'ui.open']) on(name, () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/w' }))
  on('session.cwd', () => ({ value: '/w' }))
  on('ui.render', () => ({ type: 'Box', props: {}, children: [] }))
  on('fs.list', () => ({ value: [{ name: 'package.json', kind: 'file', size: 10 }] }))
  on('fs.read', () => ({ value: pkg }))
  on('fs.exists', () => ({ value: false }))
  on('tool.call', () => ({ result: 'ok' }))
  on('turn.complete', (_: any, e: any) => ({ text: e.answer }))
  on('process.run', async (_: any, e: any) => {
    await spec.run.hold
    const isLint = e.argv.at(-1) === 'lint'

    return result(isLint ? spec.run.lint : spec.run.test, isLint && spec.run.lint === '' ? 0 : spec.run.code)
  })
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/w' })
  if (spec.isIdle === true) return
  await $.tool.call({ tool: 'Edit', file_path: '/w/src/a.ts', old_string: 'a', new_string: 'b' })
  await $.turn.complete({ answer: 'ok', durationMs: 1, isAborted: false, turnId: 't', reason: 'answer' })
  await clock.advance(5_500)
  await clock.advance(4_000)
}

const dump = async (label: string, ui: any) => console.log(`@@TREE@@${label}@@${JSON.stringify(await ui.drawn())}`)

async function dumpPanes($: any, label: string) {
  for (const [name, columns] of Object.entries(WIDTHS)) {
    const pane = await $.ui.mount(paneOf(columns))
    await dump(`${label}-${name}`, pane)
    await pane.unmount()
  }
}

for (const theme of ['dark', 'light']) {
  test(`preview ${theme}: failing band and details pane`, async ($: any, on: any) => {
    await setup($, on, { theme, run: { test: VITEST, lint: ESLINT, code: 1 } })
    await dump(`band-fail-${theme}`, await $.ui.mount(bandOf))
    await dump(`band-fail-narrow-${theme}`, await $.ui.mount(narrowBand))
    await dumpPanes($, `pane-fail-${theme}`)
  })

  test(`preview ${theme}: passing band`, async ($: any, on: any) => {
    await setup($, on, { theme, run: { test: PASS, lint: ESLINT, code: 0 } })
    await dump(`band-pass-${theme}`, await $.ui.mount(bandOf))
    await dumpPanes($, `pane-pass-${theme}`)
  })

  test(`preview ${theme}: no run yet`, async ($: any, on: any) => {
    await setup($, on, { theme, run: { test: PASS, lint: '', code: 0 }, isIdle: true })
    await dumpPanes($, `pane-empty-${theme}`)
  })

  test(`preview ${theme}: running band and details pane`, async ($: any, on: any) => {
    await setup($, on, { theme, run: { test: PASS, lint: '', code: 0, hold: new Promise<void>(() => undefined) } })
    await dump(`band-running-${theme}`, await $.ui.mount(bandOf))
    await dumpPanes($, `pane-running-${theme}`)
  })
}

// The CI watch on PR #7: the pane's CI section while pending, red and green, and the band card a red finish leaves.
const CI_RUNS = {
  pending: [passed('lint'), pending('unit tests'), pending('e2e · chromium'), { ...passed('deploy preview'), bucket: 'skipping' }],
  fail: [passed('lint'), failed('unit tests'), passed('e2e · chromium'), { ...passed('deploy preview'), bucket: 'skipping' }],
  pass: [passed('lint'), passed('unit tests'), passed('e2e · chromium')],
}

for (const theme of ['dark', 'light']) {
  for (const [name, checks] of Object.entries(CI_RUNS)) {
    test(`preview ${theme}: CI ${name} in the pane${name === 'fail' ? ' and the band card' : ''}`, async ($: any, on: any) => {
      const gh = newGh({ talk: 0 })
      const clock = await setupCi($, on, { gh, surface: 'desktop', theme, lang: 'tr' })
      gh.checks = checks
      gh.talk = 2
      await clock.advance(60_000)
      await dumpPanes($, `pane-ci-${name}-${theme}`)
      if (name === 'fail') {
        await dump(`band-ci-fail-${theme}`, await $.ui.mount(bandOf))
        await dump(`band-ci-fail-narrow-${theme}`, await $.ui.mount(narrowBand))
      }
    })
  }
}
