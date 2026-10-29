// The hub's motion on the desktop: each drawing is an interactive frame whose source changes only with what it
// shows, so unchanged rows keep their frames (and their loops) across redraws, a changed row lights up once, and
// the drawings enter again when the hub is put back in the panel.
import { expect, test } from 'claude-code/testing'

import { stableDrawings } from '../hooks/kit/stable'
import type { HubCard } from '../types'
import { stubWorld } from './world'

const PANE = { plugin: 'modz', component: 'Pane', requestId: 'modz', viewport: { columns: 100, rows: 40 }, props: { bodyColumns: 50 } } as const

const drawing = (source: string) => ({ source, alt: source, height: 1 })

test('a kept drawing is built once per what it shows: entering first, a change later, entering again after a reset', () => {
  const kept = stableDrawings()
  const phases: string[] = []
  const build = (phase: string) => {
    phases.push(phase)

    return drawing(`${phase}-${phases.length}`)
  }
  const first = kept.draw('row', { detail: 'a' }, build)
  expect(kept.draw('row', { detail: 'a' }, build)).toBe(first)
  kept.draw('row', { detail: 'b' }, build)
  kept.reset()
  kept.draw('row', { detail: 'b' }, build)

  expect(phases).toEqual(['enter', 'change', 'enter'])
})

const testsMod = {
  name: 'test-badge',
  register(on: any) {
    on('command.run', { command: 'say' }, async ($: any, e: any, next: any) => {
      await $.state.set({ plugin: 'test-badge', key: 'hub' }, JSON.parse(e.args))

      return next(e)
    })
  },
}

const card = (detail: string, tone: HubCard['tone'], at: number): HubCard => ({ pane: 'tests', detail, tone, at })

const sources = async (ui: any) => Object.fromEntries((await ui.findAll({ type: 'Svg' })).map((svg: any) => [svg.props.alt, svg.props.source]))

test('a changed card redraws only its own row; the rest keep their sources, pressed rows held still', { plugins: [testsMod] }, async ($: any, on: any) => {
  stubWorld(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  const say = (value: HubCard) => $.command.run({ command: 'say', args: JSON.stringify(value) })
  await say(card('41/42 geçti', 'bad', 1))
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const svgs = await ui.findAll({ type: 'Svg' })
  // Section labels are frames that enter; rows are images under their buttons, so they never animate.
  expect(svgs.some((svg: any) => svg.props.isInteractive === true && /class="m-fade"/.test(svg.props.source))).toBe(true)
  expect(svgs.filter((svg: any) => svg.props.isInteractive !== true).every((svg: any) => /animation:none!important/.test(svg.props.source))).toBe(true)
  const before = await sources(ui)

  await say(card('42/42 geçti', 'ok', 2))
  const after = await sources(ui)
  const changed = Object.keys(after).filter(alt => after[alt] !== before[alt])

  expect(changed).toEqual(['Testler: 42/42 geçti'])
})

test('live work lights its glyph; a quiet row stays in the quiet ink', { plugins: [testsMod] }, async ($: any, on: any) => {
  stubWorld(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'say', args: JSON.stringify(card('Çalışıyor 12/42', 'live', 1)) })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const all = await sources(ui)

  expect(all[Object.keys(all).find(alt => alt.startsWith('Testler')) ?? '']).toMatch(/<g class="fg-edit"><rect/)
  expect(all[Object.keys(all).find(alt => alt.startsWith('Kontrol')) ?? '']).toMatch(/<g class="f-mid"><rect/)
})
