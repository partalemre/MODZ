// The trail in the conversation: under a tool row its sentence with a picture of the kind of work; under a folded
// run the order of the work as one picture and its steps in the agent's own words. The engine's row is kept.
import { expect, mock, test } from 'claude-code/testing'

import { setLang } from '../hooks/kit/lang'
import { kindOf, plainCall, purposeOf } from '../hooks/kit/plain'
import { flowPic } from '../hooks/plain-flow'
import { stepOfCall } from '../hooks/plain-rows'
import { isTold, trailOf } from '../hooks/plain-trail'
import { stubWorld } from './world'

const ROW = { type: 'Text', props: {}, children: ['engine row'] }
const SITE = { plugin: 'modz', viewport: { columns: 100, rows: 40 } } as const

const call = (tool: string, input: Record<string, unknown>, more: Record<string, unknown> = {}) => ({
  tool_use_id: `t-${tool}`, tool, input, isRunning: false, isErrored: false, isInterrupted: false, ...more,
})
const bash = (command: string, description?: string, more: Record<string, unknown> = {}) => call('Bash', { command, description }, more)
const row = (props: ReturnType<typeof call>, surface: 'terminal' | 'desktop') => ({ ...SITE, surface, component: 'ToolUse', requestId: props.tool_use_id, props }) as const
const group = (calls: ReturnType<typeof call>[], more: { isExpanded?: boolean; surface?: 'terminal' | 'desktop' } = {}) =>
  ({ ...SITE, surface: more.surface ?? 'desktop', component: 'ToolGroup', requestId: 'group:1', props: { calls, isActive: false, isExpanded: more.isExpanded === true } }) as const

// Every piece of text the drawing holds, in order, as one string; a markdown line is its text.
const leaves = (node: any): string[] => {
  if (typeof node === 'string') return [node]

  return node?.type === 'Markdown' ? [String(node.props.text)] : (node?.children ?? []).flatMap(leaves)
}
const said = async (ui: any): Promise<string> => leaves(await ui.drawn()).join(' ').replace(/\s+/g, ' ').trim()
const pictures = async (ui: any): Promise<string[]> => (await ui.findAll({ type: 'Svg' })).map((pic: any) => String(pic.props?.alt ?? ''))

// The engine beneath the hub: its own row for every tool row and group.
async function start($: any, on: any, env: Record<string, string> = { MODZ_LANG: 'tr' }) {
  mock.clock(on, { now: 1_000 })
  stubWorld(on, { hasOwnClock: true, env })
  on('ui.render', () => ROW)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/w' })
}

test("desktop: a tool row keeps the engine's row and says the call under it, with a picture of its kind", async ($, on) => {
  await start($, on)
  const ui = await $.ui.mount(row(bash('cd /w && claude plugin test mods/skins 2>&1 | grep -E "pass|fail"'), 'desktop'))
  expect(await said(ui)).toBe('engine row Modun testlerini çalıştırıyor')
  expect(await pictures(ui)).toEqual(['kontrol'])
})

test('terminal: the same row with a glyph where the picture would be', async ($, on) => {
  await start($, on)
  const ui = await $.ui.mount(row(bash('npm test'), 'terminal'))
  expect(await said(ui)).toBe('engine row ◈ Testleri çalıştırıyor')
  expect(await pictures(ui)).toEqual([])
})

test('a call that ended badly says so after its sentence; one that went well adds no mark of its own', async ($, on) => {
  await start($, on)
  const failed = await $.ui.mount(row(bash('npm test', undefined, { isErrored: true }), 'desktop'))
  expect(await said(failed)).toBe('engine row Testleri çalıştırıyor ✗ başarısız oldu')
  await failed.unmount()
  const cut = await $.ui.mount(row(call('Read', { file_path: '/w/a.ts' }, { isInterrupted: true }), 'desktop'))
  expect(await said(cut)).toBe('engine row [a.ts](<file:///w/a.ts>) dosyasını okuyor — yarıda kesildi')
})

