import type { SessionMessage } from 'claude-code'

import type { ReplayStep } from '../types'

export const EXPLAIN_MODEL = 'haiku'
export const MAX_MODEL_STEPS = 20
const NOTE_MAX = 90
const DIFF_PER_STEP = 600
const TOKENS_PER_STEP = 40
const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit'])

// One plain line from Claude's prose: the first sentence, markdown dropped, cut to fit a row.
export function shortLine(text: string): string {
  const line = text.split('\n').map(part => part.replace(/^[\s#>*-]+/, '').trim()).find(part => part !== '') ?? ''
  const plain = line.replace(/[*_`]/g, '')
  const sentence = (plain.match(/^(.+?[.!?])(\s|$)/)?.[1] ?? plain).replace(/[.:;,]+$/, '').trim()

  return sentence.length > NOTE_MAX ? `${sentence.slice(0, NOTE_MAX - 1).trimEnd()}…` : sentence
}

function isPrompt(message: SessionMessage): boolean {
  return message.role === 'user' && message.text.trim() !== '' && (message.toolResults ?? []).length === 0
}

// What Claude said before each edit, keyed by tool_use_id. A text covers the edits of its own message
// and of the text-less messages after it, until another tool runs or the person writes.
export function notesFromMessages(messages: SessionMessage[], ids: Set<string>): Map<string, string> {
  const notes = new Map<string, string>()
  let pending = ''
  for (const message of messages) {
    if (isPrompt(message)) pending = ''
    if (message.role !== 'assistant') continue
    if (message.text.trim() !== '') pending = shortLine(message.text)
    for (const use of message.toolUses) {
      if (ids.has(use.tool_use_id) && pending !== '') notes.set(use.tool_use_id, pending)
    }
    if (message.toolUses.some(use => !EDIT_TOOLS.has(use.tool))) pending = ''
  }

  return notes
}

// The tool_use_ids of the steps one loop (main: undefined) made.
export function idsOfLoop(steps: ReplayStep[], agentId: string | undefined): Set<string> {
  return new Set(steps.flatMap(step => (step.agentId === agentId && step.toolUseId !== undefined ? [step.toolUseId] : [])))
}

// Indexes of the steps that still need a line, at most as many as one call explains.
export function unexplained(steps: ReplayStep[]): number[] {
  return steps.flatMap((step, index) => (step.said === undefined && step.diff.length > 0 ? [index] : [])).slice(0, MAX_MODEL_STEPS)
}

function diffText(step: ReplayStep): string {
  return step.diff.map(line => `${line.op === '~' ? ' ' : line.op}${line.t}`).join('\n').slice(0, DIFF_PER_STEP)
}

export function buildPrompt(steps: ReplayStep[], indexes: number[]): { prompt: string; maxTokens: number } {
  const blocks = indexes.map((index, n) => {
    const step = steps[index] as ReplayStep

    return `### ${n + 1}: ${step.file}\n${diffText(step)}`
  })
  const prompt = [
    'Her dosya değişikliğinin ne işe yaradığını Türkçe, en fazla 10 kelimelik tek bir cümleyle yaz.',
    'Yalnızca "<numara>: <açıklama>" satırları yaz, başka hiçbir şey yazma.',
    '',
    ...blocks,
  ].join('\n')

  return { prompt, maxTokens: TOKENS_PER_STEP * indexes.length }
}

// "1: ..." lines of the reply mapped back to the step indexes they were asked for.
export function parseReply(text: string, indexes: number[]): Map<number, string> {
  const notes = new Map<number, string>()
  for (const line of text.split('\n')) {
    const found = line.match(/^\s*(\d+)\s*[:.)-]\s*(.+)$/)
    const index = found === null ? undefined : indexes[Number(found[1]) - 1]
    const note = found === null ? '' : shortLine(found[2] as string)
    if (index !== undefined && note !== '') notes.set(index, note)
  }

  return notes
}

// The steps with each one lacking a line given the one `noteOf` finds, if any.
export function withNotes(steps: ReplayStep[], noteOf: (step: ReplayStep, index: number) => string | undefined): ReplayStep[] {
  return steps.map((step, index) => {
    const said = step.said ?? noteOf(step, index)

    return said === undefined ? step : { ...step, said }
  })
}
