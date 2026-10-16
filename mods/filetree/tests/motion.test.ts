// The pane in motion on the desktop (kit/moving.ts): every card is an interactive frame that enters as the pane
// opens, keeps its very source while what it shows is unchanged, runs its live dot only while Claude works, and
// enters again when the pane opens anew. The tree rows stay a Client, their own clicks unswallowed.
import { expect, test } from 'claude-code/testing'

import { world } from './world'

const ROOT = '/Users/k/MODZ'
const REPO = { root: ROOT, files: ['a.ts', 'b.ts'], status: '## main\0', heads: { [ROOT]: ['1111111aaaa'] } }
const PROPS = { title: 'Dosyalar', isFocused: false, bodyColumns: 50, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} } as any
const PANE = { plugin: 'filetree', surface: 'desktop', component: 'Pane', requestId: 'filetree', props: PROPS } as const
const OPEN = { command: 'modz-open', args: 'files' }
// Stands for the MODZ main panel asking for the Files pane, as `modz` does.
const modz = {
  name: 'modz',
  register(on: any) {
    on('command.run', { command: 'modz-open' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'open' }, { pane: e.args, at: 1 })

      return {}
    })
  },
}
const WITH_HUB = { timeoutMs: 20_000, plugins: [modz] } as any
const DONE = { answer: '', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' }

const svgsOf = (pane: any) => pane.findAll({ type: 'Svg' })
const sources = async (pane: any): Promise<string[]> => (await svgsOf(pane)).map((svg: any) => svg.props.source as string)
const isEntering = (source: string) => source.includes('class="m-in"')

// The pane opened from the MODZ main panel: its tree is there, so it only opens, and the desktop draws it anew.
async function reopen($: any, at: { clock: any; pane: any }) {
  await $.command.run(OPEN)
  await at.pane.redraw(PROPS)
  await at.clock.settle()
}

// The desktop app with the pane drawn, its tree, git and look read, then opened.
async function opened($: any, on: any) {
  const clock = world(on, REPO)
  await $.session.start({ cwd: ROOT, surface: 'desktop', isInteractive: true })
  await clock.settle()
  const pane = await $.ui.mount(PANE)
  await clock.settle()
  await reopen($, { clock, pane })

  return { clock, pane }
}

test('desktop: the cards cascade in as sized frames and keep their sources across a redraw', WITH_HUB, async ($: any, on: any) => {
  const { clock, pane } = await opened($, on)
  const entered = await sources(pane)
  await $.turn.start({ text: 'go', turnId: 't1' })
  await $.tool.call({ tool: 'Read', file_path: `${ROOT}/a.ts` })
  await clock.settle()
  const svgs = await svgsOf(pane)
  const first = await sources(pane)

  expect(entered).toHaveLength(2)
  expect(entered.every(isEntering)).toBe(true)
  expect(svgs).toHaveLength(3)
  expect(svgs.every((svg: any) => svg.props.isInteractive === true && svg.props.width > 0 && svg.props.height > 0)).toBe(true)
  expect(first.every(source => source.includes(':root{color-scheme:light dark}'))).toBe(true)
  // The touched card is new with the read, so it enters; the hero changed, so it sweeps.
  expect(isEntering(first[1] ?? '')).toBe(true)
  expect(first[0]).toContain('class="m-sweep"')
  expect(await pane.findAll({ type: 'Client' })).toHaveLength(1)

  await pane.redraw({ ...PROPS, isFocused: !PROPS.isFocused })
  await clock.settle()
  expect(await sources(pane)).toEqual(first)
})

test('desktop: the live dot runs its rings while Claude works and stops once the turn ends', WITH_HUB, async ($: any, on: any) => {
  const { clock, pane } = await opened($, on)
  const hero = async () => (await sources(pane))[0] ?? ''

  expect(await hero()).not.toContain('m-ripple')
  await $.turn.start({ text: 'go', turnId: 't1' })
  await $.tool.call({ tool: 'Read', file_path: `${ROOT}/a.ts` })
  await clock.settle()
  expect(await hero()).toContain('m-ripple')

  await $.turn.complete(DONE)
  await clock.settle()
  expect(await hero()).not.toContain('m-ripple')
})

test('desktop: opening the pane again brings every card in anew', WITH_HUB, async ($: any, on: any) => {
  const { clock, pane } = await opened($, on)
  await $.turn.start({ text: 'go', turnId: 't1' })
  await $.tool.call({ tool: 'Read', file_path: `${ROOT}/a.ts` })
  await $.turn.complete(DONE)
  await clock.settle()
  expect((await sources(pane)).some(source => !isEntering(source))).toBe(true)

  await reopen($, { clock, pane })
  expect((await sources(pane)).every(isEntering)).toBe(true)
})
