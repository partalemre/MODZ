import { expect, test } from 'claude-code/testing'

import { PANE, SECOND, SURFACES, finish, setup, spawn, svgOf, threeRunning, tool } from './fixtures'

for (const surface of SURFACES) {
  const mount = ($: any) => $.ui.mount({ ...PANE, surface })
  const text = async (ui: any) => {
    const words = (await ui.findAll({ type: 'Text' })).map((t: any) => t.text ?? '')
    const labels = (await ui.findAll({ type: 'Button' })).map((b: any) => b.props?.label ?? '')
    return [...words, ...labels].join('\n')
  }

  test(`${surface}: rows are titled by the Agent description with tier, model, tool and meta`, async ($, on) => {
    const { clock } = await setup($, on)
    await threeRunning($)
    await clock.advance(156 * SECOND)
    const ui = await mount($)
    const all = await text(ui)
    expect(all).toContain('Build the landing page')
    expect(all).not.toContain('general-purpose')
    expect(all).toContain('heavy')
    expect(all).toContain('Opus 5.5 · xhigh')
    expect(all).toContain('› Edit src/hero.tsx')
    expect(all).toContain('1 araç')
    expect(all).toMatch(/ctx 13% · 129k · ≈\$0\.\d\d/)
    expect(all).toContain('2:36')
    expect(await ui.find({ type: 'Text', text: 'Çalışıyor · 3' })).toBeDefined()
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
    expect((await ui.find({ key: 'done' }))?.props?.label).toBe('▾ Bitti · 2')
    await ui.press({ key: 'done' })
    expect((await ui.find({ key: 'done' }))?.props?.label).toBe('▸ Bitti · 2')
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
    expect(await ui.find({ type: 'Text', text: 'Planlı · 1' })).toBeDefined()
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

  test(`${surface}: pressing an agent opens its task, work history and result; again closes it`, async ($, on) => {
    const { clock } = await setup($, on)
    await threeRunning($)
    await clock.advance(3 * SECOND)
    await tool($, { tool: 'Read', file_path: '/w/site/src/a.ts', agentId: 'a3' })
    await finish($, 'a3')
    const ui = await mount($)
    expect(await text(ui)).not.toContain('İş geçmişi')
    expect((await ui.find({ key: 'open-a3' }))?.props?.label).toBe('▸ Build the landing page')

    await ui.press({ key: 'open-a3' })
    const open = await text(ui)
    expect((await ui.find({ key: 'open-a3' }))?.props?.label).toBe('▾ Build the landing page')
    expect(open).toContain('Görev')
    expect(open).toContain('do it')
    expect(open).toContain('İş geçmişi · 2 araç')
    expect(open).toContain('Edit')
    expect(open).toContain(' src/hero.tsx')
    expect(open).toContain(' src/a.ts')
    expect(open).toContain('+0:03')
    expect(open).toContain('Sonuç')

    await ui.press({ key: 'open-a3' })
    expect(await text(ui)).not.toContain('İş geçmişi')
  })

  test(`${surface}: /agents-info toggles the pane`, async ($, on) => {
    const { world } = await setup($, on)
    expect((await $.command.run({ command: 'agents-info', args: '' })).text).toBe('Ajan paneli açıldı.')
    expect((await $.command.run({ command: 'agents-info', args: '' })).text).toBe('Ajan paneli kapandı.')
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
