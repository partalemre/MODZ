// Finds the tables and fenced code in a reply so they can be drawn as cards; the rest
// stays markdown.

export type Align = 'left' | 'right' | 'center'

export type Table = { kind: 'table'; header: string[]; align: Align[]; rows: string[][] }

// `raw` is the fence as written, for the surfaces that keep Claude Code's own drawing.
export type Code = { kind: 'code'; lang: string; code: string; raw: string }

export type Segment = { kind: 'text'; text: string } | Table | Code

const SEPARATOR = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/
const FENCE = /^\s*(```|~~~)\s*([\w+#.-]*)/

// Inline emphasis and code ticks read as noise in a padded cell.
const clean = (cell: string): string =>
  cell.replace(/\*\*|__|`/g, '').replace(/\\\|/g, '|').trim()

export function cellsOf(line: string): string[] {
  const inner = line.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '')

  return inner.split(/(?<!\\)\|/).map(clean)
}

const alignOf = (cell: string): Align => {
  const spec = cell.trim()

  if (spec.startsWith(':') && spec.endsWith(':')) {
    return 'center'
  }

  return spec.endsWith(':') ? 'right' : 'left'
}

const fit = (cells: string[], width: number): string[] =>
  Array.from({ length: width }, (_, i) => cells[i] ?? '')

type Found<T> = { segment: T; end: number }

