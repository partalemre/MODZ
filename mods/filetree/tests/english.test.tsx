import { expect, test } from 'claude-code/testing'

import { opens, world } from './world'
import type { World } from './world'

// With no MODZ_LANG the file tree speaks English, the film's words, and nothing Turkish-only shows.

const ROOT = '/Users/k/MODZ'
const ENGLISH = { HOME: '/Users/k' }
const TURKISH_ONLY = /[çğıöşüİ]/
const props = { title: 'Files', isFocused: false, bodyColumns: 50, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} } as any
const texts = async (ui: any) => JSON.stringify(await ui.drawn()) + JSON.stringify(await ui.drawn({ in: 'rows' }))

// Stands for the MODZ main panel: it writes open requests and reads the card, as `modz` does.
const modz = {
  name: 'modz',
  register(on: any) {
    on('command.run', { command: 'modz-open' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'open' }, { pane: e.args, at: 1 })

      return {}
    })
    on('command.run', { command: 'modz-hub' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'filetree', key: 'hub' })).value ?? null) }))
  },
}
const hub = async ($: any) => JSON.parse((await $.command.run({ command: 'modz-hub', args: '' } as any)).text)

const repo = (over: Partial<World> = {}): World => ({ root: ROOT, files: ['a.ts', 'b.ts'], status: '## main\0 M a.ts\0', heads: { [ROOT]: ['1111111aaaa'] }, env: ENGLISH, ...over })

async function editTurn($: any, clock: any) {
  await $.turn.start({ text: 'go', turnId: 't1' })
  await $.tool.call({ tool: 'Edit', file_path: `${ROOT}/a.ts`, old_string: 'a', new_string: 'b' } as any)
  await clock.settle()
}

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: the pane speaks English after a turn that edited a file`, { timeoutMs: 20_000 }, async ($, on) => {
    const clock = world(on, repo())
    await $.session.start({ cwd: ROOT, surface, isInteractive: true })
    await clock.settle()
    const ui = await $.ui.mount({ plugin: 'filetree', surface, component: 'Pane', requestId: 'filetree', props })
    await editTurn($, clock)
    await $.turn.complete({ answer: '', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' } as any)
    await clock.settle()
    const shown = await texts(ui)

    expect(shown).toContain('DONE')
    expect(shown).toContain('Claude edited 1 file')
    expect(shown).toContain('Find a file')
    expect(shown).not.toMatch(TURKISH_ONLY)
    if (surface === 'desktop') {
      for (const label of ['TOUCHED BY CLAUDE · 1 FILE', 'Edited', 'ALL FILES', 'Collapse', 'Refresh', 'More', '1 change']) expect(shown).toContain(label)
    }
    await ui.unmount()
  })

  test(`${surface}: before any turn the pane says Claude is waiting, in English`, { timeoutMs: 20_000 }, async ($, on) => {
    const clock = world(on, repo({ status: '## main\0' }))
    await $.session.start({ cwd: ROOT, surface, isInteractive: true })
    await clock.settle()
    const ui = await $.ui.mount({ plugin: 'filetree', surface, component: 'Pane', requestId: 'filetree', props })
    await clock.settle()
    const shown = await texts(ui)

    if (surface === 'desktop') expect(shown).toContain('Claude is waiting')
    else expect(shown).toContain(' clean')
    expect(shown).not.toMatch(TURKISH_ONLY)
    await ui.unmount()
  })

  test(`${surface}: a refused commit says why, in English`, { timeoutMs: 20_000 }, async ($, on) => {
    const tool = () => ({ isError: true, result: 'Exit code 1', text: 'On branch main\nnothing to commit, working tree clean' })
    const clock = world(on, repo({ status: '## main\0', tool }))
    await $.session.start({ cwd: ROOT, surface, isInteractive: true })
    await clock.settle()
    const ui = await $.ui.mount({ plugin: 'filetree', surface, component: 'Pane', requestId: 'filetree', props })
    await $.tool.call({ tool: 'Bash', command: 'git commit -m x' } as any)
    await clock.settle()
    const shown = await texts(ui)

    expect(shown).toContain('no commit: nothing to commit')
    expect(shown).not.toMatch(TURKISH_ONLY)
    await ui.unmount()
  })
}

test('the hub card reads like the film: changed this turn, then what git leaves', { timeoutMs: 20_000, plugins: [modz] } as any, async ($: any, on: any) => {
  const w = repo()
  const clock = world(on, w)
  await $.session.start({ cwd: ROOT, surface: 'desktop', isInteractive: true })
  await clock.settle()
  expect(await hub($)).toMatchObject({ pane: 'files', detail: '1 uncommitted change', tone: 'warn' })
  await editTurn($, clock)
  expect(await hub($)).toMatchObject({ detail: '1 changed this turn', tone: 'live' })
  w.status = '## main\0'
  await $.turn.complete({ answer: '', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' })
  await $.tool.call({ tool: 'Bash', command: 'touch c' } as any)
  await clock.settle()
  expect(await hub($)).toMatchObject({ detail: 'clean', tone: 'ok' })
})

test('a MODZ open request opens the pane titled Files', { timeoutMs: 20_000, plugins: [modz] } as any, async ($: any, on: any) => {
  const clock = world(on, repo())
  await $.session.start({ cwd: ROOT, surface: 'desktop', isInteractive: true })
  await clock.settle()
  const before = opens.length
  await $.command.run({ command: 'modz-open', args: 'files' })
  await clock.settle()
  expect(opens.slice(before).some(o => o.id === 'filetree' && o.title === 'Files')).toBe(true)
})
