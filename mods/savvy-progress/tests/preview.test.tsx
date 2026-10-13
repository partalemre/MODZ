import { expect, test } from 'claude-code/testing'

import { BAND, PANE, SECOND, finish, measure, modelStep, setup, spawn, threeRunning, tool } from './fixtures'

/** The test runner's console: bin/preview reads the trees it prints. */
declare const console: { log: (text: string) => void }

// Desktop trees for bin/preview: each logged tree becomes a PNG. A pane's tree is wrapped in a box
// as wide as its columns (8 px a column, as the renderer and MODZ measure), so the picture shows
// the pane at its own width rather than the renderer's page.
const dump = async (label: string, ui: any, cols?: number) => {
  const tree = await ui.drawn()
  const framed = cols ? { type: 'Box', props: { width: cols, flexDirection: 'column' }, children: [tree] } : tree
  console.log('@@TREE@@' + label + '@@' + JSON.stringify(framed))
  expect(tree).toBeDefined()
}

const MINUTE = 60 * SECOND

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

// Narrow ≈ a 400 px band and a 400 px side pane; wide ≈ the transcript's band and a 600 px pane.
const WIDTHS = { narrow: { band: 50, pane: 50 }, wide: { band: 92, pane: 75 } } as const

const dumpBand = async ($: any, label: string) => {
  for (const [name, cols] of Object.entries(WIDTHS)) {
    const ui = await $.ui.mount({ ...BAND, requestId: `band-${name}`, surface: 'desktop', props: { ...BAND.props, bodyColumns: cols.band } })
    await dump(`${label}-${name}`, ui)
  }
}

// Each press happens once, on the first mount: the panel's state outlives the mount.
const dumpPane = async ($: any, label: string, presses: string[] = []) => {
  let isFirst = true
  for (const [name, cols] of Object.entries(WIDTHS)) {
    const ui = await $.ui.mount({ ...PANE, surface: 'desktop', props: { ...PANE.props, bodyColumns: cols.pane } })
    if (isFirst) for (const key of presses) await ui.press({ key })
    isFirst = false
    await dump(`${label}-${name}`, ui, cols.pane)
    await ui.unmount()
  }
}

// A worker that reads, edits and runs tests over a few minutes, one call at a time.
async function work($: any, clock: any, agentId: string, calls: Record<string, unknown>[]) {
  for (const call of calls) {
    await clock.advance(9 * SECOND)
    await tool($, { ...call, agentId })
  }
}

const READS = ['src/hero.tsx', 'src/nav.tsx', 'package.json'].map(file => ({ tool: 'Read', file_path: `/w/site/${file}` }))
const EDITS = [{ tool: 'Edit', file_path: '/w/site/src/hero.tsx', old_string: 'a', new_string: 'b' }, { tool: 'Write', file_path: '/w/site/src/cta.tsx', content: '' }]
const TESTS = [{ tool: 'Bash', command: 'npm test' }]

test('preview: band, three agents running with no report', async ($, on) => {
  const { clock } = await setup($, on)
  await threeRunning($)
  await clock.advance(12 * SECOND)
  await dumpBand($, 'band-running-3-agents')
})

test('preview: band, reported flow at 2/4', async ($, on) => {
  const { clock } = await setup($, on)
  await launchKit($, clock)
  await dumpBand($, 'band-report-2-of-4')
})

test('preview: band, done with a failure', async ($, on) => {
  await setup($, on)
  await spawn($, 'Research competitors')
  await spawn($, 'Design the graphics')
  await finish($, 'a1')
  await finish($, 'a2', 'error')
  await dumpBand($, 'band-done-failed')
})

test('preview: panel empty, a resting crab and one action', async ($, on) => {
  await setup($, on)
  await dumpPane($, 'panel-empty')
})

test('preview: panel empty with the Yeni görev form open', async ($, on) => {
  await setup($, on)
  await dumpPane($, 'panel-new-task', ['new-task'])
})

test('preview: panel with running, finished and planned', async ($, on) => {
  const { clock } = await setup($, on)
  await launchKit($, clock)
  await measure($, 23.5, 1)
  await dumpPane($, 'panel-running-finished-planned')
})

test('preview: panel of effort-dressed agents', async ($, on) => {
  const { clock } = await setup($, on)
  await threeRunning($)
  await work($, clock, 'a1', READS)
  await work($, clock, 'a3', [...EDITS, ...TESTS])
  await finish($, 'a2')
  await measure($, 23.5, 1)
  await dumpPane($, 'panel-effort-costumes')
})

test('preview: panel with one running agent open: history, message and stop', async ($, on) => {
  const { clock } = await setup($, on)
  await threeRunning($)
  await work($, clock, 'a3', [...READS, ...TESTS])
  await work($, clock, 'a1', READS.slice(0, 1))
  await measure($, 23.5, 1)
  await dumpPane($, 'panel-history-open', ['open-a3'])
})

const BRIEF = 'Rebuild the landing hero: tighter headline, one primary action, the crab mascot on the right. Keep the copy under 12 words and check the layout at 360 px before you finish.'

const spawnBrief = ($: any, description: string) => $.agent.spawn({ prompt: BRIEF, description, subagentType: 'savvy-medium' })

// A Bash call left open, so the card shows a command in flight; resolved after the dump.
function holdBash(on: any): () => void {
  let release = () => {}
  const gate = new Promise<void>(resolve => (release = resolve))
  on('tool.call', { tool: 'Bash' }, async () => (await gate, { result: 'ok' }))
  return release
}

