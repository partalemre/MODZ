import { expect, test } from 'claude-code/testing'

import { BAND, PANE, SECOND, finish, modelStep, setup, spawn, threeRunning, tool } from './fixtures'

// Desktop trees for bin/preview: each logged tree becomes a PNG.
const dump = async (label: string, ui: any) => {
  const tree = await ui.drawn()
  console.log('@@TREE@@' + label + '@@' + JSON.stringify(tree))
  expect(tree).toBeDefined()
}

const TASKS = [
  { title: 'Research competitor launches', tier: 'careful' },
  { title: 'Design the launch graphics', tier: 'medium' },
  { title: 'Build the landing page', tier: 'light' },
  { title: 'Review the whole kit', tier: 'heavy', after: [1, 2, 3] },
]

async function launchKit($: any, clock: any) {
  await tool($, { tool: 'mcp__savvy-progress__progress', title: 'Launch kit', tasks: TASKS, phase: 'delegate' })
  await spawn($, TASKS[0]!.title, 'savvy-careful')
  await spawn($, TASKS[1]!.title, 'savvy-medium')
  await spawn($, TASKS[2]!.title, 'savvy-light')
  for (const [id, effort] of [['a1', 'high'], ['a2', 'medium'], ['a3', 'low']] as const) await modelStep($, id, effort)
  await tool($, { tool: 'mcp__savvy-progress__step', done: 3, total: 5, note: 'Hero copy', agentId: 'a3' })
  await tool($, { tool: 'Write', file_path: '/w/site/src/Hero.tsx', content: '', agentId: 'a3' })
  await clock.advance(42 * SECOND)
  await finish($, 'a1')
  await clock.advance(9 * SECOND)
  await finish($, 'a2')
  await tool($, { tool: 'mcp__savvy-progress__progress', done: 2 })
  await clock.advance(5 * SECOND)
}

test('preview: band, three agents running with no report', async ($, on) => {
  const { clock } = await setup($, on)
  await threeRunning($)
  await clock.advance(12 * SECOND)
  await dump('band-running-3-agents', await $.ui.mount({ ...BAND, surface: 'desktop', props: { ...BAND.props, bodyColumns: 92 } }))
})

test('preview: band, one of three agents finished', async ($, on) => {
  await setup($, on)
  await threeRunning($)
  await finish($, 'a1')
  await tool($, { tool: 'mcp__savvy-progress__step', done: 2, total: 4, agentId: 'a2' })
  await dump('band-agents-partial', await $.ui.mount({ ...BAND, surface: 'desktop', props: { ...BAND.props, bodyColumns: 92 } }))
})

test('preview: band, reported flow at 2/4', async ($, on) => {
  const { clock } = await setup($, on)
  await launchKit($, clock)
  await dump('band-report-2-of-4', await $.ui.mount({ ...BAND, surface: 'desktop', props: { ...BAND.props, bodyColumns: 92 } }))
})

test('preview: band, done', async ($, on) => {
  await setup($, on)
  await spawn($, 'Research competitors')
  await spawn($, 'Design the graphics')
  await finish($, 'a1')
  await finish($, 'a2')
  await dump('band-done', await $.ui.mount({ ...BAND, surface: 'desktop', props: { ...BAND.props, bodyColumns: 92 } }))
})

test('preview: panel with running, finished and planned', async ($, on) => {
  const { clock } = await setup($, on)
  await launchKit($, clock)
  await dump('panel-running-finished-planned', await $.ui.mount({ ...PANE, surface: 'desktop' }))
})

test('preview: panel of effort-dressed agents', async ($, on) => {
  const { clock } = await setup($, on)
  await threeRunning($)
  await clock.advance(156 * SECOND)
  await finish($, 'a2')
  await dump('panel-effort-costumes', await $.ui.mount({ ...PANE, surface: 'desktop' }))
})

test('preview: panel with one agent work history open', async ($, on) => {
  const { clock } = await setup($, on)
  await threeRunning($)
  for (const file of ['src/hero.tsx', 'src/nav.tsx', 'package.json']) {
    await clock.advance(4 * SECOND)
    await tool($, { tool: 'Read', file_path: `/w/site/${file}`, agentId: 'a3' })
  }
  await tool($, { tool: 'Bash', command: 'npm test', agentId: 'a3' })
  await clock.advance(7 * SECOND)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'open-a3' })
  await dump('panel-history-open', ui)
})
