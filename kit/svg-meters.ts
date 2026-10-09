// MODZ kit — measures: the meter with its pace tick, the segmented 270° arc, the sparkline.
// The fill never passes 100 %; past it the value reads "dolu".
import { baseline, num, rectEl, TYPE, textEl, toPic, upperTr } from './svg-core'
import type { Part, SvgPic } from './svg-core'
import type { Role } from './tokens'

const AHEAD_OF_PACE = 0.1
const NEAR_FULL = 0.95
const PERCENT = 100
export const FULL_TEXT = 'dolu'

// The fill's paint: neutral (text.mid, or the role) on pace, Amber when more than 10 points
// ahead of the pace, Flare from 95 %.
export function meterTone(ratio: number, pace?: number, role?: Role): string {
  if (ratio >= NEAR_FULL) return 'danger'
  if (pace !== undefined && ratio - pace > AHEAD_OF_PACE) return 'warn'

  return role ?? 'mid'
}

export const clampRatio = (value: number, max = 1): number =>
  max > 0 && !Number.isNaN(value) ? Math.max(0, Math.min(1, value / max)) : 0

// "%42", or "dolu" once the value reaches its max (Turkish puts % first).
export const percentText = (value: number, max = 1): string =>
  max > 0 && value >= max ? FULL_TEXT : `%${Math.round(clampRatio(value, max) * PERCENT)}`

// ---------------------------------------------------------------------------

export type MeterOpts = {
  value: number
  max?: number
  width: number
  pace?: number
  isHero?: boolean
  label?: string
  valueText?: string
  role?: Role
  bg?: 'card' | 'inset' | 'sheet'
}

const TRACK_H = 4
const HERO_H = 6
const TICK_H = 10
const TICK_HALO = 3
const BAR_ONLY_H = 12
const LABELLED_H = 28
const LABEL_BOX = 16
const BAR_CENTER_LABELLED = 22

export type MeterGeometry = { ratio: number; fill: number; track: number; height: number; paceX: number | null; tone: string }

export function meterGeometry(o: MeterOpts): MeterGeometry {
  const ratio = clampRatio(o.value, o.max)
  const height = o.isHero ? HERO_H : TRACK_H
  const fill = ratio > 0 ? Math.min(o.width, Math.max(height, Math.round(o.width * ratio))) : 0
  const pace = o.pace === undefined ? null : Math.max(0, Math.min(1, o.pace))
  const paceX = pace === null ? null : Math.round(Math.min(o.width - 1, pace * o.width))

  return { ratio, fill, track: o.width, height, paceX, tone: meterTone(ratio, o.pace, o.role) }
}

function meterBar(o: MeterOpts, g: MeterGeometry, centerY: number): string {
  const top = centerY - g.height / 2
  const bar = { x: 0, y: top, height: g.height, radius: g.height / 2 }
  const tick =
    g.paceX === null
      ? ''
      : rectEl({ x: g.paceX - 1, y: top, width: TICK_HALO, height: g.height, paint: o.bg ?? 'card' }) +
        rectEl({ x: g.paceX, y: centerY - TICK_H / 2, width: 1, height: TICK_H, paint: 'mid' })

  return [
    rectEl({ ...bar, width: g.track, paint: 'track' }),
    g.fill > 0 ? rectEl({ ...bar, width: g.fill, paint: g.tone }) : '',
    tick,
  ].join('')
}

export function meterPart(o: MeterOpts): Part {
  const g = meterGeometry(o)
  const shown = o.valueText ?? percentText(o.value, o.max)
  const isLabelled = o.label !== undefined || o.valueText !== undefined
  const height = isLabelled ? LABELLED_H : BAR_ONLY_H
  const y = baseline(0, LABEL_BOX, TYPE.label.size)
  const texts = isLabelled
    ? [
        o.label ? textEl({ x: 0, y, text: o.label, paint: 'mid', ...TYPE.label }) : '',
        textEl({ x: o.width, y, text: shown, paint: g.ratio >= NEAR_FULL ? 'danger' : 'hi', size: TYPE.label.size, weight: 600, anchor: 'end', isMono: true }),
      ].join('')
    : ''
  const bar = meterBar(o, g, isLabelled ? BAR_CENTER_LABELLED : BAR_ONLY_H / 2)

  return { body: texts + bar, width: o.width, height, alt: `${o.label ? `${o.label}: ` : ''}${shown}` }
}

export const meter = (o: MeterOpts): SvgPic => toPic(meterPart(o))

// ---------------------------------------------------------------------------
// Segmented arc: 270°, 20 segments, opening at the bottom; value in the middle, and at
// 72 px a label in the opening.

