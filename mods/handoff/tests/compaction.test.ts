import { expect, test } from 'claude-code/testing'

import { MINUTE, bandOf, buttonsOf, compactBy, measure, newWorld, paneOf, said, start, stub } from './stubs'

// Compaction under control: working notes written before any compaction, offered back after it, one question near
// the auto-compaction point, the notes listed in the pane, old ones pruned.

const COMPACT_NOTE = /^\/w\/\.claude\/handoff\/\d{4}-\d{2}-\d{2}-\d{4}-compact\.md$/
const AFTER = ['handoff-restore', 'handoff-forget']
const DAY = 24 * 60 * MINUTE

for (const trigger of ['auto', 'manual'] as const) {
  test(`${trigger}: the notes are on disk before core compacts, with no model call`, async ($: any, on: any) => {
    const world = newWorld({ messages: [said('user', 'move the API to v2'), said('assistant', 'ok')] })
    stub(on, world)
    await start($, 'terminal')
    await $.tool.call({ tool: 'Edit', file_path: '/w/src/api.ts', old_string: 'a', new_string: 'b' })
    await measure($, 91)
    await compactBy($, trigger)

    expect(world.compacts).toBe(1)
    expect(world.filesAtCompact).toHaveLength(1)
    const [path] = world.filesAtCompact
    expect(path).toMatch(COMPACT_NOTE)
    expect(world.files[path!]).toContain('- move the API to v2')
    expect(world.files[path!]).toContain('- src/api.ts')
    expect(world.asked).toHaveLength(0)
    // A deliberate handoff for the next chat is left alone.
    expect(world.store['latest:/w']).toBeUndefined()
  })
}

test('after a compaction one line says what happened; Restore puts the notes back once', async ($: any, on: any) => {
  const world = newWorld({ messages: [said('user', 'move the API to v2')], sizes: { tokensBefore: 182_400, tokensAfter: 23_600 } })
  stub(on, world)
  await start($, 'terminal')
  await compactBy($, 'auto')
  const band = await $.ui.mount(bandOf('terminal'))

  expect(buttonsOf(await band.drawn())).toEqual(AFTER)
  expect(await band.find({ text: /182k → 24k/ })).toBeDefined()
  expect(world.appended).toHaveLength(0)

  await band.press({ key: 'handoff-restore' })
  expect(world.appended).toHaveLength(1)
  expect(world.appended[0].type).toBe('user')
  expect(world.appended[0].content[0].text).toContain('- move the API to v2')
  expect(buttonsOf(await band.drawn())).toEqual([])
})

test('"Dismiss" lets the line go and nothing is injected; sizes are left out when the engine gives none', async ($: any, on: any) => {
  const world = newWorld()
  stub(on, world)
  await start($, 'terminal')
  await compactBy($, 'manual')
  const band = await $.ui.mount(bandOf('terminal'))

  expect(await band.find({ text: /→/ })).toBeUndefined()
  await band.press({ key: 'handoff-forget' })
  expect(buttonsOf(await band.drawn())).toEqual([])
  expect(world.appended).toHaveLength(0)
})

test('a precompute and a subagent compaction write nothing and offer nothing', async ($: any, on: any) => {
  const world = newWorld()
  stub(on, world)
  await start($, 'terminal')
  await compactBy($, 'precompute')
  await compactBy($, 'auto', { agentId: 'a1' })

  expect(Object.keys(world.files)).toEqual([])
  expect(buttonsOf(await (await $.ui.mount(bandOf('terminal'))).drawn())).toEqual([])
})

test('one question near auto-compaction: compact now (notes kept) or hand off', async ($: any, on: any) => {
  // Auto-compaction at 78%: the line comes five points before it, under the 80% setting.
  const world = newWorld({ autoTokens: 156_000, sizes: { tokensBefore: 150_000, tokensAfter: 20_000 } })
  stub(on, world)
  await start($, 'terminal')
  await measure($, 72)
  const band = await $.ui.mount(bandOf('terminal'))
  expect(buttonsOf(await band.drawn())).toEqual([])

  await measure($, 73)
  expect(buttonsOf(await band.drawn())).toEqual(['handoff-compact', 'handoff-write', 'handoff-snooze'])
  expect(await band.find({ text: /summarized automatically at 78%/ })).toBeDefined()

  await band.press({ key: 'handoff-compact' })
  expect(world.compacts).toBe(1)
  expect(world.filesAtCompact[0]).toMatch(COMPACT_NOTE)
  expect(world.asked).toHaveLength(0)
  expect(buttonsOf(await band.drawn())).toEqual(AFTER)
  expect(await band.find({ text: /150k → 20k/ })).toBeDefined()
})

test('with auto-compaction off the line comes at the setting', async ($: any, on: any) => {
  stub(on, newWorld({ autoTokens: null }))
  await start($, 'terminal')
  await measure($, 80)
  const band = await $.ui.mount(bandOf('terminal'))
  expect(buttonsOf(await band.drawn())).toEqual(['handoff-compact', 'handoff-write', 'handoff-snooze'])
  expect(await band.find({ text: /summarized automatically at/ })).toBeUndefined()
})

test('the pane says what the mod does and lists the notes with their age; Delete removes one', async ($: any, on: any) => {
  const world = newWorld()
  const clock = stub(on, world)
  await start($, 'terminal')
  await compactBy($, 'auto')
  await clock.advance(3 * 60 * MINUTE)
  const pane = await $.ui.mount(paneOf('terminal'))

  expect(await pane.find({ text: /Before the chat is summarized/ })).toBeDefined()
  expect(await pane.find({ text: /3 h ago/ })).toBeDefined()
  const [path] = Object.keys(world.files)
  await pane.press({ key: 'handoff-drop-0' })
  expect(world.files[path!]).toBeUndefined()
  expect(world.store['notes:/w']).toEqual([])
  expect(buttonsOf(await pane.drawn())).not.toContain('handoff-drop-0')
})

test('notes older than seven days are pruned when a session starts', async ($: any, on: any) => {
  const old = { path: '/w/.claude/handoff/2026-01-01-0900-compact.md', at: -8 * DAY, kind: 'compact', trigger: 'auto', text: '# old' }
  const fresh = { path: '/w/.claude/handoff/2026-01-08-0900-compact.md', at: -DAY, kind: 'compact', trigger: 'auto', text: '# fresh' }
  const world = newWorld({ store: { 'notes:/w': [old, fresh] }, files: { [old.path]: '# old', [fresh.path]: '# fresh' } })
  stub(on, world)
  await start($, 'terminal')

  expect(world.files[old.path]).toBeUndefined()
  expect(world.files[fresh.path]).toBe('# fresh')
  expect(world.store['notes:/w']).toEqual([fresh])
})

test('Turkish: the after-compaction line speaks Turkish', async ($: any, on: any) => {
  stub(on, newWorld({ env: { MODZ_LANG: 'tr' } }))
  await start($, 'terminal')
  await compactBy($, 'auto')
  const band = await $.ui.mount(bandOf('terminal'))
  expect(await band.find({ type: 'Button', text: 'Çalışma notlarını geri yükle' })).toBeDefined()
})
