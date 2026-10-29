import { expect, mock, test } from 'claude-code/testing'

// The default interface: no MODZ_LANG, so every surface reads English.

const SURFACES = ['terminal', 'desktop'] as const
const MIN = 60_000
const TURKISH = /[çğıöşüİ]/

type Status = 'pending' | 'in_progress' | 'completed'

let clock: any
let statuses: (string | undefined)[] = []

function paneOf(surface: (typeof SURFACES)[number], bodyRows = 30) {
  return {
    plugin: 'plan-steps', component: 'Pane', requestId: 'plan-steps', surface,
    viewport: { columns: 160, rows: 40 },
    props: { title: 'Plan', isFocused: false, bodyColumns: 52, placement: 'dock', scroll: { offset: 0, bodyRows }, view: {} },
  } as const
}

async function setup($: any, on: any) {
  clock = mock.clock(on)
  mock.env(on, {})
  statuses = []
  for (const name of ['command.register', 'ui.log']) on(name, () => ({ value: undefined }))
  on('ui.status', (_: any, e: any) => {
    statuses.push(e.text)

    return { value: undefined }
  })
  on('session.start', () => ({ cwd: '/w' }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.render', () => ({ type: 'engine', ref: 1 }))
  on('fs.read', () => ({ value: '' }))
  on('tool.call', (_: any, e: any) => (e.tool === 'Agent' ? { result: { status: 'async_launched', agentId: 'ag-1', content: [] } } : { result: 'ok' }))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })
}

function todos(list: [string, Status][]) {
  return { tool: 'TodoWrite', todos: list.map(([content, status]) => ({ content, status, activeForm: content })) }
}

// Stands for the MODZ main panel reading this mod's card.
const modz = {
  name: 'modz',
  register(on: any) {
    on('command.run', { command: 'modz-hub' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'plan-steps', key: 'hub' })).value ?? null) }))
  },
}

async function hubOf($: any) {
  return JSON.parse((await $.command.run({ command: 'modz-hub', args: '' })).text)
}

async function drawnText(pane: any): Promise<string> {
  return JSON.stringify(await pane.drawn())
}

async function rowText(pane: any, key: string): Promise<string | undefined> {
  return (await pane.find({ type: 'Box', key }))?.text
}

async function workUnderWay($: any) {
  await $.tool.call(todos([['Write types', 'in_progress'], ['Parser', 'pending'], ['Draw pane', 'pending']]))
  await clock.advance(4 * MIN)
  await $.tool.call(todos([['Write types', 'completed'], ['Parser', 'in_progress'], ['Draw pane', 'pending']]))
  await clock.advance(MIN)
  await $.tool.call({ tool: 'Edit', file_path: '/w/hooks/parse.ts', old_string: 'a', new_string: 'b' })
  await $.tool.call({ tool: 'Agent', description: 'Write tests', prompt: 'p' })
  await clock.advance(2 * MIN)
}

for (const surface of SURFACES) {
  test(`${surface}: the plan pane reads English by default`, async ($: any, on: any) => {
    await setup($, on)
    await workUnderWay($)
    const pane = await $.ui.mount(paneOf(surface))
    expect(await drawnText(pane)).not.toMatch(TURKISH)
    if (surface === 'desktop') {
      const svg = String((await pane.find({ type: 'Svg' }))?.props?.source ?? '')
      for (const part of ['1 / 3 steps', '≈50%', 'task list', '4m', 'Write tests · running', '>parse.ts<']) expect(svg).toContain(part)
      expect(String((await pane.find({ type: 'Svg' }))?.props?.alt)).toBe('Plan · 1/3 steps · ≈50% · now: Parser')

      return
    }
    expect(await rowText(pane, 'head')).toBe('Plan · 1/3 steps · ≈50%task list')
    expect(await rowText(pane, 'step-write-types')).toBe('✓Write types4m')
    expect(await rowText(pane, 'detail-summary')).toBe('› 1 file: parse.ts')
  })

  test(`${surface}: the empty pane reads English by default`, async ($: any, on: any) => {
    await setup($, on)
    const pane = await $.ui.mount(paneOf(surface))
    expect(await drawnText(pane)).not.toMatch(TURKISH)
    const sentence = 'No plan yet · steps show up here once a task list or an approved plan arrives'
    if (surface === 'desktop') {
      expect((await pane.find({ type: 'Svg' }))?.props?.alt).toBe(`Plan: ${sentence}`)

      return
    }
    expect(await rowText(pane, 'empty')).toBe(sentence)
  })

  test(`${surface}: a long or quiet plan says so in English`, async ($: any, on: any) => {
    await setup($, on)
    const list: [string, Status][] = Array.from({ length: 30 }, (_, index) => [`Task ${index + 1} work`, index < 20 ? 'completed' : index === 20 ? 'in_progress' : 'pending'])
    await $.tool.call(todos(list))
    await clock.advance(31 * MIN)
    const pane = await $.ui.mount(paneOf(surface, 12))
    const text = await drawnText(pane)
    expect(text).not.toMatch(TURKISH)
    for (const part of ['more steps', 'waiting · 31m ago']) expect(text).toContain(part)
    if (surface === 'terminal') expect(await rowText(pane, 'more-below')).toBe('  +4 more steps')
  })
}

test('the status line and the MODZ card read English by default', { plugins: [modz] }, async ($: any, on: any) => {
  await setup($, on)
  await $.tool.call(todos([['A', 'pending'], ['B', 'pending']]))
  expect(await hubOf($)).toMatchObject({ detail: '2 steps · not started', tone: 'idle' })

  await $.tool.call(todos([['A', 'completed'], ['B', 'in_progress']]))
  expect(statuses[statuses.length - 1]).toBe('plan 1/2 · B')
  expect(await hubOf($)).toMatchObject({ detail: '1 of 2 steps', tone: 'live' })

  await clock.advance(31 * MIN)
  expect(await hubOf($)).toMatchObject({ detail: '1 of 2 steps · waiting', tone: 'idle' })

  await $.tool.call(todos([['A', 'completed'], ['B', 'completed']]))
  expect(statuses[statuses.length - 1]).toBe('plan 2/2 · done')
  expect(await hubOf($)).toMatchObject({ detail: '2 of 2 done', tone: 'ok' })
})
