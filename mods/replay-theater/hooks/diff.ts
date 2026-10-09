// Copyright 2026 Anthropic PBC
// SPDX-License-Identifier: Apache-2.0
//
// The line diff of the original Replay Theater, typed. Modified 2026 (MODZ): changed-word spans per line pair.

const MAX_LCS_LINES = 400
// A pair of lines whose changed middle is under this share of the longer line gets its span highlighted.
const SPAN_SHARE_MAX = 0.7

export type DiffOp = ' ' | '-' | '+' | '~'
export type Span = { start: number; end: number }
export type DiffLine = { op: DiffOp; t: string; span?: Span }

function splitLines(text: unknown): string[] {
  if (text === undefined || text === null || text === '') return []
  const lines = String(text).split('\n')
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop()

  return lines
}

function lcsTable(a: string[], b: string[]): number[][] {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      const row = dp[i] as number[]
      row[j] = a[i] === b[j] ? (dp[i + 1]?.[j + 1] ?? 0) + 1 : Math.max(dp[i + 1]?.[j] ?? 0, row[j + 1] ?? 0)
    }
  }

  return dp
}

// Small inputs get an LCS diff, so unchanged lines show as context; large ones are all removed, then all added.
export function diffLines(oldText: unknown, newText: unknown): DiffLine[] {
  const a = splitLines(oldText)
  const b = splitLines(newText)
  if (a.length > MAX_LCS_LINES || b.length > MAX_LCS_LINES) {
    return [...a.map(t => ({ op: '-' as const, t })), ...b.map(t => ({ op: '+' as const, t }))]
  }
  const dp = lcsTable(a, b)
  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ op: ' ', t: a[i] as string })
      i++
      j++
    } else if ((dp[i + 1]?.[j] ?? 0) >= (dp[i]?.[j + 1] ?? 0)) out.push({ op: '-', t: a[i++] as string })
    else out.push({ op: '+', t: b[j++] as string })
  }
  while (i < a.length) out.push({ op: '-', t: a[i++] as string })
  while (j < b.length) out.push({ op: '+', t: b[j++] as string })

  return withSpans(trimContext(out))
}

const isChange = (line: DiffLine | undefined): boolean => line !== undefined && line.op !== ' '

// One line of context around each change, so a long file's Write shows the changed lines, not the whole file.
export function trimContext(lines: DiffLine[]): DiffLine[] {
  if (!lines.some(isChange)) return lines
  const out: DiffLine[] = []
  let skipped = false
  lines.forEach((line, k) => {
    if (isChange(line) || isChange(lines[k - 1]) || isChange(lines[k + 1])) {
      if (skipped && out.length > 0) out.push({ op: '~', t: '⋯' })
      out.push(line)
      skipped = false
    } else skipped = true
  })

  return out
}

export function countChanges(diff: DiffLine[]): { add: number; del: number } {
  return {
    add: diff.filter(line => line.op === '+').length,
    del: diff.filter(line => line.op === '-').length,
  }
}

const isWord = (char: string | undefined): boolean => char !== undefined && /[\p{L}\p{N}_$]/u.test(char)

// The changed middle of two similar lines, widened to whole words; null when the lines share too little.
export function changedSpans(before: string, after: string): { before: Span; after: Span } | null {
  let head = 0
  while (head < before.length && head < after.length && before[head] === after[head]) head++
  while (head > 0 && isWord(before[head - 1]) && (isWord(before[head]) || isWord(after[head]))) head--
  let tail = 0
  const room = Math.min(before.length, after.length) - head
  while (tail < room && before[before.length - 1 - tail] === after[after.length - 1 - tail]) tail++
  const endOf = (text: string) => text.length - tail
  while (tail > 0 && isWord(before[endOf(before)]) && (isWord(before[endOf(before) - 1]) || isWord(after[endOf(after) - 1]))) tail--
  const longest = Math.max(before.length, after.length)
  const changed = Math.max(endOf(before) - head, endOf(after) - head)
  if (longest === 0 || changed / longest > SPAN_SHARE_MAX || head + tail === 0) return null

  return { before: { start: head, end: endOf(before) }, after: { start: head, end: endOf(after) } }
}

// Each run of removed lines followed by as many added ones is paired line by line for word spans.
function withSpans(lines: DiffLine[]): DiffLine[] {
  const out = lines.map(line => ({ ...line }))
  let k = 0
  while (k < out.length) {
    let removed = 0
    while (out[k + removed]?.op === '-') removed++
    let added = 0
    while (out[k + removed + added]?.op === '+') added++
    if (removed > 0 && removed === added) pairSpans(out, { from: k, count: removed })
    k += Math.max(1, removed + added)
  }

  return out
}

function pairSpans(lines: DiffLine[], run: { from: number; count: number }): void {
  for (let n = 0; n < run.count; n++) {
    const before = lines[run.from + n] as DiffLine
    const after = lines[run.from + run.count + n] as DiffLine
    const spans = changedSpans(before.t, after.t)
    if (spans === null) continue
    before.span = spans.before
    after.span = spans.after
  }
}
