import { expect, test } from 'claude-code/testing'

import { setLang } from '../hooks/i18n'
import { modelLine } from '../hooks/pane-svg'
import type { AgentRun } from '../types'
import { PANE, SECOND, SURFACES, setup, spawn, tool } from './fixtures'

// Asking an agent from the panel reads as a conversation: the question, the agent on it, its
// answer under it, and a follow-up from the same card that picks the finished agent up again.

setLang('tr')

const answer = ($: any, agentId: string, text: string) =>
  $.turn.complete({ answer: text, durationMs: 1, isAborted: false, turnId: `turn-${agentId}`, agentId, reason: 'answer' })

const run = (patch: Partial<AgentRun> = {}): AgentRun => ({
  id: 'a1', agentId: 'a1', type: 'claude', description: 'Work', model: '', status: 'running', startedAt: 0,
  contextTokens: 0, contextMax: 1, tokens: 0, costUsd: 0, steps: 0, round: 1, toolCount: 0, ...patch,
})

for (const surface of SURFACES) {
  const mount = ($: any, bodyColumns = PANE.props.bodyColumns) => $.ui.mount({ ...PANE, surface, props: { ...PANE.props, bodyColumns } })
  const words = async (ui: any) => {
    const texts = (await ui.findAll({ type: 'Text' })).map((t: any) => t.text ?? '')
    const labels = (await ui.findAll({ type: 'Button' })).map((b: any) => b.props?.label ?? '')
    return [...texts, ...labels].join('\n')
  }

  test(`${surface}: a question from the form, the agent on it, its answer, then a follow-up and its answer`, async ($, on) => {
    const { world, clock } = await setup($, on)
    const ui = await mount($)
    await ui.press({ key: 'new-task' })
    await ui.input({ key: 'dispatch-task', text: 'Summarise the README' })
    // The kit's spawn names no agent id (core does, in a session): the roster adopts the run.
    world.roster.push({ id: 'a1', type: 'general-purpose', description: 'Summarise the README', status: 'running' })
    await clock.advance(SECOND)
    expect(await words(ui)).toContain('Sen\nSummarise the README')
    expect(await words(ui)).toContain('● Pip yanıtlıyor…')

    await answer($, 'a1', 'It installs the mods.')
    let seen = await words(ui)
    expect(seen.indexOf('Pip\nIt installs the mods.')).toBeGreaterThan(seen.indexOf('Summarise the README'))
    expect(seen).not.toContain('yanıtlıyor')
    const field = (await ui.findAll({ type: 'Input' })).find((input: any) => String(input.props.key).startsWith('send-'))
    expect(field?.props?.placeholder).toBe("Pip'e devam sorusu sor, Enter gönderir")

    await ui.input({ key: field?.props?.key, text: 'Which ones?' })
    expect(world.sent.at(-1)?.text).toBe('Which ones?')
    seen = await words(ui)
    expect(seen.indexOf('Sen\nWhich ones?')).toBeGreaterThan(seen.indexOf('It installs the mods.'))
    expect(seen).toContain('● Pip yanıtlıyor…')

    await answer($, 'a1', 'Seventeen of them.')
    seen = await words(ui)
    expect(seen.indexOf('Pip\nSeventeen of them.')).toBeGreaterThan(seen.indexOf('Which ones?'))
    expect(seen).not.toContain('yanıtlıyor')
  })

  test(`${surface}: an agent Claude dispatched shows its task as the task, not as the person's words`, async ($, on) => {
    await setup($, on)
    await spawn($, 'Build the landing page')
    const ui = await mount($)
    await ui.press({ key: 'open-a1' })
    const seen = await words(ui)
    expect(seen).toContain('Görev\ndo it')
    expect(seen).not.toContain('Sen\n')
  })

  test(`${surface}: before its first tool call the open card draws no empty now box or history`, async ($, on) => {
    await setup($, on)
    await spawn($, 'Answer a question')
    const ui = await mount($)
    await ui.press({ key: 'open-a1' })
    expect(await words(ui)).not.toContain('Şu an')
    expect(await words(ui)).not.toContain('İş geçmişi')
    await tool($, { tool: 'Read', file_path: '/w/README.md', agentId: 'a1' })
    expect(await words(ui)).toContain('İş geçmişi · 1 araç')
  })
}

test('desktop: a narrow card sets the now line above the meta instead of cutting it to a stub', async ($, on) => {
  await setup($, on)
  await spawn($, 'Answer a question')
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop', props: { ...PANE.props, bodyColumns: 30 } })
  const texts = (await ui.findAll({ type: 'Text' })).map((t: any) => t.text ?? '')
  expect(texts).toContain('başlıyor')
})

test('desktop: no percent is guessed before the first tool call', async ($, on) => {
  await setup($, on)
  await spawn($, 'Answer a question')
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const alts = async () => (await ui.findAll({ type: 'Svg' })).map((s: any) => String(s.props.alt))
  expect(await alts()).toContain('başlıyor')
  expect((await alts()).some(alt => /~%\d+/.test(alt))).toBe(false)
  await tool($, { tool: 'Read', file_path: '/w/README.md', agentId: 'a1' })
  expect((await alts()).some(alt => /^~%\d+$/.test(alt))).toBe(true)
})

test('a model the spawn did not name is left out, never drawn as "—"', () => {
  expect(modelLine(run())).toBe('')
  expect(modelLine(run({ model: 'inherit' }))).toBe('')
  expect(modelLine(run({ effort: 'high' }))).toBe('high')
  expect(modelLine(run({ model: 'claude-opus-5-5', effort: 'high', round: 2 }))).toBe('Opus 5.5 · high · tur 2')
})