export type ArcOpts = { value: number; max?: number; size?: number; label?: string; role?: Role; pace?: number }

const ARC_SMALL = 44
const ARC_LARGE = 72
const SEGMENTS = 20
const SWEEP = 270
const START = 135
const GAP_DEG = 2.5
const STROKE_SMALL = 5
const STROKE_LARGE = 6
const RAD = Math.PI / 180

function segment(o: { i: number; c: number; r: number; paint: string; width: number }): string {
  const step = SWEEP / SEGMENTS
  const a0 = (START + o.i * step + GAP_DEG / 2) * RAD
  const a1 = (START + (o.i + 1) * step - GAP_DEG / 2) * RAD
  const at = (a: number): string => `${num(o.c + o.r * Math.cos(a))} ${num(o.c + o.r * Math.sin(a))}`

  return `<path d="M${at(a0)}A${num(o.r)} ${num(o.r)} 0 0 1 ${at(a1)}" class="s-${o.paint}" stroke-width="${o.width}" fill="none"/>`
}

export function arcPart(o: ArcOpts): Part {
  const size = o.size ?? ARC_SMALL
  const isLarge = size >= ARC_LARGE
  const width = isLarge ? STROKE_LARGE : STROKE_SMALL
  const ratio = clampRatio(o.value, o.max)
  const lit = ratio > 0 ? Math.max(1, Math.round(ratio * SEGMENTS)) : 0
  const tone = meterTone(ratio, o.pace, o.role ?? 'read')
  const c = size / 2
  const r = c - width / 2 - 1
  const segments = Array.from({ length: SEGMENTS }, (_, i) => segment({ i, c, r, width, paint: i < lit ? tone : 'track' }))
  const value = percentText(o.value, o.max)
  const type = isLarge ? { size: 17, weight: 650 } : { size: 11, weight: 600 }
  const center = textEl({ x: c, y: baseline(0, size, type.size), text: value, paint: 'hi', ...type, anchor: 'middle', isMono: true })
  const label =
    isLarge && o.label
      ? textEl({ x: c, y: size - 4, text: upperTr(o.label), paint: 'lo', ...TYPE.eyebrow, size: 9, anchor: 'middle' })
      : ''

  return { body: segments.join('') + center + label, width: size, height: size, alt: `${o.label ? `${o.label}: ` : ''}${value}` }
}

export const arc = (o: ArcOpts): SvgPic => toPic(arcPart(o))

// ---------------------------------------------------------------------------
// Sparkline: a 1.5 px line, a 12 % area under it, a dot on the latest value.

export type SparklineOpts = {
  values: readonly number[]
  width?: number
  height?: number
  role?: Role
  hasArea?: boolean
  bg?: 'card' | 'inset' | 'sheet'
}

const SPARK_W = 96
const SPARK_H = 24
const SPARK_PAD = 3
const SPARK_STROKE = 1.5
const AREA_OPACITY = 0.12
const DOT_R = 2.5

export function sparklinePart(o: SparklineOpts): Part {
  const width = o.width ?? SPARK_W
  const height = o.height ?? SPARK_H
  const values = o.values.length > 1 ? o.values : [o.values[0] ?? 0, o.values[0] ?? 0]
  const low = Math.min(...values)
  const span = Math.max(...values) - low
  const x = (i: number): number => SPARK_PAD + (i * (width - SPARK_PAD * 2)) / (values.length - 1)
  const y = (v: number): number => (span === 0 ? height / 2 : SPARK_PAD + (1 - (v - low) / span) * (height - SPARK_PAD * 2))
  const points = values.map((v, i) => `${num(x(i))} ${num(y(v))}`)
  const line = `M${points.join('L')}`
  const paint = o.role ?? 'mid'
  const last = values.length - 1
  const body = [
    o.hasArea === false ? '' : `<path d="${line}L${num(x(last))} ${height}L${num(x(0))} ${height}Z" class="f-${paint}" fill-opacity="${AREA_OPACITY}"/>`,
    `<path d="${line}" class="s-${paint}" fill="none" stroke-width="${SPARK_STROKE}" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<circle cx="${num(x(last))}" cy="${num(y(values[last] ?? 0))}" r="${DOT_R}" class="f-${paint} s-${o.bg ?? 'card'}" stroke-width="${SPARK_STROKE}"/>`,
  ]

  return { body: body.join(''), width, height, alt: `${values.length} değer, son ${values[last]}` }
}

export const sparkline = (o: SparklineOpts): SvgPic => toPic(sparklinePart(o))
