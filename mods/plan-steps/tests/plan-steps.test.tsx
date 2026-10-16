import { expect, mock, test } from 'claude-code/testing'

const SURFACES = ['terminal', 'desktop'] as const
const MIN = 60_000
const PLAN_PATH = '/w/docs/superpowers/plans/2026-10-09-plan-steps.md'

let clock: any
let opened: string[] = []
let statuses: (string | undefined)[] = []
let files: Record<string, string> = {}
let taskSeq = 0
const failing = new Set<string>()

type Status = 'pending' | 'in_progress' | 'completed'

function paneOf(surface: (typeof SURFACES)[number], bodyRows = 30) {
  return {
    plugin: 'plan-steps', component: 'Pane', requestId: 'plan-steps', surface,
    viewport: { columns: 160, rows: 40 },
    props: { title: 'Plan', isFocused: false, bodyColumns: 52, placement: 'dock', scroll: { offset: 0, bodyRows }, view: {} },
  } as const
}

function toolAnswer(e: any) {
  if (failing.has(e.tool)) return { result: 'nope', isError: true }
  if (e.tool === 'TaskCreate') return { result: { task: { id: String(++taskSeq), subject: e.subject } } }
  if (e.tool === 'ExitPlanMode') return { result: { plan: '## Plan\n1. Tipleri yaz\n2. Paneli çiz\n3. Testle', isAgent: false } }
  if (e.tool === 'Agent') {
    const status = e.run_in_background === false ? 'completed' : 'async_launched'

    return { result: { status, agentId: `ag-${e.description.length}`, content: [] } }
  }

  return { result: 'ok' }
}

// The Turkish interface these tests read; english.test.tsx covers the default.
async function setup($: any, on: any) {
  clock = mock.clock(on)
  mock.env(on, { MODZ_LANG: 'tr' })
  opened = []
  statuses = []
  files = {}
  taskSeq = 0
  on('session.start', () => ({ cwd: '/w' }))
  on('command.register', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('ui.status', (_: any, e: any) => {
    statuses.push(e.text)

    return { value: undefined }
  })
  on('ui.open', (_: any, e: any) => {
    opened.push(e.id)

    return { value: { isPlaced: true } }
  })
  on('ui.render', () => ({ type: 'engine', ref: 1 }))
  on('turn.complete', (_: any, e: any) => ({ text: e.answer }))
  on('prompt.submit', (_: any, e: any) => ({ text: e.text }))
  on('fs.read', (_: any, e: any) => ({ value: files[e.path] ?? '' }))
  on('tool.call', (_: any, e: any) => toolAnswer(e))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })
}

function todos(list: [string, Status][]) {
  return { tool: 'TodoWrite', todos: list.map(([content, status]) => ({ content, status, activeForm: content })) }
}

const lastStatus = () => statuses[statuses.length - 1]

async function svgOf(pane: any): Promise<string> {
  return String((await pane.find({ type: 'Svg' }))?.props?.source ?? '')
}

async function rowText(pane: any, key: string): Promise<string | undefined> {
  return (await pane.find({ type: 'Box', key }))?.text
}

// Stands for the MODZ main panel: it writes open requests and reads the cards, as `modz` does.
const modz = {
  name: 'modz',
  register(on: any) {
    on('command.run', { command: 'modz-open' }, async ($: any, e: any) => {
      await $.state.set({ plugin: 'modz', key: 'open' }, { pane: e.args, at: 1 })

      return {}
    })
    on('command.run', { command: 'modz-hub' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'plan-steps', key: 'hub' })).value ?? null) }))
  },
}

async function hubOf($: any) {
  return JSON.parse((await $.command.run({ command: 'modz-hub', args: '' })).text)
}

