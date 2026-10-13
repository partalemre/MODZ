import { expect, test } from 'claude-code/testing'

import { FOLDER, IDEAS, mine, mineWorld, paneSite, paneWords, wordsOf } from './ideas-world'
import { CHAT_A, CHAT_B } from './fixtures/chats'
import { TAIL_BYTES } from '../hooks/transcripts'
import { world } from './world'
import { BAND, start } from './world'

// `/mine` end to end: one model call, the Ideas pane's states on both surfaces, a rule saved through
// reflect's own card, Copy for the rest, and the way back to the MODZ hub.

const RULE = 'Use pnpm, not npm, in this repo'

const hubOn = {
  name: 'modz',
  register(on: any) {
    const heard: unknown[] = []
    on('command.run', { command: 'hub-on' }, async ($: any) => ($.state.set({ plugin: 'modz', key: 'isOn' }, true), {}))
    on('state.set', { key: 'home' }, async (_: any, e: any, next: any) => (heard.push(e.value), next(e)))
    on('command.run', { command: 'hub-heard' }, async () => ({ text: JSON.stringify(heard) }))
  },
}

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: /mine opens Ideas, asks the model once, and lists typed ideas with local counts`, async ($, on) => {
    const w = mineWorld(on, { ideas: IDEAS, lang: null })
    await start($)
    await mine($, w)
    expect(w.opened).toEqual(['reflect-ideas'])
    expect(w.mined).toHaveLength(1)
    expect(w.mined[0]).not.toContain('sk-')
    expect(w.mined[0]).not.toContain('fix the login bug')
    const { texts, buttons, alts } = await paneWords($, surface)
    const head = surface === 'desktop' ? alts.join(' ') : texts.join(' ')
    expect(head).toContain('2 ideas')
    expect(texts).toContain(RULE)
    expect(texts).toContain('Seen 2 times in 2 chats')
    expect(texts).toContain('Seen 3 times in 2 chats')
    expect(buttons).toEqual(['idea-save:0=Save to CLAUDE.md', 'idea-copy:1=Copy'])
  })

  test(`${surface}: with no repeating friction the pane says so, offers Run again, and the model is not called`, async ($, on) => {
    const w = mineWorld(on, { lang: null, chats: 'calm' })
    await start($)
    await mine($, w)
    expect(w.mined).toEqual([])
    const drawn = await paneWords($, surface)
    expect(JSON.stringify(drawn)).toContain('No repeating friction found in the last 1 chat')
    expect(drawn.buttons).toEqual(['mine-again=Run again'])
  })

  test(`${surface}: a project with no past chats says so`, async ($, on) => {
    const w = mineWorld(on, { lang: null, chats: 'none' })
    await start($)
    await mine($, w)
    expect(w.mined).toEqual([])
    expect(JSON.stringify(await paneWords($, surface))).toContain('No past chats found for this project')
  })

  test(`${surface}: an unusable answer shows the local candidates alone, with Try again`, async ($, on) => {
    const w = mineWorld(on, { ideas: 'sure! here are some ideas', lang: null })
    await start($)
    await mine($, w)
    const { texts, buttons } = await paneWords($, surface)
    expect(texts).toContain('Could not turn these into ideas; here is what repeats.')
    expect(texts).toContain('npm test')
    expect(buttons).toEqual(['mine-again=Try again'])
  })

  test(`${surface}: a rule idea goes to reflect's card and its CLAUDE.md choice, then reads as saved`, async ($, on) => {
    const w = mineWorld(on, { ideas: IDEAS, lang: null })
    await start($)
    await mine($, w)
    const pane = await $.ui.mount(paneSite(surface))
    await pane.press({ key: 'idea-save:0' })
    expect((await wordsOf(pane)).texts).toContain('✓ In the card above the prompt')
    const band = await $.ui.mount({ plugin: 'reflect-mod', surface, ...BAND })
    const keys = (await band.findAll({ type: 'Button' })).map(b => b.key ?? '')
    expect(keys.some(k => k.startsWith('pick-global:'))).toBe(true)
    await band.press({ key: keys.find(k => k.startsWith('save:')) ?? '' })
    expect(w.files['/repo/CLAUDE.md']).toContain(`- ${RULE}`)
    expect((await wordsOf(pane)).texts).toContain('✓ Saved to CLAUDE.md')
  })

  test(`${surface}: Copy puts the idea on the clipboard and says Copied for a moment`, async ($, on) => {
    const w = mineWorld(on, { ideas: IDEAS, lang: null })
    await start($)
    await mine($, w)
    const pane = await $.ui.mount(paneSite(surface))
    await pane.press({ key: 'idea-copy:1' })
    expect(w.clipboard).toEqual(['Make a PreToolUse hook that runs pnpm test instead of npm test'])
    expect((await wordsOf(pane)).buttons).toContain('idea-copy:1=Copied')
    await w.clock.advance(5000)
    expect((await wordsOf(pane)).buttons).toContain('idea-copy:1=Copy')
  })

  test(`${surface}: with the hub on, "← MODZ" heads the pane and writes home`, { plugins: [hubOn] }, async ($: any, on: any) => {
    const w = mineWorld(on, { ideas: IDEAS, lang: null })
    await start($)
    await mine($, w)
    await $.command.run({ command: 'hub-on', args: '' })
    const pane = await $.ui.mount(paneSite(surface))
    expect((await pane.findAll({ type: 'Button' }))[0]?.key).toBe('modz-home')
    await pane.press({ key: 'modz-home' })
    expect(JSON.parse((await $.command.run({ command: 'hub-heard', args: '' })).text)).toHaveLength(1)
  })
}

