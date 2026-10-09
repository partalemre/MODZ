// The card's vector parts on desktop: header (tile + headline), risk banner, and the
// list with size bars on one global scale. After Delete, file rows get a drawn strike.

import { svgStyle } from './theme'
import { escape, fit, fitMiddle, icon, measure, svgOpen, tile } from './svg-kit'
import type { Banner, Row, View } from './view'

const TILE = 38
const HEAD_X = 52
const HEAD_SIZE = 15.5
const CMD_SIZE = 14.5
const META_SIZE = 13
const ROW_H = 28
const GROUP_GAP = 8
const LIST_TOP = 14
const BAR_W = 96
const BAR_W_NARROW = 60
const NARROW = 420
const BAR_H = 6
const COUNT_W = 74
const SIZE_W = 64
const STRIKE_MS = 220
const STRIKE_STAGGER_MS = 60

export function headerSvg(view: View, width: number): { source: string; height: number } {
  const height = view.fullCommand === null ? 46 : 64
  const room = width - HEAD_X
  const glue = ' · '
  const fixed = measure(glue, { size: HEAD_SIZE }) + measure(view.payload, { size: HEAD_SIZE, isBold: true }) + measure(view.tail, { size: HEAD_SIZE })
  const command = fit(view.command, Math.max(60, room - fixed), { size: CMD_SIZE, isMono: true, isBold: true })
  const payloadColor = view.isPayloadEmpty ? 'var(--lo)' : 'var(--danger)'
  const full = view.fullCommand === null ? '' : `<text x="${HEAD_X}" y="58" class="mono" font-size="11.5" style="fill:var(--lo)">${escape(fitMiddle(view.fullCommand, room, { size: 11.5, isMono: true }))}</text>`

  return {
    height,
    source: [
      svgOpen(width, height),
      svgStyle(),
      tile(view.icon, { x: 0, y: 4, size: TILE, role: 'danger' }),
      `<text x="${HEAD_X}" y="21"><tspan class="mono" font-size="${CMD_SIZE}" font-weight="700" style="fill:var(--hi)">${escape(command)}</tspan>`,
      `<tspan font-size="${HEAD_SIZE}" style="fill:var(--lo)">${glue}</tspan>`,
      `<tspan font-size="${HEAD_SIZE}" font-weight="700" style="fill:${payloadColor}">${escape(view.payload)}</tspan>`,
      `<tspan font-size="${HEAD_SIZE}" style="fill:var(--mid)">${escape(view.tail)}</tspan></text>`,
      `<text x="${HEAD_X}" y="40" font-size="${META_SIZE}" style="fill:var(--lo)">${escape(fit(view.context, room, { size: META_SIZE }))}</text>`,
      full,
      '</svg>',
    ].join(''),
  }
}

/** Words laid into at most two lines of `width` px. */
function wrapTwo(text: string, width: number, size: number): string[] {
  const words = text.split(' ')
  const first: string[] = []
  while (words.length > 0 && measure([...first, words[0]].join(' '), { size }) <= width) first.push(words.shift() ?? '')
  if (words.length === 0) return [first.join(' ')]

  return [first.join(' '), fit(words.join(' '), width, { size })].filter(line => line !== '')
}

export function bannerSvg(banner: Banner, width: number): { source: string; height: number } {
  const size = 13.5
  const textX = 40
  const wrapped = wrapTwo(banner.text, width - textX - 14, size)
  const height = wrapped.length === 1 ? 40 : 58
  const tone = banner.tone
  const texts = wrapped.map((line, i) => `<text x="${textX}" y="${25 + i * 18}" font-size="${size}" style="fill:var(--${tone})">${escape(line)}</text>`)

  return {
    height,
    source: [
      svgOpen(width, height),
      svgStyle(),
      `<rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="10" style="fill:var(--${tone}-tint);stroke:var(--${tone}-line)"/>`,
      icon('shield', { x: 14, y: 12, size: 16, color: `var(--${tone})` }),
      ...texts,
      '</svg>',
    ].join(''),
  }
}

type Columns = { barX: number; barW: number; sizeRight: number; countRight: number }

function columnsOf(width: number): Columns {
  const barW = width < NARROW ? BAR_W_NARROW : BAR_W
  const barX = width - barW

  return { barX, barW, sizeRight: barX - 14, countRight: barX - 14 - SIZE_W }
}

