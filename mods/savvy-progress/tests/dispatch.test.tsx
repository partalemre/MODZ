import { expect, test } from 'claude-code/testing'

import { PANE, SECOND, SURFACES, setup, threeRunning } from './fixtures'

// "Yeni görev": the empty panel's one action, the form, the start, a refusal, and where the agent
// types come from (built-ins, the engine's offers, the project's agent files).

const REVIEWER = '---\nname: reviewer\ndescription: "Reviews diffs before they land"\ntools: Read, Grep\n---\nYou review.'
const NO_NAME = '---\ndescription: nameless\n---\n'
const typeOf = (spawn: Record<string, unknown> | undefined) => spawn?.subagentType ?? spawn?.subagent_type

for (const surface of SURFACES) {
  const mount = ($: any) => $.ui.mount({ ...PANE, surface })
  const texts = async (ui: any) => (await ui.findAll({ type: 'Text' })).map((t: any) => t.text ?? '').join('\n')

  test(`${surface}: the empty panel invites with an eyebrow, one sentence and one action`, async ($, on) => {
    await setup($, on)
    const ui = await mount($)
    expect(await texts(ui)).toContain('● HENÜZ AJAN YOK')
    expect(await texts(ui)).toContain('Bir görev ver, bir yengeç işe koyulsun')
    expect((await ui.findAll({ type: 'Button' })).map((b: any) => b.props.label)).toEqual(['＋ Yeni görev'])
    await ui.press({ key: 'new-task' })
    expect(await ui.find({ key: 'dispatch-task' })).toBeDefined()
    expect(await texts(ui)).toContain('yerleşik · Araştırma, arama ve çok adımlı iş')
    await ui.press({ key: 'dispatch-cancel' })
    expect(await ui.find({ key: 'dispatch-task' })).toBeUndefined()
  })

  test(`${surface}: a described task starts the picked type, closes the form and names its crab`, async ($, on) => {
    const { world, clock } = await setup($, on)
    await threeRunning($)
    const ui = await mount($)
    await ui.press({ key: 'new-task' })
    await ui.select({ key: 'dispatch-type', value: 'Explore' })
    await ui.input({ key: 'dispatch-task', text: '   ' })
    expect(world.spawns).toHaveLength(3)
    await ui.input({ key: 'dispatch-task', text: 'Find every caller of fetchPrices and say which ones retry\nthen stop' })
    expect(world.spawns).toHaveLength(4)
    expect(typeOf(world.spawns[3])).toBe('Explore')
    expect(world.spawns[3]?.prompt).toBe('Find every caller of fetchPrices and say which ones retry\nthen stop')
    expect(String(world.spawns[3]?.description)).toMatch(/^Find every caller of fetchPrices.{0,10}…$/)
    expect(world.toasts).toContain('Kiko işe koyuldu')
    expect(await ui.find({ key: 'dispatch-task' })).toBeUndefined()
    // Its card is there at once and open, ready for a message. The kit's spawn names no agent id
    // (core does, in a session), so the run waits under a local id until the roster adopts it.
    const field = (await ui.findAll({ type: 'Input' })).find((input: any) => input.props.key.startsWith('send-'))
    expect(field?.props?.placeholder).toBe("Kiko'ya yaz, Enter gönderir")
    world.roster.push({ id: 'agent-77', type: 'Explore', description: String(world.spawns[3]?.description), status: 'running' })
    await clock.advance(SECOND)
    expect(await ui.find({ key: 'send-agent-77' })).toBeUndefined()
    expect((await ui.findAll({ type: 'Button' })).filter((b: any) => String(b.props.key).startsWith('open-'))).toHaveLength(4)
    expect(field?.props?.key).toBe((await ui.findAll({ type: 'Input' })).find((input: any) => input.props.key.startsWith('send-'))?.props?.key)
  })

  test(`${surface}: a refused start keeps the form open and says why`, async ($, on) => {
    const { world } = await setup($, on, { deny: { Plan: 'plan mode is off' } })
    await threeRunning($)
    const ui = await mount($)
    await ui.press({ key: 'new-task' })
    await ui.select({ key: 'dispatch-type', value: 'Plan' })
    await ui.input({ key: 'dispatch-task', text: 'Plan the billing page' })
    expect(await texts(ui)).toContain('Reddedildi: plan mode is off')
    expect(await ui.find({ key: 'dispatch-task' })).toBeDefined()
    expect(world.toasts.some(toast => toast.includes('işe koyuldu'))).toBe(false)
    await ui.select({ key: 'dispatch-type', value: 'general-purpose' })
    expect(await texts(ui)).not.toContain('Reddedildi')
  })

  test(`${surface}: types come from the built-ins, the engine's offers and the project's agent files`, async ($, on) => {
    await setup($, on, { files: { '.claude/agents': { 'reviewer.md': REVIEWER, 'nameless.md': NO_NAME, 'notes.txt': 'x' } } })
    await $.agent.offer({ agent: 'savvy-flow:savvy-heavy', description: 'Heavy worker for hard tasks\nUse when…', source: 'plugin', provider: { plugin: 'savvy-flow', tier: 'user' } })
    await $.agent.offer({ agent: 'Explore', description: 'engine words', source: 'built-in', provider: { plugin: 'engine', tier: 'core' } })
    const ui = await mount($)
    await ui.press({ key: 'new-task' })
    const options = (await ui.find({ key: 'dispatch-type' }))?.props?.options.map((o: any) => o.value)
    expect(options).toEqual(['general-purpose', 'Explore', 'Plan', 'reviewer', 'savvy-flow:savvy-heavy'])
    await ui.select({ key: 'dispatch-type', value: 'reviewer' })
    expect(await texts(ui)).toContain('proje · Reviews diffs before they land')
    await ui.select({ key: 'dispatch-type', value: 'savvy-flow:savvy-heavy' })
    expect(await texts(ui)).toContain('eklenti · Heavy worker for hard tasks')
  })
}