test("a folded run leads each step with the agent's own words, then what that means, and how it ended", async ($, on) => {
  await start($, on)
  const ui = await $.ui.mount(group([
    bash('gh pr view 70 --json state', 'İki isteğin birleştirilebilir olduğuna bak'),
    bash('sleep 5; gh pr merge 70 --merge', "70 numaralı isteği main'e birleştir"),
    bash('claude plugin test mods/skins', 'Birleşmiş halde skins modunu dene', { isErrored: true }),
  ]))
  expect(await said(ui)).toBe([
    'engine row',
    "İki isteğin birleştirilebilir olduğuna bak · GitHub’daki değişiklik isteklerine (PR) bakıyor ✓",
    "70 numaralı isteği main'e birleştir · Bir değişiklik isteğini (PR) ana koda birleştiriyor ✓",
    'Birleşmiş halde skins modunu dene · Modun testlerini çalıştırıyor ✗ başarısız oldu',
  ].join(' '))
  // The first picture is the order of the work: two GitHub steps, then a check.
  expect(await pictures(ui)).toEqual(['GitHub ×2 → kontrol', 'GitHub', 'GitHub', 'kontrol'])
})

test('calls that say little one by one fold into one step with a count and their names', async ($, on) => {
  await start($, on, {})
  const reads = ['a', 'b', 'c', 'd', 'e'].map(name => call('Read', { file_path: `/w/${name}.ts` }))
  const ui = await $.ui.mount(group([call('Grep', { pattern: 'login' }), call('Grep', { pattern: 'login' }), ...reads], { surface: 'terminal' }))
  expect(await said(ui)).toBe('engine row ⌕ Searching inside files for “login” ×2 ✓ ◉ Reading 5 files · a.ts, b.ts, c.ts +2 ✓')
})

// The desktop is sent a link to a file only inside markdown, so a step about files is one markdown line there.
test('desktop: a step about files names each as a link that opens the file', async ($, on) => {
  await start($, on)
  const one = await $.ui.mount(row(call('Read', { file_path: '/w/docs/RELEASE_PLAN v2.md' }), 'desktop'))
  expect((await one.findAll({ type: 'Markdown' })).map((line: any) => line.props.text)).toEqual(['[RELEASE\\_PLAN v2.md](<file:///w/docs/RELEASE_PLAN%20v2.md>) dosyasını okuyor'])
  const reads = ['a', 'b', 'c', 'd'].map(name => call('Read', { file_path: `/w/${name}.ts` }))
  const many = await $.ui.mount(group(reads))
  expect((await many.findAll({ type: 'Markdown' })).map((line: any) => line.props.text)).toEqual([
    '4 dosya okuyor · [a.ts](<file:///w/a.ts>), [b.ts](<file:///w/b.ts>), [c.ts](<file:///w/c.ts>) +1',
  ])
})

test('terminal: the file a step names is a link inside its sentence', async ($, on) => {
  await start($, on)
  const ui = await $.ui.mount(row(call('Edit', { file_path: '/w/src/app.ts' }), 'terminal'))
  expect(await said(ui)).toBe('engine row ✎ app.ts dosyasını değiştiriyor')
  expect((await ui.findAll({ type: 'Link' })).map((link: any) => link.props.href)).toEqual(['file:///w/src/app.ts'])
})

test('a search for tools names the tools; a line printed only to part two outputs is not a step', () => {
  expect(plainCall('ToolSearch', { query: 'select:mcp__ccd_session__start_session,Monitor' }, 'tr')).toBe('İhtiyaç duyduğu aracı arıyor: start session, Monitor')
  expect(plainCall('Bash', { command: 'cat docs/RELEASE_PLAN.md; echo ---; git log --oneline -3' }, 'tr')).toBe('Bir dosyayı okuyor: RELEASE_PLAN.md, sonra daha önce kaydedilmiş sürümlere bakıyor')
  expect(plainCall('Bash', { command: 'echo "hazır"' }, 'tr')).toBe('Ekrana bir yazı yazdırıyor: “hazır”')
})