test('preview: panel with a busy agent open: task, a command in flight, recent calls and files', async ($, on) => {
  const release = holdBash(on)
  const { clock } = await setup($, on)
  await spawnBrief($, 'Rebuild the landing hero')
  await modelStep($, 'a1', 'medium')
  await work($, clock, 'a1', [...READS, ...EDITS, { tool: 'Read', file_path: '/w/site/src/styles/tokens.css' }])
  await tool($, { tool: 'mcp__savvy-progress__step', done: 3, total: 5, note: 'Hero copy', agentId: 'a1' })
  await clock.advance(9 * SECOND)
  const pending = tool($, { tool: 'Bash', command: 'npx playwright test hero.spec.ts --project=mobile', agentId: 'a1' })
  await clock.advance(14 * SECOND)
  await measure($, 23.5, 1)
  await dumpPane($, 'panel-detail-busy', ['open-a1'])
  release()
  await pending
})

test('preview: panel with a failed agent open on where it stopped', async ($, on) => {
  const { clock } = await setup($, on)
  await spawn($, 'Migrate the billing tables', 'savvy-careful')
  await modelStep($, 'a1', 'high')
  await work($, clock, 'a1', [...READS.slice(0, 2), { tool: 'Bash', command: 'npm run migrate' }])
  await finish($, 'a1', 'error')
  await dumpPane($, 'panel-detail-failed', ['open-a1'])
})

test('preview: panel with a finished agent open on its result', async ($, on) => {
  const { clock } = await setup($, on)
  await threeRunning($)
  await tool($, { tool: 'Read', file_path: '/w/mods/modz/hooks/catalog.ts', agentId: 'a1' })
  await tool($, { tool: 'Bash', command: 'bun test', agentId: 'a1' })
  await clock.advance(31 * SECOND)
  await $.turn.complete({ answer: 'Five findings, two verified by running the code. One bad marketplace entry kills the whole pane.', durationMs: 1, isAborted: false, turnId: 'turn-a1', agentId: 'a1', reason: 'answer' })
  await work($, clock, 'a2', READS)
  await work($, clock, 'a3', EDITS)
  await measure($, 23.5, 1)
  await dumpPane($, 'panel-result-open', ['open-a1'])
})

test('preview: panel with a question asked from the form: its answer and a follow-up on its way', async ($, on) => {
  const { clock, world } = await setup($, on)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'new-task' })
  await ui.input({ key: 'dispatch-task', text: 'Summarise what this repository ships' })
  world.roster.push({ id: 'a1', type: 'general-purpose', description: 'Summarise what this repository ships', status: 'running' })
  await clock.advance(2 * SECOND)
  await $.turn.complete({ answer: 'Seventeen mods for Claude Code, a hub that opens them, and a site that lists them.', durationMs: 1, isAborted: false, turnId: 'turn-a1', agentId: 'a1', reason: 'answer' })
  const field = (await ui.findAll({ type: 'Input' })).find((input: any) => String(input.props.key).startsWith('send-'))
  await ui.input({ key: String(field?.props?.key), text: 'Which of them run on the desktop?' })
  await ui.unmount()
  await dumpPane($, 'panel-asked-conversation')
})

test('preview: panel with a quiet agent: amber pill and the attention line', async ($, on) => {
  const { clock } = await setup($, on)
  await threeRunning($)
  await clock.advance(3 * MINUTE)
  await work($, clock, 'a2', READS)
  await work($, clock, 'a3', EDITS)
  await dumpPane($, 'panel-quiet-agent')
})

test('preview: panel with a fresh failure on the attention line', async ($, on) => {
  const { clock } = await setup($, on)
  await threeRunning($)
  await work($, clock, 'a1', READS)
  await work($, clock, 'a2', EDITS)
  await finish($, 'a2', 'error')
  await work($, clock, 'a3', TESTS)
  await dumpPane($, 'panel-failure')
})

test('preview: panel timeline of a busy crew', async ($, on) => {
  const { clock } = await setup($, on)
  await spawn($, 'Map the API surface', 'Explore')
  await work($, clock, 'a1', READS)
  await spawn($, 'Write the client', 'savvy-medium')
  await work($, clock, 'a2', [...READS.slice(0, 1), ...EDITS])
  await finish($, 'a1')
  await spawn($, 'Test the client', 'savvy-light')
  await work($, clock, 'a3', [...TESTS, ...EDITS, ...TESTS])
  await work($, clock, 'a2', TESTS)
  await finish($, 'a2')
  await spawn($, 'Review the change', 'savvy-heavy')
  await work($, clock, 'a4', READS)
  await dumpPane($, 'panel-timeline', ['done'])
})

test('preview: panel compact strip', async ($, on) => {
  const { clock } = await setup($, on)
  await launchKit($, clock)
  await dumpPane($, 'panel-compact', ['compact'])
})

test('preview: panel with agents and the form open on a refusal', async ($, on) => {
  const { clock } = await setup($, on, { deny: { Plan: 'plan mode is off in this session' } })
  await threeRunning($)
  await clock.advance(20 * SECOND)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'new-task' })
  await ui.select({ key: 'dispatch-type', value: 'Plan' })
  await ui.input({ key: 'dispatch-task', text: 'Plan the billing page' })
  await ui.unmount()
  await dumpPane($, 'panel-new-task-refused')
})
