import { expect, mock, test } from 'claude-code/testing'

// A desktop that reattaches keeps a tree whose buttons the engine already released; the band and the
// full-budget question are drawn again.

const STAMP = { key: 'render-stamp' }
const BAND = { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120, scroll: { offset: 0, bodyRows: 10 }, view: {} }
const QUESTION = { tool: 'AskUserQuestion', questions: [{ header: 'Bütçe', question: 'Oturum bütçesi doldu?', options: [] }] }
const cost = (usd: number) => ({ context: {}, rateLimits: [], cost: { usd }, changed: ['cost'] })
const site = (component: string, props: object) => ({
  plugin: 'session-budget', component, requestId: component, surface: 'desktop', viewport: { columns: 120, rows: 40 }, props,
})

type Renders = { count: number }

async function start($: any, on: any, renders: Renders) {
  mock.clock(on)
  on('session.start', () => ({ cwd: '/w' }))
  on('session.usage', () => ({ value: { startedAt: 0, context: {}, rateLimits: [], cost: { usd: 1 } } }))
  on('session.measure', (_: any, e: any) => ({ changed: e.changed }))
  on('session.surfaces', () => ({ value: ['desktop'] }))
  on('session.attach', (_: any, e: any) => ({ clientId: e.clientId }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('command.register', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  // Beneath the mod: each call is one drawing of a mounted instance.
  on('ui.render', () => {
    renders.count += 1

    return { type: 'engine', ref: 1 }
  })
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/w' })
  await $.command.run({ command: 'budget', args: '$5' })
}

test('a reattaching desktop gets the warning band drawn again', async ($: any, on: any) => {
  await start($, on, { count: 0 })
  await $.session.measure(cost(5))
  const band = await $.ui.mount(site('AbovePrompt', BAND))
  const before = (await band.find(STAMP))?.text
  expect(before).toBeDefined()

  await $.session.attach({ surface: 'desktop', clientId: 'desktop-2' })

  expect((await band.find(STAMP))?.text).not.toBe(before)
})

test('a reattaching desktop gets the full-budget question drawn again', async ($: any, on: any) => {
  const renders = { count: 0 }
  await start($, on, renders)
  await $.session.measure(cost(6.1))
  const question = await $.ui.mount(site('AskUserQuestion', QUESTION))
  expect(await question.find({ type: 'Svg' })).toBeDefined()
  const before = renders.count

  await $.session.attach({ surface: 'desktop', clientId: 'desktop-2' })

  // A drawing follows an invalidate before its next read, so the read comes first.
  expect(await question.find({ type: 'Svg' })).toBeDefined()
  expect(renders.count).toBeGreaterThan(before)
})
