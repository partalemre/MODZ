import { cachePercent, compact, labelOf, percentText, untilReset } from './format'
import { HOT_PERCENT, gradientAt, mix, severityColor, toHex } from './palette'
import type { Rgb } from './palette'
import type { HudTurn } from '../types'

export type SvgGauge = { id: string; percent: number; previous: number | null; resetsAt: string | null }

export type SvgTheme = 'light' | 'dark' | 'auto'

export type SvgInput = {
  width: number
  theme: SvgTheme
  gauges: SvgGauge[]
  costUsd: number | null
  turn: HudTurn | null
  isLive: boolean
  isTurnLive: boolean
  nowMs: number
}

type Layout = {
  gaugeXs: number[]
  gaugeWidth: number
  costX: number | null
  turnX: number | null
}

export const SVG_HEIGHT = 46

const PAD_X = 6
const GAP = 24
const DOT_WIDTH = 20
const COST_WIDTH = 60
const TURN_WIDTH = 216
const GAUGE_MIN = 96
const GAUGE_MAX = 236
const COST_MIN_WIDTH = 520
const TURN_MIN_WIDTH = 900
const LABEL_Y = 13
const BAR_Y = 24
const BAR_HEIGHT = 6
const BAR_RADIUS = 3
const MIN_FILL = 5
const PERCENT = 100
const SPARK_BARS = 12
const SPARK_STEP = 6
const SPARK_WIDTH = 4
const SPARK_HEIGHT = 11
const SHINE_WIDTH = 56
const SHINE_SECONDS = 1.7
const SHINE_STAGGER = 0.28
const SWAY_SECONDS = 0.85
const MOVE_EPSILON = 0.05
const LIGHT_TEXT_DARKEN = 0.38
const BLACK: Rgb = [0, 0, 0]
const SKY = '#38bdf8'

function num(value: number): string {
  return value.toFixed(1)
}

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function computeLayout(input: SvgInput): Layout {
  const hasCost = input.costUsd !== null && input.width >= COST_MIN_WIDTH
  const hasTurn = input.turn !== null && input.turn.requests > 0 && input.width >= TURN_MIN_WIDTH
  const turnSpan = hasTurn ? TURN_WIDTH + GAP : 0
  const costSpan = hasCost ? COST_WIDTH + GAP : 0
  const region = input.width - PAD_X * 2 - DOT_WIDTH - turnSpan - costSpan
  const count = Math.max(1, input.gauges.length)
  const fitted = (region - GAP * (count - 1)) / count
  const gaugeWidth = Math.min(GAUGE_MAX, Math.max(GAUGE_MIN, fitted))
  const gaugeXs = input.gauges.map((_, index) => PAD_X + DOT_WIDTH + index * (gaugeWidth + GAP))
  const gaugesEnd = PAD_X + DOT_WIDTH + count * gaugeWidth + (count - 1) * GAP

  return {
    gaugeXs,
    gaugeWidth,
    costX: hasCost ? gaugesEnd + GAP : null,
    turnX: hasTurn ? gaugesEnd + GAP + costSpan : null,
  }
}

function styleBlock(): string {
  return `<style>
svg{--muted:#64748b;--strong:#0f172a;--track:rgba(100,116,139,.22);--line:rgba(100,116,139,.38)}
svg.t-dark{--muted:#94a3b8;--strong:#e2e8f0;--track:rgba(148,163,184,.24);--line:rgba(148,163,184,.34)}
@media (prefers-color-scheme: dark){svg.t-auto{--muted:#94a3b8;--strong:#e2e8f0;--track:rgba(148,163,184,.24);--line:rgba(148,163,184,.34)}}
text{font-family:ui-sans-serif,system-ui,-apple-system,"SF Pro Text","Segoe UI",sans-serif;font-variant-numeric:tabular-nums}
.lbl{font-size:10.5px;font-weight:650;letter-spacing:.09em;fill:var(--muted)}
.rst{font-size:10.5px;font-weight:500;letter-spacing:.02em;fill:var(--muted);opacity:.9}
.val{font-size:13px;font-weight:700;fill:var(--vl)}
svg.t-dark .val{fill:var(--vd)}
@media (prefers-color-scheme: dark){svg.t-auto .val{fill:var(--vd)}}
.sub{font-size:11.5px;fill:var(--muted)}
.strong{fill:var(--strong)}
.track{fill:var(--track)}
.pill{fill:none;stroke:var(--line);stroke-width:1}
</style>`
}

