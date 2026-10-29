import { fillOf, strokeOf, svgStyle } from './theme'
import type { Tone } from './theme'

// Svg building blocks of the Tidemark kit: a document shell, the slim meter with its pace tick,
// the sparkline and the group label. Pure strings; colors come from classes.

export type SvgDoc = { source: string; alt: string; width: number; height: number }

const AREA_OPACITY = 0.12
const LABEL_SIZE = 12
const LABEL_WEIGHT = 600
const PERCENT = 100

export const escape = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const NARROW = 'iljtf.,:;|!\'` ·'
const WIDE = 'mwMW@%'
// Digits of the system font, tabular or not, are a little wider than an average lower-case letter.
const DIGIT_EM = 0.6

// Width of a text in px, close enough to lay out a line without a renderer.
export function measure(text: string, size: number, isMono = false): number {
  if (isMono) return [...text].length * size * 0.6

  return [...text].reduce((sum, char) => {
    if (NARROW.includes(char)) return sum + size * 0.3
    if (WIDE.includes(char)) return sum + size * 0.82
    if (char >= '0' && char <= '9') return sum + size * DIGIT_EM

    return sum + (char >= 'A' && char <= 'Z' ? size * 0.66 : size * 0.55)
  }, 0)
}

export function svgDoc(spec: { width: number; height: number; body: string; alt: string; css?: string }): SvgDoc {
  const width = Math.ceil(spec.width)
  const height = Math.ceil(spec.height)
  const open = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`

  return { source: `${open}${svgStyle(spec.css)}${spec.body}</svg>`, alt: spec.alt, width, height }
}

const clampPercent = (value: number): number => Math.max(0, Math.min(PERCENT, value))

export type MeterSpec = { x: number; y: number; width: number; height: number; percent: number; tone: Tone; pace: number | null }

// How far a meter's fill reaches: never past full, a non-zero value at least a round dot.
export const filledOf = (spec: Pick<MeterSpec, 'width' | 'height' | 'percent'>): number =>
  spec.percent <= 0 ? 0 : Math.max(spec.height, (clampPercent(spec.percent) / PERCENT) * spec.width)

// A slim meter: track, fill (never past full), and the pace tick standing out above and below.
export function meter(spec: MeterSpec): string {
  const { x, y, width, height } = spec
  const filled = filledOf(spec)
  const parts = [
    `<rect class="f-track" x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}"/>`,
    filled > 0 ? `<rect class="${fillOf(spec.tone, 'mid')}" x="${x}" y="${y}" width="${filled.toFixed(1)}" height="${height}" rx="${height / 2}"/>` : '',
  ]
  if (spec.pace !== null) {
    const tickX = x + (clampPercent(spec.pace) / PERCENT) * width
    parts.push(`<rect class="f-hi" x="${(tickX - 0.5).toFixed(1)}" y="${y - 2}" width="1.5" height="${height + 4}" rx=".75"/>`)
  }

  return parts.join('')
}

export type SparkSpec = { x: number; y: number; width: number; height: number; values: readonly number[]; max: number; tone: Tone }

// A quiet history line with a faint area under it; nothing for fewer than two readings.
export function sparkline(spec: SparkSpec): string {
  if (spec.values.length < 2 || spec.max <= 0) return ''
  const stepX = spec.width / (spec.values.length - 1)
  const points = spec.values.map((value, index) => {
    const ratio = Math.max(0, Math.min(1, value / spec.max))

    return `${(spec.x + index * stepX).toFixed(1)} ${(spec.y + spec.height - ratio * spec.height).toFixed(1)}`
  })
  const bottom = spec.y + spec.height
  const area = `M${spec.x} ${bottom} L${points.join(' L')} L${spec.x + spec.width} ${bottom} Z`

  return [
    `<path class="${fillOf(spec.tone, 'mid')}" fill-opacity="${AREA_OPACITY}" d="${area}"/>`,
    `<path class="${strokeOf(spec.tone)}" fill="none" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" d="M${points.join(' L')}"/>`,
  ].join('')
}

// A group's label: sentence case, quiet, no tracking (DESIGN.md §0.2).
export function groupLabel(text: string, at: { x: number; y: number }): string {
  return `<text class="f-lo" x="${at.x}" y="${at.y}" font-size="${LABEL_SIZE}" font-weight="${LABEL_WEIGHT}">${escape(text)}</text>`
}
