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

const LINE_STEP = 19
const FIRST_BASELINE = 21
const FULL_STEP = 18
const HEAD_BOTTOM = 6
const HEAD_MIN = 46
const GLUE = ' · '

type Line = { y: number; markup: string }

const commandRun = (command: string): string =>
  `<tspan class="mono" font-size="${CMD_SIZE}" font-weight="700" style="fill:var(--hi)">${escape(command)}</tspan>`

function payloadRun(view: View, room: number): string {
  const color = view.isPayloadEmpty ? 'var(--lo)' : 'var(--danger)'
  const tail = fit(view.tail, Math.max(0, room - measure(view.payload, { size: HEAD_SIZE, isBold: true })), { size: HEAD_SIZE })

  return `<tspan font-size="${HEAD_SIZE}" font-weight="700" style="fill:${color}">${escape(view.payload)}</tspan><tspan font-size="${HEAD_SIZE}" style="fill:var(--mid)">${escape(tail)}</tspan>`
}

// The headline on one line when it fits; in a narrow pane the command takes a line of its own
// and what it does goes under it, so neither is cut.
function headlineLines(view: View, room: number): Line[] {
  const spec = { size: CMD_SIZE, isMono: true, isBold: true }
  const said = measure(view.payload, { size: HEAD_SIZE, isBold: true }) + measure(view.tail, { size: HEAD_SIZE })
  const glue = `<tspan font-size="${HEAD_SIZE}" style="fill:var(--lo)">${GLUE}</tspan>`
  if (measure(view.command, spec) + measure(GLUE, { size: HEAD_SIZE }) + said <= room) {
    return [{ y: FIRST_BASELINE, markup: commandRun(view.command) + glue + payloadRun(view, room) }]
  }

  return [
    { y: FIRST_BASELINE, markup: commandRun(fitMiddle(view.command, room, spec)) },
    { y: FIRST_BASELINE + LINE_STEP, markup: payloadRun(view, room) },
  ]
}

export function headerSvg(view: View, width: number): { source: string; height: number } {
  const room = width - HEAD_X
  const lines = headlineLines(view, room)
  const contextY = (lines[lines.length - 1]?.y ?? FIRST_BASELINE) + LINE_STEP
  const fullY = contextY + FULL_STEP
  const full = view.fullCommand === null ? '' : `<text x="${HEAD_X}" y="${fullY}" class="mono" font-size="11.5" style="fill:var(--lo)">${escape(fitMiddle(view.fullCommand, room, { size: 11.5, isMono: true }))}</text>`
  const height = Math.max(HEAD_MIN, (view.fullCommand === null ? contextY : fullY) + HEAD_BOTTOM)

  return {
    height,
    source: [
      svgOpen(width, height),
      svgStyle(),
      tile(view.icon, { x: 0, y: 4, size: TILE, role: 'danger' }),
      ...lines.map(line => `<text x="${HEAD_X}" y="${line.y}">${line.markup}</text>`),
      `<text x="${HEAD_X}" y="${contextY}" font-size="${META_SIZE}" style="fill:var(--lo)">${escape(fit(view.context, room, { size: META_SIZE }))}</text>`,
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

type Columns = { barX: number; barW: number; sizeRight: number; countRight: number; hasCount: boolean }

const FOLDER_X = 26
const NAME_GAP = 8
const NAME_SIZE = 13

// A narrow pane gives up the folder's file count before it would cut a folder's name.
function columnsOf(width: number, rows: Row[]): Columns {
  const barW = width < NARROW ? BAR_W_NARROW : BAR_W
  const barX = width - barW
  const countRight = barX - 14 - SIZE_W
  const nameRoom = countRight - COUNT_W - FOLDER_X - NAME_GAP
  const hasCount = rows.every(row => row.kind !== 'folder' || measure(row.name, { size: NAME_SIZE, isBold: true }) <= nameRoom)

  return { barX, barW, sizeRight: barX - 14, countRight, hasCount }
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
  const nameX = row.kind === 'file' ? 48 : row.kind === 'more' ? 2 : FOLDER_X
  const tagW = row.tag === '' ? 0 : measure(row.tag, { size: 11.5, isMono: true }) + 10
  const right = isFolder && cols.hasCount ? cols.countRight - COUNT_W : row.size === '' ? cols.barX - 14 : cols.sizeRight - SIZE_W
  const spec = { size: NAME_SIZE, isBold: isFolder }
  const name = fitMiddle(row.name, Math.max(40, right - nameX - tagW - NAME_GAP), spec)
  const glyph = row.kind === 'more' ? '' : icon(row.icon, { x: isFolder || row.kind === 'item' ? 2 : 26, y: top + 7, size: isFolder ? 16 : 14, color: isFolder ? 'var(--mid)' : 'var(--lo)' })
  const tag = row.tag === '' ? '' : `<text x="${nameX}" y="${base}" class="mono" font-size="11.5" style="fill:var(--lo)">${escape(row.tag)}</text>`
  const nameColor = isFolder ? 'var(--hi)' : row.kind === 'more' ? 'var(--lo)' : 'var(--mid)'
  const dim = placed.strikeIndex === null ? '' : ` class="dim" style="animation-delay:${placed.strikeIndex * STRIKE_STAGGER_MS}ms"`
  const texts = [
    `<text x="${nameX + tagW}" y="${base}" font-size="13" font-weight="${isFolder ? 600 : 400}" style="fill:${nameColor}">${escape(name)}</text>`,
    row.count === '' || !cols.hasCount ? '' : `<text x="${cols.countRight}" y="${base}" text-anchor="end" font-size="12.5" style="fill:var(--lo)">${escape(row.count)}</text>`,
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
  const cols = columnsOf(width, rows)
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
