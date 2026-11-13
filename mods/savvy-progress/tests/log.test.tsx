import { expect } from 'claude-code/testing'

import { openEvent, withReason } from '../hooks/history'
import { setLang } from '../hooks/i18n'
import { timeOf } from '../hooks/log'
import type { AgentRun } from '../types'
import { test, PANE, prompt, setup, tool } from './fixtures'

// The step-by-step log: every call an agent made, when, what for, why (the sentence it wrote before the call),
// the tool and file behind it. Opened from the agent's card in place of its short list of latest steps.

setLang('tr')

const run = (patch: Partial<AgentRun> = {}): AgentRun => ({
  id: 'a1', agentId: 'a1', type: 'general-purpose', description: 'Work', model: 'm', status: 'running', startedAt: 0,
  contextTokens: 0, contextMax: 1, tokens: 0, costUsd: 0, steps: 0, round: 1, toolCount: 0, ...patch,
})

const read = (id: string, at: number) => ({ call: { tool: 'Read', file_path: '/w/docs/RELEASE_PLAN.md' }, at, id })
const REASON = 'Önce yayın planını okuyorum, kalan işleri saymak için'

test('what the agent wrote before a step is the reason of its calls, whether they open before or after', () => {
  const step = { answer: `Plana bakmam gerek.\n\n**${REASON}:**`, calls: 2, sentAt: 1_000 }
  // An older call, then t1 opened while the reply was still streaming; t2 opens once it is whole.
  const early = withReason(openEvent(openEvent(run(), read('t0', 500)), read('t1', 1_200)), step)
  const both = openEvent(early, read('t2', 1_500))
  expect(both.history?.map(e => e.because)).toEqual([undefined, REASON, REASON])
  expect(both.history?.[1]?.path).toBe('/w/docs/RELEASE_PLAN.md')
  // The step asked for two calls: a third is not its own. A later step made without a word carries none over.
  expect(openEvent(both, read('t3', 1_600)).history?.at(-1)?.because).toBeUndefined()
  const silent = openEvent(withReason(both, { answer: '', calls: 1, sentAt: 2_000 }), read('t4', 2_100))
  expect(silent.history?.at(-1)?.because).toBeUndefined()
})

test('a step is stamped with the time of day it was made', () => {
  expect(timeOf(new Date(2026, 10, 13, 9, 5, 7).getTime())).toBe('09:05:07')
})

// One model request of the main loop that says why before it calls its tools.
async function mainStep($: any, index = 0) {
  const stream = $.turn.step({ turnId: 'main-1', index, model: 'claude-opus-5-5', messageCount: 1 })
  let step = await stream.next()
  while (step.done !== true) step = await stream.next()
}

const SURFACES = ['terminal', 'desktop'] as const

for (const surface of SURFACES) {
  const text = async (ui: any) => {
    const words = (await ui.findAll({ type: 'Text' })).map((t: any) => t.text ?? '')
    const labels = (await ui.findAll({ type: 'Button' })).map((b: any) => b.props?.label ?? '')
    return [...words, ...labels].join('\n')
  }

  test(`${surface}: the card's button opens the whole log, each step with its time, tool and file, and folds it again`, async ($, on) => {
    await setup($, on)
    await prompt($, 'Ne kadar iş kaldı?')
    await mainStep($)
    for (let i = 0; i < 10; i += 1) await tool($, { tool: 'Bash', command: `./step-${i}.sh`, description: `Adım ${i}` })
    await tool($, { tool: 'Read', file_path: '/w/docs/RELEASE_PLAN.md', tool_use_id: 'r1' })
    const ui = await $.ui.mount({ ...PANE, surface })
    await ui.press({ key: 'open-main' })
    const short = await text(ui)
    expect(short).toContain('Tüm adımları göster (11)')
    expect(short).not.toContain('Adım 0')

    await ui.press({ key: 'log-main' })
    const log = await text(ui)
    expect(log).toContain('Adım adım kayıt · 11 adım')
    expect(log).toContain('Adım 0')
    expect(log).toMatch(/\d\d:\d\d:\d\d/)
    expect(log).toContain('RELEASE_PLAN.md dosyasını okuyor')
    expect(log).toContain('Kaydı kapat')
    // The file is a link that opens it, written as markdown: the desktop is sent no other link to a file.
    expect((await ui.findAll({ type: 'Markdown' })).map((m: any) => m.props.text)).toContain('[RELEASE\\_PLAN.md](<file:///w/docs/RELEASE_PLAN.md>)')

    await ui.press({ key: 'log-main' })
    expect(await text(ui)).not.toContain('Adım 0')
  })
}
