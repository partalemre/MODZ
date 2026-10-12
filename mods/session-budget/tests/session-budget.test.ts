import { expect, mock, test } from 'claude-code/testing'

import { advance, etaMinutes, etaText, parseCommand, raise, ratioOf, spentOf, startBudget } from '../hooks/budget'
import { setLang } from '../hooks/lang'

const at = (percent: number, resetsAt = 'r1', usd: number | null = null) => ({ percent, resetsAt, usd })

test('/budget arguments: percent of 5h, dollars, off, status, nonsense', () => {
  expect(parseCommand('20%')).toEqual({ kind: 'set', budget: { kind: 'percent', limit: 20 } })
  expect(parseCommand(' 12.5 ')).toEqual({ kind: 'set', budget: { kind: 'percent', limit: 12.5 } })
  expect(parseCommand('$5')).toEqual({ kind: 'set', budget: { kind: 'usd', limit: 5 } })
  expect(parseCommand('2.5usd')).toEqual({ kind: 'set', budget: { kind: 'usd', limit: 2.5 } })
  expect(parseCommand('off')).toEqual({ kind: 'off' })
  expect(parseCommand('')).toEqual({ kind: 'status' })
  expect(parseCommand('150%').kind).toBe('error')
  expect(parseCommand('$0').kind).toBe('error')
  expect(parseCommand('lots').kind).toBe('error')
})

test('spend counts from when the budget was set, and carries over a 5h window reset', () => {
  let budget = startBudget('percent', 10, at(30))
  budget = advance(budget, at(36))
  expect(spentOf(budget)).toBe(6)
  budget = advance(budget, at(2, 'r2'))
  expect(spentOf(budget)).toBe(8)
  expect(ratioOf(budget)).toBe(0.8)
})

test('a dollar budget counts session cost from when it was set', () => {
  const budget = advance(startBudget('usd', 4, at(0, 'r1', 1)), at(0, 'r1', 4))
  expect(spentOf(budget)).toBe(3)
})

test('the pace says when the budget runs out; going on raises it a step past what is spent', () => {
  setLang('tr')
  const budget = { ...advance(startBudget('usd', 5, at(0, 'r1', 0)), at(0, 'r1', 4)), setAt: 0 }
  expect(etaMinutes(budget, 600_000)).toBe(3)
  expect(etaMinutes(budget, 30_000)).toBeNull()
  expect(etaText(25)).toBe('bu hızla ~25 dk')
  expect(etaText(80)).toBe('bu hızla ~1 sa 20 dk')
  const over = advance(startBudget('usd', 5, at(0, 'r1', 0)), at(0, 'r1', 6))
  expect(raise(over).limit).toBe(7)
  expect(raise(startBudget('percent', 10, at(0))).limit).toBe(12)
})

// `env` is what $.env.get answers: Turkish unless a test asks for the English default.
type World = { asked: string[]; answer: string; submitted: string[]; surfaces?: string[]; filled?: string[]; draft?: string; env?: Record<string, string> }

