import type { Align, Table } from './markdown'
import { wrapLines } from './markdown'
import type { Palette } from './skin'
import { CONTROL_SLOT, escape, HEADER_MID, measure as measureAt, MONO, svgCard } from './svg-kit'
import type { CardFrame } from './svg-kit'

// A table as an animated vector card in the skin's colours, with no background of its
// own so the page shows through, for the surfaces that draw `Svg` (the desktop app).
// Long cells wrap onto more lines instead of being cut, so nothing is hidden: the
// desktop draws the card as an image, which cannot show a tooltip on hover.

const SIZE = 15
const LINE_H = 21
const HEADER_H = 58
const HEAD_SIZE = 12
const HEAD_LINE_H = 16
const ROW_PAD_Y = 12
const MIN_ROW_H = 44
const PAD_X = 24
const COL_GAP = 28
const MIN_COL = 56
const MIN_WIDTH = 420
const MAX_WIDTH = 1600
const STAGGER_MS = 60

export type SvgTable = { source: string; width: number; height: number; alt: string }

type CellKind = 'text' | 'code' | 'number' | 'colour' | 'diff'

const HEX = /^#[0-9a-f]{6}$/i
const DIFF = /^\+(\d+)\s*[−-](\d+)$/
const NUMBER = /^[+−-]?[$€£]?\d[\d.,]*\s?(%|ms|s|min|h|kb|mb|gb|x|×)?$/i
const CODE = /^[^\s]*[/_.:@][^\s]*$/

export const kindOfCell = (cell: string): CellKind => {
  const text = cell.trim()

  if (HEX.test(text)) {
    return 'colour'
  }

  if (DIFF.test(text)) {
    return 'diff'
  }

  if (NUMBER.test(text)) {
    return 'number'
  }

  return CODE.test(text) && text.length > 1 ? 'code' : 'text'
}

// Width of a string in pixels at the table's type size.
export const measure = (text: string, isMono: boolean): number => measureAt(text, isMono, SIZE)

// Width of a header label: smaller type, spaced out by the header's letter-spacing.
const measureHead = (text: string): number => measureAt(text, false, HEAD_SIZE) + [...text].length * HEAD_SIZE * 0.1

const isMonoKind = (kind: CellKind): boolean => kind !== 'text'

export type Wrap = { isMono: boolean; maxLines?: number }

// The cell's text as lines that fit its column, every line kept unless `maxLines` caps it:
// the card is an image, so a line cut with `…` could not be read anywhere.
export const wrapCell = (text: string, width: number, { isMono, maxLines = Infinity }: Wrap): string[] =>
  wrapLines(text, width, { maxLines, measure: line => measure(line, isMono) })

const longestWord = (text: string, widthOf: (text: string) => number): number =>
  Math.max(0, ...text.split(/\s+/).filter(Boolean).map(widthOf))

// What a cell needs to sit on one line, and the least it needs: its longest word when it
// wraps, its whole text when it does not.
function cellWidths(cell: string): { natural: number; least: number } {
  const kind = kindOfCell(cell)
  const isMono = isMonoKind(kind)
  const natural = measure(cell, isMono) + (kind === 'colour' ? 22 : 0)
  const isWrapped = kind === 'text' || kind === 'code'

  return { natural, least: isWrapped ? longestWord(cell, line => measure(line, isMono)) : natural }
}

function naturalWidths(table: Table): number[] {
  return table.header.map((header, col) => {
    const cells = table.rows.map(row => cellWidths(row[col] ?? '').natural)

    return Math.max(MIN_COL, Math.ceil(Math.max(measureHead(header.toUpperCase()), ...cells)))
  })
}

function leastWidths(table: Table): number[] {
  return table.header.map((header, col) => {
    const cells = table.rows.map(row => cellWidths(row[col] ?? '').least)

    return Math.max(MIN_COL, Math.ceil(Math.max(longestWord(header.toUpperCase(), measureHead), ...cells)))
  })
}

// `reserve` is kept free at the right; `least` is what each column needs at the least.
export type Fit = { reserve?: number; least?: readonly number[] }

