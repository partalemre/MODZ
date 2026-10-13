// What a read put into Claude's context, in tokens, from the API's own counts (DESIGN.md §1, honest numbers).
// Every model request reports its whole prompt: uncached input + cache read + cache write. The next request in the
// same loop is that prompt, the step's own answer, and what the step's results added. So the growth, less the answer,
// is what the results cost. A read alone there, after an answer without thinking, is measured (`exact`). Several
// results, a reminder riding along, or thinking (the usage does not say how much of it the next prompt carries)
// share the growth by text length (`share`, drawn ≈). With no growth to read (no next request, a compaction
// between) the read gets a guess from its text length (`guess`, drawn ~), at the rate measured steps showed.

import type { CostKind, ReadCost } from '../types'

export type PendingRead = { id: string; file: string; chars: number }
export type Usage = { input_tokens: number; output_tokens: number; cache_read_input_tokens: number; cache_creation_input_tokens: number }
export type StepSize = { prompt: number; output: number }
// A block the step's results put into the prompt: its tool call's id (a reminder has none) and its text's length.
// An image or a document has no text length that says anything about its tokens: it is opaque.
export type Block = { id: string; chars: number; isOpaque: boolean }
export type Added = { blocks: Block[]; hasThinking: boolean }
// Tokens a character of results cost in this session's measured steps.
export type Rate = { tokens: number; chars: number }
export type Attributed = { file: string; cost: ReadCost }
type ApiBlock = { type: string; [field: string]: unknown }
export type ApiMessage = { role: string; content: readonly ApiBlock[] | string }

// Read output carries line-number prefixes, which tokenize densely: probes measured 2 to 2.3 characters a token
// on code. Until the session has measured a step of its own, a guess divides by this.
const DEFAULT_CHARS_PER_TOKEN = 3
// The session's own rate replaces the default once its measured steps cover this many characters.
const RATE_MIN_CHARS = 500
const RANK: Record<CostKind, number> = { exact: 0, share: 1, guess: 2 }

export const NO_COST: ReadCost = { tokens: 0, kind: 'exact', reads: 0 }

export const promptOf = (u: Usage): number => u.input_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens

export const sizeOf = (u: Usage | null): StepSize | null => (u ? { prompt: promptOf(u), output: u.output_tokens } : null)

// The step's growth that its results account for; zero when it cannot be read.
export function growthOf(before: StepSize | null, after: StepSize | null): number {
  if (!before || !after) return 0
  return Math.max(0, after.prompt - before.prompt - before.output)
}

function textChars(content: unknown): { chars: number; isOpaque: boolean } {
  if (typeof content === 'string') return { chars: content.length, isOpaque: false }
  if (!Array.isArray(content)) return { chars: 0, isOpaque: true }
  return content.reduce<{ chars: number; isOpaque: boolean }>(
    (acc, part: ApiBlock) =>
      part.type === 'text' && typeof part.text === 'string' ? { ...acc, chars: acc.chars + part.text.length } : { ...acc, isOpaque: true },
    { chars: 0, isOpaque: false },
  )
}

function blockOf(b: ApiBlock): Block {
  if (b.type === 'text') return { id: '', ...textChars(String(b.text ?? '')) }
  if (b.type === 'tool_result') return { id: String(b.tool_use_id ?? ''), ...textChars(b.content) }
  return { id: '', chars: 0, isOpaque: true }
}

const blocksOf = (m: ApiMessage | undefined): ApiBlock[] => (m && Array.isArray(m.content) ? [...m.content] : [])

// What the step put into the prompt: the user messages between its own answer and the next one, found by the
// results' ids so it reads the same whenever the transcript is asked. Null when the results are gone (compacted).
export function addedOf(messages: readonly ApiMessage[], ids: readonly string[]): Added | null {
  const at = messages.findLastIndex(m => m.role === 'user' && blocksOf(m).some(b => b.type === 'tool_result' && ids.includes(String(b.tool_use_id))))
  if (at < 0) return null
  let start = at
  while (start > 0 && messages[start - 1]?.role === 'user') start--
  let end = at
  while (end + 1 < messages.length && messages[end + 1]?.role === 'user') end++
  const answer = messages[start - 1]
  const hasThinking = blocksOf(answer).some(b => b.type === 'thinking' || b.type === 'redacted_thinking')
  return { blocks: messages.slice(start, end + 1).flatMap(m => blocksOf(m).map(blockOf)), hasThinking }
}

export function guess(chars: number, rate: Rate): number {
  const perChar = rate.chars >= RATE_MIN_CHARS ? rate.tokens / rate.chars : 1 / DEFAULT_CHARS_PER_TOKEN
  return Math.max(1, Math.round(chars * perChar))
}

const guessed = (reads: readonly PendingRead[], rate: Rate): Attributed[] =>
  reads.map(r => ({ file: r.file, cost: { tokens: guess(r.chars, rate), kind: 'guess', reads: 1 } }))

// A read's own characters: its result's text without the reminders the engine appended to it.
const ownChars = (r: PendingRead, b: Block): number => (r.chars > 0 ? Math.min(r.chars, b.chars) : b.chars)

// Each read's tokens from one step's measured growth; see the top of this file for when it is exact.
export function attribute(step: { reads: readonly PendingRead[]; added: Added | null; grown: number }, rate: Rate): Attributed[] {
  const { reads, added, grown } = step
  const total = added?.blocks.reduce((s, b) => s + b.chars, 0) ?? 0
  if (!added || grown <= 0 || total <= 0 || added.blocks.some(b => b.isOpaque)) return guessed(reads, rate)
  const isAlone = reads.length === 1 && added.blocks.length === 1 && !added.hasThinking
  return reads.map(r => {
    const b = added.blocks.find(x => x.id === r.id)
    if (!b) return guessed([r], rate)[0] as Attributed
    const own = ownChars(r, b)
    if (isAlone && own === b.chars) return { file: r.file, cost: { tokens: grown, kind: 'exact', reads: 1 } }
    return { file: r.file, cost: { tokens: Math.max(1, Math.round((grown * own) / total)), kind: 'share', reads: 1 } }
  })
}

// The rate a measured step teaches: its growth over every character it added. A step that thought teaches
// nothing: how much of its thinking the next prompt carries is not reported.
export function rateAfter(rate: Rate, step: { added: Added | null; grown: number }): Rate {
  const { added, grown } = step
  if (!added || added.hasThinking || grown <= 0 || added.blocks.some(b => b.isOpaque)) return rate
  const chars = added.blocks.reduce((s, b) => s + b.chars, 0)
  return chars > 0 ? { tokens: rate.tokens + grown, chars: rate.chars + chars } : rate
}

// Two costs of one file or one total: summed, and only as sure as the less sure of them.
export function merge(a: ReadCost | undefined, b: ReadCost): ReadCost {
  if (!a) return b
  return { tokens: a.tokens + b.tokens, kind: RANK[b.kind] > RANK[a.kind] ? b.kind : a.kind, reads: a.reads + b.reads }
}

export const sumOf = (costs: readonly ReadCost[]): ReadCost => costs.reduce((acc, c) => merge(acc, c), NO_COST)
