import { expect, test } from 'claude-code/testing'

import { COMPOSE, MINUTE, bandOf, buttonsOf, measure, newWorld, paneOf, said, start, stub } from './stubs'

// Desktop sessions run in worktrees of one repo; the note waits for the person to take it, in whichever one.

const SECTION = 'handoff:note'
const TREE_A = '/w/.claude/worktrees/a'
const TREE_B = '/w/.claude/worktrees/b'
const idsOf = async ($: any) => (await $.prompt.compose(COMPOSE)).sections.map((section: any) => section.id)

test('a note written in a worktree is kept for the main repo, outside the worktree', async ($: any, on: any) => {
  const world = newWorld({ root: TREE_A })
  stub(on, world)
  await start($, 'desktop')
  await $.command.run({ command: 'handoff', args: '' })

  const [path] = Object.keys(world.files)
  expect(path?.startsWith('/w/.claude/handoff/')).toBe(true)
  expect((world.store['latest:/w'] as any)?.path).toBe(path)
})

test('the next session takes the note only when the person presses Continue, in another worktree too', async ($: any, on: any) => {
  const world = newWorld({ root: TREE_A, messages: [said('user', 'go'), said('assistant', 'done')] })
  stub(on, world)
  await start($, 'desktop')
  await $.command.run({ command: 'handoff', args: '' })
  // A /clear in the same process stands for the next session; the next one runs in another worktree.
  await $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } } as any)
  world.sessionId = 's2'
  world.root = TREE_B
  world.messages = [said('user', 'a side question')]

  expect(await idsOf($)).not.toContain(SECTION)
  const band = await $.ui.mount(bandOf('desktop'))
  expect(buttonsOf(await band.drawn())).toContain('handoff-continue')
  await band.press({ key: 'handoff-continue' })

  expect((world.store['latest:/w'] as any).consumedBy).toBe('s2')
  expect(await idsOf($)).toContain(SECTION)
  expect(buttonsOf(await band.drawn())).not.toContain('handoff-continue')
})

const reflect = {
  name: 'reflect',
  register(on: any) {
    on('session.start', async ($: any, e: any, next: any) => (await $.state.set({ plugin: 'reflect', key: 'notice' }, { id: 'r1' }), next(e)))
  },
}

test('a notice another mod left behind holds the card back for a while, not for ever', { plugins: [reflect] }, async ($: any, on: any) => {
  const clock = stub(on, newWorld())
  await start($, 'terminal')
  await measure($, 82)
  const band = await $.ui.mount(bandOf('terminal'))
  expect(buttonsOf(await band.drawn())).toEqual([])

  await clock.advance(30 * MINUTE)
  await measure($, 83)
  expect(buttonsOf(await band.drawn())).toContain('handoff-write')
})

test('the empty pane says what the mod does and when it speaks', async ($: any, on: any) => {
  stub(on, newWorld())
  await start($, 'desktop')
  const pane = await $.ui.mount(paneOf('desktop'))

  expect(JSON.stringify(await pane.drawn())).toContain('so a fresh chat can continue from it')
})
