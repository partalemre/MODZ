import { expect, test } from 'claude-code/testing'

import { SURFACES, newWorld, paneOf, plannedTurn, replayCommand, settle, setup, startWithArchive, svgText, texts } from './fixtures'
import { archiveWorld, BIG_ID, DIR, NOW_ID, OLD_ID } from './transcripts'

const MIB = String(1024 * 1024)

// Going back further than the last turn: this session's turns and this project's past sessions, read from
// their transcripts, each turn replayed step by step like the live one.

const shownIn = async (pane: any): Promise<string> => [...(await texts(pane)), await svgText(pane)].join('\n')

async function press(pane: any, clock: any, key: string): Promise<void> {
  await pane.press({ key })
  await settle(clock)
}

for (const surface of SURFACES) {
  test(`${surface}: /replay sessions lists the project's sessions with date, title, turns and edits`, async ($: any, on: any) => {
    const world = newWorld()
    const clock = await startWithArchive($, on, world)
    await replayCommand($, clock, 'sessions')
    const pane = await $.ui.mount(paneOf(surface))
    const shown = await shownIn(pane)

    expect(world.opened).toEqual(['replay-theater'])
    expect(shown).toContain('Bu proje · 4 oturum')
    expect(shown).toContain('Bu oturum')
    expect(shown).toContain('Fix the greeting')
    expect(shown).toContain('Rename greet to welcome everywhere')
    expect(shown).toContain('12 Eki')
    expect(shown).toContain('3 tur · 5 düzenleme')
    expect(shown).toContain('1 tur · düzenleme yok')
    expect(shown).toContain('Big refactor')
    expect(await pane.find({ key: `rt-session-${OLD_ID}-open` })).toBeDefined()
    // The desktop row is pressed as a whole: a plain cover whose label is a run of Hangul fillers, not an "Aç" button at its end.
    if (surface === 'desktop') {
      const cover = (await pane.find({ key: `rt-session-${OLD_ID}-open` }))?.props
      expect(cover?.plain).toBe(true)
      expect(String(cover?.label)).toMatch(/^\u3164+$/)
    }
    expect(await pane.find({ key: 'rt-session-s-empty-open' })).toBeUndefined()
    expect(world.spawned).toEqual([['dd', `if=${DIR}/${BIG_ID}.jsonl`, `bs=${MIB}`, 'skip=0']])
  })

  test(`${surface}: a past turn replays step by step, its subagent's edit too, and Finish returns to its turns`, async ($: any, on: any) => {
    const world = newWorld()
    const clock = await startWithArchive($, on, world)
    await replayCommand($, clock, 'sessions')
    const pane = await $.ui.mount(paneOf(surface))
    await press(pane, clock, `rt-session-${OLD_ID}-open`)

    const turns = await shownIn(pane)
    expect(turns).toContain('3 tur · 5 düzenleme')
    expect(turns).toContain('“Rename greet to welcome everywhere”')
    expect(turns).toContain('“Add a changelog”')
    expect(turns).toContain('3 düzenleme · 3 dosya')

    await press(pane, clock, 'rt-turn-1-open')
    const first = await shownIn(pane)
    expect(first).toContain('Düzenleme 1 / 2')
    expect(first).toContain('Tur 1')
    expect(first).toContain('I rename the function first, then the docs')
    expect(first).toContain('Plan adımı 1/2')
    expect(first).toContain('yalnızca düzenlenen kısım')

    await press(pane, clock, 'rt-next')
    const second = await shownIn(pane)
    expect(second).toContain('Düzenleme 2 / 2')
    expect(second).toContain('guide.md')
    expect(second).toContain('Updating the guide')
    expect((await pane.find({ key: 'rt-next' }))?.props?.label).toBe('Bitir')

    await press(pane, clock, 'rt-next')
    expect(await pane.find({ key: 'rt-turn-2-open' })).toBeDefined()
    expect(world.closed).toEqual([])
    expect(world.modelCalls).toHaveLength(0)
  })
}

