import { mock, test } from 'claude-code/testing'

// Visual states for bin/preview: each logs its drawn tree.
const log = async (label: string, ui: any) => console.log(`@@TREE@@${label}@@${JSON.stringify(await ui.drawn())}`)

type World = { answer: string }

function stub(on: any, world: World) {
  const clock = mock.clock(on)
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
const site = (component: string, surface: string, props: object) => ({
  plugin: 'session-budget', component, requestId: `${component}-${surface}`, surface, viewport: { columns: 110, rows: 40 }, props,
})
const BAND = { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 110, scroll: { offset: 0, bodyRows: 10 }, view: {} }
const QUESTION = { tool: 'AskUserQuestion', questions: [{ header: 'Bütçe', question: 'Oturum bütçesi doldu?', options: [] }] }

for (const surface of ['desktop', 'terminal']) {
  test(`preview budget states (${surface})`, async ($: any, on: any) => {
    const world = { answer: 'Dur' }
    const clock = stub(on, world)
    await $.session.start({ surface, isInteractive: true, cwd: '/w' })
    await $.command.run({ command: 'budget', args: '$5' })
    await clock.advance(100 * 60_000)
    await $.session.measure(cost(5))
    const warn = await $.ui.mount(site('AbovePrompt', surface, BAND))
    await log(`budget-80-${surface}`, warn)
    await warn.unmount()

    await $.session.measure(cost(6.1))
    await log(`budget-100-card-${surface}`, await $.ui.mount(site('AskUserQuestion', surface, QUESTION)))
    await $.prompt.submit({ text: 'bir şey daha', context: [], wait: false, origin: { kind: 'composer' } })
    await log(`budget-stopped-${surface}`, await $.ui.mount(site('AbovePrompt', surface, BAND)))
  })
}