function bar(row: Row, top: number, cols: Columns): string {
  if (row.share === null) return ''
  const y = top + (ROW_H - BAR_H) / 2
  const fill = Math.max(row.share > 0 ? BAR_H : 0, Math.round(cols.barW * Math.min(1, row.share)))
  const color = row.kind === 'folder' ? 'var(--mid)' : 'var(--lo)'

  return `<rect x="${cols.barX}" y="${y}" width="${cols.barW}" height="${BAR_H}" rx="3" style="fill:var(--track)"/><rect x="${cols.barX}" y="${y}" width="${fill}" height="${BAR_H}" rx="3" style="fill:${color}"/>`
}

type Placed = { row: Row; top: number; strikeIndex: number | null }

function rowSvg(placed: Placed, cols: Columns): string {
  const { row, top } = placed
  const base = top + 18
  const isFolder = row.kind === 'folder'
  const nameX = row.kind === 'file' ? 48 : row.kind === 'more' ? 2 : 26
  const tagW = row.tag === '' ? 0 : measure(row.tag, { size: 11.5, isMono: true }) + 10
  const right = isFolder ? cols.countRight - COUNT_W : row.size === '' ? cols.barX - 14 : cols.sizeRight - SIZE_W
  const spec = { size: 13, isBold: isFolder }
  const name = fitMiddle(row.name, Math.max(40, right - nameX - tagW - 8), spec)
  const glyph = row.kind === 'more' ? '' : icon(row.icon, { x: isFolder || row.kind === 'item' ? 2 : 26, y: top + 7, size: isFolder ? 16 : 14, color: isFolder ? 'var(--mid)' : 'var(--lo)' })
  const tag = row.tag === '' ? '' : `<text x="${nameX}" y="${base}" class="mono" font-size="11.5" style="fill:var(--lo)">${escape(row.tag)}</text>`
  const nameColor = isFolder ? 'var(--hi)' : row.kind === 'more' ? 'var(--lo)' : 'var(--mid)'
  const dim = placed.strikeIndex === null ? '' : ` class="dim" style="animation-delay:${placed.strikeIndex * STRIKE_STAGGER_MS}ms"`
  const texts = [
    `<text x="${nameX + tagW}" y="${base}" font-size="13" font-weight="${isFolder ? 600 : 400}" style="fill:${nameColor}">${escape(name)}</text>`,
    row.count === '' ? '' : `<text x="${cols.countRight}" y="${base}" text-anchor="end" font-size="12.5" style="fill:var(--lo)">${escape(row.count)}</text>`,
    row.size === '' ? '' : `<text x="${cols.sizeRight}" y="${base}" text-anchor="end" class="num" font-size="12.5" font-weight="${isFolder ? 600 : 400}" style="fill:${isFolder ? 'var(--hi)' : 'var(--lo)'}">${escape(row.size)}</text>`,
  ]

  return `${glyph}<g${dim}>${tag}${texts.join('')}</g>${bar(row, top, cols)}${strike(placed, nameX + tagW, measure(name, spec))}`
}

function strike(placed: Placed, x: number, textWidth: number): string {
  if (placed.strikeIndex === null) return ''
  const y = placed.top + 13.5
  const delay = placed.strikeIndex * STRIKE_STAGGER_MS

  return `<path d="M${x - 4} ${y}H${x + textWidth + 4}" pathLength="1" class="st" style="stroke:var(--danger);animation-delay:${delay}ms"/>`
}

// The struck state is the resting style, so reduced motion (no animation) still shows it; the animation plays into it.
const STRIKE_CSS = `.st{fill:none;stroke-width:1.5;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:0;animation:draw ${STRIKE_MS}ms cubic-bezier(.2,.8,.2,1) backwards}.dim{opacity:.45;animation:dim ${STRIKE_MS}ms ease-out backwards}@keyframes draw{from{stroke-dashoffset:1}}@keyframes dim{from{opacity:1}}`

/** The list as one drawing; `isStruck` strikes every file, item and the overflow line. */
export function listSvg(rows: Row[], width: number, isStruck: boolean): { source: string; height: number } {
  const cols = columnsOf(width)
  const placed: Placed[] = []
  let y = LIST_TOP
  let struck = 0
  rows.forEach((row, index) => {
    if (row.kind === 'folder' && index > 0) y += GROUP_GAP
    const isStrikable = isStruck && row.kind !== 'folder'
    placed.push({ row, top: y, strikeIndex: isStrikable ? struck++ : null })
    y += ROW_H
  })
  const height = y + 4

  return {
    height,
    source: [
      svgOpen(width, height),
      svgStyle(isStruck ? STRIKE_CSS : ''),
      `<path d="M0 .5H${width}" style="stroke:var(--line)"/>`,
      ...placed.map(item => rowSvg(item, cols)),
      '</svg>',
    ].join(''),
  }
}
