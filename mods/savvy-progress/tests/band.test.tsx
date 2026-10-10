import { expect, test } from 'claude-code/testing'

import { BAND, OTHERS, SURFACES, finish, modelStep, prompt, setup, spawn, svgOf, threeRunning, tool } from './fixtures'

for (const surface of SURFACES) {
  let last: any
  const mount = async ($: any, props = {}) => {
    await last?.unmount()
    last = await $.ui.mount({ ...BAND, surface, props: { ...BAND.props, ...props } })
    return last
  }
  const shows = async (ui: any, text: string) =>
    surface === 'desktop' ? expect(await svgOf(ui)).toContain(text) : expect(await ui.find({ type: 'Text', text })).toBeDefined()

  test(`${surface}: three running agents read "Ajanlar 0/3 · —", not 0%`, async ($, on) => {
    last = undefined
    await setup($, on)
    await threeRunning($)
    const ui = await mount($)
    await shows(ui, 'Ajanlar 0/3')
    await shows(ui, '—')
    if (surface === 'desktop') expect((await ui.find({ type: 'Svg' }))?.props?.alt).toBe('Research competitors +2: Ajanlar 0/3, —')
    else expect(await ui.find({ type: 'Text', text: /%0\b/ })).toBeUndefined()
    expect((await ui.find({ key: 'savvy-agents' }))?.props?.label).toBe('×3')
  })

  test(`${surface}: finished agents move the count, the last one closes it as Bitti`, async ($, on) => {
    last = undefined
    await setup($, on)
    await threeRunning($)
    await finish($, 'a1')
    await shows(await mount($), 'Ajanlar 1/3')
    await finish($, 'a2')
    await finish($, 'a3', 'error')
    const ui = await mount($)
    await shows(ui, 'Bitti · 1 hata')
    await shows(ui, '%100')
  })

  test(`${surface}: the band stacks above the others' rows and yields to a survey`, async ($, on) => {
    last = undefined
    await setup($, on)
    await spawn($, 'Research')
    const ui = await mount($)
    const tree = (await ui.drawn()) as any
    expect(tree.children.at(-1)).toEqual(OTHERS)
    expect(tree.children.length).toBe(2)
    const survey = await mount($, { hasSurvey: true })
    expect(await survey.drawn()).toEqual(OTHERS)
  })

  test(`${surface}: the progress tool still drives the band in Turkish`, async ($, on) => {
    last = undefined
    await setup($, on)
    const tasks = [1, 2, 3, 4].map(n => ({ title: `Task ${n}`, tier: 'medium' }))
    const answer = await tool($, { tool: 'mcp__savvy-progress__progress', title: 'Launch kit', tasks, phase: 'delegate' })
    expect(answer.result).toBe('ok: Görevler 0/4')
    await tool($, { tool: 'mcp__savvy-progress__progress', done: 2 })
    const ui = await mount($)
    await shows(ui, 'Launch kit')
    await shows(ui, 'Görevler 2/4')
    await shows(ui, '%50')
    await tool($, { tool: 'mcp__savvy-progress__progress', phase: 'review', done: 3 })
    await shows(await mount($), 'Gözden geçirme 3/4')
  })

  test(`${surface}: a step report gives partial credit marked ~`, async ($, on) => {
    last = undefined
    await setup($, on)
    await spawn($, 'One')
    await spawn($, 'Two')
    await tool($, { tool: 'mcp__savvy-progress__step', done: 1, total: 2, note: 'Hero', agentId: 'a1' })
    await shows(await mount($), '~%25')
  })

  test(`${surface}: the main task list counts when present`, async ($, on) => {
    last = undefined
    await setup($, on)
    await spawn($, 'One')
    for (const subject of ['a', 'b', 'c', 'd']) await tool($, { tool: 'TaskCreate', subject, description: 'x' })
    await tool($, { tool: 'TaskUpdate', taskId: 't1', status: 'completed' })
    await shows(await mount($), 'Görevler 1/4')
  })

  test(`${surface}: a finished job's band stays over a new request until a new job or ✕`, async ($, on) => {
    last = undefined
    await setup($, on)
    await spawn($, 'One')
    await prompt($, 'more', 'task-notification')
    expect(((await (await mount($)).drawn()) as any).children?.length).toBe(2)
    await finish($, 'a1')
    await prompt($, 'next thing')
    await shows(await mount($), 'Bitti')
    await spawn($, 'Two')
    const ui = await mount($)
    await shows(ui, 'Ajanlar 0/1')
    await ui.press({ key: 'savvy-dismiss' })
    expect(await (await mount($)).drawn()).toEqual(OTHERS)
  })

  test(`${surface}: the crew button opens the İlerleme pane`, async ($, on) => {
    last = undefined
    const { world } = await setup($, on)
    await spawn($, 'One')
    await modelStep($, 'a1')
    await (await mount($)).press({ key: 'savvy-agents' })
    expect(world.opened).toEqual(['savvy-agents'])
  })
}
