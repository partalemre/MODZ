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
  // What $.env.get answers: Turkish unless a test asks for the English default.
  env?: Record<string, string>
  // Each folder's entries (a folder not named is empty), each file's text, and what else exists.
  tree: Record<string, string[]>
  texts: Record<string, string>
  existing: string[]
  // The folder each check ran in, the questions asked and the answer given (null: dismissed), and the plugin store.
  cwds: string[]
  asked: string[]
  consent: string | null
  store: Record<string, unknown>
  // What test-badge proposed for the prompt box, and the context each submitted prompt carried.
  suggested: string[]
  contexts: (readonly string[] | undefined)[]
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

export const PKG = JSON.stringify({ scripts: { test: 'vitest run', lint: 'eslint .' } })
export const newWorld = (over: Partial<World> = {}): World => ({
  runs: [], statuses: [], opened: [], copied: [], toasts: [], outs: { test: VITEST_FAIL, lint: ESLINT_FAIL }, code: 1, canOpen: true,
  tree: { '/w': ['package.json'] }, texts: { '/w/package.json': PKG }, existing: [], cwds: [], asked: [], consent: 'yes', store: {},
  suggested: [], contexts: [], ...over,
})
export const result = (stdout: string, exitCode: number) => ({ value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })
const YES = { tr: 'Evet, çalıştır', en: 'Yes, run them' }

// The engine's AskUserQuestion dialog: the world's answer by its meaning, in the session's language.
function answerAsk(world: World, e: any) {
  const question = e.questions[0].question
  world.asked.push(question)
  if (world.consent === null) return { deny: 'dismissed' }
  const lang = (world.env ?? { MODZ_LANG: 'tr' }).MODZ_LANG === 'tr' ? 'tr' : 'en'
  const answer = world.consent === 'yes' ? YES[lang] : world.consent

  return { result: { answers: { [question]: answer } } }
}

function stubHost(on: any, world: World) {
  on('session.start', () => ({ cwd: '/w' }))
  on('session.cwd', () => ({ value: '/w' }))
  on('store.get', (_: any, e: any) => ({ value: world.store[e.key] }))
  on('store.set', (_: any, e: any) => ((world.store[e.key] = e.value), { value: undefined }))
  on('prompt.suggest', (_: any, e: any) => (world.suggested.push(e.text), { isShown: true }))
  on('prompt.submit', (_: any, e: any) => (world.contexts.push(e.context), { text: e.text, context: e.context }))
  on('command.register', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('ui.status', (_: any, e: any) => (world.statuses.push(e.text), { value: undefined }))
  on('ui.toast', (_: any, e: any) => (world.toasts.push(e.text), { value: undefined }))
  on('ui.open', (_: any, e: any) => (world.opened.push(e.id), { value: { isPlaced: true } }))
  on('ui.copy', (_: any, e: any) => (world.copied.push(e.text), { value: { isCopied: true } }))
  on('ui.render', () => ({ type: 'engine', ref: 1 }))
  on('fs.list', (_: any, e: any) => ({ value: (world.tree[e.path] ?? []).map(name => ({ name, kind: name.includes('.') ? 'file' : 'dir', size: 10 })) }))
  on('fs.read', (_: any, e: any) => ({ value: world.texts[e.path] ?? '' }))
  on('fs.exists', (_: any, e: any) => ({ value: world.existing.includes(e.path) }))
  on('tool.call', (_: any, e: any) => (e.tool === 'AskUserQuestion' ? answerAsk(world, e) : { result: 'ok' }))
  on('turn.complete', (_: any, e: any) => ({ text: e.answer }))
  on('turn.start', (_: any, e: any) => ({ turnId: e.turnId }))
}

export async function setup($: any, on: any, world: World) {
  const clock = mock.clock(on)
  mock.env(on, world.env ?? { MODZ_LANG: 'tr' })
  stubHost(on, world)
  on('process.run', async (_: any, e: any) => {
    // The CI watch's probe (git, gh) is not a check run; this folder is no git repo, so it stops there.
    if (e.argv[0] === 'git' || e.argv[0] === 'gh') return result('', 128)
    world.runs.push(e.argv)
    if (e.argv[0] === 'nice') world.cwds.push(e.init?.cwd)
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
