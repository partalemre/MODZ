import { mock, test } from 'claude-code/testing'

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
const bandOf = { plugin: 'test-badge', component: 'AbovePrompt', requestId: 'band', surface: 'desktop', viewport: { columns: 110, rows: 40 }, props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100, scroll: { offset: 0, bodyRows: 10 }, view: {} } }
const paneOf = { plugin: 'test-badge', component: 'Pane', requestId: 'test-badge', surface: 'desktop', viewport: { columns: 110, rows: 40 }, props: { title: 'Testler', isFocused: true, bodyColumns: 92, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} } }

type Run = { test: string; lint: string; code: number; hold?: Promise<void> }

async function setup($: any, on: any, spec: { theme: string; run: Run }) {
  const clock = mock.clock(on)
  mock.env(on, { MODZ_THEME: spec.theme })
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
  await $.tool.call({ tool: 'Edit', file_path: '/w/src/a.ts', old_string: 'a', new_string: 'b' })
  await $.turn.complete({ answer: 'ok', durationMs: 1, isAborted: false, turnId: 't', reason: 'answer' })
  await clock.advance(5_500)
  await clock.advance(4_000)
}

const dump = async (label: string, ui: any) => console.log(`@@TREE@@${label}@@${JSON.stringify(await ui.drawn())}`)

for (const theme of ['dark', 'light']) {
  test(`preview ${theme}: failing band and details pane`, async ($: any, on: any) => {
    await setup($, on, { theme, run: { test: VITEST, lint: ESLINT, code: 1 } })
    await dump(`band-fail-${theme}`, await $.ui.mount(bandOf))
    await dump(`pane-fail-${theme}`, await $.ui.mount(paneOf))
  })

  test(`preview ${theme}: passing band`, async ($: any, on: any) => {
    await setup($, on, { theme, run: { test: PASS, lint: ESLINT, code: 0 } })
    await dump(`band-pass-${theme}`, await $.ui.mount(bandOf))
    await dump(`pane-pass-${theme}`, await $.ui.mount(paneOf))
  })

  test(`preview ${theme}: running band`, async ($: any, on: any) => {
    await setup($, on, { theme, run: { test: PASS, lint: '', code: 0, hold: new Promise<void>(() => undefined) } })
    await dump(`band-running-${theme}`, await $.ui.mount(bandOf))
  })
}
