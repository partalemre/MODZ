import type { ReplayDiffLine } from '../types'
import { escape, measure, MONO_EM } from './ui/svg'
import { svgDoc } from './ui/theme'
import type { Theme } from './ui/theme'
import { upper } from './lang'
import { words } from './words'
import type { Words } from './words'

export const MAX_DIFF_LINES = 12
const CODE_SIZE = 12.5
const CHAR = CODE_SIZE * MONO_EM
const ROW_H = 20
const PAD_Y = 6
const SIGN_X = 12
const CODE_X = 28
const LEGEND_GAP = 18
const SWATCH = 11
const TAB = '  '
const CODE_PAD_RIGHT = 12
// Past this a line is cut after all: a drawing must stay under the Svg size cap.
const LINE_CHARS_MAX = 400

const TINT: Record<string, string> = { '-': 'var(--danger-t)', '+': 'var(--ok-t)' }
const WORD: Record<string, string> = { '-': 'var(--danger-l)', '+': 'var(--ok-l)' }
const SIGN: Record<string, string> = { '-': '−', '+': '+' }
const SIGN_CLS: Record<string, string> = { '-': 'f-danger', '+': 'f-ok' }

export type DiffModel = { lines: ReplayDiffLine[]; width: number; theme: Theme }
export type DiffDrawing = { source: string; height: number; hidden: number; contentWidth: number }

function clipLine(text: string, maxChars: number): { shown: string; isCut: boolean } {
  const plain = text.replace(/\t/g, TAB)
  if (plain.length <= maxChars) return { shown: plain, isCut: false }

  return { shown: `${plain.slice(0, Math.max(1, maxChars - 1))}…`, isCut: true }
}

function wordRect(line: ReplayDiffLine, y: number, maxChars: number): string {
  if (line.span === undefined) return ''
  const start = Math.min(line.span.start, maxChars)
  const end = Math.min(line.span.end, maxChars)
  if (end <= start) return ''

  return `<rect x="${CODE_X + start * CHAR - 1}" y="${y + 2}" width="${(end - start) * CHAR + 2}" height="${ROW_H - 4}" rx="3" fill="${WORD[line.op]}"/>`
}

function diffRow(line: ReplayDiffLine, y: number, inner: { width: number; maxChars: number }): string {
  if (line.op === '~') return `<text x="${CODE_X}" y="${y + 14}" class="lo micro">⋯</text>`
  const { shown } = clipLine(line.t, inner.maxChars)
  const code = `<text x="${CODE_X}" y="${y + 14.5}" class="mono ${line.op === ' ' ? 'lo' : 'hi'}" font-size="${CODE_SIZE}" xml:space="preserve">${escape(shown)}</text>`
  if (line.op === ' ') return code
  const tint = `<rect x="1" y="${y}" width="${inner.width - 2}" height="${ROW_H}" fill="${TINT[line.op]}"/>`
  const sign = `<text x="${SIGN_X}" y="${y + 14.5}" class="mono ${SIGN_CLS[line.op]}" font-size="${CODE_SIZE}">${SIGN[line.op]}</text>`

  return `${tint}${wordRect(line, y, inner.maxChars)}${sign}${code}`
}

type Swatch = { label: (w: Words) => string; svg: (x: number, y: number) => string }

const SWATCHES: Swatch[] = [
  { label: w => w.removed, svg: (x, y) => `<rect x="${x + 0.5}" y="${y + 0.5}" width="${SWATCH - 1}" height="${SWATCH - 1}" rx="2.5" fill="var(--danger-t)" stroke="var(--danger-l)"/>` },
  { label: w => w.added, svg: (x, y) => `<rect x="${x + 0.5}" y="${y + 0.5}" width="${SWATCH - 1}" height="${SWATCH - 1}" rx="2.5" fill="var(--ok-t)" stroke="var(--ok-l)"/>` },
  {
    label: w => w.changedWord,
    svg: (x, y) => `<rect x="${x}" y="${y}" width="${SWATCH / 2}" height="${SWATCH}" fill="var(--danger-l)"/><rect x="${x + SWATCH / 2}" y="${y}" width="${SWATCH / 2}" height="${SWATCH}" fill="var(--ok-l)"/>`,
  },
  { label: w => w.unchanged, svg: (x, y) => `<rect x="${x + 0.5}" y="${y + 0.5}" width="${SWATCH - 1}" height="${SWATCH - 1}" rx="2.5" fill="none" stroke="var(--line2)"/>` },
]

// The swatches in one row, or two when the pane is narrow.
function legend(width: number, top: number): { svg: string; height: number } {
  let x = 0
  let y = top
  const w = words()
  const parts = SWATCHES.map(item => {
    const label = item.label(w)
    const itemWidth = SWATCH + 6 + measure(label, 11.5)
    if (x > 0 && x + itemWidth > width) {
      x = 0
      y += LEGEND_GAP
    }
    const svg = `${item.svg(x, y)}<text x="${x + SWATCH + 6}" y="${y + 9.5}" class="lo" font-size="11.5">${escape(label)}</text>`
    x += itemWidth + 16

    return svg
  })

  return { svg: parts.join(''), height: y - top + SWATCH }
}

const charsOf = (line: ReplayDiffLine): number => (line.op === '~' ? 0 : line.t.replace(/\t/g, TAB).length)

// The diff as one drawing: tinted rows, the changed words on a stronger tint, then the legend. A line longer
// than the pane widens the drawing to `contentWidth` instead of being cut; the pane scrolls it sideways.
function noteOf(shownCount: number, hidden: number): string {
  const w = words()
  if (shownCount === 0) return `${upper(w.noLineChanges.slice(0, 1))}${w.noLineChanges.slice(1)}.`

  return hidden > 0 ? w.moreLines(hidden) : ''
}

export function diffSvg(model: DiffModel): DiffDrawing {
  const shown = model.lines.slice(0, MAX_DIFF_LINES)
  const hidden = model.lines.length - shown.length
  const extra = hidden > 0 || shown.length === 0 ? 1 : 0
  const boxH = PAD_Y * 2 + (shown.length + extra) * ROW_H
  const longest = Math.min(LINE_CHARS_MAX, Math.max(0, ...shown.map(charsOf)))
  const contentWidth = Math.max(model.width, Math.ceil(CODE_X + longest * CHAR + CODE_PAD_RIGHT))
  const inner = { width: contentWidth, maxChars: Math.floor((contentWidth - CODE_X - CODE_PAD_RIGHT) / CHAR) }
  const rows = shown.map((line, n) => diffRow(line, PAD_Y + n * ROW_H, inner))
  const tail = PAD_Y + shown.length * ROW_H + 14
  const note = noteOf(shown.length, hidden)
  const noteSvg = note === '' ? '' : `<text x="${CODE_X}" y="${tail}" class="lo" font-size="11.5">${note}</text>`
  const box = `<rect x="0.5" y="0.5" width="${contentWidth - 1}" height="${boxH - 1}" rx="8" fill="var(--inset)" stroke="var(--line)"/>`
  const key = legend(model.width, boxH + 14)
  const height = boxH + 14 + key.height + 2
  const body = `${box}<g>${rows.join('')}</g>${noteSvg}${key.svg}`

  return { source: svgDoc({ width: contentWidth, height, theme: model.theme }, body), height, hidden, contentWidth }
}
