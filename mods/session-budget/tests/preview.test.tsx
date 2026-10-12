import { mock, test } from 'claude-code/testing'

/** The test runner's console: bin/preview reads the trees it prints. */
declare const console: { log: (text: string) => void }

// Visual states for bin/preview: each logs its drawn tree. The desktop Svg follows the page's
// scheme, so the same tree is logged again for the light page; `-w<px>` names a narrow band.
const log = async (label: string, ui: any) => {
  const tree = JSON.stringify(await ui.drawn())
  console.log(`@@TREE@@${label}@@${tree}`)
  if (label.includes('desktop')) console.log(`@@TREE@@${label}-light@@${tree}`)
}

type World = { answer: string }

function stub(on: any, world: World) {
  const clock = mock.clock(on)
  mock.env(on, { MODZ_LANG: 'tr' })
  on('session.start', () => ({ cwd: '/w' }))
  on('session.usage', () => ({ value: { startedAt: 0, context: {}, rateLimits: [], cost: { usd: 1 } } }))
  on('session.measure', (_: any, e: any) => ({ changed: e.changed }))
  on('session.surfaces', () => ({ value: ['desktop'] }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('command.register', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('ui.render', (_: any, e: any) => (e.component === 'AskUserQuestion' ? { type: 'engine', ref: 0 } : { type: 'Text', props: { dimColor: true }, children: ['(diğer bant satırları)'] }))
  on('prompt.submit', (_: any, e: any) => ({ text: e.text }))
  on('tool.call', (_: any, e: any) => ({ result: { answers: { [e.questions[0].question]: world.answer } } }))

  return clock
}

const cost = (usd: number) => ({ context: {}, rateLimits: [], cost: { usd }, changed: ['cost'] })
type Size = { tag: string; columns: number }
const site = (component: string, size: Size & { surface: string }, props: object) => ({
  plugin: 'session-budget', component, requestId: `${component}-${size.surface}${size.tag}`, surface: size.surface, viewport: { columns: size.columns, rows: 40 }, props,
})
const band = (size: Size) => ({ hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: size.columns, scroll: { offset: 0, bodyRows: 10 }, view: {} })
// Full width, the band at about 520 px and the right pane at about 400 px (8 px a column).
const SIZES: Size[] = [{ tag: '', columns: 110 }, { tag: '-w520', columns: 65 }, { tag: '-w400', columns: 50 }]
const CASES = [...SIZES.map(size => ({ ...size, surface: 'desktop' })), { tag: '', columns: 110, surface: 'terminal' }]
const QUESTION = { tool: 'AskUserQuestion', questions: [{ header: 'Bütçe', question: 'Oturum bütçesi doldu?', options: [] }] }

for (const size of CASES) {
  const { surface } = size
  const name = `${surface}${size.tag}`
  test(`preview budget states (${name})`, async ($: any, on: any) => {
    const world = { answer: 'Dur' }
    const clock = stub(on, world)
    await $.session.start({ surface, isInteractive: true, cwd: '/w' })
    await $.command.run({ command: 'budget', args: '$5' })
    await clock.advance(100 * 60_000)
    await $.session.measure(cost(5))
    const warn = await $.ui.mount(site('AbovePrompt', size, band(size)))
    await log(`budget-80-${name}`, warn)
    await warn.unmount()

    await $.session.measure(cost(6.1))
    await log(`budget-100-card-${name}`, await $.ui.mount(site('AskUserQuestion', size, QUESTION)))
    await $.prompt.submit({ text: 'bir şey daha', context: [], wait: false, origin: { kind: 'composer' } })
    await log(`budget-stopped-${name}`, await $.ui.mount(site('AbovePrompt', size, band(size))))
  })
}
