import { expect, test } from 'claude-code/testing'

import { changedSpans, countChanges, diffLines } from '../hooks/diff'
import { buildPrompt, notesFromMessages, parseReply, shortLine, unexplained } from '../hooks/explain'
import { currentStep, planAfter } from '../hooks/plan'
import { fit, wrap } from '../hooks/ui/svg'

test('an Edit diff keeps one line of context and marks the skipped run', () => {
  const before = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].join('\n')
  const after = ['a', 'B', 'c', 'd', 'e', 'F', 'g'].join('\n')
  const lines = diffLines(before, after)

  expect(lines.map(line => line.op).join('')).toBe(' -+ ~ -+ ')
  expect(countChanges(lines)).toEqual({ add: 2, del: 2 })
})

test('a renamed token is the changed span, widened to the whole word', () => {
  expect(changedSpans('greet(name)', 'welcome(name)')).toEqual({ before: { start: 0, end: 5 }, after: { start: 0, end: 7 } })
  const imports = changedSpans("import { greet } from './greet.js';", "import { greeting } from './greet.js';")
  expect(imports).toEqual({ before: { start: 9, end: 14 }, after: { start: 9, end: 17 } })
})

test('wholly different lines get no span; paired lines in a run each get theirs', () => {
  expect(changedSpans('## How to make it', 'Steep the grounds overnight.')).toBeNull()
  const lines = diffLines('x = greet(a)\ny = greet(b)\n', 'x = welcome(a)\ny = welcome(b)\n')
  expect(lines.filter(line => line.span !== undefined)).toHaveLength(4)
  expect(lines[2]?.span).toEqual({ start: 4, end: 11 })
})

test('shortLine keeps the first sentence of Claude\'s prose, plain and short', () => {
  expect(shortLine('Şimdi `pane.tsx` başlığını **sadeleştiriyorum**. Sonra testler.')).toBe('Şimdi pane.tsx başlığını sadeleştiriyorum')
  expect(shortLine('\n- Testleri güncelliyorum:\n')).toBe('Testleri güncelliyorum')
  expect(shortLine('x'.repeat(200)).length).toBe(90)
})

const use = (id: string, tool = 'Edit') => ({ tool_use_id: id, tool, input: {} })
const said = (text: string, toolUses: ReturnType<typeof use>[]) => ({ role: 'assistant' as const, text, toolUses })
const results = { role: 'user' as const, text: '', toolUses: [], toolResults: [{ tool_use_id: 'r', text: 'ok', isError: false }] }

test('a narration covers its own edits and the text-less edits after it, not past another tool', () => {
  const messages = [
    { role: 'user' as const, text: 'düzelt', toolUses: [] },
    said('Başlığı güncelliyorum.', [use('e1'), use('e2')]),
    results,
    said('', [use('e3', 'MultiEdit')]),
    results,
    said('Dosyayı okuyorum.', [use('r1', 'Read')]),
    results,
    said('', [use('e4', 'Write')]),
  ]
  const notes = notesFromMessages(messages as any, new Set(['e1', 'e2', 'e3', 'e4']))

  expect([notes.get('e1'), notes.get('e2'), notes.get('e3')]).toEqual(['Başlığı güncelliyorum', 'Başlığı güncelliyorum', 'Başlığı güncelliyorum'])
  expect(notes.has('e4')).toBe(false)
})

test('the model is asked only about unexplained steps and the reply maps back', () => {
  const step = (file: string, text?: string) => ({ tool: 'Edit', file, note: '', diff: diffLines('a', 'b'), ...(text === undefined ? {} : { said: text }) })
  const steps = [step('a.ts', 'hazır'), step('b.ts'), step('c.ts')]
  const indexes = unexplained(steps)
  const { prompt, maxTokens } = buildPrompt(steps, indexes)

  expect(indexes).toEqual([1, 2])
  expect(prompt).toContain('### 1: b.ts\n-a\n+b')
  expect(prompt).not.toContain('a.ts')
  expect(maxTokens).toBe(80)
  expect([...parseReply('1: B dosyasını ekler.\n2) C testini düzeltir\nbozuk satır', indexes)]).toEqual([[1, 'B dosyasını ekler'], [2, 'C testini düzeltir']])
})

test('TodoWrite replaces the plan; TaskCreate / TaskUpdate / TaskList keep theirs', () => {
  const todos = [
    { content: 'Kur', status: 'completed', activeForm: 'Kuruluyor' },
    { content: 'Yaz', status: 'in_progress', activeForm: 'Yazılıyor' },
  ]
  expect(currentStep(planAfter([], { tool: 'TodoWrite', todos }, undefined))).toEqual({ index: 2, total: 2, title: 'Yaz' })

  let plan = planAfter([], { tool: 'TaskCreate', subject: 'Kur', description: '' }, { task: { id: '7', subject: 'Kur' } })
  plan = planAfter(plan, { tool: 'TaskCreate', subject: 'Test et', description: '' }, { task: { id: '8', subject: 'Test et' } })
  plan = planAfter(plan, { tool: 'TaskUpdate', taskId: '8', status: 'in_progress' }, { success: true })
  expect(currentStep(plan)).toEqual({ index: 2, total: 2, title: 'Test et' })
  expect(planAfter(plan, { tool: 'TaskUpdate', taskId: '7', status: 'deleted' }, {})).toHaveLength(1)
})

test('svg text fits its room and wraps into at most the lines asked for', () => {
  expect(fit('kısa', 200, 13)).toBe('kısa')
  expect(fit('çok uzun bir dosya adı burada duruyor.ts', 80, 13).endsWith('…')).toBe(true)
  const lines = wrap('bir iki üç dört beş altı yedi sekiz dokuz on on bir on iki', { width: 90, size: 13, maxLines: 2 })
  expect(lines).toHaveLength(2)
  expect(lines[1]?.endsWith('…')).toBe(true)
})
