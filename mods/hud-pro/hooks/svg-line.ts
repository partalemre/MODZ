import { costText, FIVE_HOUR, percentText } from './format'
import type { GaugeView } from './model'
import { escape, measure, meter, svgDoc } from './svg'
import type { SvgDoc } from './svg'
import { fillOf } from './theme'

// The desktop's HUD: one Svg line of quiet pills, one per limit and one for the session's ≈cost.
// A pill reads label, a thin meter with its pace tick, the value, then the reset. Drawn as an
// image, so the band shows through around it. As the band narrows it drops detail, never overflows:
// the resets go first, then the meters shorten, then the labels, the meters and the cost.

const HEIGHT = 26
// Every pill is the same height and padding; the meter the same thickness in each.
const PILL = { y: 1, h: 24, padX: 12 } as const
// The first pill's edge sits under the band's own leading dot (savvy-progress draws it from x 1).
const LEAD_X = 1
const BASELINE = 17.5
const LABEL_SIZE = 12
const VALUE_SIZE = 12.5
const METER = { long: 38, short: 20, height: 4 } as const
const GAP = { inner: 7, pill: 6 } as const
// The hairline the last frame's stroke needs past its edge.
const EDGE = 1
// measure() reads the system font a little narrow, its bold more so (checked against Chrome).
const SCALE = { regular: 1.05, bold: 1.15 } as const
const BOLD_WEIGHT = 600
// Values sit right-aligned in a slot at least this wide, so "%5" and "%44" take the same room.
const VALUE_SLOT = '%00'

type Resets = 'all' | 'five' | 'none'
type Layout = { isLong: boolean; meter: number; resets: Resets; hasCost: boolean }

const LAYOUTS: readonly Layout[] = [
  { isLong: true, meter: METER.long, resets: 'all', hasCost: true },
  { isLong: true, meter: METER.long, resets: 'five', hasCost: true },
  { isLong: true, meter: METER.long, resets: 'none', hasCost: true },
  { isLong: true, meter: METER.short, resets: 'none', hasCost: true },
  { isLong: false, meter: METER.short, resets: 'none', hasCost: true },
  { isLong: false, meter: 0, resets: 'none', hasCost: true },
  { isLong: false, meter: 0, resets: 'none', hasCost: false },
]

export type LineSpec = { gauges: readonly GaugeView[]; costUsd: number | null; maxWidth: number }

type Piece = { width: number; draw: (x: number) => string }
type Pill = { pieces: readonly Piece[]; frame: string }
type TextSpec = { value: string; cls: string; size: number; weight?: number; slot?: string }

// Numbers are tabular in the system font, as the band above draws its percent.
const widthOf = (value: string, spec: TextSpec): number =>
  measure(value, spec.size) * ((spec.weight ?? 0) >= BOLD_WEIGHT ? SCALE.bold : SCALE.regular)

const text = (spec: TextSpec): Piece => {
  const width = Math.max(widthOf(spec.value, spec), spec.slot === undefined ? 0 : widthOf(spec.slot, spec))
  const isSlotted = spec.slot !== undefined

  return {
    width,
    draw: x =>
      `<text class="${spec.cls}" x="${(isSlotted ? x + width : x).toFixed(1)}" y="${BASELINE}" font-size="${spec.size}" font-weight="${spec.weight ?? 500}"${isSlotted ? ' text-anchor="end"' : ''}>${escape(spec.value)}</text>`,
  }
}

const meterPiece = (gauge: GaugeView, width: number): Piece => ({
  width,
  draw: x => meter({ x, y: PILL.y + (PILL.h - METER.height) / 2, width, height: METER.height, percent: gauge.percent, tone: gauge.tone, pace: gauge.pace }),
})

const hasReset = (gauge: GaugeView, resets: Resets): boolean =>
  gauge.reset !== '' && (resets === 'all' || (resets === 'five' && gauge.id === FIVE_HOUR))

function gaugePill(gauge: GaugeView, layout: Layout): Pill {
  const label = text({ value: layout.isLong ? gauge.long : gauge.short, cls: 'f-mid', size: LABEL_SIZE })
  const value = text({ value: percentText(gauge.percent), cls: `${fillOf(gauge.tone)} tab`, size: VALUE_SIZE, weight: 650, slot: VALUE_SLOT })
  const reset = hasReset(gauge, layout.resets) ? [text({ value: gauge.reset, cls: 'f-lo tab', size: LABEL_SIZE })] : []
  const frame = gauge.tone === 'neutral' ? 's-line' : `s-${gauge.tone}-l`

  return { pieces: [label, ...(layout.meter > 0 ? [meterPiece(gauge, layout.meter)] : []), value, ...reset], frame }
}

function costPill(usd: number): Pill {
  return {
    pieces: [text({ value: costText(usd), cls: 'f-hi tab', size: VALUE_SIZE, weight: 650 }), text({ value: 'oturum', cls: 'f-lo', size: LABEL_SIZE })],
    frame: 's-line',
  }
}

const pillWidth = (pill: Pill): number =>
  pill.pieces.reduce((sum, piece) => sum + piece.width, 0) + GAP.inner * (pill.pieces.length - 1) + PILL.padX * 2

function drawPill(pill: Pill, x: number): string {
  const width = pillWidth(pill)
  let at = x + PILL.padX
  const body = pill.pieces.map(piece => {
    const drawn = piece.draw(at)
    at += piece.width + GAP.inner

    return drawn
  })
  const frame = `<rect class="f-card ${pill.frame}" x="${(x + 0.5).toFixed(1)}" y="${PILL.y + 0.5}" width="${(width - 1).toFixed(1)}" height="${PILL.h - 1}" rx="${(PILL.h - 1) / 2}"/>`

  return `${frame}${body.join('')}`
}

function place(pills: readonly Pill[]): { width: number; body: string } {
  let x = LEAD_X
  const body = pills.map(pill => {
    const drawn = drawPill(pill, x)
    x += pillWidth(pill) + GAP.pill

    return drawn
  })

  return { width: Math.max(0, x - GAP.pill), body: body.join('') }
}

function pillsFor(spec: LineSpec, layout: Layout): Pill[] {
  const gauges = spec.gauges.map(gauge => gaugePill(gauge, layout))

  return layout.hasCost && spec.costUsd !== null ? [...gauges, costPill(spec.costUsd)] : gauges
}

function altOf(spec: LineSpec): string {
  const gauges = spec.gauges.map(gauge => [`${gauge.long} ${percentText(gauge.percent)}`, ...(gauge.reset === '' ? [] : [`${gauge.reset} sonra sıfırlanır`])].join(', '))

  return [...gauges, ...(spec.costUsd === null ? [] : [`oturum ${costText(spec.costUsd)}`])].join(' · ')
}

export function lineSvg(spec: LineSpec): SvgDoc | null {
  if (spec.gauges.length === 0 && spec.costUsd === null) return null
  const placed = LAYOUTS.map(layout => place(pillsFor(spec, layout)))
  const fit = placed.find(candidate => candidate.width + EDGE <= spec.maxWidth) ?? placed[placed.length - 1]
  if (fit === undefined || fit.width <= LEAD_X) return null

  return svgDoc({ width: fit.width + EDGE, height: HEIGHT, body: fit.body, alt: altOf(spec) })
}
