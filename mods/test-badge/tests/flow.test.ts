import { expect, mock, test } from 'claude-code/testing'

type World = {
  runs: string[][]
  statuses: (string | undefined)[]
  opened: string[]
  copied: string[]
  toasts: string[]
  outs: { test: string; lint: string }
  code: number
  canOpen: boolean
  hold?: Promise<void>
}

const SURFACES = ['terminal', 'desktop'] as const
const VITEST_FAIL = [
  ' FAIL  src/auth/login.test.ts > login > rejects an expired token',
  'AssertionError: expected 200 to be 401',
  ' ❯ src/auth/login.test.ts:42:22',
  ' Tests  1 failed | 41 passed (42)',
].join('\n')
const ESLINT_FAIL = [
  '/w/src/api/user.ts',
  "   3:7  error  'x' is assigned a value but never used  no-unused-vars",
  '   9:1  error  Unexpected any  @typescript-eslint/no-explicit-any',
  '✖ 2 problems (2 errors, 0 warnings)',
].join('\n')

const newWorld = (over: Partial<World> = {}): World => ({
  runs: [], statuses: [], opened: [], copied: [], toasts: [], outs: { test: VITEST_FAIL, lint: ESLINT_FAIL }, code: 1, canOpen: true, ...over,
})
const result = (stdout: string, exitCode: number) => ({ value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })
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

async function setup($: any, on: any, world: World) {
  const clock = mock.clock(on)
  stubHost(on, world)
  on('process.run', async (_: any, e: any) => {
    world.runs.push(e.argv)
    if (e.argv[0] !== 'nice') {
      if (!world.canOpen) throw new Error('not found')

      return result('', 0)
    }
    await world.hold

    return result(e.argv.at(-1) === 'lint' ? world.outs.lint : world.outs.test, world.code)
  })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })

  return clock
}

