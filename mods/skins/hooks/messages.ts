import { hardBreaks, splitReply } from './markdown'
import type { Segment } from './markdown'
import { MAX_LINES as MAX_CODE_LINES } from './svg-code'

// Markdown takes at most 10000 characters a block; a longer prompt keeps Claude Code's
// own drawing, which folds a big paste.
const MAX_MARKDOWN = 9000
const MAX_PROMPT = 4000

// Only a person's own typing becomes a prompt row: a task notification or a peer's
// message is not theirs to dress as theirs.
const TYPED = new Set(['composer', 'bridge', 'sdk'])

export const isOwnPrompt = ({ origin, text }: { origin: { kind: string }; text: string }): boolean =>
  TYPED.has(origin.kind) && text.length <= MAX_PROMPT

// A reply's segments when it holds a table or code to draw and every markdown block fits;
// null keeps Claude Code's own drawing.
export function cardSegments(text: string): Segment[] | null {
  if (!/\||```|~~~/.test(text)) {
    return null
  }

  const segments = splitReply(text)
  // Measured as Markdown will take it: hard breaks add two characters a line.
  const fits = segments.every(segment => segment.kind === 'table' || (segment.kind === 'text' ? hardBreaks(segment.text) : segment.raw).length <= MAX_MARKDOWN)
  // A code card shows at most MAX_CODE_LINES lines; a longer block keeps Claude Code's drawing, cut nowhere.
  const isCodeWhole = segments.every(segment => segment.kind !== 'code' || segment.code.split('\n').length <= MAX_CODE_LINES)

  return fits && isCodeWhole && segments.some(segment => segment.kind !== 'text') ? segments : null
}

// The topics an AskUserQuestion dialog asks about, from the headers its questions carry.
export const headersOf = (questions: readonly unknown[]): string[] =>
  questions
    .map(question => (question as { header?: unknown } | null)?.header)
    .filter((header): header is string => typeof header === 'string' && header !== '')