test('a rule already in CLAUDE.md is not offered again; Turkish words', async ($, on) => {
  const w = mineWorld(on, { ideas: IDEAS, files: { '/repo/CLAUDE.md': `# Repo\n- ${RULE}\n` } })
  await start($)
  await mine($, w)
  const pane = await $.ui.mount(paneSite('terminal'))
  expect((await pane.findAll({ type: 'Button' })).map(b => b.props.label)).toEqual(["CLAUDE.md'ye kaydet", 'Kopyala'])
  await pane.press({ key: 'idea-save:0' })
  expect((await wordsOf(pane)).texts).toContain("✓ Zaten CLAUDE.md'de")
  const band = await $.ui.mount({ plugin: 'reflect-mod', surface: 'terminal', ...BAND })
  expect(await band.findAll({ type: 'Button' })).toEqual([])
})

test('a blocked model leaves the local candidates; Try again runs one more call', async ($, on) => {
  const w = mineWorld(on, { ideas: 'throw', lang: null })
  await start($)
  await mine($, w)
  const pane = await $.ui.mount(paneSite('terminal'))
  await pane.press({ key: 'mine-again' })
  await w.clock.settle()
  expect(w.mined).toHaveLength(2)
  expect((await wordsOf(pane)).texts).toContain('Could not turn these into ideas; here is what repeats.')
})

test('a chat over 4 MiB is read from its end with tail, its torn first row dropped; a failing tail only skips it', async ($, on) => {
  const big = { name: 'big.jsonl', size: 5 * 1024 * 1024, mtimeMs: 9 }
  const w = world(on, {
    ideas: IDEAS, lang: null,
    files: { [`${FOLDER}/a.jsonl`]: CHAT_A },
    dirs: { [FOLDER]: [{ name: 'a.jsonl', mtimeMs: 1 }, big, { name: 'gone.jsonl', size: 6 * 1024 * 1024, mtimeMs: 8 }] },
    tails: { [`${FOLDER}/big.jsonl`]: `"half a row"}}\n${CHAT_B}` },
  })
  await start($)
  await mine($, w)
  expect(w.ran).toEqual([
    ['tail', '-c', String(TAIL_BYTES), '--', `${FOLDER}/big.jsonl`],
    ['tail', '-c', String(TAIL_BYTES), '--', `${FOLDER}/gone.jsonl`],
  ])
  expect(w.mined).toHaveLength(1)
  expect(w.mined[0]).toContain('"sample":"npm test"')
  const { alts } = await paneWords($, 'desktop')
  expect(alts.join(' ')).toContain('2 chats read · 1 from the end · 1 unreadable')
})
