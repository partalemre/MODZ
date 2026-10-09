import { mock, test } from 'claude-code/testing'

/** The test runner's console: bin/preview reads the trees it prints. */
declare const console: { log: (text: string) => void }

// Draws the in-app fallback row (done and waiting) on the desktop for bin/preview, per pinned theme.
const ok = (exitCode: number) => ({ value: { exitCode, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })
const band = (columns: number) => ({
  plugin: 'done-ping', component: 'AbovePrompt', requestId: `band-${columns}`, surface: 'desktop', viewport: { columns: 110, rows: 30 },
  props: { hasSurvey: false, isWorking: false, maxRows: 5, bodyColumns: columns, scroll: { offset: 0, bodyRows: 5 }, view: {} },
})
// Full width, then the band at about 520 px and 400 px (8 px a column); `-w<px>` sets the preview's page.
const SIZES = [{ tag: '', columns: 100 }, { tag: '-w520', columns: 65 }, { tag: '-w400', columns: 50 }]

async function setup($: any, on: any, theme: string) {
  const clock = mock.clock(on)
  mock.env(on, { MODZ_THEME: theme })
  for (const name of ['store.get', 'store.set', 'command.register', 'ui.log']) on(name, () => ({ value: undefined }))
  on('session.start', () => ({ cwd: '/work/eliti' }))
  on('session.surfaces', () => ({ value: ['desktop'] }))
  on('ui.render', () => ({ type: 'Box', props: {}, children: [] }))
  on('turn.start', (_: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', (_: any, e: any) => ({ text: e.answer }))
  on('fs.exists', () => ({ value: false }))
  on('tool.list', () => ({ value: [] }))
  on('tool.call', () => ({ result: 'ok' }))
  on('tool.check', () => ({ decision: 'ask' }))
  on('process.run', () => ok(1))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work/eliti' })

  return clock
}

const dump = async (label: string, ui: any) => console.log(`@@TREE@@${label}@@${JSON.stringify(await ui.drawn())}`)
const dumpSizes = async ($: any, label: string) => {
  for (const size of SIZES) await dump(`${label}${size.tag}`, await $.ui.mount(band(size.columns)))
}

for (const theme of ['dark', 'light']) {
  test(`preview ${theme}: turn done`, async ($: any, on: any) => {
    const clock = await setup($, on, theme)
    await $.turn.start({ text: 'go', turnId: 't' })
    for (const file of ['a.ts', 'b.ts', 'c.ts']) await $.tool.call({ tool: 'Edit', file_path: file, old_string: 'a', new_string: 'b' })
    await $.tool.call({ tool: 'Bash', command: 'npm test' })
    await $.turn.complete({ answer: 'ok', durationMs: 134_000, isAborted: false, turnId: 't', reason: 'answer' })
    await clock.advance(5)
    await dumpSizes($, `fallback-done-${theme}`)
  })

  test(`preview ${theme}: waiting on the person`, async ($: any, on: any) => {
    const clock = await setup($, on, theme)
    await $.tool.check({ tool: 'Edit', input: { file_path: '/w/src/app.ts' }, tool_use_id: 'u1' })
    await clock.advance(5)
    await dumpSizes($, `fallback-wait-${theme}`)
  })
}
