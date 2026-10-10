import { expect, test } from 'claude-code/testing'

import { PANE, SECOND, SURFACES, finish, setup, spawn, svgOf, threeRunning, tool } from './fixtures'

// The Ajanlar panel's parts around and inside the cards, on both surfaces: the header card, the
// cards' heads, talking to an agent and stopping it, the quiet-agent warning, the timeline.

const MINUTE = 60 * SECOND
const TASKS = [1, 2, 3, 4].map(n => ({ title: `Task ${n}`, tier: 'medium' }))

for (const surface of SURFACES) {
  const mount = ($: any) => $.ui.mount({ ...PANE, surface })
  // Every word the person can read: native text and labels, and on the desktop the drawings too.
  const words = async (ui: any) => {
    const texts = (await ui.findAll({ type: 'Text' })).map((t: any) => t.text ?? '')
    const labels = (await ui.findAll({ type: 'Button' })).map((b: any) => b.props?.label ?? '')
    const drawn = surface === 'desktop' ? await svgOf(ui) : ''
    return [...texts, ...labels, drawn].join('\n')
  }

  test(`${surface}: the header card names the job, its percent, the counts and the totals`, async ($, on) => {
    await setup($, on)
    await tool($, { tool: 'mcp__savvy-progress__progress', title: 'Launch kit', tasks: TASKS, phase: 'delegate' })
    await spawn($, 'Task 1')
    await spawn($, 'Task 2')
    await finish($, 'a1')
    await tool($, { tool: 'mcp__savvy-progress__progress', done: 1 })
    const ui = await mount($)
    const seen = await words(ui)
    for (const part of ['Launch kit', '%25', '1 çalışıyor · 1 bitti · 2 planlı', 'Maliyet', 'Token', 'Süre', '5 saat payı']) expect(seen).toContain(part)
    if (surface === 'desktop') expect((await ui.findAll({ type: 'Svg' }))[0]?.props?.alt).toMatch(/^Launch kit, %25, 1 çalışıyor/)
  })

  test(`${surface}: nothing measurable reads "—" in the header, never 0%`, async ($, on) => {
    await setup($, on)
    await threeRunning($)
    const seen = await words(await mount($))
    expect(seen).toContain('—')
    expect(seen).not.toMatch(/[^~]%0\b/)
  })

  test(`${surface}: each card names its crab, its tier and model, and its status`, async ($, on) => {
    await setup($, on)
    await threeRunning($)
    await finish($, 'a2')
    const seen = await words(await mount($))
    for (const part of ['Pip', 'Mako', 'Nori', 'heavy', 'medium', 'light', 'Opus 5.5', 'çalışıyor', 'bitti']) expect(seen).toContain(part)
  })

  test(`${surface}: an open running card sends a message to that agent and says it arrived`, async ($, on) => {
    const { world } = await setup($, on)
    await threeRunning($)
    const ui = await mount($)
    await ui.press({ key: 'open-a3' })
    expect((await ui.find({ key: 'send-a3' }))?.props?.placeholder).toBe("Nori'ye yaz, Enter gönderir")
    await ui.input({ key: 'send-a3', text: '  look at the footer too  ' })
    expect(world.sent).toHaveLength(1)
    expect(world.sent[0]?.text).toBe('look at the footer too')
    expect(String(world.sent[0]?.to)).toContain('a3')
    expect(world.toasts).toContain('Mesaj iletildi')
  })

  test(`${surface}: an empty message is not sent; an undelivered one says why`, async ($, on) => {
    const { world } = await setup($, on, { undelivered: 'agent gone' })
    await threeRunning($)
    const ui = await mount($)
    await ui.press({ key: 'open-a1' })
    await ui.input({ key: 'send-a1', text: '   ' })
    expect(world.sent).toHaveLength(0)
    await ui.input({ key: 'send-a1', text: 'still there?' })
    expect(world.toasts).toContain('İletilemedi: agent gone')
  })

  test(`${surface}: the stop button names its crab and asks TaskStop for that agent`, async ($, on) => {
    const { world } = await setup($, on)
    await threeRunning($)
    const ui = await mount($)
    await ui.press({ key: 'open-a2' })
    expect((await ui.find({ key: 'stop-a2' }))?.props?.label).toBe("Mako'yu durdur")
    await ui.press({ key: 'stop-a2' })
    expect(world.calls.find(call => call.tool === 'TaskStop')).toMatchObject({ task_id: 'a2' })
    expect(world.toasts).toContain('Durdurma istendi')
  })

  test(`${surface}: a refused stop says so; a finished card has no message or stop`, async ($, on) => {
    const { world } = await setup($, on, { refuse: ['TaskStop'] })
    await threeRunning($)
    await finish($, 'a1')
    const ui = await mount($)
    await ui.press({ key: 'open-a2' })
    await ui.press({ key: 'stop-a2' })
    expect(world.toasts).toContain('Durdurma reddedildi')
    await ui.press({ key: 'open-a1' })
    expect(await ui.find({ key: 'stop-a1' })).toBeUndefined()
    expect(await ui.find({ key: 'send-a1' })).toBeUndefined()
  })

  test(`${surface}: an agent unheard for 2 minutes turns its pill Amber and takes the attention line`, async ($, on) => {
    const { clock } = await setup($, on)
    await threeRunning($)
    await clock.advance(MINUTE + 50 * SECOND)
    const ui = await mount($)
    expect(await words(ui)).not.toContain('sessiz')
    await clock.advance(30 * SECOND)
    await tool($, { tool: 'Read', file_path: '/w/a.ts', agentId: 'a2' })
    await tool($, { tool: 'Read', file_path: '/w/b.ts', agentId: 'a3' })
    const seen = await words(ui)
    expect(seen).toContain('Pip sessiz 2 dk')
    expect(seen).not.toContain('Mako sessiz')
    if (surface === 'desktop') expect(await svgOf(ui)).toContain('b-warn')
    await ui.press({ key: 'look' })
    expect(await ui.find({ key: 'stop-a1' })).toBeDefined()
  })

  test(`${surface}: a fresh failure takes the attention line, a stop by the person does not`, async ($, on) => {
    await setup($, on)
    await threeRunning($)
    await finish($, 'a1', 'aborted')
    const ui = await mount($)
    expect(await words(ui)).not.toContain('hata verdi')
    await finish($, 'a2', 'error')
    expect(await words(ui)).toContain('Mako hata verdi')
  })

  test(`${surface}: the timeline shows once two agents exist and folds away`, async ($, on) => {
    await setup($, on)
    await spawn($, 'Only one')
    const ui = await mount($)
    expect(await ui.find({ key: 'timeline' })).toBeUndefined()
    await spawn($, 'A second one')
    await tool($, { tool: 'Read', file_path: '/w/a.ts', agentId: 'a2' })
    expect(await words(ui)).toContain('Zaman çizelgesi')
    if (surface === 'desktop') expect((await ui.findAll({ type: 'Svg' })).some((s: any) => /^Zaman çizelgesi: Pip 0:00 çalışıyor, Mako/.test(s.props.alt))).toBe(true)
    else expect(await ui.find({ type: 'Text', text: /^Pip\s+/ })).toBeDefined()
    await ui.press({ key: 'timeline' })
    expect(await words(ui)).not.toMatch(/Zaman çizelgesi: |^Pip\s+─/m)
  })
}
