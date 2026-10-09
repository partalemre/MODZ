import { mock } from 'claude-code/testing'

// The host test-badge runs against: a package.json project whose checks fail, and the engine's answers.

export type World = {
  runs: string[][]
  statuses: (string | undefined)[]
  opened: string[]
  copied: string[]
  toasts: string[]
  outs: { test: string; lint: string }
  code: number
  // The lint command's exit code when it differs from the tests'.
  lintCode?: number
  canOpen: boolean
  hold?: Promise<void>
  // Where the session starts; terminal unless a test needs the desktop.
  surface?: 'terminal' | 'desktop'
}

export const VITEST_FAIL = [
  ' FAIL  src/auth/login.test.ts > login > rejects an expired token',
  'AssertionError: expected 200 to be 401',
  ' ❯ src/auth/login.test.ts:42:22',
  ' Tests  1 failed | 41 passed (42)',
].join('\n')
export const ESLINT_FAIL = [
  '/w/src/api/user.ts',
  "   3:7  error  'x' is assigned a value but never used  no-unused-vars",
  '   9:1  error  Unexpected any  @typescript-eslint/no-explicit-any',
  '✖ 2 problems (2 errors, 0 warnings)',
].join('\n')

export const newWorld = (over: Partial<World> = {}): World => ({
  runs: [], statuses: [], opened: [], copied: [], toasts: [], outs: { test: VITEST_FAIL, lint: ESLINT_FAIL }, code: 1, canOpen: true, ...over,
})
export const result = (stdout: string, exitCode: number) => ({ value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })
const pkg = JSON.stringify({ scripts: { test: 'vitest run', lint: 'eslint .' } })

function stubHost(on: any, world: World) {
  on('session.start', () => ({ cwd: '/w' }))
  on('session.cwd', () => ({ value: '/w' }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('command.register', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('ui.status', (_: any, e: any) => (world.statuses.push(e.text), { value: undefined }))
  on('ui.toast', (_: any, e: any) => (world.toasts.push(e.text), { value: undefined }))
  on('ui.open', (_: any, e: any) => (world.opened.push(e.id), { value: { isPlaced: true } }))
  on('ui.copy', (_: any, e: any) => (world.copied.push(e.text), { value: { isCopied: true } }))
  on('ui.render', () => ({ type: 'engine', ref: 1 }))
  on('fs.list', () => ({ value: [{ name: 'package.json', kind: 'file', size: 10 }] }))
  on('fs.read', () => ({ value: pkg }))
  on('fs.exists', () => ({ value: false }))
  on('tool.call', () => ({ result: 'ok' }))
  on('turn.complete', (_: any, e: any) => ({ text: e.answer }))
}

export async function setup($: any, on: any, world: World) {
  const clock = mock.clock(on)
  stubHost(on, world)
  on('process.run', async (_: any, e: any) => {
    world.runs.push(e.argv)
    if (e.argv[0] !== 'nice') {
      if (!world.canOpen) throw new Error('not found')

      return result('', 0)
    }
    await world.hold

    const isLint = e.argv.at(-1) === 'lint'

    return result(isLint ? world.outs.lint : world.outs.test, isLint ? (world.lintCode ?? world.code) : world.code)
  })
  await $.session.start({ surface: world.surface ?? 'terminal', isInteractive: true, cwd: '/w' })

  return clock
}

export const done = (turnId: string, agentId?: string) => ({ answer: 'ok', durationMs: 1, isAborted: false, turnId, reason: 'answer', agentId })
export const bandOf = (surface: string) => ({
  plugin: 'test-badge', component: 'AbovePrompt', requestId: 'band', surface, viewport: { columns: 120, rows: 40 },
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 115, scroll: { offset: 0, bodyRows: 10 }, view: {} },
})
export const paneOf = (surface: string) => ({
  plugin: 'test-badge', component: 'Pane', requestId: 'test-badge', surface, viewport: { columns: 120, rows: 40 },
  props: { title: 'Testler', isFocused: true, bodyColumns: 80, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
})

export async function editAndRun($: any, clock: any) {
  await $.tool.call({ tool: 'Edit', file_path: '/w/src/a.ts', old_string: 'a', new_string: 'b' })
  await $.turn.complete(done('t1'))
  await clock.advance(5_500)
}