async function setup($: any, on: any, world: World) {
  const clock = mock.clock(on)
  mock.env(on, world.env ?? { MODZ_LANG: 'tr' })
  on('session.start', () => ({ cwd: '/w' }))
  on('session.usage', () => ({ value: { startedAt: 0, context: {}, rateLimits: [{ kind: 'five_hour', percentUsed: 40, resetsAt: 'r1' }], cost: { usd: 1 } } }))
  on('session.measure', (_: any, e: any) => ({ changed: e.changed }))
  on('session.surfaces', () => ({ value: world.surfaces ?? ['terminal'] }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('command.register', () => ({ value: undefined }))
  on('ui.log', () => ({ value: undefined }))
  on('ui.render', () => ({ type: 'engine', ref: 1 }))
  on('prompt.read', () => ({ value: { text: world.draft ?? '', cursor: 0 } }))
  on('prompt.fill', (_: any, e: any) => {
    world.filled?.push(e.text)
    world.draft = e.text

    return { isFilled: true, box: { text: e.text, cursor: e.text.length } }
  })
  on('prompt.submit', (_: any, e: any) => {
    world.submitted.push(e.text)

    return { text: e.text }
  })
  on('tool.call', (_: any, e: any) => {
    const question = e.questions[0].question
    world.asked.push(question)

    return { result: { answers: { [question]: world.answer } } }
  })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/w' })

  return clock
}

const measure = ($: any, percentUsed: number) =>
  $.session.measure({ context: {}, rateLimits: [{ kind: 'five_hour', percentUsed, resetsAt: 'r1' }], cost: { usd: 1 }, changed: ['rateLimits'] })
const typed = (text: string, kind = 'composer') => ({ text, context: [], wait: false, origin: { kind } })
const SURFACES = ['terminal', 'desktop'] as const
const band = (surface: (typeof SURFACES)[number]) => ({
  plugin: 'session-budget', component: 'AbovePrompt', requestId: `band-${surface}`, surface, viewport: { columns: 120, rows: 40 },
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 120, scroll: { offset: 0, bodyRows: 10 }, view: {} },
}) as const

test('80% shows one amber line above the other rows on both surfaces; it clears itself after 20s', async ($: any, on: any) => {
  const world: World = { asked: [], answer: 'Dur', submitted: [] }
  const clock = await setup($, on, world)
  expect(await $.command.run({ command: 'budget', args: '10%' })).toMatchObject({ text: 'Oturum bütçesi kuruldu: %10 (5 saatlik limit).' })

  await measure($, 48.5)
  const terminal = await $.ui.mount(band('terminal'))
  expect((await terminal.find({ type: 'Text', text: 'Bütçe %85 · 5s %8,5 / %10' }))?.props.color).toBe('warning')
  expect(await terminal.find({ type: 'Text', text: /┃/ })).toBeDefined()
  await terminal.unmount()
  const ui = await $.ui.mount(band('desktop'))
  const svg = (await ui.find({ type: 'Svg' })) as { props: { alt: string; source: string } } | undefined
  expect(svg?.props.alt).toBe('Bütçe · %85 · 5s %8,5 / %10')
  expect(svg?.props.source).toContain('f-warn-t')
  const drawn = JSON.stringify(await ui.drawn())
  expect(drawn.indexOf('"engine"')).toBeGreaterThan(drawn.indexOf('Bütçe'))
  await clock.advance(20_001)
  expect(await ui.find({ type: 'Svg' })).toBeUndefined()
})

for (const surface of SURFACES) {
  test(`at 100% a typed prompt asks; Dur drops it with a red line and puts it back in the box (${surface})`, async ($: any, on: any) => {
    const world: World = { asked: [], answer: 'Dur', submitted: [], filled: [] }
    const clock = await setup($, on, world)
    await $.command.run({ command: 'budget', args: '5' })
    await measure($, 46)

    const stopped = await $.prompt.submit(typed('one more thing'))
    expect(world.asked[0]).toBe('Oturum bütçesi doldu: 5s %6 / %5 (%120). Yine de devam edilsin mi?')
    expect(stopped.drop).toMatch(/^Oturum bütçesi doldu/)
    expect(world.submitted).toEqual([])
    const ui = await $.ui.mount(band(surface))
    if (surface === 'terminal') {
      expect((await ui.find({ type: 'Text', text: /^Durduruldu: bütçe doldu/ }))?.props.color).toBe('error')
    } else {
      const svg = (await ui.find({ type: 'Svg' })) as { props: { alt: string; source: string } } | undefined
      expect(svg?.props.alt).toBe('Durduruldu: bütçe doldu · 5s %6 / %5 · /budget ile artır')
      expect(svg?.props.source).toContain('f-danger-t')
    }
    await clock.advance(1_000)
    expect(world.filled).toEqual(['one more thing'])

    world.answer = 'Devam et (+%1)'
    await $.prompt.submit(typed('go on'))
    await $.prompt.submit(typed('and again'))
    expect(world.asked).toHaveLength(2)
    expect(world.submitted).toEqual(['go on', 'and again'])
  })
}

test('Dur leaves a draft typed meanwhile alone', async ($: any, on: any) => {
  const world: World = { asked: [], answer: 'Dur', submitted: [], filled: [] }
  const clock = await setup($, on, world)
  await $.command.run({ command: 'budget', args: '5' })
  await measure($, 46)
  await $.prompt.submit(typed('one more thing'))
  world.draft = 'yeni taslak'
  await clock.advance(1_000)

  expect(world.filled).toEqual([])
})

test('under budget, off, or a plugin prompt: nothing is asked', async ($: any, on: any) => {
  const world: World = { asked: [], answer: 'Dur', submitted: [] }
  await setup($, on, world)
  await $.command.run({ command: 'budget', args: '$10' })
  await $.prompt.submit(typed('cheap'))

  await $.command.run({ command: 'budget', args: '1%' })
  await measure($, 45)
  await $.prompt.submit({ ...typed('from a plugin'), origin: { kind: 'plugin', name: 'x' } })
  expect(await $.command.run({ command: 'session-budget', args: '' })).toMatchObject({ text: 'session-budget kapalı' })
  await $.prompt.submit(typed('while off'))

  expect(world.asked).toEqual([])
  expect(world.submitted).toEqual(['cheap', 'from a plugin', 'while off'])
})

test('desktop prompts (sdk with a surface) are held at 100%; a headless sdk run is not', async ($: any, on: any) => {
  const world: World = { asked: [], answer: 'Dur', submitted: [], surfaces: [] }
  await setup($, on, world)
  await $.command.run({ command: 'budget', args: '1%' })
  await measure($, 45)
  await $.prompt.submit(typed('headless', 'sdk'))
  expect(world.asked).toEqual([])
  world.surfaces = ['desktop']
  const out = await $.prompt.submit(typed('from the app', 'sdk'))
  expect(world.asked).toHaveLength(1)
  expect(out.drop).toBeDefined()
  expect(world.submitted).toEqual(['headless'])
})

// A stand-in for reflect: its notice is set from the session's start.
const LOUDER = {
  name: 'reflect',
  register(on: any) {
    on('session.start', async ($: any, e: any, next: any) => {
      await $.state.set({ plugin: 'reflect', key: 'notice' }, { id: 1, text: 'rule', priority: 2, expiresAt: 0 })

      return next(e)
    })
  },
}

for (const surface of SURFACES) {
  test(`a higher-ranked notice (reflect) owns the line while it shows (${surface})`, { plugins: [LOUDER] }, async ($: any, on: any) => {
    const world: World = { asked: [], answer: 'Dur', submitted: [] }
    await setup($, on, world)
    await $.command.run({ command: 'budget', args: '10%' })
    await measure($, 48.5)
    const ui = await $.ui.mount(band(surface))
    expect(JSON.stringify(await ui.drawn())).not.toContain('Bütçe')
  })
}

const question = (surface: (typeof SURFACES)[number]) => ({
  plugin: 'session-budget', component: 'AskUserQuestion', requestId: `q-${surface}`, surface, viewport: { columns: 100, rows: 40 },
  props: { tool: 'AskUserQuestion', questions: [{ header: 'Bütçe', question: 'Oturum bütçesi doldu?', options: [] }] },
}) as const

test('a full budget puts an Amber card above the question, which keeps its own options', async ($: any, on: any) => {
  const world: World = { asked: [], answer: 'Dur', submitted: [] }
  await setup($, on, world)
  await $.command.run({ command: 'budget', args: '$0.5' })
  await $.session.measure({ context: {}, rateLimits: [], cost: { usd: 1.6 }, changed: ['cost'] })

  const desktop = await $.ui.mount(question('desktop'))
  const card = (await desktop.find({ type: 'Svg' })) as { props: { alt: string; source: string } } | undefined
  expect(card?.props.alt).toBe('Oturum bütçesi doldu: $0,60 / $0,50 · %120. Mesajın bekletiliyor; devam edersen bütçe +$1 artar.')
  expect(card?.props.source).toContain('s-warn-l')
  expect(JSON.stringify(await desktop.drawn())).toContain('"engine"')
  const terminal = await $.ui.mount(question('terminal'))
  expect(await terminal.find({ type: 'Text', text: 'Bütçe doldu · $0,60 / $0,50 (%120)' })).toBeDefined()
})

// Without MODZ_LANG every word is English, on both surfaces.
const TURKISH = /[çğıöşüİ]/

for (const surface of SURFACES) {
  test(`English: the 80% row, the Stop line and the full card (${surface})`, async ($: any, on: any) => {
    const world: World = { asked: [], answer: 'Stop', submitted: [], env: {} }
    await setup($, on, world)
    expect(await $.command.run({ command: 'budget', args: '10%' })).toMatchObject({ text: 'Session budget set: 10% of the 5-hour limit.' })
    await measure($, 48.5)
    const warn = await $.ui.mount(band(surface))
    const warnText = JSON.stringify(await warn.drawn())
    expect(warnText).toContain(surface === 'terminal' ? 'Budget 85% · 5h 8.5% / 10%' : 'Budget · 85% · 5h 8.5% / 10%')
    expect(warnText).not.toMatch(TURKISH)
    await warn.unmount()

    await measure($, 51)
    const stopped = await $.prompt.submit(typed('one more thing'))
    expect(world.asked[0]).toBe('Session budget is full: 5h 11% / 10% (110%). Continue anyway?')
    expect(stopped.drop).toBe('Session budget is full: 5h 11% / 10% (110%). Raise it with /budget, or remove it with /budget off.')
    const line = JSON.stringify(await (await $.ui.mount(band(surface))).drawn())
    expect(line).toContain('Stopped: budget is full · 5h 11% / 10%')
    expect(line).not.toMatch(TURKISH)

    const card = await $.ui.mount({ ...question(surface), props: { ...question(surface).props, questions: [{ header: 'Budget', question: 'Full?', options: [] }] } })
    const cardText = JSON.stringify(await card.drawn())
    expect(cardText).toContain(surface === 'terminal' ? 'Budget is full · 5h 11% / 10% (110%)' : 'Your message is on hold; continuing raises the budget by +2%.')
    expect(cardText).not.toMatch(TURKISH)
  })
}

test('English: Continue anyway raises the budget; the commands answer in English', async ($: any, on: any) => {
  const world: World = { asked: [], answer: 'Continue anyway (+$1)', submitted: [], env: {} }
  await setup($, on, world)
  expect(await $.command.run({ command: 'budget', args: '' })).toMatchObject({ text: 'No session budget. Set one with /budget 20% or /budget $5' })
  expect(await $.command.run({ command: 'budget', args: '$0.5' })).toMatchObject({ text: 'Session budget set: $0.5.' })
  await $.session.measure({ context: {}, rateLimits: [], cost: { usd: 1.6 }, changed: ['cost'] })
  await $.prompt.submit(typed('go on'))
  expect(world.submitted).toEqual(['go on'])
  expect(await $.command.run({ command: 'budget', args: 'status' })).toMatchObject({ text: 'Session budget: $0.60 / $1.60 (38%)' })
  expect(await $.command.run({ command: 'budget', args: 'lots' })).toMatchObject({ text: 'Usage: /budget <share of the 5h limit, e.g. 20%> | <$amount, e.g. $5> | off' })
  expect(await $.command.run({ command: 'session-budget', args: 'off' })).toMatchObject({ text: 'session-budget off' })
  setLang('en')
  expect(etaText(80)).toBe('full in ≈1h 20m at this pace')
})
