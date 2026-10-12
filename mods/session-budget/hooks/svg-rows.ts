import { escape, eyebrow, eyebrowWidth, measure, svgDoc } from './svg'
import type { SvgDoc } from './svg'
import type { Role } from './theme'
import { words } from './words'

// The desktop drawings, in the MODZ notice family: a band row (24 px tile, the outcome in text.hi,
// its facts in text.mid, the meter last) and the full-budget card (38 px tile, eyebrow, headline, body).

const ROW = { h: 28, tile: 24, glyph: 13, radius: 6, textX: 34, baseline: 18.5 } as const
const TITLE = { size: 13, weight: 650 } as const
const DETAIL = 12.5
const BOLD_SLACK = 1.06
const SEP = ' · '
const METER = { width: 72, height: 6, gap: 12, scale: 1.25 } as const
const ICON_GRID = 24
const ICON_STROKE = 1.75

const GLYPHS = {
  gauge: '<path d="M4.6 16.8a8 8 0 1 1 14.8 0"/><path d="M12 14.2l3.6-4.2"/><circle cx="12" cy="14.6" r="1.1"/>',
  x: '<path d="M7 7l10 10M17 7L7 17"/>',
} as const

type Glyph = keyof typeof GLYPHS
type Tile = { x: number; y: number; size: number; glyph: number; radius: number; role: Role; icon: Glyph }

function tile(t: Tile): string {
  const scale = t.glyph / ICON_GRID
  const inset = (t.size - t.glyph) / 2

  return `<rect class="f-${t.role}-t" x="${t.x}" y="${t.y}" width="${t.size}" height="${t.size}" rx="${t.radius}"/>`
    + `<g class="s-${t.role}" transform="translate(${t.x + inset} ${t.y + inset}) scale(${scale})" fill="none" stroke-width="${ICON_STROKE / scale}" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[t.icon]}</g>`
}

// `isKept`: the fact that tells the person what to do; a narrow row drops the others first.
type Part = { text: string; isMono?: boolean; isKept?: boolean }

const partWidth = (part: Part): number => measure(part.text, DETAIL, part.isMono)
const detailWidth = (parts: readonly Part[]): number => parts.reduce((sum, part) => sum + measure(SEP, DETAIL) + partWidth(part), 0)

function detailRuns(parts: readonly Part[]): string {
  return parts.map(part => `<tspan class="f-lo">${SEP}</tspan><tspan class="f-mid${part.isMono === true ? ' num' : ''}">${escape(part.text)}</tspan>`).join('')
}

type RowSpec = { role: Role; icon: Glyph; title: string; parts: readonly Part[]; room: number; meter?: number; alt: string }

// Facts drop from the end until the row fits its room whole: a fact is shown entire or not at all.
function rowDoc(row: RowSpec): SvgDoc {
  const titleW = measure(row.title, TITLE.size) * BOLD_SLACK
  const meterW = row.meter === undefined ? 0 : METER.gap + METER.width
  const parts = [...row.parts]
  while (parts.length > 0 && ROW.textX + titleW + detailWidth(parts) + meterW > row.room) {
    const loose = parts.map(part => part.isKept === true).lastIndexOf(false)
    parts.splice(loose >= 0 ? loose : parts.length - 1, 1)
  }
  const textEnd = ROW.textX + titleW + detailWidth(parts)
  const body = [
    tile({ x: 0, y: (ROW.h - ROW.tile) / 2, size: ROW.tile, glyph: ROW.glyph, radius: ROW.radius, role: row.role, icon: row.icon }),
    `<text x="${ROW.textX}" y="${ROW.baseline}" font-size="${DETAIL}"><tspan class="f-hi" font-size="${TITLE.size}" font-weight="${TITLE.weight}">${escape(row.title)}</tspan>${detailRuns(parts)}</text>`,
    row.meter === undefined ? '' : tidemarkMeter(textEnd + METER.gap, row.meter),
  ]

  return svgDoc({ width: textEnd + meterW + 2, height: ROW.h, body: body.join(''), alt: row.alt })
}

