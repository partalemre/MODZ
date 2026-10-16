import { expect, test } from 'claude-code/testing'

import { hubOf, isOpenFor } from '../hooks/hub'
import { setLang } from '../hooks/lang'
import { newWorld, paneOf, setup } from './fixtures'

// The MODZ main panel's side (DESIGN.md §9): the hub card this mod writes and the open requests it answers.
const OPEN_WAIT_MS = 200

// Stands for the MODZ main panel: it writes open requests and reads the card, as `modz` does.
const modz = {
  name: 'modz',
  register(on: any) {
    on('command.run', { command: 'modz-open' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'open' }, { pane: e.args, at: 1 })

      return {}
    })
    on('command.run', { command: 'modz-on' }, async ($: any) => {
      await $.state.set({ plugin: 'modz', key: 'isOn' }, true)

      return {}
    })
    on('command.run', { command: 'modz-stage' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'stage' }, { pane: e.args, at: 1 })

      return {}
    })
    on('command.run', { command: 'modz-hub' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'replay-theater', key: 'hub' })).value ?? null) }))
  },
}

const hub = async ($: any) => JSON.parse((await $.command.run({ command: 'modz-hub', args: '' })).text)

async function editTurn($: any, turnId: string) {
  await $.turn.start({ text: 'adı değiştir', turnId })
  await $.tool.call({ tool: 'Edit', file_path: '/w/README.md', old_string: 'greet', new_string: 'welcome' })
  await $.tool.call({ tool: 'Edit', file_path: '/w/src/greet.js', old_string: 'greet', new_string: 'welcome' })
  await $.turn.complete({ answer: 'Tamam.', durationMs: 1, isAborted: false, turnId, reason: 'answer' })
}

test('the hub card is idle at start, counts the last turn\'s edits, and is rewritten only when that changes', { plugins: [modz] }, async ($: any, on: any) => {
  const clock = await setup($, on, newWorld())
  expect(await hub($)).toMatchObject({ pane: 'replay', detail: '', tone: 'idle' })

  await editTurn($, 't1')
  const first = await hub($)
  expect(first).toMatchObject({ pane: 'replay', detail: '2 düzenleme · 2 dosya', tone: 'ok' })

  await clock.advance(60_000)
  await $.turn.start({ text: 'sadece oku', turnId: 't2' })
  await $.turn.complete({ answer: 'Okudum.', durationMs: 1, isAborted: false, turnId: 't2', reason: 'answer' })
  expect((await hub($)).at).toBe(first.at)
})

test('a MODZ open request for replay opens the pane, even with nothing to replay; one for another pane does not', { plugins: [modz] }, async ($: any, on: any) => {
  const world = newWorld()
  const clock = await setup($, on, world)
  await $.command.run({ command: 'modz-open', args: 'checkpoints' })
  expect(world.opened).toEqual([])

  const opening = $.command.run({ command: 'modz-open', args: 'replay' })
  await clock.advance(OPEN_WAIT_MS)
  await opening
  expect(world.opened).toEqual(['replay-theater'])
  expect(await (await $.ui.mount(paneOf('desktop'))).find({ key: 'rt-empty' })).toBeDefined()

  // Already open: it only comes forward, with no second wait.
  await $.command.run({ command: 'modz-open', args: 'replay' })
  expect(world.opened).toEqual(['replay-theater', 'replay-theater'])
})

test('with the hub on the opened pane reports itself shown, and steps aside when another pane takes the panel', { plugins: [modz] }, async ($: any, on: any) => {
  const shown: unknown[] = []
  on('state.set', { plugin: 'replay-theater', key: 'shown' }, (_: any, e: any, next: any) => (shown.push(e.value?.pane), next(e)))
  const world = newWorld()
  const clock = await setup($, on, world)
  const opening = $.command.run({ command: 'modz-open', args: 'replay' })
  await clock.advance(OPEN_WAIT_MS)
  await opening
  // The hub is off: nothing to step aside for.
  expect(shown).toEqual([])
  await $.command.run({ command: 'modz-on', args: '' })
  await $.command.run({ command: 'modz-open', args: 'replay' })
  expect(shown).toEqual(['replay'])
  await $.command.run({ command: 'modz-stage', args: 'replay' })
  expect(world.closed).toEqual([])
  await $.command.run({ command: 'modz-stage', args: 'checkpoints' })
  expect(world.closed).toEqual(['replay-theater'])
})

test('the card and the open match are pure', () => {
  setLang('tr')
  expect(hubOf(null)).toEqual({ detail: '', tone: 'idle' })
  const step = { tool: 'Edit', file: 'a.ts', note: '', diff: [] }
  expect(hubOf({ id: 't', steps: [step, step, { ...step, file: 'b.ts' }], explain: 'none', quote: '' })).toEqual({ detail: '3 düzenleme · 2 dosya', tone: 'ok' })
  expect(isOpenFor({ pane: 'replay', at: 1 }, 'replay')).toBe(true)
  expect(isOpenFor({ pane: 'checkpoints' }, 'replay')).toBe(false)
  expect(isOpenFor(undefined, 'replay')).toBe(false)
})
