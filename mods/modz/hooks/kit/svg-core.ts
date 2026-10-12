// MODZ kit — what every Svg builder shares: the type scale, the document shell, text and
// icon elements. Colours are paint names (`hi`, `read`, `read-tint`, …) that svgStyle turns
// into CSS variables for both schemes; no hex reaches the markup.
import { icon, ICON_GRID } from './icons'
import type { IconName } from './icons'
import { monoWidth, textWidth } from './svg-metrics'
import type { Measure } from './svg-metrics'
import { svgStyle } from './tokens'

export type SvgPic = { source: string; width: number; height: number; alt: string }

// A drawing not yet wrapped in its <svg>, so composites can place it.
export type Part = { body: string; width: number; height: number; alt: string }

export const STROKE = 1.75
const CAP_EM = 0.7
const DECIMALS = 100
const SCALE_DIGITS = 4

export const TYPE = {
  display: { size: 24, weight: 650 },
  headline: { size: 17, weight: 620, line: 22 },
  title: { size: 14, weight: 600, line: 20 },
  body: { size: 13, weight: 400, line: 18 },
  eyebrow: { size: 10.5, weight: 700, tracking: 0.1 },
  label: { size: 12, weight: 500 },
  micro: { size: 10.5, weight: 500 },
} as const

export const num = (value: number): string => String(Math.round(value * DECIMALS) / DECIMALS)

export const escapeXml = (text: string): string =>
  text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char)

// Capitals in the interface language (Turkish keeps its dotted İ; English never gets one).
export { upper as upperTr } from './lang'

export const sans = (size: number, weight?: number): Measure => text => textWidth(text, size, weight)
export const mono = (size: number): Measure => text => monoWidth(text, size)

// The baseline that centres a line's capitals in a box `height` tall starting at `top`.
export const baseline = (top: number, height: number, size: number): number =>
  Math.round(top + height / 2 + (size * CAP_EM) / 2)

export function toPic(part: Part): SvgPic {
  const { width, height } = part
  const source = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"`,
    ` role="img" aria-label="${escapeXml(part.alt)}"><style>${svgStyle(part.body)}</style>${part.body}</svg>`,
  ].join('')

  return { source, width, height, alt: part.alt }
}

export const place = (body: string, x: number, y: number): string =>
  x === 0 && y === 0 ? body : `<g transform="translate(${num(x)} ${num(y)})">${body}</g>`

export type TextSpec = {
  x: number
  y: number
  text: string
  size: number
  paint: string
  weight?: number
  anchor?: 'start' | 'middle' | 'end'
  isMono?: boolean
  tracking?: number
  className?: string
}

export function textEl(t: TextSpec): string {
  const classes = [`f-${t.paint}`, t.isMono ? 'mono' : '', t.className ?? ''].filter(Boolean).join(' ')
  const attrs = [
    `x="${num(t.x)}" y="${num(t.y)}" class="${classes}" font-size="${t.size}"`,
    t.weight === undefined ? '' : ` font-weight="${t.weight}"`,
    t.anchor === undefined || t.anchor === 'start' ? '' : ` text-anchor="${t.anchor}"`,
    t.tracking === undefined ? '' : ` letter-spacing="${num(t.tracking)}"`,
  ].join('')

  return `<text ${attrs}>${escapeXml(t.text)}</text>`
}

export type IconSpec = { name: IconName; x: number; y: number; size: number; paint: string }

// An icon scaled to `size` px with its stroke kept at STROKE rendered px.
export function iconEl(s: IconSpec): string {
  const scale = s.size / ICON_GRID

  return [
    `<g transform="translate(${num(s.x)} ${num(s.y)}) scale(${scale.toFixed(SCALE_DIGITS)})"`,
    ` class="s-${s.paint}" fill="none" stroke-width="${num(STROKE / scale)}" stroke-linecap="round" stroke-linejoin="round">`,
    `${icon(s.name)}</g>`,
  ].join('')
}

export type RectSpec = { x: number; y: number; width: number; height: number; radius?: number; paint: string; className?: string }

export const rectEl = (r: RectSpec, extra = ''): string =>
  `<rect x="${num(r.x)}" y="${num(r.y)}" width="${num(Math.max(0, r.width))}" height="${num(r.height)}"${
    r.radius ? ` rx="${num(r.radius)}"` : ''
  } class="f-${r.paint}${r.className ? ` ${r.className}` : ''}"${extra}/>`

// A 1 px hairline inside a rect's edge, so it lands on whole device pixels.
export const outlineEl = (r: RectSpec, opacity = 1): string =>
  `<rect x="${num(r.x + 0.5)}" y="${num(r.y + 0.5)}" width="${num(r.width - 1)}" height="${num(r.height - 1)}"${
    r.radius ? ` rx="${num(r.radius - 0.5)}"` : ''
  } fill="none" class="s-${r.paint}"${opacity < 1 ? ` stroke-opacity="${opacity}"` : ''}/>`
