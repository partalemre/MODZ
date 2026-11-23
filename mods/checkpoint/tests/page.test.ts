import { expect, test } from 'claude-code/testing'

import { newFake, stub } from './stubs'

// The Restore points page the MODZ hub draws in its own pane: /checkpoints asks the hub for it, the hub's stage
// reads the list anew, and a press on the page (modz.act) does what the pane's own button does.

// Stands for a hub that draws this list itself: it says so, stages the page, hands presses on, and hears `home`.
const modz = {
  name: 'modz',
  register(on: any) {
    const heard: unknown[] = []
    on('command.run', { command: 'hub-draws' }, async ($: any) => {
      await $.state.set({ plugin: 'modz', key: 'isOn' }, true)
      await $.state.set({ plugin: 'modz', key: 'drawn' }, ['plan', 'checkpoints'])

      return {}
    })
    on('command.run', { command: 'hub-stage' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'stage' }, { pane: e.args, at: 1 })

      return {}
    })
    on('command.run', { command: 'hub-act' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'act' }, { page: 'checkpoints', ...JSON.parse(e.args), at: 1 })

      return {}
    })
    on('state.set', { key: 'home' }, async (_: any, e: any, next: any) => (heard.push(e.value), next(e)))
    on('command.run', { command: 'hub-heard' }, async () => ({ text: JSON.stringify(heard) }))
    on('command.run', { command: 'cp-view' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'checkpoint', key: 'view' })).value ?? null) }))
  },
}

const ONE = { refs: 'refs/checkpoints/s/1\tc1\t100\tfix login', diff: 'M\0a.ts\0A\0new.ts\0' }
const run = async ($: any, command: string, args = '') => (await $.command.run({ command, args })).text
const viewOf = async ($: any) => JSON.parse(await run($, 'cp-view'))

async function start($: any, on: any) {
  const opened: string[] = []
  const fake = newFake({ ...ONE, opened })
  const clock = stub(on, fake)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/w' })
  await run($, 'hub-draws')

  return { clock, opened, fake }
}

test('/checkpoints asks a hub that draws the list for its page, and opens no pane of its own', { plugins: [modz] }, async ($: any, on: any) => {
  const { opened } = await start($, on)
  await run($, 'checkpoints')

  expect(opened).toEqual([])
  expect(JSON.parse(await run($, 'hub-heard'))).toEqual([{ pane: 'checkpoints', at: expect.any(Number) }])
})

test('the hub staging the page reads the list anew; another page does not', { plugins: [modz] }, async ($: any, on: any) => {
  await start($, on)
  await run($, 'hub-stage', 'plan')
  expect((await viewOf($))?.entries ?? []).toEqual([])

  await run($, 'hub-stage', 'checkpoints')
  expect((await viewOf($)).entries.map((entry: any) => entry.label)).toEqual(['fix login'])
})

test('presses on the hub\'s page: undo asks first, cancel changes nothing, confirm restores; redo finds the safety point', { plugins: [modz] }, async ($: any, on: any) => {
  const { clock, fake } = await start($, on)
  await run($, 'hub-stage', 'checkpoints')
  const press = async (action: object) => (await run($, 'hub-act', JSON.stringify(action)), await clock.advance(1))
  const lines = () => fake.calls.map(call => call.argv.join(' '))

  await press({ action: 'undo', arg: 'refs/checkpoints/s/1' })
  expect((await viewOf($)).pending?.entry.ref).toBe('refs/checkpoints/s/1')
  await press({ action: 'cancel' })
  expect((await viewOf($)).pending).toBeNull()
  expect(lines().some(line => line.includes('git restore'))).toBe(false)

  await press({ action: 'undo', arg: 'refs/checkpoints/s/1' })
  await press({ action: 'confirm' })
  const after = await viewOf($)
  expect(lines()).toContain('git restore --source=c1 --worktree -- :(literal)a.ts')
  expect(after.status.tone).toBe('success')

  await press({ action: 'undo', arg: after.status.redo.ref })
  expect((await viewOf($)).pending?.entry.ref).toBe(after.status.redo.ref)
})

test('a press for another page, or a ref nobody keeps, does nothing', { plugins: [modz] }, async ($: any, on: any) => {
  const { clock } = await start($, on)
  await run($, 'hub-stage', 'checkpoints')
  await run($, 'hub-act', JSON.stringify({ page: 'plan', action: 'undo', arg: 'refs/checkpoints/s/1' }))
  await run($, 'hub-act', JSON.stringify({ action: 'undo', arg: 'refs/nope' }))
  await clock.advance(1)

  expect((await viewOf($)).pending).toBeNull()
})