// The fence opening at line `i` as a code segment, with the line that closes it; null
// while it is still streaming.
function codeAt(lines: readonly string[], i: number, fence: RegExpExecArray): Found<Code> | null {
  const close = lines.findIndex((other, j) => j > i && FENCE.test(other) && other.trim().replace(/[`~]/g, '') === '')

  if (close === -1) {
    return null
  }

  return {
    segment: {
      kind: 'code',
      lang: (fence[2] ?? '').toLowerCase(),
      code: lines.slice(i + 1, close).join('\n'),
      raw: lines.slice(i, close + 1).join('\n'),
    },
    end: close,
  }
}

// The table whose header is line `i`, with its last row's line; null when none starts there.
function tableAt(lines: readonly string[], i: number): Found<Table> | null {
  const line = lines[i] ?? ''
  const next = lines[i + 1] ?? ''
  const header = cellsOf(line)
  const isTable = line.includes('|') && SEPARATOR.test(next) && header.length > 1 && cellsOf(next).length === header.length

  if (!isTable) {
    return null
  }

  const rows: string[][] = []
  let end = i + 2

  while (end < lines.length && (lines[end] ?? '').includes('|') && (lines[end] ?? '').trim() !== '') {
    rows.push(fit(cellsOf(lines[end] ?? ''), header.length))
    end++
  }

  return { segment: { kind: 'table', header, align: cellsOf(next).map(alignOf), rows }, end: end - 1 }
}

export function splitReply(markdown: string): Segment[] {
  const lines = markdown.split('\n')
  const segments: Segment[] = []
  let text: string[] = []
  let inFence = false

  const flush = () => {
    if (text.join('\n').trim() !== '') {
      segments.push({ kind: 'text', text: text.join('\n') })
    }

    text = []
  }

  for (let i = 0; i < lines.length; i++) {
    const fence = FENCE.exec(lines[i] ?? '')
    // A closed fence becomes a code segment; one still streaming stays text.
    const code = fence === null || inFence ? null : codeAt(lines, i, fence)

    if (fence !== null && code === null) {
      inFence = !inFence
    }

    const found = code ?? (inFence ? null : tableAt(lines, i))

    if (found === null) {
      text.push(lines[i] ?? '')
      continue
    }

    flush()
    segments.push(found.segment)
    i = found.end
  }

  flush()

  return segments
}

// Terminal cells a character takes: wide East Asian characters and emoji take two,
// combining marks, zero-width joiners and skin-tone modifiers none.
const WIDE: readonly (readonly [number, number])[] = [
  [0x1100, 0x115f],
  [0x2e80, 0x303e],
  [0x3041, 0x33ff],
  [0x3400, 0x4dbf],
  [0x4e00, 0x9fff],
  [0xa000, 0xa4cf],
  [0xa960, 0xa97f],
  [0xac00, 0xd7a3],
  [0xf900, 0xfaff],
  [0xfe10, 0xfe19],
  [0xfe30, 0xfe6f],
  [0xff00, 0xff60],
  [0xffe0, 0xffe6],
  [0x1f300, 0x1f64f],
  [0x1f680, 0x1f6ff],
  [0x1f900, 0x1f9ff],
  [0x1fa70, 0x1faff],
  [0x20000, 0x3fffd],
]

export const charWidth = (char: string): number => {
  const code = char.codePointAt(0) ?? 0

  if (/\p{Mn}|\p{Me}|\u200d|[\ufe00-\ufe0f]|\p{Emoji_Modifier}/u.test(char)) {
    return 0
  }

  return WIDE.some(([from, to]) => code >= from && code <= to) ? 2 : 1
}

export const widthOf = (text: string): number => [...text].reduce((sum, char) => sum + charWidth(char), 0)

// `text` cut to `width` cells, marked with an ellipsis where it lost text.
const cutTo = (text: string, width: number): string => {
  if (widthOf(text) <= width) {
    return text
  }

  let kept = ''
  let used = 0

  for (const char of text) {
    const next = charWidth(char)

    if (used + next > width - 1) {
      break
    }

    kept += char
    used += next
  }

  return `${kept}…`
}

// Natural column widths, narrowed from the widest down until the table fits.
export function columnWidths(table: Table, maxWidth: number, gap: number): number[] {
  const widths = table.header.map((cell, col) =>
    Math.max(widthOf(cell), ...table.rows.map(row => widthOf(row[col] ?? ''))),
  )
  const budget = maxWidth - gap * (widths.length - 1)

  while (widths.reduce((sum, width) => sum + width, 0) > budget) {
    const widest = widths.indexOf(Math.max(...widths))

    if ((widths[widest] ?? 0) <= 3) {
      break
    }

    widths[widest] = (widths[widest] ?? 0) - 1
  }

  return widths
}

type Measure = (text: string) => number

// Splits a word too long for its column into pieces that each fit.
function breakWord(word: string, width: number, measure: Measure): string[] {
  const pieces: string[] = []
  let piece = ''

  for (const char of word) {
    if (piece !== '' && measure(piece + char) > width) {
      pieces.push(piece)
      piece = char
    } else {
      piece += char
    }
  }

  return piece === '' ? pieces : [...pieces, piece]
}

// Every line kept unless `maxLines` caps them, the last then ending in `…`. `measure` is
// terminal cells by default; the desktop card passes its pixel measure.
export type WrapBy = { maxLines?: number; measure?: Measure }

// `text` as lines that fit `width`, broken between words where it can be.
export function wrapLines(text: string, width: number, { maxLines = Infinity, measure = widthOf }: WrapBy = {}): string[] {
  const lines: string[] = []
  let line = ''

  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line === '' ? word : `${line} ${word}`

    if (measure(candidate) <= width) {
      line = candidate
      continue
    }

    if (line !== '') {
      lines.push(line)
    }

    const pieces = measure(word) <= width ? [word] : breakWord(word, width, measure)
    lines.push(...pieces.slice(0, -1))
    line = pieces.at(-1) ?? ''
  }

  const all = line === '' ? lines : [...lines, line]

  if (all.length <= maxLines) {
    return all.length === 0 ? [''] : all
  }

  const kept = all.slice(0, maxLines)
  const chars = [...(kept[maxLines - 1] ?? '')]

  while (chars.length > 0 && measure(`${chars.join('')}…`) > width) {
    chars.pop()
  }

  return [...kept.slice(0, -1), `${chars.join('')}…`]
}

export function padCell(text: string, width: number, align: Align): string {
  const cut = cutTo(text, width)
  const room = width - widthOf(cut)

  if (align === 'right') {
    return ' '.repeat(room) + cut
  }

  if (align === 'center') {
    const left = Math.floor(room / 2)

    return ' '.repeat(left) + cut + ' '.repeat(room - left)
  }

  return cut + ' '.repeat(room)
}
