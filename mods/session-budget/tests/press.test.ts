import { expect, mock, test } from 'claude-code/testing'

// A desktop clicks the tree it last painted. Every redraw keeps each button's press handle, so a click
// on an earlier tree still lands.

const WIDER_BY = 20
const BAND = { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120, scroll: { offset: 0, bodyRows: 10 }, view: {} }
const cost = (usd: number) => ({ context: {}, rateLimits: [], cost: { usd }, changed: ['cost'] })
const site = (component: string, props: object) => ({
  plugin: 'session-budget', component, requestId: component, surface: 'desktop', viewport: { columns: 120, rows: 40 }, props,
})

function handlesOf(node: any, out: Record<string, number> = {}): Record<string, number> {
  if (node === null || typeof node !== 'object') return out
  if (node.press !== undefined && typeof node.props?.key === 'string') out[`${node.type}:${node.props.key}`] = node.press.handle
  for (const child of node.children ?? []) handlesOf(child, out)

  return out
}

async function start($: any, on: any) {
  mock.clock(on)
  mock.env(on, { MODZ_LANG: 'tr' })
  on('session.start', () => ({ cwd: '/w' }))
  on('session.usage', () => ({ value: { startedAt: 0, context: {}, rateLimits: [], cost: { usd: 1 } } }))
  on('session.measure', (_: any, e: any) => ({ changed: e.changed }))
  on('session.surfaces', () => ({ value: ['desktop'] }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('command.register', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('ui.render', () => ({ type: 'engine', ref: 1 }))
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/w' })
  await $.command.run({ command: 'budget', args: '$5' })
}

test('a warning band redraw keeps every button’s press handle', async ($: any, on: any) => {
  await start($, on)
  await $.session.measure(cost(5))
  const band = await $.ui.mount(site('AbovePrompt', BAND))
  const before = handlesOf(await band.drawn())
  await band.redraw({ ...BAND, bodyColumns: BAND.bodyColumns + WIDER_BY })

  expect(Object.keys(before).length).toBeGreaterThan(0)
  expect(handlesOf(await band.drawn())).toEqual(before)
})
