// The plain-words line in the conversation: one sentence under each tool call's row, by rules alone, with the
// engine's own row kept as it is.
import { expect, mock, test } from 'claude-code/testing'

import { setLang } from '../hooks/kit/lang'
import { groupLines, isTold, lineOf } from '../hooks/plain-rows'
import { stubWorld } from './world'

const ROW = { type: 'Text', props: {}, children: ['engine row'] }
const SITE = { plugin: 'modz', viewport: { columns: 100, rows: 40 } } as const

const call = (tool: string, input: Record<string, unknown>, more: Record<string, unknown> = {}) => ({
  tool_use_id: `t-${tool}`, tool, input, isRunning: false, isErrored: false, isInterrupted: false, ...more,
})
const row = (props: ReturnType<typeof call>, surface: 'terminal' | 'desktop') => ({ ...SITE, surface, component: 'ToolUse', requestId: props.tool_use_id, props }) as const
const group = (calls: ReturnType<typeof call>[], isExpanded = false) =>
  ({ ...SITE, surface: 'desktop', component: 'ToolGroup', requestId: 'group:1', props: { calls, isActive: false, isExpanded } }) as const

const texts = async (ui: any): Promise<string[]> => (await ui.findAll({ type: 'Text' })).map((t: any) => String(t.text ?? ''))

// The engine beneath the hub: its own row for every tool row and group.
async function start($: any, on: any, env: Record<string, string> = { MODZ_LANG: 'tr' }) {
  mock.clock(on, { now: 1_000 })
  stubWorld(on, { hasOwnClock: true, env })
  on('ui.render', () => ROW)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/w' })
}

for (const surface of ['terminal', 'desktop'] as const) {
  test(`${surface}: a tool row keeps the engine's row and says the call in plain words under it`, async ($, on) => {
    await start($, on)
    const ui = await $.ui.mount(row(call('Bash', { command: 'cd /w && claude plugin test mods/skins 2>&1 | grep -E "pass|fail"' }), surface))
    expect(await texts(ui)).toEqual(['engine row', '↳ Modun testlerini çalıştırıyor'])
  })
}

test('a call that ended badly says so after its sentence', async ($, on) => {
  await start($, on)
  const failed = await $.ui.mount(row(call('Bash', { command: 'npm test' }, { isErrored: true }), 'desktop'))
  expect(await texts(failed)).toContain('↳ Testleri çalıştırıyor · başarısız oldu')
  await failed.unmount()
  const cut = await $.ui.mount(row(call('Read', { file_path: '/w/a.ts' }, { isInterrupted: true }), 'desktop'))
  expect(await texts(cut)).toContain('↳ a.ts dosyasını okuyor · yarıda kesildi')
})

test('a folded run tells its steps once each under its line, and counts what it has no room for', async ($, on) => {
  await start($, on, {})
  const reads = ['a', 'b', 'c', 'd', 'e', 'f'].map(name => call('Read', { file_path: `/w/${name}.ts` }))
  const ui = await $.ui.mount(group([call('Grep', { pattern: 'login' }), call('Grep', { pattern: 'login' }), ...reads]))
  expect(await texts(ui)).toEqual([
    'engine row',
    '↳ Searching inside files for “login”',
    '↳ Reading the file a.ts',
    '↳ Reading the file b.ts',
    '↳ Reading the file c.ts',
    '↳ +3 more steps',
  ])
})

test('an unfolded run adds nothing: each of its rows tells its own', async ($, on) => {
  await start($, on)
  const ui = await $.ui.mount(group([call('Read', { file_path: '/w/a.ts' })], true))
  expect(await texts(ui)).toEqual(['engine row'])
})

test("calls that only keep the app's own displays current get no line", async ($, on) => {
  await start($, on)
  const ui = await $.ui.mount(row(call('mcp__ccd_turn__update_plan', { advance: true }), 'desktop'))
  expect(await texts(ui)).toEqual(['engine row'])
  expect(isTold('mcp__savvy-progress__step')).toBe(false)
  expect(isTold('mcp__github__create_pull_request')).toBe(true)
})

test('the lines are pure: the language set is the language said', () => {
  setLang('tr')
  expect(lineOf({ tool: 'Bash', input: { command: 'git status' } })).toBe('Hangi dosyaların değiştiğine bakıyor')
  expect(groupLines([{ tool: 'mcp__ccd_turn__wrap_up', input: {} }])).toEqual([])
  setLang(undefined)
  expect(lineOf({ tool: 'Bash', input: { command: 'git status' } })).toBe('Checking which files have changed')
})

test('the option turns the line off and leaves every row to the engine', { options: { plainWords: false } }, async ($, on) => {
  await start($, on)
  const ui = await $.ui.mount(row(call('Bash', { command: 'npm test' }), 'desktop'))
  expect(await texts(ui)).toEqual(['engine row'])
})
