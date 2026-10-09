import { expect, test } from 'claude-code/testing'

import { opens, world } from './world'
import type { World } from './world'

// The MODZ main panel's data path (DESIGN.md §9) and commits judged in the repo they ran in.

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

const props = { title: 'Dosyalar', isFocused: false, bodyColumns: 50, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} } as any
const texts = async (ui: any) => JSON.stringify(await ui.drawn()) + JSON.stringify(await ui.drawn({ in: 'rows' }))
const SEED = 'P=/Users/k/playground; mkdir -p $P && cd $P && git init -q -b main\ngit add -A && git commit -qm "chore: seed" && bun test | tail -4'

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: a commit in another repo is a success there, not a failure here`, { timeoutMs: 20_000 }, async ($, on) => {
    const root = '/Users/k/MODZ'
    const w: World = { root, files: ['a.ts'], status: '## main\0 M a.ts\0', heads: { [root]: ['1111111aaaa'], '/Users/k/playground': ['', '2222222bbbb'] } }
    const clock = world(on, w)
    await $.session.start({ cwd: root, surface, isInteractive: true })
    await clock.settle()
    const ui = await $.ui.mount({ plugin: 'filetree', surface, component: 'Pane', requestId: 'filetree', props })
    await $.tool.call({ tool: 'Bash', command: SEED } as any)
    await clock.settle()
    const shown = await texts(ui)
    expect(shown).toContain('commit edildi · playground')
    expect(shown).not.toContain('başarısız')
    expect(shown).not.toContain('oluşmadı')
    expect(shown).not.toContain('commit etti')
    await ui.unmount()
  })

  test(`${surface}: a commit git refused says why`, { timeoutMs: 20_000 }, async ($, on) => {
    const root = '/Users/k/MODZ'
    const w: World = {
      root, files: ['a.ts'], status: '## main\0', heads: { [root]: ['1111111aaaa'] },
      tool: () => ({ isError: true, result: 'Exit code 1', text: 'On branch main\nnothing to commit, working tree clean' }),
    }
    const clock = world(on, w)
    await $.session.start({ cwd: root, surface, isInteractive: true })
    await clock.settle()
    const ui = await $.ui.mount({ plugin: 'filetree', surface, component: 'Pane', requestId: 'filetree', props })
    await $.tool.call({ tool: 'Bash', command: 'git commit -m x' } as any)
    await clock.settle()
    expect(await texts(ui)).toContain('commit olmadı: değişiklik yok')
    await ui.unmount()
  })
}

test('hub card: written at start, live during a turn, then what git leaves', { timeoutMs: 20_000, plugins: [modz] } as any, async ($: any, on: any) => {
  const root = '/Users/k/MODZ'
  const w: World = { root, files: ['a.ts', 'b.ts'], status: '## main\0 M a.ts\0?? b.ts\0', heads: { [root]: ['1111111aaaa'] } }
  const clock = world(on, w)
  await $.session.start({ cwd: root, surface: 'desktop', isInteractive: true })
  await clock.settle()
  expect(await hub($)).toMatchObject({ pane: 'files', detail: '2 değişiklik commit edilmedi', tone: 'warn' })
  await $.turn.start({ text: 'go', turnId: 't1' })
  await $.tool.call({ tool: 'Read', file_path: `${root}/a.ts` } as any)
  await clock.settle()
  expect(await hub($)).toMatchObject({ detail: '1 dosya bu tur', tone: 'live' })
  w.status = '## main\0'
  await $.turn.complete({ answer: '', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' })
  await $.tool.call({ tool: 'Bash', command: 'touch c' } as any)
  await clock.settle()
  expect(await hub($)).toMatchObject({ detail: 'temiz', tone: 'ok' })
})

test('modz.open with pane "files" opens the pane titled Dosyalar; another pane key does not', { timeoutMs: 20_000, plugins: [modz] } as any, async ($: any, on: any) => {
  const root = '/Users/k/MODZ'
  const clock = world(on, { root, files: ['a.ts'], status: '## main\0', heads: { [root]: ['1111111aaaa'] } })
  await $.session.start({ cwd: root, surface: 'desktop', isInteractive: true })
  await clock.settle()
  const before = opens.length
  await $.command.run({ command: 'modz-open', args: 'agents' })
  await clock.settle()
  expect(opens.length).toBe(before)
  await $.command.run({ command: 'modz-open', args: 'files' })
  await clock.settle()
  expect(opens.slice(before).some(o => o.id === 'filetree' && o.title === 'Dosyalar' && o.focus === true)).toBe(true)
})

test('desktop toolbar: one row, the rest under Daha fazla, and single-key shortcuts', { timeoutMs: 20_000 }, async ($, on) => {
  const root = '/Users/k/MODZ'
  const clock = world(on, { root, files: ['.env', 'a.ts'], status: '## main\0', heads: { [root]: ['1111111aaaa'] } })
  await $.session.start({ cwd: root, surface: 'desktop', isInteractive: true })
  await clock.settle()
  const ui = await $.ui.mount({ plugin: 'filetree', surface: 'desktop', component: 'Pane', requestId: 'filetree', props })
  await clock.settle()
  const shown = await texts(ui)
  for (const label of ['Daralt', 'Yenile', 'Daha fazla']) expect(shown).toContain(label)
  for (const label of ['Boyutları göster', 'Üst klasör', 'Projeye dön', 'Gizlileri gizle']) expect(shown).not.toContain(label)
  expect(shown).toContain('.env')
  await ui.post({ key: '.' }, { in: 'rows' })
  await clock.settle()
  expect(await texts(ui)).not.toContain('.env')
  await ui.press({ key: 'more' })
  await clock.settle()
  const open = await texts(ui)
  for (const label of ['Boyutları göster', 'Üst klasör', 'Projeye dön', 'Gizlileri göster', 'Daha az', 'Ağaç seçiliyken']) expect(open).toContain(label)
  await ui.unmount()
})

test('hub card: after a turn that committed, the commit and a clean tree', { timeoutMs: 20_000, plugins: [modz] } as any, async ($: any, on: any) => {
  const root = '/Users/k/MODZ'
  const w: World = { root, files: ['a.ts'], status: '## main\0 M a.ts\0', heads: { [root]: ['1111111aaaa', '2222222bbbb'] } }
  const clock = world(on, w)
  await $.session.start({ cwd: root, surface: 'desktop', isInteractive: true })
  await clock.settle()
  await $.turn.start({ text: 'commit it', turnId: 't1' })
  w.status = '## main\0'
  await $.tool.call({ tool: 'Bash', command: 'git commit -am "fix: a"' } as any)
  await clock.settle()
  await $.turn.complete({ answer: '', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' })
  await clock.settle()
  expect(await hub($)).toMatchObject({ detail: 'commit 2222222 · temiz', tone: 'ok' })
})
