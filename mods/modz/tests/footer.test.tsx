// The footer toggle: on the desktop the prompt footer's mode labels gain "MODZ", which puts the hub in the panel
// without the keyboard and takes it away again, as the app's own session-rail toggle does. The terminal keeps its footer.
import { expect, test } from 'claude-code/testing'

import { stubWorld } from './world'

const FOOTER = { plugin: 'modz', component: 'SessionMode', viewport: { columns: 100, rows: 40 }, props: { modes: ['focus', 'memory paused'] } } as const

function walk(node: any, out: any[] = []): any[] {
  if (node === null || typeof node !== 'object') return out
  out.push(node)
  for (const child of node.children ?? []) walk(child, out)

  return out
}

const textOf = (tree: any) => walk(tree).flatMap(node => (node.children ?? []).filter((c: unknown) => typeof c === 'string')).join('')
const toggleOf = (tree: any) => walk(tree).find(node => node.type === 'Button' && node.props?.key === 'modz-toggle')

async function desktop($: any, on: any) {
  const w = stubWorld(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })

  return { w, ui: await $.ui.mount({ ...FOOTER, surface: 'desktop' }) }
}

test('the desktop footer keeps the engine’s labels and adds a dim MODZ control', async ($: any, on: any) => {
  const { ui } = await desktop($, on)
  const tree = await ui.drawn()

  expect(textOf(tree)).toContain('focus & memory paused')
  expect(toggleOf(tree)?.props).toMatchObject({ label: 'MODZ', plain: true, dimColor: true })
})

test('with no labels the footer holds the control alone', async ($: any, on: any) => {
  stubWorld(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  const ui = await $.ui.mount({ ...FOOTER, surface: 'desktop', props: { modes: [] } })
  const tree = await ui.drawn()

  expect(toggleOf(tree)).toBeDefined()
  expect(walk(tree).filter(node => node.type === 'Text')).toHaveLength(0)
})

test('a press takes the hub away when it is shown, and the next brings it back without the keyboard', async ($: any, on: any) => {
  const { w, ui } = await desktop($, on)
  expect(w.up).toEqual(['modz'])

  await ui.press({ key: 'modz-toggle' })
  expect(w.up).toEqual([])

  await ui.press({ key: 'modz-toggle' })
  expect(w.up).toEqual(['modz'])
  expect(w.focused).toEqual([])
})

test('a press over another mod’s pane brings the hub back on stage', async ($: any, on: any) => {
  const { w, ui } = await desktop($, on)
  // Another mod's pane holds the panel: the hub stepped aside.
  w.up.splice(0, w.up.length, 'plan')

  await ui.press({ key: 'modz-toggle' })

  expect(w.up.at(-1)).toBe('modz')
  expect(w.opened.at(-1)).toBe('close:modz-mods')
})

test('the terminal footer is left to the engine', async ($: any, on: any) => {
  stubWorld(on)
  // The engine's own footer, beneath every plugin.
  on('ui.render', () => ({ type: 'Text', children: ['focus & memory paused'] }))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  const ui = await $.ui.mount({ ...FOOTER, surface: 'terminal' })

  expect(toggleOf(await ui.drawn())).toBeUndefined()
})