test('from the live replay, Turns lists this session’s turns from its transcript', async ($: any, on: any) => {
  const world = newWorld()
  const clock = await startWithArchive($, on, world)
  await plannedTurn($, world)
  await replayCommand($, clock, '')
  const pane = await $.ui.mount(paneOf('terminal'))
  await press(pane, clock, 'rt-turns')

  const shown = await shownIn(pane)
  expect(shown).toContain('Düzenleme yapan turlar')
  expect(shown).toContain('· Bu oturum')
  expect(shown).toContain('“Fix the greeting”')
  expect(shown).toContain('Tur 1 · 1 düzenleme · 1 dosya')
  await press(pane, clock, 'rt-turn-1-open')
  expect(await texts(pane)).toContain('› Fixing the typo')
})

test('a transcript past the read cap is read from its end and says so', async ($: any, on: any) => {
  const world = newWorld()
  const clock = await startWithArchive($, on, world)
  const big = world.dirs[DIR]!.find(entry => entry.name === `${BIG_ID}.jsonl`)!
  big.size = 50 * 1024 * 1024
  await replayCommand($, clock, 'sessions')
  const pane = await $.ui.mount(paneOf('terminal'))
  await press(pane, clock, `rt-session-${BIG_ID}-open`)

  const shown = await shownIn(pane)
  expect(world.spawned.at(-1)).toEqual(['dd', `if=${DIR}/${BIG_ID}.jsonl`, `bs=${MIB}`, 'skip=2'])
  expect(shown).toContain('çok büyük kaydın yalnızca son kısmı okundu')
  expect(shown).toContain('1 düzenleme · 1 dosya')
})

test('with no transcript the lists say there is nothing to read', async ($: any, on: any) => {
  const world = newWorld()
  const clock = await setup($, on, world)
  await replayCommand($, clock, 'sessions')
  const pane = await $.ui.mount(paneOf('terminal'))

  expect(await texts(pane)).toContain('Okunacak kayıt yok')
  await press(pane, clock, 'rt-this-session')
  expect(await texts(pane)).toContain('Okunacak kayıt yok')
})

test('list lines are kept across sessions: a session read before is not read again', async ($: any, on: any) => {
  const world = newWorld()
  const archive = archiveWorld()
  const listed = archive.dirs[DIR]!.find(entry => entry.name === `${OLD_ID}.jsonl`)!
  world.store.sessions = { [OLD_ID]: { size: listed.size, mtimeMs: listed.mtimeMs, title: 'Kept from before', turns: 9, edits: 7, isCut: false }, junk: { size: 'x' } }
  const clock = await startWithArchive($, on, world)
  await replayCommand($, clock, 'sessions')

  expect(await shownIn(await $.ui.mount(paneOf('terminal')))).toContain('Kept from before')
  expect(world.reads).not.toContain(`${DIR}/${OLD_ID}.jsonl`)
  const kept = world.store.sessions as Record<string, { title: string }>
  expect(Object.keys(kept).sort()).toEqual([BIG_ID, 's-empty', NOW_ID, OLD_ID].sort())
  expect(kept[NOW_ID]?.title).toBe('Fix the greeting')
})

test('a transcript that cannot be read says so in its row', async ($: any, on: any) => {
  const world = newWorld()
  const clock = await startWithArchive($, on, world)
  delete world.streamed[`${DIR}/${BIG_ID}.jsonl`]
  await replayCommand($, clock, 'sessions')

  expect(await shownIn(await $.ui.mount(paneOf('terminal')))).toContain('kayıt okunamadı')
  expect(Object.keys(world.store.sessions as object)).not.toContain(BIG_ID)
})

test('a long list shows its newest rows first, then More shows the rest', async ($: any, on: any) => {
  const world = newWorld()
  const clock = await startWithArchive($, on, world)
  const extra = Array.from({ length: 6 }, (_, k) => ({ name: `s-extra${k}.jsonl`, kind: 'file', size: 10, mtimeMs: 1_000 + k, isLink: false }))
  world.dirs[DIR]!.push(...extra)
  for (const entry of extra) world.files[`${DIR}/${entry.name}`] = '{"type":"user","message":{"content":"hi"}}'
  await replayCommand($, clock, 'sessions')
  const pane = await $.ui.mount(paneOf('terminal'))

  expect((await pane.find({ key: 'rt-more' }))?.props?.label).toBe('Daha fazla (2)')
  expect(await shownIn(pane)).not.toContain('s-extra0')
  await pane.press({ key: 'rt-more' })
  expect(await pane.find({ key: 'rt-more' })).toBeUndefined()
  expect(await shownIn(pane)).toContain('Bu proje · 10 oturum')
})
