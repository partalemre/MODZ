import { expect } from 'claude-code/testing'

import { test, OTHERS, SURFACES, setup } from './fixtures'
import { planStepOf, textKey } from '../hooks/agents'
import { benchCard, rowCrab } from '../hooks/row-crab'
import { workKindOf } from '../hooks/work-kind'
import { crewAt } from '../hooks/transcript'

// The `progress` and `step` rows fold away in the transcript; anything else, or a failed call, stays.

const PROGRESS = 'mcp__savvy-progress__progress'
const STEP = 'mcp__savvy-progress__step'

// Each mount is its own instance, as each row of a transcript is.
let seq = 0
const nextId = () => `tu${++seq}`

type Surface = (typeof SURFACES)[number]

const row = (surface: Surface, tool: string, extra = {}) => {
  const id = nextId()
  return {
    plugin: 'savvy-progress',
    surface,
    component: 'ToolUse' as const,
    requestId: id,
    props: { tool_use_id: id, tool, input: {}, isRunning: false, isErrored: false, isInterrupted: false, ...extra },
  }
}

const group = (surface: Surface, tools: string[]) => ({
  plugin: 'savvy-progress',
  surface,
  component: 'ToolGroup' as const,
  requestId: nextId(),
  props: { calls: tools.map(tool => ({ tool, input: {}, isRunning: false, isErrored: false, isInterrupted: false })), isActive: false, isExpanded: false },
})

const isEmptyBox = (tree: any) => tree?.type === 'Box' && (tree.children ?? []).length === 0

for (const surface of SURFACES) {
  test(`${surface}: a progress or step call that went well draws nothing`, async ($, on) => {
    await setup($, on)
    for (const tool of [PROGRESS, STEP]) expect(isEmptyBox(await (await $.ui.mount(row(surface, tool))).drawn())).toBe(true)
    const id = nextId()
    const result = { plugin: 'savvy-progress', surface, component: 'ToolResult' as const, requestId: id, props: { tool_use_id: id, tool: PROGRESS, output: 'ok', isErrored: false } }
    expect(isEmptyBox(await (await $.ui.mount(result)).drawn())).toBe(true)
  })

  test(`${surface}: other tools and failed calls keep the engine's row`, async ($, on) => {
    await setup($, on)
    expect(await (await $.ui.mount(row(surface, 'Bash'))).drawn()).toEqual(OTHERS)
    expect(await (await $.ui.mount(row(surface, PROGRESS, { isErrored: true }))).drawn()).toEqual(OTHERS)
    expect(await (await $.ui.mount(row(surface, STEP, { isInterrupted: true }))).drawn()).toEqual(OTHERS)
  })

  test(`${surface}: a group of only these calls folds away, a mixed one keeps its count line`, async ($, on) => {
    await setup($, on)
    expect(isEmptyBox(await (await $.ui.mount(group(surface, [PROGRESS, PROGRESS]))).drawn())).toBe(true)
    expect(await (await $.ui.mount(group(surface, [PROGRESS, 'Read']))).drawn()).toEqual(OTHERS)
  })
}

// A helper agent's crab stands on the row of the Agent call that started it, at work and after.

const AGENT_CALL = { tool: 'Agent', tool_use_id: 'tu-agent' }
const helper = (over = {}) =>
  ({ id: 'a1', agentId: 'a1', toolUseId: 'tu-agent', type: 'Explore', description: 'look around', status: 'running', steps: 4, lastTool: 'Bash', lastKind: 'run', lastPlain: 'testleri çalıştırıyor', look: 1, ...over }) as any

test('an agent at work follows the conversation to its newest row; one that ended stays where it was set to work', async () => {
  const ids = (crew: { id: string }[]) => crew.map(run => run.id)
  const working = helper()
  const ended = helper({ id: 'a2', toolUseId: 'tu-old', status: 'done' })

  // With no newest row known, it stands on the row that set it to work, a waking message's included.
  expect(ids(crewAt([working], ['tu-agent'], ''))).toEqual(['a1'])
  expect(ids(crewAt([helper({ toolUseId: 'tu-message' })], ['tu-message'], ''))).toEqual(['a1'])
  expect(crewAt([working], ['another'], '')).toEqual([])

  // The conversation moved on: it left its first row and stands at the newest one, alone or folded into a run.
  expect(crewAt([working, ended], ['tu-agent'], 'tu-new')).toEqual([])
  expect(ids(crewAt([working, ended], ['tu-new'], 'tu-new'))).toEqual(['a1'])
  expect(ids(crewAt([working, ended], ['tu-x', 'tu-new'], 'tu-new'))).toEqual(['a1'])
  expect(ids(crewAt([working, ended], ['tu-old'], 'tu-new'))).toEqual(['a2'])
  expect(crewAt([helper({ isMain: true })], ['tu-agent'], 'tu-agent')).toEqual([])
})

test('the main loop\'s newest words are a row too: helpers at work stand under them', async () => {
  const said = 'Beş yardımcı ajan şu an beş projede aynı anda çalışıyor;\n  sonuçlar gelince hepsini kontrol edeceğim.'
  const key = textKey(said)

  expect(key).toBe(textKey(`  ${said.replace(/\n\s+/, ' ')}  `))
  expect(textKey('  \n ')).toBe('')
  expect(crewAt([helper()], [key], key).map(run => run.id)).toEqual(['a1'])
  expect(crewAt([helper()], [textKey('an earlier message')], key)).toEqual([])
  // Its first row is left: it has moved down to the words.
  expect(crewAt([helper()], ['tu-agent'], key)).toEqual([])
})

