// Small SVG builders: text that is measured, fitted and wrapped without a renderer, group labels
// and line icons. Every drawing ends with the reduced-motion rule (DESIGN.md §5).

import { FONT, MONO } from './theme'

export const esc = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const NARROW = 'iljtfrı.,:;|!\'`· ()'
const WIDE = 'mwMWğĞ@%'
const BOLD_GROWTH = 1.06
/** Advance widths as a share of the font size, for a system sans and a monospace. */
const GLYPH = { narrow: 0.3, wide: 0.82, capital: 0.64, space: 0.28, other: 0.54, mono: 0.6 }

export type Font = { size: number; weight?: number; isMono?: boolean }

function share(c: string): number {
  if (NARROW.includes(c)) return GLYPH.narrow
  if (WIDE.includes(c)) return GLYPH.wide
  if (c === ' ') return GLYPH.space
  return c >= 'A' && c <= 'Z' ? GLYPH.capital : GLYPH.other
}

/** Width of a string in pixels, close enough to lay out a card. */
export function measure(text: string, font: Font): number {
  const chars = [...text]
  if (font.isMono) return chars.length * font.size * GLYPH.mono
  const base = chars.reduce((sum, c) => sum + font.size * share(c), 0)
  return base * ((font.weight ?? 400) >= 600 ? BOLD_GROWTH : 1)
}

/** The text cut with an ellipsis to fit `width`. */
export function fit(text: string, width: number, font: Font): string {
  if (measure(text, font) <= width) return text
  const chars = [...text]
  while (chars.length > 1 && measure(`${chars.join('')}…`, font) > width) chars.pop()
  return `${chars.join('').trimEnd()}…`
}

export type Box = { width: number; font: Font; maxLines: number }

/** Word-wrapped lines, the last one fitted with an ellipsis when the text runs past `maxLines`. */
export function wrap(text: string, box: Box): string[] {
  const { width, font, maxLines } = box
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word
    if (measure(next, font) <= width || !line) line = next
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  if (lines.length <= maxLines) return lines.map(l => fit(l, width, font))
  const kept = lines.slice(0, maxLines)
  kept[maxLines - 1] = fit(`${kept[maxLines - 1]} ${lines.slice(maxLines).join(' ')}`, width, font)
  return kept
}

export type TextSpec = Font & { x: number; y: number; fill: string; text: string; anchor?: 'start' | 'end' | 'middle'; isItalic?: boolean }

export function text(t: TextSpec): string {
  const attrs = [
    `x="${t.x}" y="${t.y}" fill="${t.fill}" font-size="${t.size}" font-weight="${t.weight ?? 400}"`,
    `font-family="${t.isMono ? MONO : FONT}"`,
    t.isMono ? 'font-variant-numeric="tabular-nums"' : '',
    t.anchor && t.anchor !== 'start' ? `text-anchor="${t.anchor}"` : '',
    t.isItalic ? 'font-style="italic"' : '',
  ]
  return `<text ${attrs.filter(Boolean).join(' ')}>${esc(t.text)}</text>`
}

export const LABEL: Font = { size: 12, weight: 600 }

/** A group label: sentence case, 12/600, quiet (DESIGN.md §0.2). */
export const label = (at: { x: number; y: number; fill: string }, words: string): string => text({ ...LABEL, ...at, text: words })

export const ICON_STROKE = 1.75

/** A 24-grid line icon drawn at `size`, top-left at (x, y). */
export type IconSpec = { x: number; y: number; size: number; color: string }

export const icon = (paths: string, { x, y, size, color }: IconSpec): string =>
  `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="${ICON_STROKE * 24 / size}" ` +
  `stroke-linecap="round" stroke-linejoin="round">${paths}</g>`

const REDUCED = '@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}'

export function doc(size: { width: number; height: number; style?: string }, body: string): string {
  const { width, height, style = '' } = size
  const w = Math.round(width)
  const h = Math.round(height)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<style>${style}${REDUCED}</style>${body}</svg>`
}

/** A line icon on its own, sized to sit beside body text. */
export const iconSvg = (paths: string, size: number, color: string): string =>
  doc({ width: size, height: size }, icon(paths, { x: 0, y: 0, size, color }))
