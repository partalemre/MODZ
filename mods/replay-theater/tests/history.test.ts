import { expect, test } from 'claude-code/testing'

import { foldSession, inTimeOrder, stepsOfTurn, turnRows } from '../hooks/history'
import { setLang } from '../hooks/lang'
import { eventsOfLine, MAIN, newReader, promptText } from '../hooks/transcript'
import type { TranscriptEvent } from '../hooks/transcript'
import { TEXTS } from './transcripts'

// A transcript read back into turns: what counts as the person's prompt, which edits are kept, what each one
// says and serves, and how a subagent's edits find their turn.

function eventsOf(text: string, agent: string): { events: TranscriptEvent[]; skipped: number } {
  const reader = newReader(agent)
  const events = text.split('\n').flatMap(line => eventsOfLine(line, reader))

  return { events, skipped: reader.skipped }
}

function oldSession() {
  const main = eventsOf(TEXTS.old, MAIN)
  const sub = eventsOf(TEXTS.subagent, 'x1')

  return foldSession(inTimeOrder([...main.events, ...sub.events]), new Map([['x1', 'agent1']]))
}

test('the person’s words are prompts; what the engine wrote in their place is not', () => {
  expect(promptText('  Rename greet  ')).toBe('Rename greet')
  expect(promptText('<command-name>/replay</command-name>\n<command-args>sessions</command-args>')).toBe('/replay sessions')
  expect(promptText('<system-reminder>x</system-reminder>')).toBe('')
  expect(promptText('<local-command-stdout>done</local-command-stdout>')).toBe('')
  expect(promptText('[Request interrupted by user]')).toBe('')
})

test('torn lines are skipped and counted; results are parsed only for kept calls', () => {
  const main = eventsOf(TEXTS.old, MAIN)

  expect(main.skipped).toBe(1)
  expect(main.events.filter(event => event.kind === 'prompt').map(event => (event as { text: string }).text)).toEqual(['Rename greet to welcome everywhere', 'Add a changelog', '/replay sessions'])
  expect(main.events.some(event => event.kind === 'result' && event.id === 'e2' && event.isError)).toBe(true)
  const reader = newReader(MAIN)
  expect(eventsOfLine('{"type":"user","message":{"content":[{"type":"tool_result","tool_use_id":"unknown","content":"big"}]}}', reader)).toEqual([])
  expect(eventsOfLine('{"type":"user","message":{"content":5}}', reader)).toEqual([])
  expect(eventsOfLine('[]', reader)).toEqual([])
})

test('a session folds into the turns that edited files, with what was said and the plan step', () => {
  const session = oldSession()

  expect(session.title).toBe('Rename greet to welcome everywhere')
  expect(session.prompts).toBe(3)
  expect(session.turns.map(turn => turn.n)).toEqual([1, 2])
  const [first, second] = session.turns
  // The failed Edit (e2) is left out; the subagent's edit after the next prompt still joins the first turn.
  expect(first?.edits.map(edit => edit.id)).toEqual(['e1', 'se1'])
  expect(first?.edits[0]).toMatchObject({ said: 'I rename the function first, then the docs', plan: { index: 1, total: 2, title: 'Rename the function' } })
  expect(first?.edits[1]).toMatchObject({ agent: 'x1', said: 'Updating the guide' })
  expect(second?.edits.map(edit => edit.id)).toEqual(['w1', 'w2', 'w3'])
  expect(turnRows(session)).toEqual([
    { n: 2, ask: 'Add a changelog', at: Date.UTC(2026, 9, 12, 12, 10), edits: 3, files: 3 },
    { n: 1, ask: 'Rename greet to welcome everywhere', at: Date.UTC(2026, 9, 12, 12, 0), edits: 2, files: 2 },
  ])
})

test('without its meta file a subagent’s edit joins the turn under way', () => {
  const main = eventsOf(TEXTS.old, MAIN)
  const sub = eventsOf(TEXTS.subagent, 'x1')
  const session = foldSession(inTimeOrder([...main.events, ...sub.events]), new Map())

  expect(session.turns.find(turn => turn.n === 2)?.edits.map(edit => edit.id)).toEqual(['w1', 'w2', 'w3', 'se1'])
})

test('past steps show what the transcript holds, and say so', async () => {
  setLang('en')
  const session = oldSession()
  const first = await stepsOfTurn(session.turns[0]!, '/w')
  const second = await stepsOfTurn(session.turns[1]!, '/w')

  expect(first[0]).toMatchObject({ tool: 'Edit', file: 'src/greet.js', note: 'edited part only', toolUseId: 'e1' })
  expect(first[0]?.diff.map(line => line.op)).toEqual(['-', '+'])
  expect(first[1]).toMatchObject({ file: 'docs/guide.md', agentId: 'x1', said: 'Updating the guide' })
  expect(second.map(step => step.note)).toEqual(['new file', 'rewrite', 'whole file; earlier text not in transcript'])
  expect(second[0]?.diff.every(line => line.op === '+')).toBe(true)
  expect(second[1]?.diff).toEqual([{ op: '-', t: 'notes v1', span: { start: 6, end: 8 } }, { op: '+', t: 'notes v2', span: { start: 6, end: 8 } }, { op: ' ', t: 'same' }])
  expect(second[2]?.diff).toEqual([{ op: '+', t: 'only the new text' }])
  setLang('tr')
})

test('a notebook cell edit keeps only its new source', async () => {
  setLang('en')
  const turn = {
    n: 1, ask: '', at: 0,
    edits: [
      { id: 'nb1', agent: MAIN, tool: 'NotebookEdit', input: { notebook_path: '/w/a.ipynb', new_source: 'print(1)', edit_mode: 'insert' } },
      { id: 'nb2', agent: MAIN, tool: 'NotebookEdit', input: { notebook_path: '/w/a.ipynb', new_source: '', edit_mode: 'delete' } },
      { id: 'nb3', agent: MAIN, tool: 'Edit', input: { file_path: 42, old_string: 'a', new_string: 'b' } },
    ],
  }
  const steps = await stepsOfTurn(turn, '/w')

  expect(steps.map(step => [step.file, step.note])).toEqual([['a.ipynb', 'new cell'], ['a.ipynb', 'cell deleted; its text not recorded'], ['(unknown file)', 'edited part only']])
  expect(steps[1]?.diff).toEqual([])
  setLang('tr')
})
