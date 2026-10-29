import { expect, test } from 'claude-code/testing'

import { PANE, SECOND, SURFACES, finish, measure, setup, spawn, svgOf, threeRunning, tool } from './fixtures'

for (const surface of SURFACES) {
  const mount = ($: any) => $.ui.mount({ ...PANE, surface })
  const text = async (ui: any) => {
    const words = (await ui.findAll({ type: 'Text' })).map((t: any) => t.text ?? '')
    const labels = (await ui.findAll({ type: 'Button' })).map((b: any) => b.props?.label ?? '')
    return [...words, ...labels].join('\n')
  }
  // Everything the person can read: the desktop draws a card's head and the section heads.
  const all = async (ui: any) => (surface === 'terminal' ? text(ui) : `${await text(ui)}\n${await svgOf(ui)}`)
  const hasHead = async (ui: any, label: string) =>
    surface === 'terminal' ? (await ui.find({ type: 'Text', text: label })) !== undefined : (await svgOf(ui)).includes(label)
  // The row's disclosure: the title itself on the terminal; on the desktop the whole row is the press, its drawn
  // head saying what pressing it does ("Detay" to open, "Gizle" to close).
  const isShownOpen = async (ui: any, isOpen: boolean, title: string) => {
    if (surface === 'terminal') return (await ui.find({ key: 'open-a3' }))?.props?.label === `${isOpen ? '▾' : '▸'} ${title}`
    return (await svgOf(ui)).includes(`${title}: Nori`) && (await svgOf(ui)).includes(isOpen ? '(Gizle)' : '(Detay)')
  }

  test(`${surface}: rows are titled by the Agent description with tier, model, tool and meta`, async ($, on) => {
    const { clock } = await setup($, on)
    await threeRunning($)
    await clock.advance(156 * SECOND)
    const ui = await mount($)
    const seen = await all(ui)
    expect(seen).toContain('Build the landing page')
    expect(seen).not.toContain('general-purpose')
    expect(seen).toContain('heavy')
    expect(seen).toContain('Opus 5.5 · xhigh')
    expect(seen).toContain('› Edit src/hero.tsx')
    expect(seen).toContain('1 araç')
    expect(seen).toMatch(/≈\$0,\d\d/)
    expect(seen).toContain('2:36')
    // Context and tokens wait in the detail, so the card reads name, status, progress and cost.
    const metrics = /bağlam %13 · 129k token · ≈\$0,\d\d/
    expect(surface === 'terminal' ? seen : await svgOf(ui)).not.toMatch(metrics)
    await ui.press({ key: 'open-a3' })
    if (surface === 'terminal') expect(await text(ui)).toMatch(metrics)
    else expect(await svgOf(ui)).toMatch(metrics)
    expect(await hasHead(ui, 'Çalışıyor · 3')).toBe(true)
  })

  test(`${surface}: finished rows show the total time and fold under Bitti`, async ($, on) => {
    const { clock } = await setup($, on)
    await threeRunning($)
    await clock.advance(61 * SECOND)
    await finish($, 'a1')
    await finish($, 'a2', 'aborted')
    const ui = await mount($)
    expect(await text(ui)).toContain('toplam 1:01')
    expect(await text(ui)).toContain('durduruldu')
    expect(await hasHead(ui, 'Bitti · 2') || (await ui.find({ key: 'done' }))?.props?.label === '▾ Bitti · 2').toBe(true)
    expect((await ui.find({ key: 'done' }))?.props?.label).toBe(surface === 'terminal' ? '▾ Bitti · 2' : 'Gizle')
    await ui.press({ key: 'done' })
    expect((await ui.find({ key: 'done' }))?.props?.label).toBe(surface === 'terminal' ? '▸ Bitti · 2' : 'Göster')
    expect(await all(ui)).not.toContain('Design the graphics: ')
    expect(await text(ui)).not.toContain('Design the graphics')
  })

  test(`${surface}: planned tasks wait under Planlı with their dependencies`, async ($, on) => {
    await setup($, on)
    const tasks = [
      { title: 'Research', tier: 'careful' },
      { title: 'Review the kit', tier: 'heavy', after: [1] },
    ]
    await tool($, { tool: 'mcp__savvy-progress__progress', title: 'Launch kit', tasks, phase: 'delegate' })
    await spawn($, 'Research', 'savvy-careful')
    const ui = await mount($)
    expect(await hasHead(ui, 'Planlı · 1')).toBe(true)
    expect(await text(ui)).toContain('2. Review the kit')
    expect(await text(ui)).toContain('Opus · xhigh · 1 sonrası')
  })

  test(`${surface}: header tiles and the Daralt toggle are Turkish`, async ($, on) => {
    await setup($, on)
    await threeRunning($)
    const ui = await mount($)
    if (surface === 'desktop') for (const word of ['Maliyet', 'Token', 'Süre']) expect(await svgOf(ui)).toContain(word)
    else expect(await ui.find({ type: 'Text', text: /^Maliyet ≈\$.* · Token .* · Süre / })).toBeDefined()
    expect((await ui.find({ key: 'compact' }))?.props?.label).toBe('Daralt')
    await ui.press({ key: 'compact' })
    expect((await ui.find({ key: 'compact' }))?.props?.label).toBe('Genişlet')
  })

  test(`${surface}: pressing an agent opens its task, its answer and work history; again closes it`, async ($, on) => {
    const { clock } = await setup($, on)
    await threeRunning($)
    await clock.advance(3 * SECOND)
    await tool($, { tool: 'Read', file_path: '/w/site/src/a.ts', agentId: 'a3' })
    await finish($, 'a3')
    const ui = await mount($)
    expect(await text(ui)).not.toContain('İş geçmişi')
    expect(await isShownOpen(ui, false, 'Build the landing page')).toBe(true)

    await ui.press({ key: 'open-a3' })
    const open = await text(ui)
    expect(await isShownOpen(ui, true, 'Build the landing page')).toBe(true)
    expect(open).toContain('Görev')
    expect(open).toContain('do it')
    expect(open).toContain('İş geçmişi · 2 araç')
    expect(open).toContain('Edit')
    expect(open).toContain(' src/hero.tsx')
    expect(open).toContain(' src/a.ts')
    expect(open).toContain('3 sn önce')
    expect(open).toContain('Nori\nok')

    await ui.press({ key: 'open-a3' })
    expect(await text(ui)).not.toContain('İş geçmişi')
  })

  test(`${surface}: each row shows its percent, marked ~ when estimated`, async ($, on) => {
    await setup($, on)
    await threeRunning($)
    await tool($, { tool: 'mcp__savvy-progress__step', done: 3, total: 5, agentId: 'a2' })
    await finish($, 'a1')
    const ui = await mount($)
    const all = surface === 'terminal' ? await text(ui) : await svgOf(ui)
    expect(all).toContain('%100')
    expect(all).toContain('%60')
    expect(all).toMatch(/~%\d+/)
  })

  test(`${surface}: once the 5h window moved, rows and the header show each share of it`, async ($, on) => {
    await setup($, on)
    await threeRunning($)
    const pane = await mount($)
    const words = async () => (surface === 'terminal' ? text(pane) : svgOf(pane))
    expect(await words()).not.toContain('5 saat ≈')
    await measure($, 23.5, 1)
    expect(await words()).toContain('5 saat payı ≈%5,9')
    await pane.press({ key: 'open-a1' })
    expect(await words()).toContain('5 saat ≈%2,0')
  })

  test(`${surface}: an open finished row shows its work mix and its answer`, async ($, on) => {
    await setup($, on)
    await threeRunning($)
    await tool($, { tool: 'Read', file_path: '/w/site/src/a.ts', agentId: 'a3' })
    await finish($, 'a3')
    const pane = await mount($)
    await pane.press({ key: 'open-a3' })
    const open = await text(pane)
    expect(open).toContain('düzenleme 1')
    expect(open).toContain('okuma 1')
    expect(open).toContain('Nori\nok')
    if (surface === 'desktop') expect(await svgOf(pane)).toContain('okuma 1 · düzenleme 1')
  })

  test(`${surface}: /agents-info toggles the Ajanlar pane`, async ($: any, on: any) => {
    const { world } = await setup($, on)
    expect((await $.command.run({ command: 'agents-info', args: '' })).text).toBe('Ajanlar paneli açıldı.')
    expect((await $.command.run({ command: 'agents-info', args: '' })).text).toBe('Ajanlar paneli kapandı.')
    expect(world.opened).toEqual(['savvy-agents'])
    expect(world.closed).toEqual(['savvy-agents'])
  })
}

test('costume follows the effort without a savvy tier, the tier with one', async ($, on) => {
  await setup($, on)
  await threeRunning($)
  await spawn($, 'Careful one', 'savvy-careful')
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const source = await svgOf(ui)
  for (const costume of ['c-heavy', 'c-medium', 'c-light', 'c-careful']) expect(source).toContain(costume)
})
