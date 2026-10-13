import { expect, test } from 'claude-code/testing'

import { EDITS_CAP, EDIT_WINDOW_MS, parseLog, withEdit } from '../hooks/edits'
import { EN, MINUTE, NOW, SURFACES, mountPane, pass, start, stub, world } from './world'

// The collision guard: two chats on one machine, told apart by their session ids.

const CLIENT = '/work/demo-app/src/api/client.ts'
const OTHER_CHAT = 'edits/chat-b'
const otherEdit = (minutesAgo: number, path = CLIENT) => ({ sessionId: 'chat-b', project: 'billing-api', edits: { [path]: NOW - minutesAgo * MINUTE } })
const DIFF = { [`git diff --numstat -- ${CLIENT}`]: '38\t12\tsrc/api/client.ts\n' }

function byKey(node: any, key: string): any {
  if (node === null || typeof node !== 'object') return undefined
  if (node.props?.key === key && node.type === 'Button') return node
  for (const child of node.children ?? []) {
    const found = byKey(child, key)
    if (found !== undefined) return found
  }

  return undefined
}

test('a log keeps the newest edits inside the window, capped; a stranger value is no log', () => {
  const old = { sessionId: 'a', project: 'p', edits: { '/old': NOW - EDIT_WINDOW_MS - 1, '/kept': NOW - MINUTE } }
  expect(withEdit(old, { path: '/new', sessionId: 'a', project: 'p', at: NOW }).edits).toEqual({ '/new': NOW, '/kept': NOW - MINUTE })
  const full = { sessionId: 'a', project: 'p', edits: Object.fromEntries(Array.from({ length: EDITS_CAP }, (_, i) => [`/f${i}`, NOW - i])) }
  const next = withEdit(full, { path: '/newest', sessionId: 'a', project: 'p', at: NOW + 1 })
  expect(Object.keys(next.edits)).toHaveLength(EDITS_CAP)
  expect(next.edits['/newest']).toBe(NOW + 1)
  expect(next.edits[`/f${EDITS_CAP - 1}`]).toBeUndefined()
  expect(parseLog('junk')).toBeNull()
  expect(parseLog({ sessionId: 'a', edits: { '/x': 'soon', '/y': 3 } })).toEqual({ sessionId: 'a', project: '', edits: { '/y': 3 } })
})

test('one chat records its edit under its own key; the other chat is asked, the first never is', async ($, on) => {
  const w = world({ ...EN })
  stub(on, w)
  await start($, w)
  await ($ as any).tool.call({ tool: 'Edit', file_path: 'src/api/./client.ts', old_string: 'a', new_string: 'b' })
  expect(w.store['edits/chat-a']).toEqual({ sessionId: 'chat-a', project: 'demo-app', edits: { [CLIENT]: NOW } })
  await ($ as any).tool.call({ tool: 'Write', file_path: CLIENT, content: 'x' })
  expect(w.opened).toHaveLength(0)

  w.sessionId = 'chat-b'
  await pass(w, 5 * MINUTE)
  const call = ($ as any).tool.call({ tool: 'Write', file_path: CLIENT, content: 'y' })
  await pass(w, 0)
  const ui = await mountPane($, 'desktop')
  const drawn = JSON.stringify(await ui.drawn())
  expect(drawn).toContain('Another chat edited client.ts 5 min ago')
  expect(drawn).toContain('demo-app · Waiting for you')
  await ui.press({ key: 'cancel' })
  await pass(w)
  expect(((await call) as any).deny).toMatch(/Skip this edit.*client\.ts 5 min ago/)
  expect(w.ran).toHaveLength(2)
})

