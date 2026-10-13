// With no MODZ_LANG the replay speaks English, the film's words, and nothing Turkish-only shows.
import { expect, test } from 'claude-code/testing'

import { SURFACES, bandOf, newWorld, paneOf, replayCommand, said, settle, setup, startWithArchive, svgText, texts } from './fixtures'
import type { World } from './fixtures'

const OPEN_WAIT_MS = 200
const MINUTE_MS = 60_000
const TURKISH_ONLY = /[çğıöşüİ]/

const englishWorld = (): World => ({ ...newWorld(), env: {}, reply: '1: Adds the hello file.' })

const TODOS = [
  { content: 'Write the plan', status: 'completed', activeForm: 'Writing the plan' },
  { content: 'Rename the call', status: 'in_progress', activeForm: 'Renaming the call' },
  { content: 'Run the tests', status: 'pending', activeForm: 'Running the tests' },
]

async function englishTurn($: any, world: World) {
  world.messages = ([todo, edit, write]) => [
    { role: 'user', text: 'rename greet to welcome', toolUses: [] },
    said('Updating the call in the README.', [{ tool_use_id: todo as string, tool: 'TodoWrite' }, { tool_use_id: edit as string, tool: 'Edit' }]),
    said('', [{ tool_use_id: write as string, tool: 'Write' }]),
  ]
  await $.turn.start({ text: 'rename greet to welcome', turnId: 't1' })
  await $.tool.call({ tool: 'TodoWrite', todos: TODOS })
  await $.tool.call({ tool: 'Edit', file_path: '/w/README.md', old_string: 'Call greet(name)', new_string: 'Call welcome(name)' })
  await $.tool.call({ tool: 'Write', file_path: '/w/src/hello.js', content: 'hello\nworld\n' })
  await $.turn.complete({ answer: 'Renamed greet to **welcome**. Tests pass.', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' })
}

async function everything(site: any): Promise<string> {
  return [...(await texts(site)), await svgText(site), JSON.stringify(await site.drawn())].join('\n')
}

for (const surface of SURFACES) {
  test(`${surface}: the offer card speaks English`, async ($: any, on: any) => {
    const world = englishWorld()
    await setup($, on, world)
    await englishTurn($, world)
    const band = await $.ui.mount(bandOf(surface))
    const shown = await everything(band)

    expect((await band.find({ key: 'rt-open' }))?.props?.label).toBe('Watch the edits')
    expect((await band.find({ key: 'rt-dismiss' }))?.props?.label).toBe('Not now')
    expect(shown).toContain('2 edits · 2 files')
    expect(shown).toContain('or type /replay')
    if (surface === 'terminal') expect(await texts(band)).toContain('▶ REPLAY')
    else expect(await svgText(band)).toContain('REPLAY')
    expect(shown).not.toMatch(TURKISH_ONLY)
  })

  test(`${surface}: the pane speaks English, step by step`, async ($: any, on: any) => {
    const world = englishWorld()
    const clock = await setup($, on, world)
    await englishTurn($, world)
    await clock.advance(3 * MINUTE_MS)
    const opening = $.command.run({ command: 'replay', args: '' })
    await clock.advance(OPEN_WAIT_MS)
    expect(await opening).toMatchObject({ text: 'Replay: 2 edits' })
    const pane = await $.ui.mount(paneOf(surface))

    const first = await everything(pane)
    expect(first).toContain('2 edits in 2 files')
    expect(first).toContain('3m ago')
    expect(first).toContain('EDIT 1 / 2')
    expect(first).toContain('Plan step 2/3')
    expect(first).toContain('Updating the call in the README')
    expect((await pane.find({ key: 'rt-prev' }))?.props?.label).toBe('Previous')
    expect((await pane.find({ key: 'rt-next' }))?.props?.label).toBe('Next')
    expect((await pane.find({ key: 'rt-close' }))?.props?.label).toBe('Close')
    expect(first).not.toMatch(TURKISH_ONLY)

    await pane.press({ key: 'rt-next' })
    const second = await everything(pane)
    expect(second).toContain('new file')
    expect(second).toContain('Adds the hello file')
    expect((await pane.find({ key: 'rt-next' }))?.props?.label).toBe('Finish')
    expect(second).not.toMatch(TURKISH_ONLY)
    expect(world.modelCalls[0].prompt).toContain('English sentence')
  })

  test(`${surface}: the empty pane speaks English`, async ($: any, on: any) => {
    const world = englishWorld()
    const clock = await setup($, on, world)
    const opening = $.command.run({ command: 'replay', args: '' })
    await clock.advance(OPEN_WAIT_MS)
    await opening
    const shown = await everything(await $.ui.mount(paneOf(surface)))

    expect(shown).toContain('No edits yet')
    expect(shown).toContain('When Claude finishes a turn that edits files, its steps play here.')
    expect(shown).not.toMatch(TURKISH_ONLY)
  })
}

test('the desktop pane draws the English totals and legend', async ($: any, on: any) => {
  const world = englishWorld()
  const clock = await setup($, on, world)
  await englishTurn($, world)
  const opening = $.command.run({ command: 'replay', args: '' })
  await clock.advance(OPEN_WAIT_MS)
  await opening
  const drawn = await svgText(await $.ui.mount(paneOf('desktop')))

  expect(drawn).toContain('3 lines added')
  expect(drawn).toContain('1 removed')
  expect(drawn).toContain('EDITS IN ORDER')
  expect(drawn).toContain('Changed word')
})

test('with no room and nothing to replay, /replay says so in English', async ($: any, on: any) => {
  const world = { ...englishWorld(), isPlaced: false }
  const clock = await setup($, on, world)
  const opening = $.command.run({ command: 'replay', args: '' })
  await clock.advance(OPEN_WAIT_MS)
  expect(await opening).toMatchObject({ text: 'Replay: no edits yet.' })
})

test('the session list and a past turn speak English', async ($: any, on: any) => {
  const world = englishWorld()
  const clock = await startWithArchive($, on, world)
  await replayCommand($, clock, 'sessions')
  const pane = await $.ui.mount(paneOf('terminal'))
  const sessions = await everything(pane)

  expect(sessions).toContain('● PAST SESSIONS')
  expect(sessions).toContain('This project · 4 sessions')
  expect(sessions).toContain('This session · Oct 13')
  expect(sessions).toContain('3 turns · 5 edits')
  expect(sessions).toContain('1 turn · no edits')
  expect((await pane.find({ key: 'rt-this-session' }))?.props?.label).toBe('This session')
  await pane.press({ key: 'rt-session-s-old-open' })
  await settle(clock)
  expect(await everything(pane)).toContain('● TURNS WITH EDITS')
  expect((await pane.find({ key: 'rt-turn-2-open' }))?.props?.label).toBe('Watch')
  await pane.press({ key: 'rt-turn-2-open' })
  await settle(clock)
  expect(await everything(pane)).toContain('project root · Write · new file')
  await pane.press({ key: 'rt-next' })
  await pane.press({ key: 'rt-next' })
  const turn = await everything(pane)
  expect(turn).toContain('Turn 2')
  expect(turn).toContain('whole file; earlier text not in transcript')
  expect((await pane.find({ key: 'rt-turns' }))?.props?.label).toBe('Turns')
  expect(turn).not.toMatch(TURKISH_ONLY)
})
