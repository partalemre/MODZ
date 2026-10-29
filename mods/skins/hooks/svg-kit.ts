import { charWidth } from './markdown'
import type { Palette } from './skin'

// What every vector card shares: fonts, text measuring and fitting, escaping, and the
// card shell. Cards have no background of their own: the desktop draws an Svg as an
// image, so the page shows through, and bands are faint tints of the text colour.

export const FONT = `ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Inter, sans-serif`
export const MONO = `ui-monospace, 'Cascadia Code', 'JetBrains Mono', Consolas, monospace`

export const escape = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Width of a string in pixels, close enough to lay out a card without a renderer.
export function measure(text: string, isMono: boolean, size: number): number {
  if (isMono) {
    return [...text].reduce((sum, char) => sum + charWidth(char), 0) * size * 0.6
  }

  return [...text].reduce((sum, char) => {
    const cells = charWidth(char)

    // Wide East Asian characters (Hangul, kana, Han) and emoji are about one em wide,
    // nearly twice a Latin letter; combining marks and joiners take no room.
    if (cells !== 1) {
      return sum + cells * size * 0.5
    }

    if ('iljtf.,:;|!\'` '.includes(char)) {
      return sum + size * 0.3
    }

    if ('mwMW@%'.includes(char)) {
      return sum + size * 0.82
    }

    return sum + (char >= 'A' && char <= 'Z' ? size * 0.64 : size * 0.54)
  }, 0)
}

export type Font = { isMono: boolean; size: number }

export function fitText(text: string, width: number, { isMono, size }: Font): string {
  if (measure(text, isMono, size) <= width) {
    return text
  }

  const chars = [...text]

  while (chars.length > 1 && measure(`${chars.join('')}…`, isMono, size) > width) {
    chars.pop()
  }

  return `${chars.join('')}…`
}

// The room a reply gives a card, from the width the desktop reports in cells of its code
// font, kept to a range a card reads well at. Measured against the desktop's reply column,
// a reported cell is about 7.2px (6.4 drew cards at about 88% of the column). A card drawn
// a little wider than the column is scaled down to fit it, since cards leave their size to
// the markup, so this errs wide rather than leaving the column's right side empty.
const PX_PER_COLUMN = 7.2

export const cardWidth = (columns: number, min = 480, max = 1600): number =>
  Math.round(Math.min(max, Math.max(min, columns * PX_PER_COLUMN)))

// Rows that rise in one after another, honouring reduced motion.
export const MOTION = [
  '.rise{opacity:0;animation:rise .45s cubic-bezier(.2,.8,.2,1) forwards}',
  '.card{animation:fade .3s ease-out}',
  '@keyframes rise{from{opacity:0;transform:translateY(5px)}to{opacity:1}}',
  '@keyframes fade{from{opacity:0}to{opacity:1}}',
  '@media (prefers-reduced-motion:reduce){.rise,.card{animation:none;opacity:1}}',
].join('')

export const riseDelay = (index: number, stepMs: number, startMs = 80): string =>
  `style="animation-delay:${startMs + index * stepMs}ms"`

const RADIUS = 12

// The room a card leaves in its top-right corner for a Copy button laid over it.
export const CONTROL_SLOT = 84

// Where a header's labels centre: the line the Copy button laid over a card sits on,
// one text row down from the card's top edge.
export const HEADER_MID = 29

// What a card is drawn in and how wide; `hasControl` leaves the header's right corner
// free for a Copy button laid over it.
export type CardFrame = { palette: Palette; width: number; hasControl?: boolean }

export type CardShell = { width: number; height: number; palette: Palette; style?: string; body: string }

// The card: a rounded hairline outline, with everything inside clipped to its corners.
export function svgCard({ width, height, palette, style = '', body }: CardShell): string {
  // Unique per size, so cards placed together in one document keep their own corners.
  const clip = `corners-${width}x${height}`

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<defs><clipPath id="${clip}"><rect width="${width}" height="${height}" rx="${RADIUS}"/></clipPath></defs>`,
    // Sans for text that names no font of its own: a CSS rule on all text would beat the
    // monospace attribute on code, paths and output.
    `<style>text{fill:${palette.fg}}text:not([font-family]){font-family:${FONT}}${MOTION}${style}</style>`,
    `<g class="card"><g clip-path="url(#${clip})">${body}</g>`,
    `<rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="${RADIUS - 0.5}" fill="none" stroke="${palette.fg}" stroke-opacity=".16"/></g>`,
    `</svg>`,
  ].join('')
}

// A band behind a row, as a faint tint of the text colour, so it reads on any page.
export type Band = { y: number; width: number; height: number; opacity?: number }

export const tint = (palette: Palette, { y, width, height, opacity = 0.05 }: Band): string =>
  `<rect y="${y}" width="${width}" height="${height}" fill="${palette.fg}" fill-opacity="${opacity}"/>`

// A small rounded label, such as `exit 0` or `new file`, right-aligned at `right`.
export type Pill = { right: number; y: number; text: string; color: string }

export function pill(palette: Palette, { right, y, text, color }: Pill): string {
  const width = Math.ceil(measure(text, true, 11) + 16)
  const left = right - width

  return `<rect x="${left}" y="${y}" width="${width}" height="20" rx="10" fill="${color}" fill-opacity=".14"/><text x="${left + width / 2}" y="${y + 14}" text-anchor="middle" font-family="${MONO}" font-size="11" style="fill:${color}">${escape(text)}</text>`
}

export type Place = { x: number; y: number; size: number; color: string }

export const strokeIcon = (path: string, { x, y, size, color }: Place): string =>
  `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</g>`