const called = (plain: string, over = {}) => ({ tool: 'Bash', target: '', plain, at: 1, ...over })

test('every kind of work has a picture and a motion of its own, and word sent to another session is one of them', async () => {
  const kinds = ['read', 'search', 'edit', 'run', 'test', 'save', 'web', 'message', 'agent', 'wait', 'other']
  const pictures = new Set(kinds.map(lastKind => rowCrab(helper({ lastKind })).source))

  expect(pictures.size).toBe(kinds.length)
  expect(workKindOf('SendMessage', {})).toBe('message')
  expect(workKindOf('mcp__transceiver__send', {})).toBe('message')
  expect(workKindOf('Grep', { pattern: 'x' })).toBe('search')
  expect(workKindOf('Read', { file_path: '/w/a.ts' })).toBe('read')
  expect(rowCrab(helper()).source).not.toContain('<script')
})

test('the agent is born on its row, then walks down to each new piece of work', async () => {
  const born = rowCrab(helper({ history: [called('ilk iş')] }))
  expect(born.source).toContain('class="born"')
  expect(born.source).not.toContain('class="down"')

  const second = rowCrab(helper({ history: [called('ilk iş'), called('ikinci iş')] }))
  expect(second.source).toContain('class="down"')
  expect(second.source).toContain('ilk iş')
  expect(second.source).toContain('ikinci iş')
  expect(second.height).toBeGreaterThan(born.height)
})

test('the card keeps to what the agent does and why: the work now, the one before it, and its reason', async () => {
  const history = ['bir', 'iki', 'üç'].map(word => called(`${word}inci iş`))
  const card = rowCrab(helper({ history: [...history, called('şimdiki iş', { because: 'kurulum bitmeden test koşulamaz' })], steps: 41 }))

  expect(card.source).toContain('şimdiki iş')
  expect(card.source).toContain('üçinci iş')
  expect(card.source).not.toContain('ikiinci iş')
  expect(card.source).toContain('kurulum bitmeden test koşulamaz')
  // No tally of steps: it says nothing about what or why.
  expect(card.source).not.toContain('41')

  const planned = rowCrab(helper({ history, planStep: { subject: 'Fix the tests', at: 3, of: 6 } }))
  expect(planned.source).toContain('Fix the tests')
  const noted = rowCrab(helper({ history, stepDone: 2, stepTotal: 5, stepNote: 'writing the tests', planStep: { subject: 'Fix the tests', at: 3, of: 6 } }))
  expect(noted.source).toContain('writing the tests')
  expect(noted.source).not.toContain('Fix the tests')
  expect(planStepOf([{ subject: 'One', status: 'completed' }, { subject: 'Two', status: 'in_progress' }])).toEqual({ subject: 'Two', at: 2, of: 2 })
  expect(planStepOf(undefined)).toBe(undefined)
})

test('agents that ended stand together in one short row, each with its name', async () => {
  const ended = [helper({ id: 'a1', look: 1, status: 'done' }), helper({ id: 'a2', look: 2, status: 'failed' }), helper({ id: 'a3', look: 3, status: 'done' })]
  const bench = benchCard(ended)

  expect(bench.height).toBeLessThan(rowCrab(helper({ history: [called('bir iş')] })).height)
  expect(bench.alt.split(', ').length).toBe(3)
  expect(benchCard([...ended, ...ended]).height).toBeGreaterThan(bench.height)
})

test('long words are cut to the card, never drawn past it', async () => {
  const long = rowCrab(helper({ description: 'x'.repeat(400), history: [called('y'.repeat(400), { because: 'z'.repeat(400) })] }))
  for (const letter of ['x', 'y', 'z']) expect(long.source).not.toContain(letter.repeat(120))
  expect(long.source).toContain('…')
})

test('an Agent row keeps the engine row and adds the crab with its words beneath, on the desktop alone', async ($, on) => {
  await setup($, on)
  // The row is found by the Agent call's id, which the fixtures' spawn does not name.
  await $.agent.spawn({ prompt: 'do it', description: 'Look around', subagentType: 'Explore', tool_use_id: 'tu-live' } as any)
  const agentRow = (surface: Surface) => ({ plugin: 'savvy-progress', surface, component: 'ToolUse' as const, requestId: 'tu-live', props: { tool_use_id: 'tu-live', tool: 'Agent', input: {}, isRunning: true, isErrored: false, isInterrupted: false } })
  const drawn = JSON.stringify(await (await $.ui.mount(agentRow('desktop'))).drawn())

  expect(drawn).toContain('"type":"Svg"')
  expect(drawn).toContain('"isInteractive":true')
  expect(drawn).toContain('Look around')
  expect(await (await $.ui.mount(agentRow('terminal'))).drawn()).toEqual(OTHERS)

  // Folded into a run of calls its row is not drawn, so the card stands under the run's fold line.
  const folded = { plugin: 'savvy-progress', surface: 'desktop' as const, component: 'ToolGroup' as const, requestId: 'g-live', props: { calls: [{ tool_use_id: 'tu-live', tool: 'Agent', input: {}, isRunning: true, isErrored: false, isInterrupted: false }, { tool: 'Read', input: {}, isRunning: false, isErrored: false, isInterrupted: false }], isActive: true, isExpanded: false } }
  expect(JSON.stringify(await (await $.ui.mount(folded)).drawn())).toContain('Look around')
})