for (const surface of SURFACES) {
  test(`${surface}: a TodoWrite plan shows done, current and upcoming steps with times, files and agents`, async ($: any, on: any) => {
    await setup($, on)
    await $.tool.call(todos([['Tipleri yaz', 'in_progress'], ['Ayrıştırıcı', 'pending'], ['Paneli çiz', 'pending'], ['Durum satırı', 'pending']]))
    expect(opened).toEqual([])
    expect(lastStatus()).toBe('plan 0/4 · Tipleri yaz')

    await clock.advance(4 * MIN)
    await $.tool.call(todos([['Tipleri yaz', 'completed'], ['Ayrıştırıcı', 'in_progress'], ['Paneli çiz', 'pending'], ['Durum satırı', 'pending']]))
    await clock.advance(MIN)
    await $.tool.call({ tool: 'Edit', file_path: '/w/hooks/parse.ts', old_string: 'a', new_string: 'b' })
    await $.tool.call({ tool: 'Write', file_path: '/w/tests/parse.test.ts', content: 'x' })
    await $.tool.call({ tool: 'Agent', description: 'Testleri yaz', prompt: 'p' })
    await clock.advance(2 * MIN)
    await $.command.run({ command: 'steps', args: '' })
    expect(opened).toEqual(['plan-steps'])

    const pane = await $.ui.mount(paneOf(surface))
    if (surface === 'desktop') {
      const svg = await svgOf(pane)
      for (const part of ['PLAN', '1 / 4 adım', '~%38', 'görev listesi', 'Tipleri yaz', '4dk', 'Ayrıştırıcı', '3dk', '>parse.test.ts<', '>parse.ts<', 'tests/', 'Testleri yaz', 'çalışıyor', 'Paneli çiz']) expect(svg).toContain(part)
      expect(svg).not.toContain('kalan')

      return
    }
    expect(await rowText(pane, 'head')).toBe('Plan · 1/4 adım · ~%38görev listesi')
    expect(await rowText(pane, 'step-tipleri-yaz')).toBe('✓Tipleri yaz4dk')
    expect(await rowText(pane, 'step-ayristirici')).toBe('◐Ayrıştırıcı3dk')
    expect(await rowText(pane, 'step-paneli-ciz')).toBe('○Paneli çiz')
    expect(await rowText(pane, 'detail-summary')).toBe('› 2 dosya: parse.test.ts, parse.ts')
    expect(await rowText(pane, 'detail-agent-0')).toBe('● Testleri yaz')
    expect(lastStatus()).toBe('plan 1/4 · Ayrıştırıcı')

    await $.turn.complete({ answer: 'bitti', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer', agentId: 'ag-12' })
    expect(await rowText(pane, 'detail-agent-0')).toBeUndefined()
    expect(await rowText(pane, 'detail-summary')).toBe('› 2 dosya: parse.test.ts, parse.ts · 1 ajan bitti')
  })

  test(`${surface}: a plan file leads, tasks matched to its steps give their status`, async ($: any, on: any) => {
    await setup($, on)
    files[PLAN_PATH] = '### Task 1: Tipleri yaz\n- [ ] a\n### Task 2: Ayrıştırıcıyı yaz\n- [ ] a\n- [ ] b\n### Task 3: Paneli çiz\n'
    await $.tool.call({ tool: 'Write', file_path: PLAN_PATH, content: files[PLAN_PATH] })
    expect(lastStatus()).toBeUndefined()

    await $.tool.call({ tool: 'TaskCreate', subject: 'Task 1: types', description: 'd' })
    await $.tool.call({ tool: 'TaskCreate', subject: 'Ayrıştırıcıyı yaz', description: 'd' })
    await $.tool.call({ tool: 'TaskUpdate', taskId: '1', status: 'completed' })
    await $.tool.call({ tool: 'TaskUpdate', taskId: '2', status: 'in_progress' })
    files[PLAN_PATH] = files[PLAN_PATH].replace('- [ ] a\n- [ ] b', '- [x] a\n- [ ] b')
    await $.tool.call({ tool: 'Edit', file_path: PLAN_PATH, old_string: '- [ ] a\n- [ ] b', new_string: '- [x] a\n- [ ] b' })

    await $.command.run({ command: 'steps', args: '' })
    const pane = await $.ui.mount(paneOf(surface))
    if (surface === 'desktop') {
      const svg = await svgOf(pane)
      for (const part of ['1 / 3 adım', '~%50', '2026-10-09-plan-steps.md · görev listesi', 'Ayrıştırıcıyı yaz', '1/2 madde', '>2026-10-09-plan-steps.md<', '>MD<', 'Paneli çiz']) expect(svg).toContain(part)

      return
    }
    expect(await rowText(pane, 'head')).toBe('Plan · 1/3 adım · ~%50' + '2026-10-09-plan-steps.md · görev listesi')
    expect(await rowText(pane, 'step-ayristiriciyi-yaz')).toMatch(/^◐Ayrıştırıcıyı yaz/)
    expect(await rowText(pane, 'detail-summary')).toBe('› 1/2 madde · 1 dosya: 2026-10-09-plan-steps.md')
    expect(await rowText(pane, 'step-paneli-ciz')).toBe('○Paneli çiz')
  })

  test(`${surface}: a long plan keeps the current step in view`, async ($: any, on: any) => {
    await setup($, on)
    const list: [string, Status][] = Array.from({ length: 30 }, (_, index) => [`Adım ${index + 1} işi`, index < 20 ? 'completed' : index === 20 ? 'in_progress' : 'pending'])
    await $.tool.call(todos(list))
    const pane = await $.ui.mount(paneOf(surface, 12))
    if (surface === 'desktop') {
      const svg = await svgOf(pane)
      for (const part of ['Adım 21 işi', '✓ ', 'adım daha', '+']) expect(svg).toContain(part)
      expect(svg).not.toContain('>Adım 1 işi<')

      return
    }

    expect(await rowText(pane, 'step-adim-21-isi')).toMatch(/^◐/)
    expect(await rowText(pane, 'more-above')).toBe('  ✓ 19 adım daha')
    expect(await rowText(pane, 'more-below')).toBe('  +4 adım daha')
    expect(await rowText(pane, 'step-adim-1-isi')).toBeUndefined()
  })

  test(`${surface}: with no plan the pane says so`, async ($: any, on: any) => {
    await setup($, on)
    const pane = await $.ui.mount(paneOf(surface))
    if (surface === 'desktop') {
      const svg = await pane.find({ type: 'Svg' })
      expect(svg?.props?.alt).toBe('Plan: Henüz plan yok · görev listesi ya da onaylı bir plan gelince adımlar burada belirir')
      expect(String(svg?.props?.source)).toContain('PLAN')

      return
    }
    expect(await rowText(pane, 'empty')).toBe('Henüz plan yok · görev listesi ya da onaylı bir plan gelince adımlar burada belirir')
  })
}

test('ETA appears only after three timed steps and reads kalan ~Ndk', async ($: any, on: any) => {
  await setup($, on)
  for (const subject of ['A işi', 'B işi', 'C işi', 'D işi', 'E işi']) await $.tool.call({ tool: 'TaskCreate', subject, description: 'd' })
  const minutes = [2, 4, 3]
  for (const [index, spent] of minutes.entries()) {
    await $.tool.call({ tool: 'TaskUpdate', taskId: String(index + 1), status: 'in_progress' })
    await clock.advance(spent * MIN)
    const pane = await $.ui.mount(paneOf('desktop'))
    expect(await rowText(pane, 'bar')).not.toMatch(/kalan/)
    await pane.unmount()
    await $.tool.call({ tool: 'TaskUpdate', taskId: String(index + 1), status: 'completed' })
  }
  const pane = await $.ui.mount(paneOf('terminal'))

  expect(await rowText(pane, 'bar')).toMatch(/━ {2}kalan ~6dk$/)
  expect(await rowText(pane, 'head')).toBe('Plan · 3/5 adım · %60görev listesi')
})

test('an approved plan becomes the plan; the status line waits for its first step to start', { plugins: [modz] }, async ($: any, on: any) => {
  await setup($, on)
  await $.tool.call({ tool: 'ExitPlanMode' })

  expect(lastStatus()).toBeUndefined()
  expect(await hubOf($)).toMatchObject({ detail: '3 adım · başlamadı', tone: 'idle' })
  await $.tool.call(todos([['Tipleri yaz', 'in_progress'], ['Paneli çiz', 'pending'], ['Testle', 'pending']]))
  expect(lastStatus()).toBe('plan 0/3 · Tipleri yaz')
})

for (const surface of SURFACES) {
  test(`${surface}: a plan nothing touched for 30 minutes leaves the status line and says so; work brings it back`, { plugins: [modz] }, async ($: any, on: any) => {
    await setup($, on)
    await $.tool.call(todos([['Tipleri yaz', 'completed'], ['Ayrıştırıcı', 'in_progress'], ['Paneli çiz', 'pending']]))
    expect(lastStatus()).toBe('plan 1/3 · Ayrıştırıcı')

    await clock.advance(31 * MIN)
    expect(lastStatus()).toBeUndefined()
    expect(await hubOf($)).toMatchObject({ detail: '1/3 adım · bekliyor', tone: 'idle' })
    const pane = await $.ui.mount(paneOf(surface))
    if (surface === 'desktop') {
      const svg = await svgOf(pane)
      expect(svg).toContain('bekliyor · 31dk önce')
      expect(svg).not.toContain('class="breathe"')
    } else {
      expect(await rowText(pane, 'head')).toBe('Plan · 1/3 adım · ~%50görev listesi · bekliyor · 31dk önce')
    }

    await $.tool.call({ tool: 'Edit', file_path: '/w/hooks/parse.ts', old_string: 'a', new_string: 'b' })
    expect(lastStatus()).toBe('plan 1/3 · Ayrıştırıcı')
    expect(await hubOf($)).toMatchObject({ detail: '1/3 adım', tone: 'live' })
  })
}

test('a finished plan says tamam, then clears the status line at the next prompt', async ($: any, on: any) => {
  await setup($, on)
  await $.tool.call(todos([['A', 'completed'], ['B', 'completed']]))
  expect(lastStatus()).toBe('plan 2/2 · tamam')

  await $.prompt.submit({ text: 'sonraki iş', wait: false })
  expect(lastStatus()).toBeUndefined()
})

test('a failed or refused call leaves the plan alone', async ($: any, on: any) => {
  await setup($, on)
  failing.add('TaskCreate')
  await $.tool.call({ tool: 'TaskCreate', subject: 'X', description: 'd' })
  failing.clear()

  expect(statuses).toEqual([])
})

test('the MODZ hub card says how far the plan is, and is written only when that changes', { plugins: [modz] }, async ($: any, on: any) => {
  await setup($, on)
  expect(await hubOf($)).toMatchObject({ pane: 'plan', detail: '', tone: 'idle' })

  await $.tool.call(todos([['A', 'completed'], ['B', 'in_progress'], ['C', 'pending']]))
  const live = await hubOf($)
  expect(live).toMatchObject({ detail: '1/3 adım', tone: 'live' })

  await clock.advance(MIN)
  await $.tool.call({ tool: 'Edit', file_path: '/w/a.ts', old_string: 'a', new_string: 'b' })
  expect((await hubOf($)).at).toBe(live.at)

  await $.tool.call(todos([['A', 'completed'], ['B', 'completed'], ['C', 'completed']]))
  expect(await hubOf($)).toMatchObject({ detail: '3/3 bitti', tone: 'ok' })
})

test('a MODZ open request for plan opens the pane, one for another pane does not', { plugins: [modz] }, async ($: any, on: any) => {
  await setup($, on)
  await $.command.run({ command: 'modz-open', args: 'tests' })
  expect(opened).toEqual([])

  await $.command.run({ command: 'modz-open', args: 'plan' })
  expect(opened).toEqual(['plan-steps'])
})

test('the desktop task list (update_plan, wrap_up) is the plan, as TodoWrite is', async ($: any, on: any) => {
  await setup($, on)
  const items = (statuses: Status[]) => ['Bak', 'Düzelt', 'Test et'].map((content, index) => ({ content, status: statuses[index] }))
  await $.tool.call({ tool: 'mcp__ccd_turn__update_plan', items: items(['in_progress', 'pending', 'pending']), scope: 'first_task' })
  expect(lastStatus()).toBe('plan 0/3 · Bak')

  await $.tool.call({ tool: 'mcp__ccd_turn__update_plan', advance: true })
  expect(lastStatus()).toBe('plan 1/3 · Düzelt')

  await $.tool.call({ tool: 'mcp__ccd_turn__update_plan', done: [2], start: 3 })
  expect(lastStatus()).toBe('plan 2/3 · Test et')

  await $.tool.call({ tool: 'mcp__ccd_turn__wrap_up', recap: 'Bitti.' })
  expect(lastStatus()).toBe('plan 3/3 · tamam')
})
