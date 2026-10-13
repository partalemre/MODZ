import { expect, test } from 'claude-code/testing'

import { toolDetail } from '../hooks/format'
import { setLang } from '../hooks/i18n'
import { nowOf } from '../hooks/now'
import { filesShown, touchFile } from '../hooks/touched'
import type { AgentRun } from '../types'
import { PANE, SECOND, SURFACES, finish, setup, spawn, svgOf, tool } from './fixtures'

// The pure checks below read the Turkish words (MODZ_LANG=tr), as the mounted ones do.
setLang('tr')

// The open card opens from a labelled button and reads top to bottom as a conversation (the task
// and its answer), the controls, then the work: now, latest calls, files and usage.

const LONG_BRIEF = `Rebuild the landing page hero. ${'Keep the copy short and the layout calm. '.repeat(12)}End of brief.`

const spawnLong = ($: any, description: string) => $.agent.spawn({ prompt: LONG_BRIEF, description, subagentType: 'general-purpose' })

const run = (patch: Partial<AgentRun> = {}): AgentRun => ({
  id: 'a1', agentId: 'a1', type: 'general-purpose', description: 'Work', model: 'm', status: 'running', startedAt: 0,
  contextTokens: 0, contextMax: 1, tokens: 0, costUsd: 0, steps: 0, round: 1, toolCount: 0, ...patch,
})

for (const surface of SURFACES) {
  const mount = ($: any) => $.ui.mount({ ...PANE, surface })
  const text = async (ui: any) => {
    const words = (await ui.findAll({ type: 'Text' })).map((t: any) => t.text ?? '')
    const labels = (await ui.findAll({ type: 'Button' })).map((b: any) => b.props?.label ?? '')
    return [...words, ...labels].join('\n')
  }
  const seen = async (ui: any) => (surface === 'terminal' ? text(ui) : `${await text(ui)}\n${await svgOf(ui)}`)

  test(`${surface}: the card opens from a labelled, keyboard-pressable button and closes again`, async ($, on) => {
    await setup($, on)
    await spawn($, 'Build the landing page')
    const ui = await mount($)
    const closed = await ui.find({ key: 'open-a1' })
    expect(closed?.type).toBe('Button')
    expect(closed?.props?.label).toBe(surface === 'terminal' ? '▸ Build the landing page' : 'Detay ▾')
    await ui.press({ key: 'open-a1' })
    expect((await ui.find({ key: 'open-a1' }))?.props?.label).toBe(surface === 'terminal' ? '▾ Build the landing page' : 'Gizle ▴')
    expect(await text(ui)).toContain('Pip yanıtlıyor…')
    await ui.press({ key: 'open-a1' })
    expect(await text(ui)).not.toContain('Pip yanıtlıyor…')
  })

  test(`${surface}: the detail reads task and answer, then now, history, files and usage`, async ($, on) => {
    const { clock } = await setup($, on)
    await spawn($, 'Build the landing page')
    await tool($, { tool: 'Read', file_path: '/w/site/src/hero.tsx', agentId: 'a1' })
    await clock.advance(12 * SECOND)
    await tool($, { tool: 'Edit', file_path: '/w/site/src/hero.tsx', old_string: 'a', new_string: 'b', agentId: 'a1' })
    await finish($, 'a1')
    const ui = await mount($)
    await ui.press({ key: 'open-a1' })
    const all = await text(ui)
    const order = ['Görev', 'Pip\nok', 'Son adım', 'İş geçmişi · 2 araç', 'Dokunduğu dosyalar · 1'].map(word => all.indexOf(word))
    expect(order.every(at => at >= 0)).toBe(true)
    expect([...order].sort((x, y) => x - y)).toEqual(order)
    expect(all).toContain('12 sn önce')
    expect(await seen(ui)).toContain('Süre 0:12 · bağlam')
  })

  test(`${surface}: between calls a running agent is thinking, with its latest call and how long ago`, async ($, on) => {
    const { clock } = await setup($, on)
    await spawn($, 'Run the tests')
    await tool($, { tool: 'Bash', command: 'npm test -- --runInBand\necho done', agentId: 'a1' })
    await clock.advance(40 * SECOND)
    const ui = await mount($)
    await ui.press({ key: 'open-a1' })
    const all = await seen(ui)
    expect(all).toContain(surface === 'terminal' ? 'Düşünüyor' : 'DÜŞÜNÜYOR')
    expect(all).toContain('npm test -- --runInBand')
    expect(all).not.toContain('echo done')
    expect(all).toContain('40 sn önce')
  })

  test(`${surface}: a long task is cut short until "Tamamını göster" shows it whole`, async ($, on) => {
    await setup($, on)
    await spawnLong($, 'Hero')
    const ui = await mount($)
    await ui.press({ key: 'open-a1' })
    expect(await text(ui)).not.toContain('End of brief.')
    expect((await ui.find({ key: 'brief-a1' }))?.props?.label).toBe('Tamamını göster')
    await ui.press({ key: 'brief-a1' })
    expect(await text(ui)).toContain('End of brief.')
    expect((await ui.find({ key: 'brief-a1' }))?.props?.label).toBe('Kısalt')
  })

  test(`${surface}: files touched list the changed ones first and fold the rest`, async ($, on) => {
    const { clock } = await setup($, on)
    await spawn($, 'Sweep')
    for (const name of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) {
      await clock.advance(SECOND)
      await tool($, { tool: 'Read', file_path: `/w/src/${name}.ts`, agentId: 'a1' })
    }
    await tool($, { tool: 'Write', file_path: '/w/src/a.ts', content: '', agentId: 'a1' })
    await tool($, { tool: 'Grep', pattern: 'x', path: '/w/src', agentId: 'a1' })
    const ui = await mount($)
    await ui.press({ key: 'open-a1' })
    const all = await seen(ui)
    expect(all).toContain('Dokunduğu dosyalar · 7')
    expect(all).toContain('+1 dosya daha')
    expect(all).not.toContain('/w/src (')
    if (surface === 'desktop') expect(all).toContain('/w/src/a.ts (düzenleme 1 · okuma 1)')
    else expect(all.indexOf('/w/src/a.ts')).toBeLessThan(all.indexOf('/w/src/g.ts'))
  })

  test(`${surface}: the recent list keeps the latest eight calls`, async ($, on) => {
    await setup($, on)
    await spawn($, 'Busy')
    for (let i = 1; i <= 11; i++) await tool($, { tool: 'Bash', command: `step-${i}`, agentId: 'a1' })
    const ui = await mount($)
    await ui.press({ key: 'open-a1' })
    const all = await text(ui)
    expect(all).toContain('3 önceki adım gizli')
    expect(all).toContain('step-11')
    expect(all).not.toContain('step-3\n')
  })
}

