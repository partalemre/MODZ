import { expect, test } from 'claude-code/testing'

import { SURFACES, bandOf, newWorld, paneOf, plannedTurn, setup, svgText, texts } from './fixtures'
import type { Surface, World } from './fixtures'

const OPEN_WAIT_MS = 200

// /replay opens the pane; a terminal with no room for it draws the replay in the band, returned here.
async function openFromBand($: any, clock: any, surface: Surface) {
  const opening = $.command.run({ command: 'replay', args: '' })
  await clock.advance(OPEN_WAIT_MS)
  await opening

  return $.ui.mount(bandOf(surface))
}

async function shown(pane: any, surface: Surface): Promise<string> {
  return surface === 'desktop' ? svgText(pane) : (await texts(pane)).join('\n')
}

for (const surface of SURFACES) {
  test(`${surface}: each step says what it does and which plan step it served`, async ($: any, on: any) => {
    const world = newWorld()
    const clock = await setup($, on, world)
    await plannedTurn($, world)
    await openFromBand($, clock, surface)
    const pane = await $.ui.mount(paneOf(surface))

    const first = await shown(pane, surface)
    expect(first).toContain('Düzenleme 1 / 2')
    expect(first).toContain('README içindeki çağrıyı yeni adla güncelliyorum')
    expect(first).toContain('Plan adımı 2/3')
    expect(first).toContain('Adı değiştir')

    await pane.press({ key: 'rt-next' })
    const second = await shown(pane, surface)
    expect(second).toContain('Düzenleme 2 / 2')
    expect(second).toContain('Selam dosyasını oluşturur')
    expect(second).toContain('yeni dosya')
    expect(world.modelCalls).toHaveLength(1)
    expect(world.modelCalls[0]).toMatchObject({ model: 'haiku', effort: 'low' })
    expect(world.modelCalls[0].prompt).toContain('### 1: src/hello.js')
    expect(world.modelCalls[0].prompt).not.toContain('README.md')

    expect((await pane.find({ key: 'rt-next' }))?.props?.label).toBe('Bitir')
    await pane.press({ key: 'rt-next' })
    expect(world.closed).toEqual(['replay-theater'])
  })

  test(`${surface}: a survey holds the band alone and a running turn adds nothing`, async ($: any, on: any) => {
    const world = newWorld()
    await setup($, on, world)
    await plannedTurn($, world)

    const survey = await $.ui.mount(bandOf(surface, { hasSurvey: true }))
    expect(await texts(survey)).toEqual(['engine'])
    await survey.unmount()
    expect(await texts(await $.ui.mount(bandOf(surface, { isWorking: true })))).toEqual(['engine'])
  })

  test(`${surface}: with no narration and no model answer the explanation is left out`, async ($: any, on: any) => {
    const world = newWorld()
    world.reply = null
    const clock = await setup($, on, world)
    await $.turn.start({ text: 'iş', turnId: 't1' })
    await $.tool.call({ tool: 'Edit', file_path: '/w/README.md', old_string: 'greet', new_string: 'welcome' })
    await $.turn.complete({ answer: '', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' })
    await openFromBand($, clock, surface)
    const pane = await $.ui.mount(paneOf(surface))

    const text = await shown(pane, surface)
    expect(text).toContain('Düzenleme 1 / 1')
    expect(text).not.toContain('Plan adımı')
    expect(text).not.toContain('açıklanıyor')
    expect(world.modelCalls).toHaveLength(1)
  })
}

async function oneEdit($: any, world: World, edit: Record<string, unknown>) {
  await $.turn.start({ text: 'iş', turnId: 't1' })
  await $.tool.call({ tool: 'Edit', file_path: '/w/README.md', old_string: 'greet', new_string: 'welcome', ...edit })
  await $.turn.complete({ answer: 'tamam', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' })
  void world
}

test('a tool description explains its edit at no cost, and the lines are cached', async ($: any, on: any) => {
  const world = newWorld()
  const clock = await setup($, on, world)
  await oneEdit($, world, { description: 'Çağrıyı yeni adla değiştirir' })
  await openFromBand($, clock, 'terminal')
  const pane = await $.ui.mount(paneOf('terminal'))

  expect(await texts(pane)).toContain('› Çağrıyı yeni adla değiştirir')
  const again = $.command.run({ command: 'replay', args: '' })
  await clock.advance(OPEN_WAIT_MS)
  expect(await again).toMatchObject({ text: 'Tekrar: 1 düzenleme' })
  expect(world.modelCalls).toHaveLength(0)
})

test('a refused edit is not recorded; /replay opens the pane on its empty state, with no transcript text', async ($: any, on: any) => {
  const world = newWorld()
  world.isDenying = true
  const clock = await setup($, on, world)
  await oneEdit($, world, {})

  expect(await texts(await $.ui.mount(bandOf('terminal')))).toEqual(['engine'])
  const opening = $.command.run({ command: 'replay', args: '' })
  await clock.advance(OPEN_WAIT_MS)
  expect((await opening)?.text).toBeUndefined()
  expect(world.opened).toEqual(['replay-theater'])
  for (const surface of SURFACES) {
    const pane = await $.ui.mount(paneOf(surface))
    const shown = [...(await texts(pane)), await svgText(pane)].join('\n')
    expect(shown).toContain('Henüz düzenleme yok')
  }
})

test('with no room for the pane and nothing to replay, /replay says so in one line', async ($: any, on: any) => {
  const world = newWorld()
  world.isPlaced = false
  const clock = await setup($, on, world)
  const opening = $.command.run({ command: 'replay', args: '' })
  await clock.advance(OPEN_WAIT_MS)
  expect(await opening).toMatchObject({ text: 'Tekrar: henüz düzenleme yok.' })
  expect(await texts(await $.ui.mount(bandOf('terminal')))).toEqual(['engine'])
})

test('a terminal with no room for the pane draws the replay in the band, above the other lines', async ($: any, on: any) => {
  const world = newWorld()
  world.isPlaced = false
  const clock = await setup($, on, world)
  await oneEdit($, world, {})
  const band = await openFromBand($, clock, 'terminal')

  const lines = await texts(band)
  expect(lines).toContain('Düzenleme 1 / 1')
  expect(lines[lines.length - 1]).toBe('engine')
  await band.press({ key: 'rt-close' })
  expect(await texts(band)).toEqual(['engine'])
})

test('the light theme draws light: every drawing follows it', async ($: any, on: any) => {
  const world = newWorld()
  world.theme = 'light'
  const clock = await setup($, on, world)
  await oneEdit($, world, {})
  await openFromBand($, clock, 'desktop')

  expect(await svgText(await $.ui.mount(paneOf('desktop')))).toContain('class="t-light"')
})
