import { upper } from './lang'
import { themeCss } from './tidemark'
import type { Mode, Neutral, Role } from './tidemark'

// Svg building blocks of the Tidemark language (DESIGN.md §3–§5): text, badges and bars.
// Every color is a CSS variable, so one drawing serves both themes.

export type Ink = Neutral | Role | `${Role}-t` | `${Role}-l`
export type Font = { size: number; weight?: number; isMono?: boolean }

export const SANS = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`
export const MONO = `ui-monospace, 'SF Mono', Menlo, monospace`
// A desktop pane reports about 9 px a column (a 365 px body reads 40), wider than the reply column.
export const PX_PER_COLUMN = 9

const MONO_EM = 0.6
const BOLD_FROM = 600
const BOLD_WIDEN = 1.06
const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
const MOTION = '@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}'

export const esc = (text: string): string => text.replace(/[&<>"]/g, ch => ENTITIES[ch] ?? ch)
const px = (value: number): string => String(Math.round(value * 10) / 10)
const NARROW_CHAR = /[\s.,:;'|!il1()[\]ıjtf`]/
const WIDE_CHAR = /[A-ZÇĞİÖŞÜmwMW@%]/
const NARROW_EM = 0.3
const WIDE_EM = 0.72
const PLAIN_EM = 0.56

function charEm(ch: string): number {
  if (NARROW_CHAR.test(ch)) return NARROW_EM

  return WIDE_CHAR.test(ch) ? WIDE_EM : PLAIN_EM
}
export function measure(text: string, font: Font): number {
  const chars = [...text]
  const em = font.isMono === true ? chars.length * MONO_EM : chars.reduce((sum, ch) => sum + charEm(ch), 0)
  const widen = (font.weight ?? 0) >= BOLD_FROM ? BOLD_WIDEN : 1

  return em * font.size * widen
}

// Cuts `text` to `width` pixels with an ellipsis; `isFromStart` keeps the end (paths).
function cut(text: string, box: { width: number; font: Font; isFromStart: boolean }): string {
  const { width, font, isFromStart } = box
  if (measure(text, font) <= width) return text
  const chars = [...text]
  while (chars.length > 1 && measure(`${chars.join('')}…`, font) > width) {
    if (isFromStart) chars.shift()
    else chars.pop()
  }

  return isFromStart ? `…${chars.join('')}` : `${chars.join('')}…`
}

export const fit = (text: string, width: number, font: Font): string => cut(text, { width, font, isFromStart: false })
export const fitStart = (text: string, width: number, font: Font): string => cut(text, { width, font, isFromStart: true })

// Breaks `text` at spaces into at most `maxLines` lines of `width` pixels; only the last line may
// end in an ellipsis, so a long prompt reads in full where it can.
export function wrap(text: string, width: number, spec: { font: Font; maxLines: number }): string[] {
  const lines: string[] = []
  let current = ''
  for (const word of text.split(/\s+/).filter(part => part !== '')) {
    const next = current === '' ? word : `${current} ${word}`
    if (current === '' || measure(next, spec.font) <= width) current = next
    else {
      lines.push(current)
      current = word
    }
  }
  if (current !== '') lines.push(current)
  if (lines.length <= spec.maxLines) return lines.map(line => fit(line, width, spec.font))
  const kept = lines.slice(0, spec.maxLines)
  const last = kept.length - 1

  return kept.map((line, index) => (index === last ? fit(`${line} ${lines.slice(spec.maxLines).join(' ')}`, width, spec.font) : line))
}

export function svgWidth(columns: number, range: { reserve?: number; min: number; max: number }): number {
  const room = (columns - (range.reserve ?? 0)) * PX_PER_COLUMN

  return Math.round(Math.max(range.min, Math.min(range.max, room)))
}

export function svgDoc(spec: { width: number; height: number; mode: Mode; body: string }): string {
  const { width, height } = spec
  const style = `${themeCss()}text{font-family:${SANS};font-variant-numeric:tabular-nums}.mono{font-family:${MONO}}${MOTION}`

  return `<svg xmlns="http://www.w3.org/2000/svg" class="t-${spec.mode}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><style>${style}</style>${spec.body}</svg>`
}

export type TextSpec = Font & { x: number; y: number; text: string; ink: Ink; anchor?: 'start' | 'middle' | 'end' }

