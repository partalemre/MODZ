import { expect, test } from 'claude-code/testing'

import { PKG, done, editAndRun, newWorld, paneOf, setup } from './world'

// Which checks run on their own, where, and only with the person's one yes.

const NPM_TEST = ['nice', '-n', '10', 'npm', 'run', '--silent', 'test']
const tests = (world: any) => world.runs.filter((argv: string[]) => argv.at(-1) === 'test')

async function editTurn($: any, clock: any, path: string, turnId = 't1') {
  await $.tool.call({ tool: 'Edit', file_path: path, old_string: 'a', new_string: 'b' })
  await $.turn.complete(done(turnId))
  await clock.advance(5_500)
}

test('a monorepo runs the edited package’s tests, not the root suite', async ($: any, on: any) => {
  const world = newWorld({
    tree: { '/w': ['package.json', 'packages'], '/w/packages': ['api'], '/w/packages/api': ['package.json', 'src'], '/w/packages/api/src': ['a.ts'] },
    texts: { '/w/package.json': PKG, '/w/packages/api/package.json': PKG },
  })
  await editTurn($, await setup($, on, world), '/w/packages/api/src/a.ts')

  expect(tests(world)).toEqual([NPM_TEST])
  expect(world.cwds).toEqual(['/w/packages/api', '/w/packages/api'])
})

test('the first automatic run asks once, naming the exact commands, and a no is remembered', async ($: any, on: any) => {
  const world = newWorld({ consent: 'Hayır', env: { MODZ_LANG: 'tr' } })
  const clock = await setup($, on, world)
  await editTurn($, clock, '/w/src/a.ts')
  await editTurn($, clock, '/w/src/b.ts', 't2')

  expect(world.asked).toHaveLength(1)
  expect(world.asked[0]).toContain('npm run --silent test')
  expect(world.asked[0]).toContain('npm run --silent lint')
  expect(world.runs).toEqual([])
})

test('a yes is remembered for the project: the next turn runs without asking', async ($: any, on: any) => {
  const world = newWorld()
  const clock = await setup($, on, world)
  await editTurn($, clock, '/w/src/a.ts')
  await editTurn($, clock, '/w/src/b.ts', 't2')

  expect(world.asked).toHaveLength(1)
  expect(tests(world)).toHaveLength(2)
})

test('a dismissed question runs nothing and is not asked again this session', async ($: any, on: any) => {
  const world = newWorld({ consent: null })
  const clock = await setup($, on, world)
  await editTurn($, clock, '/w/src/a.ts')
  await editTurn($, clock, '/w/src/b.ts', 't2')

  expect(world.asked).toHaveLength(1)
  expect(world.runs).toEqual([])
})

test('/test-badge run is the person’s own ask: it runs without the question', async ($: any, on: any) => {
  const world = newWorld({ consent: 'Hayır' })
  const clock = await setup($, on, world)
  void $.command.run({ command: 'test-badge', args: 'run' })
  await clock.advance(10)

  expect(world.asked).toEqual([])
  expect(tests(world)).toEqual([NPM_TEST])
})

test('a tool that is not installed is “no test command found”, never a red badge', async ($: any, on: any) => {
  const world = newWorld({
    outs: { test: 'nice: vitest: No such file or directory', lint: '' }, code: 127,
    texts: { '/w/package.json': JSON.stringify({ scripts: { test: 'vitest run' } }) },
  })
  await editAndRun($, await setup($, on, world))

  expect(world.statuses.filter(text => text !== undefined)).toEqual([])
  const pane = await $.ui.mount(paneOf('terminal'))
  const text = (await pane.findAll({ type: 'Text' })).map((t: any) => t.text).join('\n')
  expect(text).toContain('Test komutu bulunamadı')
})

test('Flutter runs the tests of the edited files where they exist', async ($: any, on: any) => {
  const world = newWorld({
    tree: { '/w': ['pubspec.yaml', 'test', 'lib'] },
    texts: { '/w/pubspec.yaml': 'dependencies:\n  flutter:\n    sdk: flutter' },
    existing: ['/w/test/cart/total_test.dart'],
  })
  await editTurn($, await setup($, on, world), '/w/lib/cart/total.dart')

  expect(world.runs[0]).toEqual(['nice', '-n', '10', 'flutter', 'test', 'test/cart/total_test.dart'])
})

test('a failed run is offered to the next prompt as a suggestion; taking it hands Claude the output', async ($: any, on: any) => {
  const world = newWorld()
  await editAndRun($, await setup($, on, world))

  const offer = world.suggested.at(-1) ?? ''
  expect(offer).not.toBe('')
  await $.prompt.submit({ text: 'bir şey daha', wait: false })
  expect(world.contexts.at(-1)).toBeUndefined()
  await $.prompt.submit({ text: offer, wait: false })
  const context = (world.contexts.at(-1) ?? []).join('\n')
  expect(context).toContain('npm run --silent test')
  expect(context).toContain('src/auth/login.test.ts:42')
  expect(context).toContain('AssertionError: expected 200 to be 401')
  await $.prompt.submit({ text: offer, wait: false })
  expect(world.contexts.at(-1)).toBeUndefined()
})

test('a green run offers nothing', async ($: any, on: any) => {
  const world = newWorld({ outs: { test: ' Tests  42 passed (42)', lint: '' }, code: 0 })
  await editAndRun($, await setup($, on, world))

  expect(world.suggested).toEqual([])
})

test('no run starts while one is going, and none while Claude works on the next turn', async ($: any, on: any) => {
  let release = () => {}
  const world = newWorld({ hold: new Promise<void>(resolve => (release = resolve)) })
  const clock = await setup($, on, world)
  await editTurn($, clock, '/w/src/a.ts')
  await editTurn($, clock, '/w/src/b.ts', 't2')
  void $.command.run({ command: 'test-badge', args: 'run' })
  await clock.advance(10)
  expect(tests(world)).toHaveLength(1)
  release()
  await clock.settle()

  const before = tests(world).length
  await $.tool.call({ tool: 'Edit', file_path: '/w/src/c.ts', old_string: 'a', new_string: 'b' })
  await $.turn.complete(done('t3'))
  await $.turn.start({ text: 'go on', turnId: 't4' })
  await clock.advance(5_500)
  expect(tests(world)).toHaveLength(before)
  await $.turn.complete(done('t4'))
  await clock.advance(5_500)
  expect(tests(world)).toHaveLength(before + 1)
})