function stopsBlock(): string {
  const at = (offset: number) => `<stop offset="${offset}" stop-color="${toHex(gradientAt(offset))}"/>`

  return [0, 0.3, 0.55, 0.8, 1].map(at).join('')
}

function defsBlock(input: SvgInput, layout: Layout): string {
  const gradients = input.gauges
    .map((_, index) => {
      const x = layout.gaugeXs[index]

      return `<linearGradient id="g${index}" gradientUnits="userSpaceOnUse" x1="${num(x)}" x2="${num(x + layout.gaugeWidth)}" y1="0" y2="0">${stopsBlock()}</linearGradient>`
    })
    .join('')
  const shine =
    '<linearGradient id="shine"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
  const blur = '<filter id="blur" x="-20%" y="-300%" width="140%" height="700%"><feGaussianBlur stdDeviation="3"/></filter>'

  return `<defs>${gradients}${shine}${blur}</defs>`
}

function fillWidth(percent: number, width: number): number {
  if (percent <= 0) return 0

  return Math.min(width, Math.max(MIN_FILL, (percent / PERCENT) * width))
}

function swayOf(gauge: SvgGauge, width: number): string {
  if (gauge.previous === null || Math.abs(gauge.previous - gauge.percent) < MOVE_EPSILON) return ''
  const from = fillWidth(gauge.previous, width)
  const to = fillWidth(gauge.percent, width)

  return `<animate attributeName="width" from="${num(from)}" to="${num(to)}" dur="${SWAY_SECONDS}s" calcMode="spline" keyTimes="0;1" keySplines="0.22 1 0.36 1" fill="freeze"/>`
}

function fillBlock(spec: { gauge: SvgGauge; index: number; x: number; width: number }): string {
  const { gauge, index, x, width } = spec
  const fill = fillWidth(gauge.percent, width)
  const sway = swayOf(gauge, width)
  const bar = (attrs: string, extra: string) =>
    `<rect x="${num(x)}" y="${BAR_Y}" width="${num(fill)}" height="${BAR_HEIGHT}" rx="${BAR_RADIUS}" ${attrs}>${sway}${extra}</rect>`
  const glow =
    gauge.percent >= HOT_PERCENT
      ? bar('fill="url(#g' + index + ')" filter="url(#blur)" opacity=".5"', '<animate attributeName="opacity" values=".25;.75;.25" dur="2s" repeatCount="indefinite"/>')
      : ''

  return glow + bar(`fill="url(#g${index})"`, '')
}

function shineBlock(spec: { index: number; x: number; fill: number }): string {
  const { index, x, fill } = spec
  const clip = `<clipPath id="c${index}"><rect x="${num(x)}" y="${BAR_Y}" width="${num(fill)}" height="${BAR_HEIGHT}" rx="${BAR_RADIUS}"/></clipPath>`
  const sweep = `<rect x="${num(x - SHINE_WIDTH)}" y="${BAR_Y}" width="${SHINE_WIDTH}" height="${BAR_HEIGHT}" fill="url(#shine)" clip-path="url(#c${index})"><animate attributeName="x" from="${num(x - SHINE_WIDTH)}" to="${num(x + fill)}" dur="${SHINE_SECONDS}s" begin="${(index * SHINE_STAGGER).toFixed(2)}s" repeatCount="indefinite"/></rect>`

  return clip + sweep
}

function valueStyle(percent: number): string {
  const color = severityColor(percent)

  return `--vd:${toHex(color)};--vl:${toHex(mix(color, BLACK, LIGHT_TEXT_DARKEN))}`
}