export function text(spec: TextSpec): string {
  const attrs = [`x="${px(spec.x)}"`, `y="${px(spec.y)}"`, `font-size="${spec.size}"`]
  if (spec.weight !== undefined) attrs.push(`font-weight="${spec.weight}"`)
  if (spec.anchor !== undefined && spec.anchor !== 'start') attrs.push(`text-anchor="${spec.anchor}"`)
  if (spec.isMono === true) attrs.push('class="mono"')

  return `<text ${attrs.join(' ')} style="fill:var(--${spec.ink})">${esc(spec.text)}</text>`
}

export type Run = { text: string; ink: Ink; weight?: number; isMono?: boolean }

// One line of differently inked runs; the renderer places each run after the last.
export function runs(spec: { x: number; y: number; size: number; parts: Run[] }): string {
  const spans = spec.parts.map(part => {
    const weight = part.weight === undefined ? '' : ` font-weight="${part.weight}"`
    const mono = part.isMono === true ? ' class="mono"' : ''

    return `<tspan${weight}${mono} style="fill:var(--${part.ink})">${esc(part.text)}</tspan>`
  })

  return `<text x="${px(spec.x)}" y="${px(spec.y)}" font-size="${spec.size}">${spans.join('')}</text>`
}

export function rect(spec: { x: number; y: number; w: number; h: number; rx?: number; fill?: Ink; stroke?: Ink; className?: string }): string {
  const fill = spec.fill === undefined ? 'fill:none' : `fill:var(--${spec.fill})`
  const stroke = spec.stroke === undefined ? '' : `;stroke:var(--${spec.stroke})`
  const cls = spec.className === undefined ? '' : ` class="${spec.className}"`

  return `<rect${cls} x="${px(spec.x)}" y="${px(spec.y)}" width="${px(spec.w)}" height="${px(spec.h)}" rx="${spec.rx ?? 0}" style="${fill}${stroke}"/>`
}

export function line(spec: { x1: number; y1: number; x2: number; y2: number; ink: Ink; dash?: string }): string {
  const dash = spec.dash === undefined ? '' : ` stroke-dasharray="${spec.dash}"`

  return `<line x1="${px(spec.x1)}" y1="${px(spec.y1)}" x2="${px(spec.x2)}" y2="${px(spec.y2)}" stroke-width="1"${dash} style="stroke:var(--${spec.ink})"/>`
}

// 26×16 file-type badge: the extension in mono caps, neutral; a file's type is no state, so no colour.
export function fileBadge(spec: { x: number; y: number; path: string }): string {
  const name = spec.path.split('/').pop() ?? spec.path
  const dot = name.lastIndexOf('.')
  const ext = dot > 0 ? name.slice(dot + 1) : ''
  const label = upper(ext === '' ? '·' : ext.slice(0, 3))

  return rect({ x: spec.x, y: spec.y, w: 26, h: 16, rx: 4, fill: 'track' })
    + text({ size: 9.5, weight: 600, isMono: true, x: spec.x + 13, y: spec.y + 11.5, text: label, ink: 'lo', anchor: 'middle' })
}

// 16×16 monogram chip for a tool kind (`E` edit, `$` bash), neutral like the file badge.
export function monogram(spec: { x: number; y: number; glyph: string }): string {
  return rect({ x: spec.x, y: spec.y, w: 16, h: 16, rx: 4, fill: 'track' })
    + text({ size: 10, weight: 600, isMono: true, x: spec.x + 8, y: spec.y + 11.5, text: spec.glyph, ink: 'lo', anchor: 'middle' })
}

// A segmented bar: each part's share of `total`, 2px apart, on the track.
export function bar(spec: { x: number; y: number; width: number; height: number; total: number; parts: { value: number; ink: Ink }[] }): string {
  const radius = spec.height / 2
  const track = rect({ x: spec.x, y: spec.y, w: spec.width, h: spec.height, rx: radius, fill: 'track' })
  let left = spec.x
  const fills = spec.parts.filter(part => part.value > 0).map(part => {
    const width = Math.max(spec.height, (spec.width * part.value) / Math.max(1, spec.total) - 2)
    const drawn = rect({ x: left, y: spec.y, w: width, h: spec.height, rx: radius, fill: part.ink })
    left += width + 2

    return drawn
  })

  return track + fills.join('')
}
