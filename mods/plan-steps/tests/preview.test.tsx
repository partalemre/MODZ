import { mock, test } from 'claude-code/testing'

const MIN = 60_000
const TITLES = ['Tipleri ve durum sözleşmesini yaz', 'Görev listesi takibi', 'Markdown plan ayrıştırıcısı', 'Adım–görev bulanık eşleştirme', 'Panel çizimi: başlık, ölçer, adımlar', 'Durum satırı', 'ETA kuralı', 'Testler: terminal ve masaüstü', 'README']

const todos = (current: number) => TITLES.map((content, k) => ({ content, activeForm: content, status: k < current ? 'completed' : k === current ? 'in_progress' : 'pending' }))

const paneOf = (surface: 'desktop' | 'terminal') => ({
  plugin: 'plan-steps', component: 'Pane', requestId: 'plan-steps', surface, viewport: { columns: 160, rows: 40 },
  props: { title: 'Plan', isFocused: false, bodyColumns: 62, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
}) as const

async function setup($: any, on: any, theme: string) {
  const clock = mock.clock(on)
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
    await $.tool.call({ tool: 'Agent', description: 'Eşleştirme kenar durumları', prompt: 'p' })
    await clock.advance(4 * MIN)
    await $.command.run({ command: 'steps', args: '' })
    const pane = await $.ui.mount(paneOf('desktop'))
    console.log(`@@TREE@@plan-steps-mid-${theme}@@` + JSON.stringify(await pane.drawn()))
  })
}
