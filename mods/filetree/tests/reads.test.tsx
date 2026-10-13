import { expect, test } from 'claude-code/testing'

import { world } from './world'
import type { World } from './world'

// What each read put into context, from the sizes the model requests report: on the touched card and the tree
// row on the desktop, on the now line and the tree row in the terminal, a subagent's reads among them.

const ROOT = '/Users/k/MODZ'
const props = { title: 'Files', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} } as any
const drawnText = async (ui: any) => JSON.stringify(await ui.drawn()) + JSON.stringify(await ui.drawn({ in: 'rows' }))
const FILES: Record<string, string> = { 'a.ts': 'a'.repeat(900), 'b.ts': 'b'.repeat(300), 'c.ts': 'c'.repeat(600) }

type Engine = {
  ids: Record<string, string>
  prompts: number[]
  messages: Record<string, unknown[]>
}

// Each Read answers with its file's text; each request reports the next prompt size the test lines up.
function engine(on: any, over: Partial<World> = {}): { clock: any; at: Engine } {
  const at: Engine = { ids: {}, prompts: [], messages: {} }
  const tool = (e: any) => {
    if (e.tool !== 'Read') return undefined
    const name = e.file_path.slice(ROOT.length + 1)
    at.ids[name] = e.tool_use_id
    return { result: { type: 'text', file: { filePath: e.file_path, content: FILES[name] } }, text: FILES[name] }
  }
  const clock = world(on, { root: ROOT, files: Object.keys(FILES), status: '## main\0', heads: { [ROOT]: ['1111111aaaa'] }, env: { HOME: '/Users/k' }, tool, ...over })
  on('turn.step', async function* (_$: any, e: any) {
    const prompt = at.prompts.shift() ?? 0
    const usage = { input_tokens: 2, cache_read_input_tokens: prompt - 2, cache_creation_input_tokens: 0, output_tokens: 50, model: 'claude-test' }
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: 'tool_use', usage }
  })
  on('session.messages', (_$: any, e: any) => ({ value: at.messages[e.agentId ?? ''] ?? [] }))
  return { clock, at }
}

async function step($: any, e: { turnId: string; index: number; agentId?: string }) {
  for await (const _ of $.turn.step({ model: 'claude-test', messageCount: 1, ...e })) void _
}

const answer = (ids: string[]) => ({ role: 'assistant', content: ids.map(id => ({ type: 'tool_use', id, name: 'Read', input: {} })) })
const results = (pairs: [string, string][]) => ({ role: 'user', content: pairs.map(([id, text]) => ({ type: 'tool_result', tool_use_id: id, content: text })) })

for (const surface of ['desktop', 'terminal'] as const) {
  test(`${surface}: a read alone is measured, two side by side share their step`, { timeoutMs: 20_000 }, async ($, on) => {
    const { clock, at } = engine(on)
    await $.session.start({ cwd: ROOT, surface, isInteractive: true })
    await clock.settle()
    const ui = await $.ui.mount({ plugin: 'filetree', surface, component: 'Pane', requestId: 'filetree', props })
    await ($ as any).turn.start({ text: 'go', turnId: 't1' })
    at.prompts.push(10_000, 23_371, 24_671)
    await step($, { turnId: 't1', index: 0 })
    await $.tool.call({ tool: 'Read', file_path: `${ROOT}/a.ts` } as any)
    at.messages[''] = [answer([at.ids['a.ts'] ?? '']), results([[at.ids['a.ts'] ?? '', FILES['a.ts'] ?? '']])]
    await step($, { turnId: 't1', index: 1 })
    await clock.settle()
    for (const name of ['b.ts', 'c.ts']) await $.tool.call({ tool: 'Read', file_path: `${ROOT}/${name}` } as any)
    const b = at.ids['b.ts'] ?? ''
    const c = at.ids['c.ts'] ?? ''
    at.messages[''] = [answer([b, c]), results([[b, FILES['b.ts'] ?? ''], [c, FILES['c.ts'] ?? '']])]
    await step($, { turnId: 't1', index: 2 })
    await clock.settle()
    const shown = await drawnText(ui)
    // 23,371 − 10,000 − 50 for a.ts; the next 1,250 split 300 : 600 between b.ts and c.ts.
    expect(shown).toContain(surface === 'desktop' ? '13,321' : '13.3k tok')
    expect(shown).toContain('≈417')
    expect(shown).toContain('≈833')
    expect(shown).toContain('≈14,571')
    await ui.unmount()
  })
}

test("a subagent's read counts toward the turn, and a read no request followed is a guess", { timeoutMs: 20_000 }, async ($, on) => {
  const { clock, at } = engine(on)
  await $.session.start({ cwd: ROOT, surface: 'desktop', isInteractive: true })
  await clock.settle()
  const ui = await $.ui.mount({ plugin: 'filetree', surface: 'desktop', component: 'Pane', requestId: 'filetree', props })
  await ($ as any).turn.start({ text: 'go', turnId: 't1' })
  at.prompts.push(5_000, 7_271)
  await step($, { turnId: 't1', index: 0, agentId: 'sub1' })
  await $.tool.call({ tool: 'Read', file_path: `${ROOT}/a.ts`, agentId: 'sub1' } as any)
  const a = at.ids['a.ts'] ?? ''
  at.messages.sub1 = [answer([a]), results([[a, FILES['a.ts'] ?? '']])]
  await step($, { turnId: 't1', index: 1, agentId: 'sub1' })
  await $.tool.call({ tool: 'Read', file_path: `${ROOT}/b.ts` } as any)
  await ($ as any).turn.complete({ answer: '', durationMs: 1, isAborted: true, turnId: 't1', reason: 'answer' })
  await clock.settle()
  const shown = await drawnText(ui)
  expect(shown).toContain('2,221')
  // b.ts's 300 characters at the rate a.ts measured (2,221 tokens for 900 characters).
  expect(shown).toContain('~740')
  expect(shown).toContain('~2,961')
  await ui.unmount()
})
