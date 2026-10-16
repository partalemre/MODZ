import { expect, test } from 'claude-code/testing'

import { cardOf, isAskDue, isBandQuiet, rearmed, snoozeFrom } from '../hooks/gate'
import { injectMove } from '../hooks/inject'
import { settingsOf } from '../hooks/limits'
import { buildNote, cleanSummary, goalsOf, notePath, openSteps, relativeTo, transcriptOf } from '../hooks/note'
import { errorLine, touchedPath, withFile } from '../hooks/track'
import { said } from './stubs'

// The rules alone: when the card asks, what "Not now" waits for, what the note holds, who gets it.

const facts = (percent: number | null, over: object = {}) => ({ percent, threshold: 80, snoozeUntil: null, stage: 'idle' as const, ...over })
const DAY = 24 * 60 * 60 * 1000
const note = (over: object = {}) => ({
  path: '/w/.claude/handoff/x.md', root: '/w', text: '# note', at: 0, writtenBy: 's1', isInjectOn: true, consumedBy: null, isSummarized: false, ...over,
})

test('the ask is due from the threshold on, never before the first measurement', () => {
  expect(isAskDue(facts(null))).toBe(false)
  expect(isAskDue(facts(79))).toBe(false)
  expect(isAskDue(facts(80))).toBe(true)
  expect(isAskDue(facts(95, { stage: 'done' }))).toBe(false)
})

test('"Not now" waits ten points, and a fall under the threshold lets the snooze go', () => {
  expect(snoozeFrom(82)).toBe(92)
  expect(isAskDue(facts(91, { snoozeUntil: 92 }))).toBe(false)
  expect(isAskDue(facts(92, { snoozeUntil: 92 }))).toBe(true)
  expect(rearmed(facts(40, { snoozeUntil: 92, stage: 'done' }))).toEqual({ snoozeUntil: null, stage: 'idle' })
  expect(rearmed(facts(85, { snoozeUntil: 92, stage: 'done' }))).toEqual({ snoozeUntil: 92, stage: 'done' })
})

test('the card follows the stage; the band is quiet while a turn runs or a survey is open', () => {
  expect(cardOf(facts(50, { stage: 'saved' }))).toBe('saved')
  expect(cardOf(facts(85))).toBe('ask')
  expect(cardOf(facts(85, { stage: 'done' }))).toBe(null)
  expect(isBandQuiet({ isWorking: true, hasSurvey: false })).toBe(true)
  expect(isBandQuiet({ isWorking: false, hasSurvey: true })).toBe(true)
  expect(isBandQuiet({ isWorking: false, hasSurvey: false })).toBe(false)
})

test('a threshold outside 50 to 99 falls back to 80', () => {
  expect(settingsOf({ threshold: 70, summarize: false })).toEqual({ threshold: 70, isSummarizing: false })
  expect(settingsOf({ threshold: 120 }).threshold).toBe(80)
  expect(settingsOf({}).isSummarizing).toBe(true)
})

test('the goal is the last three typed prompts, trimmed, without tool results or tagged rows', () => {
  const messages = [
    said('user', 'first'), said('user', 'second   ask\nwith a newline'), said('assistant', 'ok'),
    said('user', '', { toolResults: [{ tool_use_id: 't', text: 'x' }] }), said('user', '<command-name>/clear</command-name>'),
    said('user', 'third'), said('user', 'x'.repeat(400)),
  ] as any[]
  const goals = goalsOf(messages)

  expect(goals).toEqual(['second ask with a newline', 'third', `${'x'.repeat(279)}…`])
})

test('open plan steps, files relative to the repo, each once', () => {
  const tasks = [{ id: '1', subject: 'Build', status: 'completed' }, { id: '2', subject: 'Test', status: 'in_progress' }, { id: '3', subject: 'Ship', status: 'pending' }] as const
  expect(openSteps(tasks)).toEqual(['[>] Test', '[ ] Ship'])
  expect(relativeTo('/w', '/w/src/a.ts')).toBe('src/a.ts')
  expect(relativeTo('/w', '/elsewhere/b.ts')).toBe('/elsewhere/b.ts')
  expect(withFile(['a'], 'a')).toEqual(['a'])
  expect(touchedPath('Edit', { file_path: '/w/a.ts' })).toBe('/w/a.ts')
  expect(touchedPath('NotebookEdit', { notebook_path: '/w/n.ipynb' })).toBe('/w/n.ipynb')
  expect(touchedPath('Read', { file_path: '/w/a.ts' })).toBe(null)
  expect(errorLine('Bash', '\n  npm ERR! missing script\nmore')).toBe('Bash: npm ERR! missing script')
})

test('the note lists every fact it has and leaves out the empty sections', () => {
  const text = buildNote({
    stamp: '2026-10-13 14:05', root: '/w', percent: 82, goals: ['fix login'], steps: ['[ ] Ship'], files: ['src/a.ts'],
    git: ['## main', ' M src/a.ts'], lastError: 'Bash: boom', summary: null,
  })

  expect(text).toContain('# Handoff · 2026-10-13 14:05')
  expect(text).toContain('Context 82% full')
  expect(text).toContain('## Goal (latest prompts)\n- fix login')
  expect(text).toContain('## Open plan steps\n- [ ] Ship')
  expect(text).toContain('## Files touched\n- src/a.ts')
  expect(text).toContain('```\n## main\n M src/a.ts\n```')
  expect(text).toContain('## Last error\nBash: boom')
  expect(text).not.toContain('## Where we are')
  expect(notePath('/w', new Date(2026, 9, 13, 14, 5).getTime())).toBe('/w/.claude/handoff/2026-10-13-1405.md')
})

test('the summary input is the newest transcript, held to its size; the reply to twelve lines', () => {
  const messages = Array.from({ length: 50 }, (_, i) => said(i % 2 === 0 ? 'user' : 'assistant', `m${i} ${'y'.repeat(600)}`)) as any[]
  const input = transcriptOf(messages)

  expect(input.length).toBe(12_000)
  expect(input).toContain('m49')
  expect(input).not.toContain('m19 ')
  expect(cleanSummary(Array.from({ length: 20 }, (_, i) => `line ${i}`).join('\n'))?.split('\n')).toHaveLength(12)
  expect(cleanSummary('  \n ')).toBe(null)
})

test('one fresh conversation claims the note; it keeps it; nobody else, the writer, or a day later gets it', () => {
  expect(injectMove({ note: note(), sessionId: 's2', now: 1 })).toBe('claim')
  expect(injectMove({ note: note({ consumedBy: 's2' }), sessionId: 's2', now: 1 })).toBe('inject')
  expect(injectMove({ note: note({ consumedBy: 's2' }), sessionId: 's3', now: 1 })).toBe('skip')
  expect(injectMove({ note: note(), sessionId: 's1', now: 1 })).toBe('skip')
  expect(injectMove({ note: note({ isInjectOn: false }), sessionId: 's2', now: 1 })).toBe('skip')
  expect(injectMove({ note: note(), sessionId: 's2', now: DAY + 1 })).toBe('skip')
  expect(injectMove({ note: null, sessionId: 's2', now: 1 })).toBe('skip')
})