test('a run with more steps than it has room for counts the rest', () => {
  setLang(undefined)
  const calls = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => bash(`./step-${n}.sh`, `Step ${n}`))
  const trail = trailOf(calls, 'en')
  expect(trail.steps.map(step => step.text)).toEqual(['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5', 'Step 6', 'Step 7', 'Step 8'])
  expect(trail.more).toBe(2)
})

test('a pause between two steps is left out; a run that only waits still says so', () => {
  expect(plainCall('Bash', { command: 'sleep 5; gh pr merge 70' }, 'tr')).toBe('Bir değişiklik isteğini (PR) ana koda birleştiriyor')
  expect(trailOf([bash('sleep 5'), bash('git status')], 'tr').steps.map(step => step.text)).toEqual(['Hangi dosyaların değiştiğine bakıyor'])
  expect(trailOf([bash('sleep 5')], 'tr').steps.map(step => step.text)).toEqual(['Kısa bir süre bekliyor'])
})

test('the kind of work is read from the call itself', () => {
  expect(kindOf('Bash', { command: 'ls && git commit -m x' })).toBe('save')
  expect(kindOf('Bash', { command: 'git status' })).toBe('read')
  expect(kindOf('Bash', { command: 'rm -rf build' })).toBe('delete')
  expect(kindOf('Bash', { command: 'npm install left-pad' })).toBe('install')
  expect(kindOf('Bash', { command: 'bin/modz check skins' })).toBe('test')
  expect(kindOf('Edit', { file_path: '/w/a.ts' })).toBe('edit')
  expect(kindOf('mcp__github__list_issues', {})).toBe('github')
  expect(kindOf('SomethingNew', {})).toBe('service')
  expect(purposeOf({ description: '  Run the tests\nsecond line ' })).toBe('Run the tests')
  expect(purposeOf({ command: 'ls' })).toBe('')
})

test('the order picture is drawn only when the run changed its kind of work', () => {
  setLang('tr')
  expect(flowPic(trailOf([bash('gh pr view 1'), bash('gh pr view 2')], 'tr').flow)).toBeNull()
  const mixed = flowPic(trailOf([call('Read', { file_path: '/w/a.ts' }), call('Edit', { file_path: '/w/a.ts' }, { isErrored: true })], 'tr').flow)
  expect(mixed?.alt).toBe('inceleme → değişiklik')
  // Colour is state: the failed stop is the only one in Flare.
  expect(mixed?.source.match(/s-danger/g)?.length).toBe(2)
  setLang(undefined)
})

test('an unfolded run adds nothing: each of its rows tells its own', async ($, on) => {
  await start($, on)
  const ui = await $.ui.mount(group([call('Read', { file_path: '/w/a.ts' })], { isExpanded: true }))
  expect(await said(ui)).toBe('engine row')
})

test("calls that only keep the app's own displays current get no line", async ($, on) => {
  await start($, on)
  const ui = await $.ui.mount(row(call('mcp__ccd_turn__update_plan', { advance: true }), 'desktop'))
  expect(await said(ui)).toBe('engine row')
  expect(isTold('mcp__savvy-progress__step')).toBe(false)
  expect(isTold('mcp__github__create_pull_request')).toBe(true)
})

test('the steps are pure: the language set is the language said', () => {
  setLang('tr')
  expect(stepOfCall({ tool: 'Bash', input: { command: 'git status' } }).text).toBe('Hangi dosyaların değiştiğine bakıyor')
  expect(trailOf([{ tool: 'mcp__ccd_turn__wrap_up', input: {} }], 'tr').steps).toEqual([])
  setLang(undefined)
  expect(stepOfCall({ tool: 'Bash', input: { command: 'git status' } }).text).toBe('Checking which files have changed')
})

test('the option turns the trail off and leaves every row to the engine', { options: { plainWords: false } }, async ($, on) => {
  await start($, on)
  const ui = await $.ui.mount(row(bash('npm test'), 'desktop'))
  expect(await said(ui)).toBe('engine row')
})
