import { expect, test } from 'claude-code/testing'

import { BAND, PANE, SECOND, SURFACES, finish, setup, spawn, svgOf, threeRunning, tool } from './fixtures'

// Without MODZ_LANG the band, the Agents pane, its cards, timeline, warning and "New task" form, and
// the hub card read English, in the film's words ("Every agent gets a face.").

const MINUTE = 60 * SECOND
const TURKISH = /[çğıöşüİ]/i
const EN = { lang: 'en' } as const
const TASKS = [1, 2, 3, 4].map(n => ({ title: `Task ${n}`, tier: 'medium' }))
const progress = ($: any, input: Record<string, unknown>) => tool($, { tool: 'mcp__savvy-progress__progress', ...input })

for (const surface of SURFACES) {
  const pane = ($: any) => $.ui.mount({ ...PANE, surface })
  // Every word the person can read: native text and labels, and on the desktop the drawings too.
  const words = async (ui: any) => {
    const texts = (await ui.findAll({ type: 'Text' })).map((t: any) => t.text ?? '')
    const labels = (await ui.findAll({ type: 'Button' })).map((b: any) => b.props?.label ?? '')
    const drawn = surface === 'desktop' ? await svgOf(ui) : ''
    return [...texts, ...labels, drawn].join('\n')
  }
  const expectAll = (seen: string, parts: string[]) => {
    for (const part of parts) expect(seen).toContain(part)
    expect(seen).not.toMatch(TURKISH)
  }

  test(`${surface}: the Agents pane header reads AGENTS, the counts and the four figures`, async ($, on) => {
    await setup($, on, EN)
    await progress($, { title: 'Checkout migration', tasks: TASKS, phase: 'delegate' })
    await spawn($, 'Task 1')
    await spawn($, 'Task 2')
    await finish($, 'a1')
    await progress($, { done: 1 })
    const seen = await words(await pane($))
    const figures = surface === 'desktop' ? ['AGENTS', 'COST', 'TOKENS', 'TIME', '5H SHARE'] : ['Cost', 'Tokens', 'Time', '5h share']
    expectAll(seen, ['Checkout migration', '25%', '1 running · 1 done · 2 planned', ...figures])
  })

  test(`${surface}: cards say running and done, with the step line and an honest cost`, async ($, on) => {
    const { clock } = await setup($, on, EN)
    await threeRunning($)
    await tool($, { tool: 'mcp__savvy-progress__step', done: 3, total: 5, note: 'Write src/checkout/Page.tsx', agentId: 'a3' })
    await clock.advance(69 * SECOND)
    await finish($, 'a2')
    const seen = await words(await pane($))
    expectAll(seen, ['Pip', 'Mako', 'Nori', 'running', 'done', '3/5 · Write src/', '1:09'])
    expect(seen).toMatch(/≈\$0\.\d\d/)
  })

  test(`${surface}: a quiet agent takes the attention line in English`, async ($, on) => {
    const { clock } = await setup($, on, EN)
    await threeRunning($)
    await clock.advance(2 * MINUTE + 20 * SECOND)
    await tool($, { tool: 'Read', file_path: '/w/a.ts', agentId: 'a2' })
    await tool($, { tool: 'Read', file_path: '/w/b.ts', agentId: 'a3' })
    const ui = await pane($)
    expectAll(await words(ui), ['Pip quiet 2 min', 'Look', 'Timeline'])
    if (surface === 'desktop') expect((await ui.findAll({ type: 'Svg' })).some((s: any) => /^Timeline: Pip \d:\d\d running/.test(s.props.alt))).toBe(true)
  })

  test(`${surface}: the empty pane offers "New task" and the form speaks English`, async ($, on) => {
    const { world } = await setup($, on, EN)
    const ui = await pane($)
    expectAll(await words(ui), ['NO AGENTS YET', 'Hand out a task and a crab gets to work', '＋ New task'])
    await ui.press({ key: 'new-task' })
    expectAll(await words(ui), ['built-in · Research, search and multi-step work', 'Cancel'])
    await ui.input({ key: 'dispatch-task', text: 'Find every caller of fetchPrices' })
    expect(world.toasts.some(text => text.endsWith(' got to work'))).toBe(true)
  })

  test(`${surface}: the band reads Agents 0/3, then Done with its failures`, async ($, on) => {
    await setup($, on, EN)
    await threeRunning($)
    const band = async () => {
      const ui = await $.ui.mount({ ...BAND, surface })
      const seen = surface === 'desktop' ? await svgOf(ui) : await words(ui)
      await ui.unmount()
      return seen
    }
    expectAll(await band(), ['Agents 0/3'])
    await finish($, 'a1')
    await finish($, 'a2')
    await finish($, 'a3', 'error')
    expectAll(await band(), ['Done · 1 failed', '100%'])
  })
}

// A stand-in for the MODZ hub that reads this mod's card, as the hub does.
const HUB_STAND_IN = {
  name: 'modz',
  register(on: any) {
    on('command.run', { command: 'hub-card' }, async ($: any) => ({ text: JSON.stringify(await $.state.get({ plugin: 'savvy-progress', key: 'hub' })) }))
  },
}

test('the hub card reads the job and how many agents run', { plugins: [HUB_STAND_IN] }, async ($, on) => {
  await setup($, on, EN)
  await threeRunning($)
  const card = JSON.parse((await $.command.run({ command: 'hub-card', args: '' })).text)
  expect(card.value.detail).toBe('Agents 0/3 · 3 running')
})
