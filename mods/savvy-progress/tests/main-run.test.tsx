import { expect } from 'claude-code/testing'

import { sharedOf } from '../hooks/chats'
import { hubCardOf } from '../hooks/hub'
import { setLang } from '../hooks/i18n'
import { QUIET_MS, stuckOf } from '../hooks/insight'
import { mainAwake } from '../hooks/main-run'
import { test, PANE, SECOND, mainEnd, prompt, setup, spawn, tool } from './fixtures'

// The session's own loop as a row of the panel: in a desktop chat most work has no subagent, and the panel used
// to show none of it.

const mount = ($: any) => $.ui.mount({ ...PANE, surface: 'terminal' })
const text = async (ui: any) => {
  const words = (await ui.findAll({ type: 'Text' })).map((t: any) => t.text ?? '')
  const labels = (await ui.findAll({ type: 'Button' })).map((b: any) => b.props?.label ?? '')
  return [...words, ...labels].join('\n')
}

// One model request of the main loop: no agentId names it.
async function mainStep($: any, index = 0) {
  const stream = $.turn.step({ turnId: 'main-1', index, model: 'claude-opus-5-5', messageCount: 1 })
  let step = await stream.next()
  while (step.done !== true) step = await stream.next()
}

test('the main loop is a row: named for what it is, titled by the request, its calls in plain words', async ($, on) => {
  await setup($, on)
  await prompt($, 'Fix the login bug\nand add a test')
  await mainStep($)
  await tool($, { tool: 'Bash', command: 'cd /w && npm test' })
  const ui = await mount($)
  const seen = await text(ui)
  expect(seen).toContain('Ana oturum')
  expect(seen).toContain('Fix the login bug')
  expect(seen).not.toContain('and add a test')
  expect(seen).toContain('› Testleri çalıştırıyor')
  expect(seen).toContain('Çalışıyor · 1')

  await ui.press({ key: 'open-main' })
  const open = await text(ui)
  expect(open).toContain('İş geçmişi · 1 araç')
  expect(open).toContain('Testleri çalıştırıyor')
  // It is talked to in the chat and stopped there: its card offers neither.
  expect(await ui.find({ key: 'stop-main' })).toBeUndefined()
  expect(await ui.find({ key: 'send-main' })).toBeUndefined()

  await mainEnd($)
  expect(await text(ui)).not.toContain('Çalışıyor · 1')
})

test('without a model request of its own the main loop has no row, and a slash command names none', async ($, on) => {
  await setup($, on)
  await tool($, { tool: 'Read', file_path: '/w/a.ts' })
  const ui = await mount($)
  expect(await text(ui)).not.toContain('Ana oturum')

  await prompt($, '/agents-info')
  await mainStep($)
  expect(await text(ui)).toContain('Bu sohbetteki iş')
})

test('a new request starts the row over; a turn that woke on a background notice keeps it', async ($, on) => {
  const { clock } = await setup($, on)
  await prompt($, 'First job')
  await mainStep($)
  await tool($, { tool: 'Read', file_path: '/w/a.ts' })
  await mainEnd($)
  await clock.advance(5 * SECOND)

  await prompt($, 'a task finished', 'task-notification')
  await mainStep($)
  const ui = await mount($)
  await ui.press({ key: 'open-main' })
  expect(await text(ui)).toContain('First job')
  expect(await text(ui)).toContain('İş geçmişi · 1 araç')

  await mainEnd($)
  await prompt($, 'Second job')
  await mainStep($)
  const again = await text(ui)
  expect(again).toContain('Second job')
  expect(again).not.toContain('First job')
  expect(again).not.toContain('İş geçmişi')
})

test('a subagent keeps its own row beside the main loop, and its calls stay its own', async ($, on) => {
  await setup($, on)
  await prompt($, 'Ship it')
  await mainStep($)
  await spawn($, 'Survey the tests')
  await tool($, { tool: 'Grep', pattern: 'launch', agentId: 'a1' })
  const ui = await mount($)
  const seen = await text(ui)
  expect(seen).toContain('Çalışıyor · 2')
  expect(seen).toContain('› Dosyaların içinde “launch” arıyor')
  // The main loop's row comes first: its title is the first of the rows' open buttons.
  const titles = (await ui.findAll({ type: 'Button' })).map((b: any) => String(b.props?.label ?? '')).filter((label: string) => label.startsWith('▸'))
  expect(titles).toEqual(['▸ Ship it', '▸ Survey the tests'])
})

test('the main loop is not crew: the hub counts no agent for it, other chats do not hear of it, and its quiet is not trouble', () => {
  setLang('tr')
  const [main] = mainAwake([], { title: 'Fix the login bug', at: 0 })
  if (!main) throw new Error('no main row')
  const busy = { ...main, lastTool: 'Bash', lastPlain: 'Testleri çalıştırıyor' }
  const card = hubCardOf({ flow: null, agents: [busy], job: null, tasks: [], chats: [] })
  // What this chat does now leads the hub's Now area, in plain words.
  expect(card.live?.lines[0]?.label).toBe('Testleri çalıştırıyor')
  expect(card.tone).toBe('live')
  expect(card.detail).toBe('')
  expect(sharedOf([busy])).toEqual([])
  expect(stuckOf(busy, QUIET_MS * 3)).toBeNull()
})
