import { expect, test } from 'claude-code/testing'

import { bandOf, buttonsOf, hubCardOf, measure, modz, newWorld, said, start, stub } from './stubs'

// The band card from the threshold on: ask, "Not now", compaction, a written note and a failed one, on both surfaces.

const ASK = ['handoff-write', 'handoff-compact', 'handoff-snooze']
const NOTE = /^\/w\/\.claude\/handoff\/\d{4}-\d{2}-\d{2}-\d{4}\.md$/

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: under the threshold the band is theirs alone; at 82% the card asks`, async ($: any, on: any) => {
    stub(on, newWorld())
    await start($, surface)
    await measure($, 42)
    const band = await $.ui.mount(bandOf(surface))
    expect(buttonsOf(await band.drawn())).toEqual([])
    expect(await band.find({ text: 'theirs' })).toBeDefined()

    await measure($, 82)
    expect(buttonsOf(await band.drawn())).toEqual(ASK)
    expect(await band.find({ text: 'theirs' })).toBeDefined()
  })

  test(`${surface}: never while a turn runs or a survey is open`, async ($: any, on: any) => {
    stub(on, newWorld())
    await start($, surface)
    await measure($, 90)
    for (const quiet of [{ isWorking: true }, { hasSurvey: true }]) {
      const band = await $.ui.mount(bandOf(surface, quiet))
      expect(buttonsOf(await band.drawn())).toEqual([])
      await band.unmount()
    }
  })

  test(`${surface}: "Not now" waits ten points`, async ($: any, on: any) => {
    stub(on, newWorld())
    await start($, surface)
    await measure($, 82)
    const band = await $.ui.mount(bandOf(surface))
    await band.press({ key: 'handoff-snooze' })
    await measure($, 91)
    expect(buttonsOf(await band.drawn())).toEqual([])
    await measure($, 92)
    expect(buttonsOf(await band.drawn())).toEqual(ASK)
  })

  test(`${surface}: "Compact instead" compacts and the ask is done until the fill climbs again`, async ($: any, on: any) => {
    const world = newWorld()
    stub(on, world)
    await start($, surface)
    await measure($, 85)
    const band = await $.ui.mount(bandOf(surface))
    await band.press({ key: 'handoff-compact' })
    expect(world.compacts).toBe(1)
    expect(buttonsOf(await band.drawn())).toEqual([])
    await measure($, 30)
    await measure($, 81)
    expect(buttonsOf(await band.drawn())).toEqual(ASK)
  })

  test(`${surface}: "Write handoff" writes the note, keeps it, and the card says where`, async ($: any, on: any) => {
    const world = newWorld({ messages: [said('user', 'fix the login form'), said('assistant', 'on it')] })
    stub(on, world)
    await start($, surface)
    await $.tool.call({ tool: 'Edit', file_path: '/w/src/login.ts', old_string: 'a', new_string: 'b' })
    await $.tool.call({ tool: 'Bash', command: 'npm test', fail: 'npm ERR! 1 failing' })
    await measure($, 82)
    const band = await $.ui.mount(bandOf(surface))
    await band.press({ key: 'handoff-write' })

    const [path] = Object.keys(world.files)
    expect(path).toMatch(NOTE)
    const text = world.files[path!]!
    expect(text).toContain('## Where we are\nLogin form is done.')
    expect(text).toContain('- fix the login form')
    expect(text).toContain('- src/login.ts')
    expect(text).toContain(' M src/app.ts')
    expect(text).toContain('Bash: npm ERR! 1 failing')
    expect(world.asked).toHaveLength(1)
    expect(world.asked[0].model).toBe('haiku')
    expect((world.store['latest:/w'] as any).path).toBe(path)
    expect(buttonsOf(await band.drawn())).toEqual(['handoff-show', 'handoff-dismiss'])

    await band.press({ key: 'handoff-show' })
    expect(world.opened).toEqual(['handoff'])
    await band.press({ key: 'handoff-dismiss' })
    expect(buttonsOf(await band.drawn())).toEqual([])
  })

  test(`${surface}: a failed write shows the error card; a /clear starts the conversation over`, async ($: any, on: any) => {
    stub(on, newWorld({ writeError: 'EACCES' }))
    await start($, surface)
    await measure($, 88)
    const band = await $.ui.mount(bandOf(surface))
    await band.press({ key: 'handoff-write' })
    expect(buttonsOf(await band.drawn())).toEqual(['handoff-retry', 'handoff-snooze'])

    await $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } } as any)
    expect(buttonsOf(await band.drawn())).toEqual([])
  })
}

test('with summarize off, or the model failing, the deterministic note stands', { options: { summarize: false } }, async ($: any, on: any) => {
  const world = newWorld({ messages: [said('user', 'ship it')] })
  stub(on, world)
  await start($, 'terminal')
  const out = await $.command.run({ command: 'handoff', args: '' })

  expect(world.asked).toHaveLength(0)
  const [path] = Object.keys(world.files)
  expect(out.text).toContain(path)
  expect(world.files[path!]).not.toContain('## Where we are')
  expect(world.files[path!]).toContain('- ship it')
})

test('a model error leaves the summary out and the note is still written', async ($: any, on: any) => {
  const world = newWorld({ reply: null, messages: [said('user', 'ship it')], git: { exitCode: 128, stdout: '' } })
  stub(on, world)
  await start($, 'terminal')
  await $.command.run({ command: 'handoff', args: '' })

  const [path] = Object.keys(world.files)
  expect(world.asked).toHaveLength(1)
  expect(world.files[path!]).not.toContain('## Where we are')
  expect(world.files[path!]).not.toContain('## Git status')
  expect((world.store['latest:/w'] as any).isSummarized).toBe(false)
})

test('/handoff show opens the pane; it never opens by itself', async ($: any, on: any) => {
  const world = newWorld()
  stub(on, world)
  await start($, 'terminal')
  await measure($, 95)
  expect(world.opened).toEqual([])
  const out = await $.command.run({ command: 'handoff', args: 'show' })
  expect(world.opened).toEqual(['handoff'])
  expect(out.text).toBe('handoff: pane opened')
})

test('Turkish: the card and the hub line speak Turkish', { plugins: [modz] }, async ($: any, on: any) => {
  stub(on, newWorld({ env: { MODZ_LANG: 'tr' } }))
  await start($, 'terminal')
  await measure($, 82)
  const band = await $.ui.mount(bandOf('terminal'))
  expect(await band.find({ text: 'Bağlam %82 dolu' })).toBeDefined()
  expect(await band.find({ type: 'Button', text: 'Devir notu yaz' })).toBeDefined()
  expect((await hubCardOf($)).detail).toBe('Bağlam %82')
})

const plan = {
  name: 'plan-steps',
  register(on: any) {
    on('session.start', async ($: any, e: any, next: any) => {
      await $.state.set({ plugin: 'plan-steps', key: 'tasks' }, [{ id: '1', subject: 'Build', status: 'completed' }, { id: '2', subject: 'Ship', status: 'pending' }])

      return next(e)
    })
  },
}

test('open plan steps come from plan-steps where it runs', { plugins: [plan] }, async ($: any, on: any) => {
  const world = newWorld()
  stub(on, world)
  await start($, 'terminal')
  await $.command.run({ command: 'handoff', args: '' })

  const [text] = Object.values(world.files)
  expect(text).toContain('## Open plan steps\n- [ ] Ship')
  expect(text).not.toContain('Build')
})

const reflect = {
  name: 'reflect',
  register(on: any) {
    on('session.start', async ($: any, e: any, next: any) => {
      await $.state.set({ plugin: 'reflect', key: 'notice' }, { id: 'r1' })

      return next(e)
    })
  },
}

test('a louder notice keeps the slot: the handoff card waits', { plugins: [reflect] }, async ($: any, on: any) => {
  stub(on, newWorld())
  await start($, 'terminal')
  await measure($, 82)
  const band = await $.ui.mount(bandOf('terminal'))
  expect(buttonsOf(await band.drawn())).toEqual([])
  expect(await band.find({ text: 'theirs' })).toBeDefined()
})
