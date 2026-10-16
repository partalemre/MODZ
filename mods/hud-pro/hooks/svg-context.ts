import type { ContextView, Segment } from './breakdown'
import { compact } from './format'
import { shine } from './kit/motion'
import { escape, eyebrow, measure, sparkline, svgDoc } from './svg'
import type { SvgDoc } from './svg'
import { words } from './words'

// The context card on the desktop: eyebrow and the estimate, one segmented bar of the window by
// category in a single accent (Tide, stepped by opacity; the free space is the bare track), a legend
// that wraps, then the last turns' fill as a sparkline beside the "~N turns left" estimate. While a
// turn runs, a light runs along the window's used part.

export type ContextCardSpec = { view: ContextView | null; turns: readonly number[]; forecast: string; meta: string; width: number; isLive?: boolean }

const PAD = 14
const RADIUS = 10
const EYEBROW_Y = 23
const BAR = { y: 36, h: 8 } as const
const LEGEND = { top: 64, row: 18, size: 11.5, swatch: 8, gap: 16, inner: 6 } as const
const SPARK = { w: 120, h: 22, gap: 12 } as const
const NOTE_SIZE = 11.5
const FOOT_H = 40
const EMPTY_H = 22
const BOTTOM_PAD = 12
// Used rows step down in strength by rank; the "Other" fold is the faintest.
const USED_OPACITY = [1, 0.72, 0.5, 0.34] as const
const OTHER_OPACITY = 0.2

// The free space is the bare track; its legend swatch is edged so it reads on the light card too.
function paintOf(segment: Segment, rank: number, isSwatch = false): string {
  if (segment.kind === 'free') return isSwatch ? 'class="f-track s-strong"' : 'class="f-track"'
  if (segment.kind === 'reserve') return 'class="f-strong"'
  const opacity = segment.kind === 'other' ? OTHER_OPACITY : (USED_OPACITY[rank] ?? OTHER_OPACITY)

  return `class="f-read" fill-opacity="${opacity}"`
}

function liveLight(view: ContextView, width: number): string {
  const used = (view.usedTokens / view.total) * width

  return used > 0 ? shine({ id: 'ctx-live', x: PAD, y: BAR.y, width: used, height: BAR.h }) : ''
}

function barSvg(view: ContextView, spec: { width: number; isLive: boolean }): string {
  const { width } = spec
  let x = PAD
  const parts = view.segments.map((segment, rank) => {
    const share = (segment.tokens / view.total) * width
    const drawn = `<rect ${paintOf(segment, rank)} x="${x.toFixed(1)}" y="${BAR.y}" width="${share.toFixed(1)}" height="${BAR.h}"/>`
    x += share

    return drawn
  })
  const clip = `<clipPath id="ctx-bar"><rect x="${PAD}" y="${BAR.y}" width="${width}" height="${BAR.h}" rx="${BAR.h / 2}"/></clipPath>`

  const light = spec.isLive ? liveLight(view, width) : ''

  return `${clip}<g clip-path="url(#ctx-bar)"><rect class="f-track" x="${PAD}" y="${BAR.y}" width="${width}" height="${BAR.h}"/>${parts.join('')}</g>${light}`
}

// One legend entry: swatch, label, tokens; the entries wrap to new rows within the card.
function legendSvg(view: ContextView, width: number): { body: string; rows: number } {
  let x = PAD
  let row = 0
  const body = view.segments.map((segment, rank) => {
    const label = `${segment.label} `
    const value = compact(segment.tokens)
    const itemW = LEGEND.swatch + LEGEND.inner + measure(label, LEGEND.size) + measure(value, LEGEND.size, true)
    if (x > PAD && x + itemW > PAD + width) {
      row += 1
      x = PAD
    }
    const y = LEGEND.top + row * LEGEND.row
    const swatch = `<rect ${paintOf(segment, rank, true)} x="${x + 0.5}" y="${y - LEGEND.swatch + 0.5}" width="${LEGEND.swatch - 1}" height="${LEGEND.swatch - 1}" rx="2"/>`
    const textX = x + LEGEND.swatch + LEGEND.inner
    const text = `<text x="${textX.toFixed(1)}" y="${y}" font-size="${LEGEND.size}"><tspan class="f-mid">${escape(label)}</tspan><tspan class="f-hi num">${value}</tspan></text>`
    x += itemW + LEGEND.gap

    return swatch + text
  })

  return { body: body.join(''), rows: row + 1 }
}

function footSvg(spec: ContextCardSpec, top: number): string {
  const max = Math.max(...spec.turns, 1)
  const spark = sparkline({ x: PAD, y: top, width: SPARK.w, height: SPARK.h, values: spec.turns, max, tone: 'read' })
  const hasSpark = spark !== ''
  const noteX = hasSpark ? PAD + SPARK.w + SPARK.gap : PAD
  const caption = spec.turns.length > 1 ? words().lastTurns(spec.turns.length) : ''
  const note = spec.forecast === '' ? '' : `<text class="f-hi" x="${noteX}" y="${top + 10}" font-size="${NOTE_SIZE}" font-weight="600">${escape(spec.forecast)}</text>`
  const captionY = spec.forecast === '' ? top + 10 : top + SPARK.h + 2

  const captionText = caption === '' ? '' : `<text class="f-lo" x="${noteX}" y="${captionY}" font-size="10.5">${escape(caption)}</text>`

  return spark + note + captionText
}

export function contextSvg(spec: ContextCardSpec): SvgDoc {
  const inner = spec.width - PAD * 2
  const head = [
    eyebrow(words().contextTitle, { x: PAD, y: EYEBROW_Y, cls: 'f-lo' }),
    `<text class="f-lo num" x="${spec.width - PAD}" y="${EYEBROW_Y}" font-size="10.5" text-anchor="end">${escape(spec.meta)}</text>`,
  ].join('')
  const legend = spec.view === null ? null : legendSvg(spec.view, inner)
  const middle =
    spec.view === null || legend === null
      ? `<text class="f-lo" x="${PAD}" y="${BAR.y + BAR.h}" font-size="${NOTE_SIZE}">${escape(words().noBreakdown)}</text>`
      : barSvg(spec.view, { width: inner, isLive: spec.isLive === true }) + legend.body
  const footTop = legend === null ? BAR.y + EMPTY_H : LEGEND.top + (legend.rows - 1) * LEGEND.row + LEGEND.row
  const hasFoot = spec.turns.length > 1 || spec.forecast !== ''
  const height = (hasFoot ? footTop + FOOT_H : footTop) + BOTTOM_PAD - LEGEND.row / 2
  const frame = `<rect class="f-inset s-line" x=".5" y=".5" width="${spec.width - 1}" height="${height - 1}" rx="${RADIUS}"/>`
  const foot = hasFoot ? footSvg(spec, footTop) : ''
  const alt = [words().contextTitle, spec.meta, ...(spec.view?.segments.map(segment => `${segment.label} ${compact(segment.tokens)}`) ?? []), spec.forecast].filter(part => part !== '').join(' · ')

  return svgDoc({ width: spec.width, height, body: frame + head + middle + foot, alt })
}
