import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'terminal-browser',
  component: 'Pane',
  requestId: 'browser',
  viewport: { columns: 100, rows: 30 },
  props: { title: 'tarayıcı', isFocused: true, bodyColumns: 90, placement: 'inline', scroll: { offset: 0, bodyRows: 24 }, view: {} },
} as const

async function start($: any, on: any, surfaces: string[]) {
  const registered: string[] = []
  on('session.surfaces', () => ({ value: surfaces }))
  on('session.start', () => ({ cwd: '/work' }))
  on('command.register', (_: any, e: any) => {
    registered.push(e.name)

    return { value: undefined }
  })
  on('tool.register', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  await $.session.start({ surface: surfaces[0] ?? 'terminal', isInteractive: true, cwd: '/work' })

  return registered
}

test('the terminal gets /browser', async ($, on) => {
  expect(await start($, on, ['terminal'])).toContain('browser')
})

test('the desktop gets no /browser and an empty pane', async ($, on) => {
  expect(await start($, on, ['desktop'])).not.toContain('browser')
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  expect(await ui.find({ type: 'Svg' })).toBeUndefined()
  expect(await ui.find({ type: 'Text' })).toBeUndefined()
})
