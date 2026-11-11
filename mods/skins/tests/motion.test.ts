// The settings and gallery panes in motion on the desktop (kit/moving.ts): every drawing in them, the 16 px icons
// too, is an interactive frame with a box that enters as its pane opens and keeps its very source while what it
// shows is unchanged. The transcript's rows, drawn by the same builders, stay plain images.
import { expect, test } from 'claude-code/testing'

import { runSkin, start, stubEngine } from './world'

const PANE_PROPS = { isFocused: true, bodyColumns: 94, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} } as const
const paneOf = (requestId: string) =>
  ({ plugin: 'skins', viewport: { columns: 100, rows: 30 }, surface: 'desktop', component: 'Pane', requestId, props: { ...PANE_PROPS, title: requestId } }) as const

const sources = async (pane: any): Promise<string[]> => (await pane.findAll({ type: 'Svg' })).map((svg: any) => svg.props.source as string)

const OPENERS = [
  ['skins-settings', ''],
  ['skins-gallery', 'gallery'],
] as const

for (const [id, args] of OPENERS) {
  test(`desktop ${id}: its drawings cascade in as boxed frames and keep their sources across a redraw`, async ($, on) => {
    stubEngine(on)
    await start($)
    await runSkin($, args)
    const pane = await $.ui.mount(paneOf(id))
    const svgs = await pane.findAll({ type: 'Svg' })
    const first = await sources(pane)

    expect(svgs.length).toBeGreaterThan(2)
    expect(svgs.every((svg: any) => svg.props.isInteractive === true && svg.props.width > 0 && svg.props.height > 0)).toBe(true)
    expect(first.every(source => source.includes(':root{color-scheme:light dark}') && source.includes('class="m-in"'))).toBe(true)

    await pane.redraw()
    expect(await sources(pane)).toEqual(first)

    await runSkin($, args)
    await pane.redraw()
    expect((await sources(pane)).every(source => source.includes('class="m-in"'))).toBe(true)
  })
}

test('the transcript row the panes sample stays a plain image', async ($, on) => {
  stubEngine(on)
  on('ui.render', () => ({ type: 'engine', ref: 0 }) as never)
  await start($)
  await runSkin($, 'gallery')
  const call = { tool_use_id: 'tu1', tool: 'Bash', input: { command: 'pnpm test' }, isRunning: false, isErrored: false, isInterrupted: false }
  const row = await $.ui.mount({ ...paneOf('tu1'), component: 'ToolUse', props: call })
  const svg: any = await row.find({ type: 'Svg' })

  expect(svg).toBeDefined()
  expect(svg.props.isInteractive).toBeUndefined()
  expect(svg.props.source).not.toContain('m-in')
})

// The desktop draws a plain Svg as a new image each time the transcript redraws, which any mod's `$.ui.invalidate`
// makes it do: an entrance left in the card would play again each time, the table loading over and over.
test('a reply\'s table card is drawn settled, while the gallery\'s frames keep their entrance', async ($, on) => {
  stubEngine(on)
  on('ui.render', { component: 'AssistantMessage' }, () => ({ type: 'engine', ref: 0 }) as never)
  await start($)
  const reply = await $.ui.mount({ ...paneOf('settled'), component: 'AssistantMessage', props: { text: '| A | B |\n|---|---|\n| 1 | 2 |', isFirstOfReply: true } })
  const [card] = await sources(reply)

  expect(card).toContain('animation:rise')
  expect(card).toContain('.rise,.card,.row,.rule{animation:none!important;opacity:1!important}')

  await runSkin($, 'gallery')
  const framed = (await sources(await $.ui.mount(paneOf('skins-gallery')))).filter(source => source.includes('animation:rise'))

  expect(framed.length).toBeGreaterThan(0)
  expect(framed.some(source => source.includes('animation:none!important;opacity'))).toBe(false)
})