for (const surface of SURFACES) {
  test(`Skip this edit has the focus and keeps the file; Edit anyway writes it (${surface})`, async ($, on) => {
    const w = world({ ...EN, store: { [OTHER_CHAT]: otherEdit(12) }, answers: DIFF })
    stub(on, w)
    await start($, w, surface)
    const call = ($ as any).tool.call({ tool: 'Edit', file_path: CLIENT, old_string: 'a', new_string: 'b' })
    await pass(w, 0)
    const ui = await mountPane($, surface)
    const tree = await ui.drawn()
    const drawn = JSON.stringify(tree)
    for (const text of ['HELD · BLAST RADIUS', 'Another chat edited client.ts 12 min ago', 'billing-api · Waiting for you', 'src/api/client.ts', 'Edit anyway', 'Skip this edit']) expect(drawn).toContain(text)
    expect(byKey(tree, 'cancel')?.props?.autoFocus).toBe(true)
    expect(byKey(tree, 'run')?.props?.autoFocus).toBeUndefined()
    await ui.press({ key: 'cancel' })
    await pass(w)
    expect(((await call) as any).deny).toMatch(/did not make it/)
    expect(w.toasts).toEqual(['Skipped. The file was left as it was.'])
    expect(w.ran).toHaveLength(0)

    const again = ($ as any).tool.call({ tool: 'Edit', file_path: CLIENT, old_string: 'a', new_string: 'b' })
    await pass(w, 0)
    await ui.press({ key: 'run' })
    await pass(w)
    expect(((await again) as any).deny).toBeUndefined()
    expect(w.ran).toHaveLength(1)
  })
}

test('an edit past the window, a symlinked spelling and a long-abandoned log', async ($, on) => {
  const stale = { sessionId: 'chat-c', project: 'old', edits: { [CLIENT]: NOW - 2 * 24 * 60 * MINUTE } }
  const w = world({ store: { [OTHER_CHAT]: otherEdit(31), 'edits/chat-c': stale }, links: { '/work/link.ts': CLIENT } })
  stub(on, w)
  await start($, w)
  await ($ as any).tool.call({ tool: 'Write', file_path: '/work/link.ts', content: 'x' })
  expect(w.opened).toHaveLength(0)
  expect(w.store['edits/chat-c']).toBeUndefined()
  expect(w.store[OTHER_CHAT]).toBeDefined()
  expect((w.store['edits/chat-a'] as any).edits).toEqual({ [CLIENT]: NOW })
})

test('with nobody to ask the edit goes ahead and says so in the debug log only', async ($, on) => {
  const w = world({ surfaces: [], store: { [OTHER_CHAT]: otherEdit(2) } })
  stub(on, w)
  await start($, w)
  const result: any = await ($ as any).tool.call({ tool: 'NotebookEdit', notebook_path: CLIENT, new_source: 'x' })

  expect(result.deny).toBeUndefined()
  expect(w.opened).toHaveLength(0)
  expect(w.logs.some(line => line.includes('client.ts 2 min ago'))).toBe(true)
})

test('a failed edit is not logged, and an ended chat clears its own key', async ($, on) => {
  const w = world({ isToolError: true })
  stub(on, w)
  await start($, w)
  await ($ as any).tool.call({ tool: 'Edit', file_path: CLIENT, old_string: 'a', new_string: 'b' })
  expect(w.store['edits/chat-a']).toBeUndefined()
  w.isToolError = false
  await ($ as any).tool.call({ tool: 'Edit', file_path: CLIENT, old_string: 'a', new_string: 'b' })
  expect(w.store['edits/chat-a']).toBeDefined()
  await ($ as any).session.end({ reason: 'exit', sessionId: 'chat-a', resume: {} })

  expect(w.store['edits/chat-a']).toBeUndefined()
})

test('the Turkish card says it in Turkish', async ($, on) => {
  const w = world({ store: { [OTHER_CHAT]: otherEdit(0) } })
  stub(on, w)
  await start($, w)
  const call = ($ as any).tool.call({ tool: 'Write', file_path: CLIENT, content: 'x' })
  await pass(w, 0)
  const ui = await mountPane($, 'terminal')
  const drawn = JSON.stringify(await ui.drawn())
  for (const text of ['DÜZENLEME BEKLETİLDİ', 'Başka bir sohbet client.ts dosyasını az önce düzenledi', 'Bu düzenlemeyi atla']) expect(drawn).toContain(text)
  await ui.press({ key: 'cancel' })
  await pass(w)
  await call
})