const done = (turnId: string, agentId?: string) => ({ answer: 'ok', durationMs: 1, isAborted: false, turnId, reason: 'answer', agentId })
const bandOf = (surface: string) => ({
  plugin: 'test-badge', component: 'AbovePrompt', requestId: 'band', surface, viewport: { columns: 120, rows: 40 },
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 115, scroll: { offset: 0, bodyRows: 10 }, view: {} },
})
const paneOf = (surface: string) => ({
  plugin: 'test-badge', component: 'Pane', requestId: 'test-badge', surface, viewport: { columns: 120, rows: 40 },
  props: { title: 'Testler', isFocused: true, bodyColumns: 80, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
})

// Every Svg alt in a drawn tree: what the desktop's pictures say.
function alts(tree: any): string[] {
  if (tree === null || typeof tree !== 'object') return []
  if (Array.isArray(tree)) return tree.flatMap(alts)
  const own = tree.type === 'Svg' ? [String(tree.props?.alt ?? '')] : []

  return [...own, ...alts(tree.children ?? tree.props?.children ?? [])]
}

const shown = async (ui: any, surface: string): Promise<string> =>
  surface === 'desktop' ? alts(await ui.drawn()).join('\n') : (await ui.findAll({ type: 'Text' })).map((t: any) => t.text).join('\n')

async function editAndRun($: any, clock: any) {
  await $.tool.call({ tool: 'Edit', file_path: '/w/src/a.ts', old_string: 'a', new_string: 'b' })
  await $.turn.complete(done('t1'))
  await clock.advance(5_500)
}

test('a turn that edited source runs tests then lint, niced, 5s after it ends', async ($: any, on: any) => {
  const world = newWorld()
  const clock = await setup($, on, world)

  await $.tool.call({ tool: 'Edit', file_path: '/w/src/a.ts', old_string: 'a', new_string: 'b' })
  await $.turn.complete(done('t1'))
  await clock.advance(4_000)
  expect(world.runs).toEqual([])
  await clock.advance(1_500)
  expect(world.runs).toEqual([
    ['nice', '-n', '10', 'npm', 'run', '--silent', 'test'],
    ['nice', '-n', '10', 'npm', 'run', '--silent', 'lint'],
  ])
  expect(world.statuses.at(-1)).toBe('testler 41/42 · lint 2 hata · 0 sn önce')
})

test('the status line holds a failure only: a green run clears it', async ($: any, on: any) => {
  const world = newWorld({ outs: { test: ' Tests  42 passed (42)', lint: '' }, code: 0 })
  await editAndRun($, await setup($, on, world))

  expect(world.statuses.filter(text => text !== undefined)).toEqual([])
})

for (const surface of SURFACES) {
  test(`${surface}: one band line above the others, Ayrıntı opens the pane grouped by file`, async ($: any, on: any) => {
    const world = newWorld()
    await editAndRun($, await setup($, on, world))

    const band = await $.ui.mount(bandOf(surface))
    expect(await shown(band, surface)).toMatch(/✕ 1\/42[\s\S]*lint 2[\s\S]*\d sn önce/)
    expect((await band.drawn() as any).children.at(-1)).toEqual({ type: 'engine', ref: 1 })
    await band.press({ key: 'tb-details' })
    expect(world.opened).toEqual(['test-badge'])

    const pane = await $.ui.mount(paneOf(surface))
    const text = await shown(pane, surface)
    expect(text).toContain('1 başarısız')
    expect(text).toContain('src/auth/login.test.ts')
    expect(text).toContain('src/api/user.ts')
    expect(text).toMatch(/AssertionError: expected 200 to be 401/)
    expect((await pane.find({ key: 'tb-filter-lint' }))?.text).toBe('Lint 2')
    expect(await pane.find({ key: 'tb-open-0' })).toBeDefined()
    await pane.press({ key: 'tb-filter-lint' })
    expect(await pane.find({ key: 'tb-open-0' })).toBeUndefined()
    expect(await pane.find({ key: 'tb-open-1' })).toBeDefined()
  })

  test(`${surface}: the shared notice gives way to a live reflect notice, and an expired one does not hold the line`, async ($: any, on: any) => {
    const world = newWorld()
    const reflect = { notice: { id: 1, priority: 2, expiresAt: 0 } as object | null }
    on('state.get', { plugin: 'reflect' }, () => ({ value: { value: reflect.notice, version: 1 } }))
    const clock = await setup($, on, world)
    await editAndRun($, clock)

    reflect.notice = { id: 1, priority: 2, expiresAt: clock.now() + 60_000 }
    const band = await $.ui.mount(bandOf(surface))
    expect(await band.find({ key: 'tb-details' })).toBeUndefined()
    reflect.notice = { id: 1, priority: 2, expiresAt: clock.now() - 1 }
    await band.redraw()
    expect(await band.find({ key: 'tb-details' })).toBeDefined()
    await band.press({ key: 'tb-dismiss' })
    expect(await band.find({ key: 'tb-details' })).toBeUndefined()
  })

  test(`${surface}: a failure row opens the file at its line; with no opener it copies file:line`, async ($: any, on: any) => {
    const world = newWorld()
    await editAndRun($, await setup($, on, world))
    const pane = await $.ui.mount(paneOf(surface))

    await pane.press({ key: 'tb-open-1' })
    expect(world.runs.at(-1)).toEqual(['code', '-g', '/w/src/api/user.ts:3'])
    world.canOpen = false
    await pane.press({ key: 'tb-open-2' })
    expect(world.copied).toEqual(['src/api/user.ts:9'])
    expect(world.toasts).toEqual(['Açılamadı, kopyalandı: src/api/user.ts:9'])
  })

  test(`${surface}: a green run shows ✓ and no Ayrıntı; the pane says all passed`, async ($: any, on: any) => {
    const world = newWorld({ outs: { test: ' Tests  42 passed (42)', lint: '' }, code: 0 })
    await editAndRun($, await setup($, on, world))

    const band = await $.ui.mount(bandOf(surface))
    expect(await shown(band, surface)).toMatch(/✓ test 42\/42[\s\S]*lint temiz/)
    expect(await band.find({ key: 'tb-details' })).toBeUndefined()
    const pane = await $.ui.mount(paneOf(surface))
    expect(await shown(pane, surface)).toMatch(/Hepsi geçti\s*· 42 test geçti · lint temiz/)
  })
}

test('an unreadable failure shows the output tail in the pane', async ($: any, on: any) => {
  const world = newWorld({ outs: { test: 'boom\nsegfault in worker 3', lint: '' } })
  world.code = 2
  await editAndRun($, await setup($, on, world))
  const pane = await $.ui.mount(paneOf('desktop'))
  expect(await shown(pane, 'desktop')).toContain('testler kaldı; hata yeri okunamadı')
  expect(await pane.find({ type: 'Text', text: /segfault in worker 3/ })).toBeDefined()
})

test('while a run goes the band shows the running pill, and the result replaces it in place', async ($: any, on: any) => {
  let release = () => {}
  const world = newWorld()
  world.hold = new Promise<void>(resolve => { release = resolve })
  await editAndRun($, await setup($, on, world))
  const band = await $.ui.mount(bandOf('terminal'))
  expect(await band.find({ type: 'Text', text: '● test çalışıyor' })).toBeDefined()
  expect(await band.find({ key: 'tb-dismiss' })).toBeUndefined()
  world.hold = undefined
  release()
  await band.redraw()
  expect(await band.find({ type: 'Text', text: '✕ 1/42' })).toBeDefined()
})

test('docs-only turns, subagent turn ends and the off switch never run anything', async ($: any, on: any) => {
  const world = newWorld()
  const clock = await setup($, on, world)

  await $.tool.call({ tool: 'Write', file_path: '/w/README.md', content: 'x' })
  await $.turn.complete(done('t1'))
  await $.tool.call({ tool: 'Write', file_path: '/w/a.py', content: 'x' })
  await $.turn.complete(done('t2', 'agent-1'))
  expect(await $.command.run({ command: 'test-badge', args: 'off' })).toMatchObject({ text: 'test-badge kapalı' })
  await $.turn.complete(done('t3'))
  await clock.advance(10_000)

  expect(world.runs).toEqual([])
})

test('quick turns are debounced into one run, and a run asked for mid-run waits its turn', async ($: any, on: any) => {
  let release = () => {}
  const world = newWorld({ outs: { test: '# pass 1\n# fail 0', lint: '' }, code: 0 })
  world.hold = new Promise<void>(resolve => { release = resolve })
  const clock = await setup($, on, world)

  for (const id of ['t1', 't2']) {
    await $.tool.call({ tool: 'Edit', file_path: '/w/a.ts', old_string: 'a', new_string: 'b' })
    await $.turn.complete(done(id))
    await clock.advance(2_000)
  }
  await clock.advance(5_000)
  expect(world.runs).toHaveLength(1)

  await $.command.run({ command: 'test-badge', args: 'run' })
  expect(world.runs).toHaveLength(1)
  world.hold = undefined
  release()
  await clock.advance(1)
  expect(world.runs).toHaveLength(4)
})

test('/test-badge details opens the pane', async ($: any, on: any) => {
  const world = newWorld()
  await setup($, on, world)
  expect(await $.command.run({ command: 'test-badge', args: 'details' })).toMatchObject({ text: 'test-badge: ayrıntılar açıldı' })
  expect(world.opened).toEqual(['test-badge'])
})
