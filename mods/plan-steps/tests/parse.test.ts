import { expect, test } from 'claude-code/testing'

import { matchTasks, resolvePlan, similarity } from '../hooks/match'
import { cleanTitle, isPlanPath, parsePlan } from '../hooks/parse'
import { fileDoc, isReplacing } from '../hooks/plan'
import { createTask, createdId, fromTodos, updateTask } from '../hooks/tasks'
import { setLang } from '../hooks/lang'

setLang('tr')

const SUPERPOWERS_PLAN = [
  '# Feature X Implementation Plan',
  '',
  '### Task 1: Schema and types',
  '- [x] **Step 1: Write the failing test**',
  '- [x] **Step 2: Run it**',
  '',
  '### Task 2: Parser for `### Task N` headings',
  '- [x] Step 1',
  '- [ ] Step 2',
  '- [ ] Step 3',
  '```md',
  '### Task 9: inside a fence, not a step',
  '- [ ] nor this',
  '```',
  '',
  '### Task 3:',
  'Prose only.',
].join('\n')

test('### Task N headings become steps with their sub-checkbox counts', () => {
  const parsed = parsePlan(SUPERPOWERS_PLAN)

  expect(parsed?.isStructured).toBe(true)
  expect(parsed?.steps).toEqual([
    { title: 'Schema and types', number: 1, isChecked: false, checksDone: 2, checksTotal: 2 },
    { title: 'Parser for ### Task N headings', number: 2, isChecked: false, checksDone: 1, checksTotal: 3 },
    { title: 'Adım 3', number: 3, isChecked: false, checksDone: 0, checksTotal: 0 },
  ])
})

test('## Step N and Turkish headings parse too', () => {
  const parsed = parsePlan('## Step 1 - Kur\n## Adım 2: Test et\n- [ ] koş')

  expect(parsed?.steps.map(step => `${step.number}:${step.title}:${step.checksTotal}`)).toEqual(['1:Kur:0', '2:Test et:1'])
})

test('top-level checkboxes are steps, nested ones their items', () => {
  const parsed = parsePlan(['- [x] Kurulum', '  - [x] npm i', '- [ ] Ekran', '  - [x] taslak', '  - [ ] cila', '* [ ] Yayın'].join('\n'))

  expect(parsed?.isStructured).toBe(true)
  expect(parsed?.steps.map(step => [step.title, step.isChecked, step.checksDone, step.checksTotal])).toEqual([
    ['Kurulum', true, 1, 1],
    ['Ekran', false, 1, 2],
    ['Yayın', false, 0, 0],
  ])
})

test('two bare checkboxes are a loose plan; a numbered list keeps its longest run from 1', () => {
  expect(parsePlan('- [ ] a\n- [ ] b')?.isStructured).toBe(false)
  const approved = parsePlan('## Yaklaşım\n1. Tipleri yaz\n2. Ayrıştırıcı\n3. Panel\n## Doğrulama\n1. Testler\n2. validate')

  expect(approved?.steps.map(step => step.title)).toEqual(['Tipleri yaz', 'Ayrıştırıcı', 'Panel'])
  expect(parsePlan('Just prose, no plan.')).toBeNull()
})

test('plan paths are recognised and other markdown needs structure', () => {
  expect(isPlanPath('/w/docs/superpowers/plans/2026-10-09-x.md')).toBe(true)
  expect(isPlanPath('/w/PLAN.md')).toBe(true)
  expect(isPlanPath('/w/feature.plan.md')).toBe(true)
  expect(isPlanPath('/w/README.md')).toBe(false)
  expect(fileDoc('/w/PLAN.md', '- [ ] a\n- [ ] b')?.strength).toBe(2)
  expect(fileDoc('/w/notes.md', '- [ ] a\n- [ ] b')).toBeNull()
  expect(fileDoc('/w/notes.md', '## Step 1 a\n## Step 2 b')?.strength).toBe(1)
})

test('a weaker doc never replaces a stronger one, but the same file always refreshes', () => {
  const strong = fileDoc('/w/PLAN.md', '## Step 1 a\n## Step 2 b')
  const weak = fileDoc('/w/notes.md', '## Step 1 a\n## Step 2 b')
  if (strong === null || weak === null) throw new Error('fixtures did not parse')

  expect(isReplacing(strong, weak)).toBe(false)
  expect(isReplacing(weak, strong)).toBe(true)
  expect(isReplacing(strong, { ...strong, steps: [] })).toBe(true)
})

test('cleanTitle strips markdown and trailing colons', () => {
  expect(cleanTitle('**Write** the [docs](x.md):')).toBe('Write the docs')
})

test('TodoWrite lists replace the task list; TaskCreate/TaskUpdate edit it', () => {
  expect(fromTodos([{ content: 'A', status: 'completed' }, { content: ' ', status: 'pending' }, { content: 'B', status: 'bogus' }])).toEqual([
    { id: 'todo-0', subject: 'A', status: 'completed' },
  ])
  let tasks = createTask([], { id: createdId({ task: { id: '7', subject: 'A' } }, []), subject: 'A' })
  tasks = createTask(tasks, { id: createdId(undefined, tasks), subject: 'B' })
  expect(tasks.map(task => task.id)).toEqual(['7', '2'])
  tasks = updateTask(tasks, { taskId: '7', status: 'in_progress', subject: 'A2' })
  expect(tasks[0]).toEqual({ id: '7', subject: 'A2', status: 'in_progress' })
  expect(updateTask(tasks, { taskId: '2', status: 'deleted' }).map(task => task.id)).toEqual(['7'])
})

test('fuzzy matching pairs tasks to steps by words or by number', () => {
  expect(similarity('Parser for Task headings', 'Write the parser for task headings')).toBe(1)
  const steps = parsePlan(SUPERPOWERS_PLAN)?.steps ?? []
  const tasks = [
    { id: '1', subject: 'Task 3: wire it', status: 'pending' as const },
    { id: '2', subject: 'schema & types', status: 'completed' as const },
    { id: '3', subject: 'something unrelated', status: 'pending' as const },
  ]
  const matched = matchTasks(steps, tasks)

  expect([...matched.entries()].map(([step, task]) => `${step}->${task.id}`).sort()).toEqual(['0->2', '2->1'])
})

test('a plan doc leads when the task list speaks for it, otherwise the task list shows', () => {
  const parsed = parsePlan(SUPERPOWERS_PLAN)
  if (parsed === null) throw new Error('fixture did not parse')
  const doc = { kind: 'file' as const, label: 'x.md', path: '/w/x.md', strength: 2, steps: parsed.steps }
  const tasks = [
    { id: '1', subject: 'Schema and types', status: 'completed' as const },
    { id: '2', subject: 'Parser for task headings', status: 'in_progress' as const },
  ]
  const merged = resolvePlan(tasks, doc)

  expect(merged?.source).toBe('x.md · görev listesi')
  expect(merged?.steps.map(step => `${step.status}:${step.credit.toFixed(2)}`)).toEqual(['completed:1.00', 'in_progress:0.33', 'pending:0.00'])
  expect(resolvePlan([{ id: '9', subject: 'Unrelated chore', status: 'pending' }], doc)?.source).toBe('görev listesi')
  expect(resolvePlan([], doc)?.steps.map(step => step.status)).toEqual(['completed', 'in_progress', 'pending'])
  expect(resolvePlan([], null)).toBeNull()
})
