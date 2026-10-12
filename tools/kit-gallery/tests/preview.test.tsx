import { expect, test } from 'claude-code/testing'

// The engine's test environment has a console; the shared lib typings predate it.
declare const console: { log: (text: string) => void }

const SECTIONS = ['cards', 'headers', 'type', 'icons', 'data', 'meters', 'steps', 'files', 'pills', 'loading']
const TERMINAL = ['cards', 'headers', 'type', 'icons', 'data', 'meters', 'pills']

const pane = (requestId: string, surface: 'desktop' | 'terminal') => ({
  plugin: 'kit-gallery',
  component: 'Pane',
  surface,
  requestId,
  viewport: { columns: 120, rows: 60 },
  props: { title: 'Kit galerisi', isFocused: true, bodyColumns: 95, placement: 'inline', scroll: { offset: 0, bodyRows: 60 }, view: {} },
}) as const

async function start($: any, on: any, surface: string) {
  on('command.register', () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/work' }))
  await $.session.start({ surface, isInteractive: true, cwd: '/work' })
}

for (const scheme of ['dark', 'light'] as const) {
  test(`gallery draws every section with Svg on the desktop (${scheme})`, async ($, on) => {
    await start($, on, 'desktop')
    for (const id of SECTIONS) {
      const ui = await $.ui.mount(pane(`kit-gallery:${id}:${scheme}`, 'desktop') as any)
      const tree = await ui.drawn()
      expect(await ui.find({ type: 'Svg' })).toBeDefined()
      console.log(`@@TREE@@desktop-${scheme}-${id}@@` + JSON.stringify(tree))
      await ui.unmount()
    }
  })
}

test('gallery draws text, no Svg, on the terminal', async ($, on) => {
  await start($, on, 'terminal')
  for (const id of TERMINAL) {
    const ui = await $.ui.mount(pane(`kit-gallery:${id}:dark`, 'terminal') as any)
    const tree = await ui.drawn()
    expect(await ui.find({ type: 'Svg' })).toBeUndefined()
    console.log(`@@TREE@@terminal-${id}@@` + JSON.stringify(tree))
    await ui.unmount()
  }
})