function gaugeBlock(input: SvgInput, layout: Layout, index: number): string {
  const gauge = input.gauges[index]
  const x = layout.gaugeXs[index]
  const width = layout.gaugeWidth
  const reset = untilReset(gauge.resetsAt, input.nowMs)
  const resetText = reset === '' ? '' : `<tspan class="rst" dx="8">↻ ${esc(reset)}</tspan>`
  const fill = fillWidth(gauge.percent, width)
  const shine = input.isLive && fill > 0 ? shineBlock({ index, x, fill }) : ''

  return `<g>
<text class="lbl" x="${num(x)}" y="${LABEL_Y}">${esc(labelOf(gauge.id).toUpperCase())}${resetText}</text>
<text class="val" style="${valueStyle(gauge.percent)}" x="${num(x + width)}" y="${LABEL_Y}" text-anchor="end">${esc(percentText(gauge.percent))}</text>
<rect class="track" x="${num(x)}" y="${BAR_Y}" width="${num(width)}" height="${BAR_HEIGHT}" rx="${BAR_RADIUS}"/>
${fillBlock({ gauge, index, x, width })}${shine}
</g>`
}

function dotBlock(input: SvgInput): string {
  const cx = PAD_X + 5
  const cy = BAR_Y - 3
  if (!input.isLive) return `<circle class="track" cx="${cx}" cy="${cy}" r="3.5"/>`
  const green = toHex(gradientAt(0))
  const ring = `<circle cx="${cx}" cy="${cy}" r="3.5" fill="none" stroke="${green}" stroke-width="1.5"><animate attributeName="r" values="3.5;10" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values=".7;0" dur="1.6s" repeatCount="indefinite"/></circle>`
  const core = `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${green}"><animate attributeName="opacity" values="1;.45;1" dur="1.6s" repeatCount="indefinite"/></circle>`

  return ring + core
}

function costBlock(input: SvgInput, x: number): string {
  const text = `$${(input.costUsd ?? 0).toFixed(2)}`

  return `<g><rect class="pill" x="${num(x)}" y="12" width="${COST_WIDTH}" height="22" rx="11"/><text class="strong" x="${num(x + COST_WIDTH / 2)}" y="27" text-anchor="middle" style="font-size:12.5px;font-weight:650">${esc(text)}</text></g>`
}

function sparkBlock(outputs: number[], x: number): string {
  const recent = outputs.slice(-SPARK_BARS)
  const peak = Math.max(1, ...recent)
  const left = x + TURN_WIDTH - SPARK_BARS * SPARK_STEP

  return recent
    .map((value, index) => {
      const height = Math.max(2, (value / peak) * SPARK_HEIGHT)
      const age = (index + 1) / recent.length
      const bx = left + (SPARK_BARS - recent.length + index) * SPARK_STEP

      return `<rect x="${num(bx)}" y="${num(LABEL_Y + 1 - height)}" width="${SPARK_WIDTH}" height="${num(height)}" rx="1.5" fill="${SKY}" opacity="${(0.25 + age * 0.75).toFixed(2)}"/>`
    })
    .join('')
}

function turnBlock(input: SvgInput, x: number): string {
  const turn = input.turn as HudTurn
  const title = input.isTurnLive ? 'THIS TURN' : 'LAST TURN'
  const line = `${compact(turn.input)} in · ${compact(turn.output)} out · ${cachePercent(turn)}% cached`

  return `<g><text class="lbl" x="${num(x)}" y="${LABEL_Y}">${title}</text>${sparkBlock(turn.outputs, x)}<text class="sub" x="${num(x)}" y="${BAR_Y + 7}">${esc(line)}</text></g>`
}

function altOf(input: SvgInput): string {
  const gauges = input.gauges.map(gauge => `${labelOf(gauge.id)} ${percentText(gauge.percent)} used`)
  const cost = input.costUsd === null ? [] : [`session cost $${input.costUsd.toFixed(2)}`]

  return [...gauges, ...cost].join(', ')
}

export function hudSvg(input: SvgInput): { source: string; alt: string; height: number } {
  const layout = computeLayout(input)
  const body = [
    dotBlock(input),
    ...input.gauges.map((_, index) => gaugeBlock(input, layout, index)),
    layout.costX === null ? '' : costBlock(input, layout.costX),
    layout.turnX === null || input.turn === null ? '' : turnBlock(input, layout.turnX),
  ].join('')
  const source = `<svg xmlns="http://www.w3.org/2000/svg" class="t-${input.theme}" width="${num(input.width)}" height="${SVG_HEIGHT}" viewBox="0 0 ${num(input.width)} ${SVG_HEIGHT}">${styleBlock()}${defsBlock(input, layout)}${body}</svg>`

  return { source, alt: altOf(input), height: SVG_HEIGHT }
}