// Columns that fit their fair share keep their natural width. The rest start from their
// longest word (`least`), so they wrap between words, and share what is left in proportion
// to how much more they hold: the fullest cell sets a row's height, so its column gains
// most. With room to spare, every column stretches in proportion, so the card spans its width.
export function fitColumns(natural: readonly number[], width: number, { reserve = 0, least = [] }: Fit = {}): number[] {
  const room = width - PAD_X * 2 - reserve - COL_GAP * (natural.length - 1)
  const total = natural.reduce((sum, w) => sum + w, 0)

  if (total <= room) {
    return natural.map(w => w + ((room - total) * w) / total)
  }

  // A start held to the fair share keeps the columns inside the card; a word wider than
  // that share is the only one that breaks.
  const fair = room / natural.length
  const starts = natural.map((w, i) => (w <= fair ? w : Math.min(fair, Math.max(MIN_COL, least[i] ?? MIN_COL))))
  const spare = Math.max(0, room - starts.reduce((sum, w) => sum + w, 0))
  const wants = natural.map((w, i) => (w <= fair ? 0 : Math.max(0, w - (starts[i] ?? 0))))
  const wanted = wants.reduce((sum, w) => sum + w, 0)

  return starts.map((w, i) => w + (wanted === 0 ? 0 : (spare * (wants[i] ?? 0)) / wanted))
}

const ANCHORS: Readonly<Record<Align, string>> = { left: 'start', center: 'middle', right: 'end' }

const anchorOf = (align: Align): string => ANCHORS[align]

// How far across its column a cell's text anchors.
const ANCHOR_SHARE: Readonly<Record<Align, number>> = { left: 0, center: 0.5, right: 1 }

const xOf = (left: number, width: number, align: Align): number => left + width * ANCHOR_SHARE[align]

type Cell = { kind: CellKind; text: string; lines: string[] }

function layoutCell(text: string, width: number): Cell {
  const kind = kindOfCell(text)
  const isWrapped = kind === 'text' || kind === 'code'

  return { kind, text, lines: isWrapped ? wrapCell(text, width, { isMono: kind === 'code' }) : [text] }
}

type Slot = { left: number; width: number; align: Align; rowH: number; palette: Palette }

function cellMarkup(cell: Cell, { left, width, align, rowH, palette }: Slot): string {
  const isMono = isMonoKind(cell.kind)
  const font = isMono ? `font-family="${MONO}" font-size="${SIZE - 0.5}"` : ''
  const blockH = cell.lines.length * LINE_H
  const firstY = (rowH - blockH) / 2 + LINE_H / 2 + 5
  const middle = rowH / 2

  if (cell.kind === 'colour') {
    const x = align === 'right' ? left + width - measure(cell.text, true) - 22 : left

    return `<circle cx="${x + 6}" cy="${middle}" r="6" fill="${cell.text}" stroke="${palette.muted}"/><text x="${x + 22}" y="${middle + 5}" ${font} fill="${palette.fg}">${escape(cell.text)}</text>`
  }

  if (cell.kind === 'diff') {
    const [, added = '0', removed = '0'] = DIFF.exec(cell.text.trim()) ?? []

    return `<text x="${xOf(left, width, align)}" y="${middle + 5}" text-anchor="${anchorOf(align)}" ${font}><tspan fill="${palette.ok}">+${added}</tspan><tspan fill="${palette.muted}"> </tspan><tspan fill="${palette.err}">−${removed}</tspan></text>`
  }

  return cell.lines
    .map(
      (line, i) =>
        `<text x="${xOf(left, width, align)}" y="${firstY + i * LINE_H}" text-anchor="${anchorOf(align)}" ${font} fill="${palette.fg}" class="${cell.kind === 'number' ? 'num' : ''}">${escape(line)}</text>`,
    )
    .join('')
}

// `labels` are the header's lines per column; `headerH` grows to hold the most of them.
type Grid = { widths: number[]; lefts: number[]; align: (i: number) => Align; labels: string[][]; headerH: number }

