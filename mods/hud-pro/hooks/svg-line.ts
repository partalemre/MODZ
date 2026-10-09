import { costText, FIVE_HOUR, percentText } from './format'
import type { GaugeView } from './model'
import { escape, measure, meter, svgDoc } from './svg'
import type { SvgDoc } from './svg'
import { fillOf } from './theme'

// The desktop's HUD: one Svg line of quiet pills, one per limit and one for the session's ≈cost.
// A pill reads label, a thin meter with its pace tick, the value, then the reset. Drawn as an
// image, so the band shows through around it. As the band narrows it drops detail, never overflows.

const HEIGHT = 26
const PILL = { y: 1, h: 24, padX: 11 } as const
const BASELINE = 17.5
const LABEL_SIZE = 12
const VALUE_SIZE = 12.5
const METER = { width: 38, height: 4 } as const
const GAP = { inner: 7, pill: 6 } as const

type Resets = 'all' | 'five' | 'none'
type Layout = { isLong: boolean; hasMeters: boolean; resets: Resets; hasCost: boolean }

const LAYOUTS: readonly Layout[] = [
  { isLong: true, hasMeters: true, resets: 'all', hasCost: true },
  { isLong: true, hasMeters: true, resets: 'five', hasCost: true },
  { isLong: false, hasMeters: true, resets: 'none', hasCost: true },
  { isLong: false, hasMeters: false, resets: 'none', hasCost: true },
  { isLong: false, hasMeters: false, resets: 'none', hasCost: false },
]

export type LineSpec = { gauges: readonly GaugeView[]; costUsd: number | null; maxWidth: number }

type Piece = { width: number; draw: (x: number) => string }
type Pill = { pieces: readonly Piece[]; frame: string }

const text = (spec: { value: string; cls: string; size: number; isMono?: boolean; weight?: number }): Piece => ({
  width: measure(spec.value, spec.size, spec.isMono),
  draw: x =>
    `<text class="${spec.cls}${spec.isMono === true ? ' num' : ''}" x="${x.toFixed(1)}" y="${BASELINE}" font-size="${spec.size}" font-weight="${spec.weight ?? 500}">${escape(spec.value)}</text>`,
})

const meterPiece = (gauge: GaugeView): Piece => ({
  width: METER.width,
  draw: x => meter({ x, y: PILL.y + (PILL.h - METER.height) / 2, width: METER.width, height: METER.height, percent: gauge.percent, tone: gauge.tone, pace: gauge.pace }),
})

const hasReset = (gauge: GaugeView, resets: Resets): boolean =>
  gauge.reset !== '' && (resets === 'all' || (resets === 'five' && gauge.id === FIVE_HOUR))

function gaugePill(gauge: GaugeView, layout: Layout): Pill {
  const label = text({ value: layout.isLong ? gauge.long : gauge.short, cls: 'f-mid', size: LABEL_SIZE })
  const value = text({ value: percentText(gauge.percent), cls: fillOf(gauge.tone), size: VALUE_SIZE, isMono: true, weight: 650 })
  const reset = hasReset(gauge, layout.resets) ? [text({ value: gauge.reset, cls: 'f-lo', size: LABEL_SIZE, isMono: true })] : []
  const frame = gauge.tone === 'neutral' ? 's-line' : `s-${gauge.tone}-l`

  return { pieces: [label, ...(layout.hasMeters ? [meterPiece(gauge)] : []), value, ...reset], frame }
}

function costPill(usd: number): Pill {
  return {
    pieces: [text({ value: costText(usd), cls: 'f-hi', size: VALUE_SIZE, isMono: true, weight: 650 }), text({ value: 'oturum', cls: 'f-lo', size: LABEL_SIZE })],
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
  let x = 0
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
  const fit = placed.find(candidate => candidate.width <= spec.maxWidth) ?? placed[placed.length - 1]
  if (fit === undefined || fit.width === 0) return null

  return svgDoc({ width: fit.width + 1, height: HEIGHT, body: fit.body, alt: altOf(spec) })
}