// Spent against the budget: the track runs past it, the budget stands as the tidemark, and the
// stretch beyond it is tinted so the overflow reads before it happens.
function tidemarkMeter(x: number, ratio: number): string {
  const y = (ROW.h - METER.height) / 2
  const mark = METER.width / METER.scale
  const fill = Math.min(METER.width, Math.max(METER.height, ratio * mark))
  const r = METER.height / 2

  return [
    `<rect class="f-track" x="${x}" y="${y}" width="${METER.width}" height="${METER.height}" rx="${r}"/>`,
    `<rect class="f-warn-t" x="${x + mark}" y="${y}" width="${METER.width - mark}" height="${METER.height}" rx="${r}"/>`,
    `<rect class="f-warn" x="${x}" y="${y}" width="${fill.toFixed(1)}" height="${METER.height}" rx="${r}"/>`,
    `<rect class="f-hi" x="${x + mark - 0.75}" y="${y - 4}" width="1.5" height="${METER.height + 8}" rx=".75"/>`,
  ].join('')
}

export type WarnRow = { percent: string; spend: string; eta: string; ratio: number; room: number }

export function warnRowSvg(row: WarnRow): SvgDoc {
  const parts: Part[] = [{ text: row.spend, isMono: true }, ...(row.eta === '' ? [] : [{ text: row.eta }])]
  const alt = [words().budget, row.percent, row.spend, row.eta].filter(part => part !== '').join(' · ')

  return rowDoc({ role: 'warn', icon: 'gauge', title: words().rowTitle(row.percent), parts, room: row.room, meter: row.ratio, alt })
}

export function stoppedRowSvg(spend: string, room: number): SvgDoc {
  const hint = words().raiseHint
  const parts: Part[] = [...(spend === '' ? [] : [{ text: spend, isMono: true }]), { text: hint, isKept: true }]
  const title = words().stoppedTitle

  return rowDoc({ role: 'danger', icon: 'x', title, parts, room, alt: `${title} · ${spend} · ${hint}` })
}

export type FullCard = { spend: string; percent: string; step: string; width: number }

// The card's frame matches a Box card (round, 16 px across, 8 px down) so it sits with the others.
const CARD = { padX: 17, padTop: 9, padBottom: 10, radius: 10, tile: 38, glyph: 18, tileRadius: 10, textX: 52 } as const
const CARD_Y = { eyebrow: 16, headline: 38, body: 59, step: 18 } as const
const HEADLINE = 17
const BODY = 13
const META = 11.5
const META_GAP = 24

function wrapWords(text: string, width: number): string[] {
  const lines: string[] = []
  for (const word of text.split(' ')) {
    const last = lines[lines.length - 1]
    if (last !== undefined && measure(`${last} ${word}`, BODY) <= width) lines[lines.length - 1] = `${last} ${word}`
    else lines.push(word)
  }

  return lines
}

export function fullCardSvg(card: FullCard): SvgDoc {
  const inner = card.width - 2 * CARD.padX
  const room = inner - CARD.textX
  const says = words()
  const meta = [`${card.spend} · ${card.percent}`, card.spend].find(text => eyebrowWidth(says.eyebrow) + measure(text, META, true) + META_GAP <= room) ?? ''
  const lines = wrapWords(says.heldWrapped(card.step), room)
  const height = CARD.padTop + CARD_Y.body + (lines.length - 1) * CARD_Y.step + CARD.padBottom
  const x = (at: number): number => CARD.padX + at
  const y = (at: number): number => CARD.padTop + at
  const body = [
    `<rect class="f-card s-warn-l" x=".5" y=".5" width="${card.width - 1}" height="${height - 1}" rx="${CARD.radius}"/>`,
    tile({ x: x(0), y: y(4), size: CARD.tile, glyph: CARD.glyph, radius: CARD.tileRadius, role: 'warn', icon: 'gauge' }),
    eyebrow(says.eyebrow, { x: x(CARD.textX), y: y(CARD_Y.eyebrow), cls: 'f-warn' }),
    meta === '' ? '' : `<text class="f-lo num" x="${x(inner)}" y="${y(CARD_Y.eyebrow)}" font-size="${META}" text-anchor="end">${escape(meta)}</text>`,
    `<text class="f-hi" x="${x(CARD.textX)}" y="${y(CARD_Y.headline)}" font-size="${HEADLINE}" font-weight="620">${escape(says.full)}</text>`,
    ...lines.map((line, i) => `<text class="f-mid" x="${x(CARD.textX)}" y="${y(CARD_Y.body + i * CARD_Y.step)}" font-size="${BODY}">${escape(line)}</text>`),
  ].join('')

  return svgDoc({ width: card.width, height, body, alt: says.fullAlt(card.spend, card.percent, card.step) })
}
