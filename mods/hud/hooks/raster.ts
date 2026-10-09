import { cachePercent, compact, labelOf, percentText, untilReset } from './format'
import { HOT_PERCENT, MUTED_DARK, TRACK, WHITE, gradientAt, mix, severityColor, toInt } from './palette'
import type { Rgb } from './palette'
import type { HudTurn } from '../types'

export type RasterGauge = { id: string; percent: number; resetsAt: string | null }

export type RasterInput = {
  columns: number
  gauges: RasterGauge[]
  costUsd: number | null
  turn: HudTurn | null
  isLive: boolean
  isTurnLive: boolean
  frame: number
  nowMs: number
}

type Canvas = { columns: number; words: Uint32Array; cursor: number }

type Layout = { barWidth: number; hasReset: boolean; hasTurn: boolean }

const TRIPLET = 3
const SPACE = 0x20
const DEFAULT_COLOR = 0x01000000
const BAR_CHAR = '▄'
const PARTIAL_MIN = 0.08
const SPARK = '▁▂▃▄▅▆▇█'
const SPARK_CELLS = 12
const SPARK_COLOR: Rgb = [56, 189, 248]
const SEPARATOR = '│'
const SHIMMER_SPEED = 0.7
const SHIMMER_PAD = 4
const SHIMMER_SPAN = 2.2
const SHIMMER_STRENGTH = 0.55
const PULSE_SPEED = 0.35
const PULSE_STRENGTH = 0.5
const HOT_PULSE_STRENGTH = 0.3
const PERCENT = 100
const HALF_CELL = 0.5
const LABEL_WIDTH = 4
const PERCENT_WIDTH = 4

const LAYOUTS: { minColumns: number; layout: Layout }[] = [
  { minColumns: 140, layout: { barWidth: 12, hasReset: true, hasTurn: true } },
  { minColumns: 104, layout: { barWidth: 10, hasReset: true, hasTurn: false } },
  { minColumns: 80, layout: { barWidth: 6, hasReset: true, hasTurn: false } },
  { minColumns: 56, layout: { barWidth: 0, hasReset: true, hasTurn: false } },
  { minColumns: 0, layout: { barWidth: 0, hasReset: false, hasTurn: false } },
]

function layoutFor(columns: number): Layout {
  return (LAYOUTS.find(entry => columns >= entry.minColumns) ?? LAYOUTS[LAYOUTS.length - 1]).layout
}

function createCanvas(columns: number): Canvas {
  const words = new Uint32Array(columns * TRIPLET)
  for (let index = 0; index < columns; index += 1) {
    words[index * TRIPLET] = SPACE
    words[index * TRIPLET + 1] = DEFAULT_COLOR
    words[index * TRIPLET + 2] = DEFAULT_COLOR
  }

  return { columns, words, cursor: 0 }
}

function put(canvas: Canvas, char: string, color: Rgb | null): void {
  if (canvas.cursor >= canvas.columns) return
  const base = canvas.cursor * TRIPLET
  canvas.words[base] = char.codePointAt(0) ?? SPACE
  canvas.words[base + 1] = color === null ? DEFAULT_COLOR : toInt(color)
  canvas.cursor += 1
}

function write(canvas: Canvas, text: string, color: Rgb | null): void {
  for (const char of text) put(canvas, char, color)
}

function shineAt(index: number, options: { width: number; frame: number }): number {
  const travel = options.width + SHIMMER_PAD * 2
  const head = ((options.frame * SHIMMER_SPEED) % travel) - SHIMMER_PAD

  return Math.max(0, 1 - Math.abs(index - head) / SHIMMER_SPAN) * SHIMMER_STRENGTH
}

function drawBar(canvas: Canvas, spec: { percent: number; width: number; frame: number; isLive: boolean }): void {
  const filled = Math.min(spec.width, Math.max(0, (spec.percent / PERCENT) * spec.width))
  const whole = Math.floor(filled)
  const fraction = filled - whole

  for (let index = 0; index < spec.width; index += 1) {
    const base = gradientAt((index + HALF_CELL) / spec.width)
    if (index < whole) {
      const shine = spec.isLive ? shineAt(index, spec) : 0
      put(canvas, BAR_CHAR, mix(base, WHITE, shine))
    } else if (index === whole && fraction >= PARTIAL_MIN) {
      put(canvas, BAR_CHAR, mix(TRACK, base, fraction))
    } else {
      put(canvas, BAR_CHAR, TRACK)
    }
  }
}

function percentColor(percent: number, input: RasterInput): Rgb {
  const color = severityColor(percent)
  if (!input.isLive || percent < HOT_PERCENT) return color
  const pulse = (Math.sin(input.frame * PULSE_SPEED) + 1) / 2

  return mix(color, WHITE, pulse * HOT_PULSE_STRENGTH)
}

function drawGauge(canvas: Canvas, gauge: RasterGauge, options: { input: RasterInput; layout: Layout }): void {
  const { input, layout } = options
  write(canvas, labelOf(gauge.id).padEnd(LABEL_WIDTH), MUTED_DARK)
  if (layout.barWidth > 0) {
    drawBar(canvas, { percent: gauge.percent, width: layout.barWidth, frame: input.frame, isLive: input.isLive })
  }
  write(canvas, ` ${percentText(gauge.percent).padStart(PERCENT_WIDTH)}`, percentColor(gauge.percent, input))
  const reset = layout.hasReset ? untilReset(gauge.resetsAt, input.nowMs) : ''
  if (reset !== '') write(canvas, ` · ${reset}`, MUTED_DARK)
}

function drawPulse(canvas: Canvas, input: RasterInput): void {
  if (input.isLive) {
    const pulse = (Math.sin(input.frame * PULSE_SPEED) + 1) / 2
    put(canvas, '●', mix(gradientAt(0), WHITE, pulse * PULSE_STRENGTH))
  } else {
    put(canvas, '●', TRACK)
  }
  write(canvas, ' ', null)
}

function sparklineOf(values: number[]): string {
  const recent = values.slice(-SPARK_CELLS)
  const peak = Math.max(1, ...recent)

  return recent.map(value => SPARK[Math.min(SPARK.length - 1, Math.floor((value / peak) * (SPARK.length - 1)))]).join('')
}

function drawTurn(canvas: Canvas, turn: HudTurn, input: RasterInput): void {
  write(canvas, input.isTurnLive ? 'turn ' : 'last ', MUTED_DARK)
  write(canvas, `in ${compact(turn.input)} out ${compact(turn.output)} cache ${cachePercent(turn)}%`, null)
  if (turn.outputs.length > 1) {
    write(canvas, ' ', null)
    write(canvas, sparklineOf(turn.outputs), SPARK_COLOR)
  }
}

function drawDivider(canvas: Canvas): void {
  write(canvas, ` ${SEPARATOR} `, TRACK)
}

export function hudCells(input: RasterInput): string {
  const canvas = createCanvas(input.columns)
  const layout = layoutFor(input.columns)

  drawPulse(canvas, input)
  input.gauges.forEach((gauge, index) => {
    if (index > 0) drawDivider(canvas)
    drawGauge(canvas, gauge, { input, layout })
  })
  if (input.costUsd !== null) {
    drawDivider(canvas)
    write(canvas, `$${input.costUsd.toFixed(2)}`, MUTED_DARK)
  }
  if (layout.hasTurn && input.turn !== null && input.turn.requests > 0) {
    drawDivider(canvas)
    drawTurn(canvas, input.turn, input)
  }

  return new Uint8Array(canvas.words.buffer).toBase64()
}
