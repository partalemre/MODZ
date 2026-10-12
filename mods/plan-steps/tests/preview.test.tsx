import { mock, test } from 'claude-code/testing'

/** The test runner's console: bin/preview reads the trees it prints. */
declare const console: { log: (text: string) => void }

const MIN = 60_000
const TITLES = ['Tipleri ve durum sözleşmesini yaz', 'Görev listesi takibi', 'Markdown plan ayrıştırıcısı', 'Adım–görev bulanık eşleştirme: TodoWrite, TaskCreate ve plan dosyasındaki adımları tek listede birleştir', 'Panel çizimi: başlık, ölçer, adımlar', 'Durum satırı', 'ETA kuralı', 'Testler: terminal ve masaüstü', 'README']

const todos = (current: number) => TITLES.map((content, k) => ({ content, activeForm: content, status: k < current ? 'completed' : k === current ? 'in_progress' : 'pending' }))

// About 400 px and 600 px of the desktop's right pane.
const WIDTHS = { narrow: 56, wide: 82 }

const paneOf = (surface: 'desktop' | 'terminal', bodyColumns: number) => ({
  plugin: 'plan-steps', component: 'Pane', requestId: 'plan-steps', surface, viewport: { columns: 160, rows: 40 },
  props: { title: 'Plan', isFocused: false, bodyColumns, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
}) as const

async function setup($: any, on: any, theme: string) {
  const clock = mock.clock(on)
  mock.env(on, { MODZ_LANG: 'tr' })
  for (const name of ['command.register', 'ui.log', 'ui.status']) on(name, () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/w' }))
  on('config.list', () => ({ value: [{ key: 'theme', value: theme }] }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.render', () => ({ type: 'engine', ref: 1 }))
  on('fs.read', () => ({ value: '' }))
  on('tool.call', (_: any, e: any) => (e.tool === 'Agent' ? { result: { status: 'async_launched', agentId: 'ag-1', content: [] } } : { result: 'ok' }))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })

  return clock
}

for (const theme of ['dark', 'light']) {
  test(`preview ${theme}`, async ($: any, on: any) => {
    const clock = await setup($, on, theme)
    for (const [k, spent] of [4, 6, 3].entries()) {
      await $.tool.call({ tool: 'TodoWrite', todos: todos(k) })
      await clock.advance(spent * MIN)
    }
    await $.tool.call({ tool: 'TodoWrite', todos: todos(3) })
    await clock.advance(2 * MIN)
    await $.tool.call({ tool: 'Edit', file_path: '/w/hooks/match.ts', old_string: 'a', new_string: 'b' })
    await $.tool.call({ tool: 'Write', file_path: '/w/tests/match.test.ts', content: 'x' })
    await $.tool.call({ tool: 'Edit', file_path: '/w/hooks/parse.ts', old_string: 'a', new_string: 'b' })
    await $.tool.call({ tool: 'Edit', file_path: '/w/docs/superpowers/plans/2026-10-09-plan-steps.md', old_string: 'a', new_string: 'b' })
    await $.tool.call({ tool: 'Agent', description: 'Eşleştirme kenar durumları', prompt: 'p' })
    await clock.advance(4 * MIN)
    await $.command.run({ command: 'steps', args: '' })
    for (const [name, columns] of Object.entries(WIDTHS)) {
      const pane = await $.ui.mount(paneOf('desktop', columns))
      console.log(`@@TREE@@plan-steps-mid-${name}-${theme}@@` + JSON.stringify(await pane.drawn()))
      await pane.unmount()
    }
  })

  test(`preview ${theme}: no plan yet`, async ($: any, on: any) => {
    await setup($, on, theme)
    for (const [name, columns] of Object.entries(WIDTHS)) {
      const pane = await $.ui.mount(paneOf('desktop', columns))
      console.log(`@@TREE@@plan-steps-empty-${name}-${theme}@@` + JSON.stringify(await pane.drawn()))
      await pane.unmount()
    }
  })

  test(`preview ${theme}: stale and not started`, async ($: any, on: any) => {
    const clock = await setup($, on, theme)
    await $.tool.call({ tool: 'TodoWrite', todos: todos(2) })
    await clock.advance(45 * MIN)
    const stale = await $.ui.mount(paneOf('desktop', WIDTHS.narrow))
    console.log(`@@TREE@@plan-steps-stale-narrow-${theme}@@` + JSON.stringify(await stale.drawn()))
    await stale.unmount()
    await $.tool.call({ tool: 'TodoWrite', todos: TITLES.slice(0, 5).map(content => ({ content, activeForm: content, status: 'pending' })) })
    const fresh = await $.ui.mount(paneOf('desktop', WIDTHS.narrow))
    console.log(`@@TREE@@plan-steps-unstarted-narrow-${theme}@@` + JSON.stringify(await fresh.drawn()))
  })
}