const tableStyle = (palette: Palette, cardWidth: number): string =>
  [
    `text{font-size:${SIZE}px}`,
    `.head{font-size:${HEAD_SIZE}px;font-weight:600;letter-spacing:.1em;fill:${palette.muted}}`,
    `.num{font-variant-numeric:tabular-nums}`,
    `.row{opacity:0;animation:rise .5s cubic-bezier(.2,.8,.2,1) forwards}`,
    `.rule{stroke-dasharray:${cardWidth};stroke-dashoffset:${cardWidth};animation:draw .8s cubic-bezier(.6,0,.2,1) .05s forwards}`,
    `@keyframes rise{from{opacity:0;transform:translateY(6px)}to{opacity:1}}`,
    `@keyframes draw{to{stroke-dashoffset:0}}`,
    `@media (prefers-reduced-motion:reduce){.row,.rule{animation:none;opacity:1;stroke-dashoffset:0}}`,
  ].join('')

// A label too long for its column wraps, and the header band grows to hold it.
function headerMarkup({ widths, lefts, align, labels }: Grid): string {
  return labels
    .flatMap((lines, i) =>
      lines.map(
        (line, j) =>
          `<text x="${xOf(lefts[i] ?? 0, widths[i] ?? 0, align(i))}" y="${HEADER_MID + 4 + j * HEAD_LINE_H}" text-anchor="${anchorOf(align(i))}" class="head">${escape(line)}</text>`,
      ),
    )
    .join('')
}

type Body = { rows: string; height: number }

function rowsMarkup(table: Table, grid: Grid, { palette, width: cardWidth }: CardFrame): Body {
  const { widths, lefts, align, headerH } = grid
  const laid = table.rows.map(row => row.map((cell, i) => layoutCell(cell, (widths[i] ?? MIN_COL) - (kindOfCell(cell) === 'colour' ? 22 : 0))))
  const heights = laid.map(cells => Math.max(MIN_ROW_H, Math.max(...cells.map(cell => cell.lines.length)) * LINE_H + ROW_PAD_Y * 2))
  const tops = heights.map((_, r) => headerH + heights.slice(0, r).reduce((sum, h) => sum + h, 0))
  const rows = laid
    .map((cells, r) => {
      const rowH = heights[r] ?? MIN_ROW_H
      const markup = cells.map((cell, i) => cellMarkup(cell, { left: lefts[i] ?? 0, width: widths[i] ?? 0, align: align(i), rowH, palette })).join('')
      const band = r % 2 === 1 ? `fill="${palette.fg}" fill-opacity=".05"` : 'fill="none"'

      // The outer group places the row; the inner one rises relative to that place.
      return `<g transform="translate(0 ${tops[r] ?? 0})"><g class="row" style="animation-delay:${120 + r * STAGGER_MS}ms"><rect class="bg" x="0" y="0" width="${cardWidth}" height="${rowH}" ${band}/>${markup}</g></g>`
    })
    .join('')

  return { rows, height: headerH + heights.reduce((sum, h) => sum + h, 0) + 6 }
}

// `width` is the room the reply gives the card, in pixels; it is clamped to a sane range.
// `hasControl` keeps a gutter at the right for a Copy button laid over the header.
export function tableSvg(table: Table, { palette, width, hasControl = false }: CardFrame): SvgTable {
  const cardWidth = Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width)))
  const reserve = hasControl ? CONTROL_SLOT : 0
  const widths = fitColumns(naturalWidths(table), cardWidth, { reserve, least: leastWidths(table) })
  const lefts = widths.map((_, i) => PAD_X + widths.slice(0, i).reduce((sum, w) => sum + w + COL_GAP, 0))
  const labels = table.header.map((cell, i) => wrapLines(cell.toUpperCase(), widths[i] ?? MIN_COL, { measure: measureHead }))
  const headerH = HEADER_H + (Math.max(1, ...labels.map(lines => lines.length)) - 1) * HEAD_LINE_H
  const grid: Grid = { widths, lefts, align: (i: number): Align => table.align[i] ?? 'left', labels, headerH }
  const { rows, height } = rowsMarkup(table, grid, { palette, width: cardWidth })

  const body = [
    headerMarkup(grid),
    `<line class="rule" x1="${PAD_X}" y1="${headerH - 1}" x2="${cardWidth - PAD_X - reserve}" y2="${headerH - 1}" stroke="${palette.user}" stroke-width="1" stroke-linecap="square"/>`,
    rows,
  ].join('')

  return {
    source: svgCard({ width: cardWidth, height, palette, style: tableStyle(palette, cardWidth), body }),
    width: cardWidth,
    height,
    alt: [table.header.join(' | '), ...table.rows.map(row => row.join(' | '))].join('\n'),
  }
}