// The hover styles ride on the drawn element itself, beside its props.
const drawnByKey = (node: any, key: string): any => {
  if (!node || typeof node !== 'object') return undefined
  if (node.props?.key === key) return node
  for (const child of node.children ?? []) {
    const found = drawnByKey(child, key)
    if (found) return found
  }
  return undefined
}

test('desktop: the whole card lights under the pointer, and its button with it', async ($, on) => {
  await setup($, on)
  await spawn($, 'Build the landing page')
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const tree = await ui.drawn()
  expect(drawnByKey(tree, 'a1')?.hover).toEqual({ borderDimColor: false })
  expect(drawnByKey(tree, 'open-a1')?.hover).toEqual({ color: 'permission' })
})

test('now: an open call is what it does, a closed one means thinking, an ended run shows its last step', () => {
  const open = run({ lastTool: 'Edit', lastDetail: '/w/site/src/hero.tsx', history: [{ tool: 'Edit', target: 'src/hero.tsx', at: 1000 }] })
  expect(nowOf(open, 13_000)).toMatchObject({ state: 'call', kind: 'edit', verb: 'Düzenliyor', target: '/w/site/src/hero.tsx', isPath: true, span: '12 sn' })
  const closed = run({ ...open, history: [{ tool: 'Edit', target: 'src/hero.tsx', at: 1000, endAt: 2000 }] })
  expect(nowOf(closed, 61_000)).toMatchObject({ state: 'thinking', verb: 'Düşünüyor', span: '1 dk önce' })
  expect(nowOf({ ...closed, status: 'done' }, 61_000)).toMatchObject({ state: 'done', verb: 'tamamlandı', tool: 'Edit' })
  expect(nowOf(run(), 5000)).toMatchObject({ state: 'starting', tool: '', span: '' })
})

test('files: one entry per path counting reads and edits; folders and other tools do not count', () => {
  const at = (n: number, call: Record<string, unknown>) => ({ call, at: n })
  let a = run()
  a = touchFile(a, at(1, { tool: 'Read', file_path: '/w/a.ts' }))
  a = touchFile(a, at(2, { tool: 'Read', file_path: '/w/b.md' }))
  a = touchFile(a, at(3, { tool: 'Edit', file_path: '/w/a.ts' }))
  a = touchFile(a, at(4, { tool: 'Grep', path: '/w' }))
  a = touchFile(a, at(5, { tool: 'Bash', command: 'cat /w/c.ts' }))
  expect(a.files).toEqual([{ path: '/w/b.md', reads: 1, edits: 0, at: 2 }, { path: '/w/a.ts', reads: 1, edits: 1, at: 3 }])
  expect(filesShown(a.files ?? []).map(f => f.path)).toEqual(['/w/a.ts', '/w/b.md'])
})

test('a call is kept in full for the open card: the whole path, the first line of a command', () => {
  expect(toolDetail({ file_path: '/Users/me/project/very/deep/folder/file.ts' })).toBe('/Users/me/project/very/deep/folder/file.ts')
  expect(toolDetail({ command: 'npm run build\nnpm test' })).toBe('npm run build')
  expect(toolDetail({ url: 'https://example.com/docs/page' })).toBe('https://example.com/docs/page')
})
