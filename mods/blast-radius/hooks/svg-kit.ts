// Small vector pieces: escaping, text measuring, original line icons on a 24 grid, the icon tile.

export const escape = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const NARROW = 'iljtfrI.,:;|!\'` ·'
const WIDE = 'mwMWğĞ@%'
const MONO_ADVANCE = 0.6
const NARROW_ADVANCE = 0.3
const WIDE_ADVANCE = 0.82
const CAP_ADVANCE = 0.64
const BODY_ADVANCE = 0.54
const BOLD_GAIN = 1.06

// Width of a string in px, close enough to lay out a row without a renderer.
export function measure(text: string, spec: { size: number; isMono?: boolean; isBold?: boolean }): number {
  const gain = spec.isBold ? BOLD_GAIN : 1
  if (spec.isMono) return [...text].length * spec.size * MONO_ADVANCE * gain
  const width = [...text].reduce((sum, char) => {
    if (NARROW.includes(char)) return sum + spec.size * NARROW_ADVANCE
    if (WIDE.includes(char)) return sum + spec.size * WIDE_ADVANCE
    return sum + spec.size * (char >= 'A' && char <= 'Z' ? CAP_ADVANCE : BODY_ADVANCE)
  }, 0)

  return width * gain
}

export function fit(text: string, width: number, spec: { size: number; isMono?: boolean; isBold?: boolean }): string {
  if (measure(text, spec) <= width) return text
  const chars = [...text]
  while (chars.length > 1 && measure(`${chars.join('')}…`, spec) > width) chars.pop()

  return `${chars.join('')}…`
}

// Keeps both ends of a path: `src/…/button.tsx`.
export function fitMiddle(text: string, width: number, spec: { size: number; isMono?: boolean; isBold?: boolean }): string {
  if (measure(text, spec) <= width) return text
  const chars = [...text]
  let head = Math.ceil(chars.length / 2)
  let tail = chars.length - head
  while (head + tail > 2 && measure(`${chars.slice(0, head).join('')}…${chars.slice(chars.length - tail).join('')}`, spec) > width) {
    if (head >= tail) head -= 1
    else tail -= 1
  }

  return `${chars.slice(0, head).join('')}…${chars.slice(chars.length - tail).join('')}`
}

export type IconName = 'trash' | 'shield' | 'folder' | 'file' | 'rewind' | 'branch' | 'push' | 'database' | 'commit' | 'key' | 'check' | 'pencil'

const ICONS: Record<IconName, string> = {
  trash: '<path d="M4.5 6.8h15"/><path d="M9.6 6.8V5.1c0-.6.5-1.1 1.1-1.1h2.6c.6 0 1.1.5 1.1 1.1v1.7"/><path d="M6.4 6.8l.85 11.5c.08 1.1 1 1.9 2.1 1.9h5.3c1.1 0 2-.8 2.1-1.9l.85-11.5"/><path d="M10.3 10.8v5.4M13.7 10.8v5.4"/>',
  shield: '<path d="M12 3.3l6.6 2.5v5.3c0 4.2-2.7 7.7-6.6 9.3-3.9-1.6-6.6-5.1-6.6-9.3V5.8z"/><path d="M12 8.4v4.4"/><path d="M12 15.8v.2"/>',
  folder: '<path d="M3.6 7.3c0-.95.75-1.7 1.7-1.7h3.9l1.9 2.1h7.6c.95 0 1.7.75 1.7 1.7v8.1c0 .95-.75 1.7-1.7 1.7H5.3c-.95 0-1.7-.75-1.7-1.7z"/>',
  file: '<path d="M6.6 3.6h6.9l4 4v11.1c0 .95-.75 1.7-1.7 1.7H6.6c-.95 0-1.7-.75-1.7-1.7V5.3c0-.95.75-1.7 1.7-1.7z"/><path d="M13.4 3.8v3.9h3.9"/>',
  rewind: '<circle cx="12" cy="12" r="2.4"/><path d="M5.4 8.6a7.6 7.6 0 1 1-.9 4.7"/><path d="M4.6 4.9v3.9h3.9"/>',
  branch: '<circle cx="7" cy="5.8" r="2"/><circle cx="7" cy="18.2" r="2"/><circle cx="17" cy="8.6" r="2"/><path d="M7 7.8v8.4"/><path d="M17 10.6c0 3.4-3.3 4.4-8.4 5.9"/>',
  push: '<path d="M12 20.2V9"/><path d="M7.6 13.2L12 8.8l4.4 4.4"/><path d="M7.6 7.6L12 3.2l4.4 4.4"/>',
  database: '<ellipse cx="12" cy="6.2" rx="6.8" ry="2.7"/><path d="M5.2 6.2v11.6c0 1.5 3 2.7 6.8 2.7s6.8-1.2 6.8-2.7V6.2"/><path d="M5.2 12c0 1.5 3 2.7 6.8 2.7s6.8-1.2 6.8-2.7"/>',
  commit: '<circle cx="12" cy="12" r="3.2"/><path d="M3.5 12h5.3M15.2 12h5.3"/>',
  key: '<circle cx="8.2" cy="15.6" r="3.9"/><path d="M11 12.8l8-8"/><path d="M16.1 7.7l2.4 2.4"/><path d="M13.7 10.1l1.8 1.8"/>',
  check: '<path d="M5.5 12.5l4.2 4.2 8.8-9.2"/>',
  pencil: '<path d="M5 19l.9-3.9L15.6 5.4c.8-.8 2-.8 2.8 0l.2.2c.8.8.8 2 0 2.8l-9.7 9.7z"/><path d="M13.9 7.1l3 3"/><path d="M12.5 19.6h6.5"/>',
}

const STROKE = 1.75
const GRID = 24

/** A line icon at (x, y), `size` px square, stroked with a CSS colour (`var(--danger)`). */
export function icon(name: IconName, at: { x: number; y: number; size: number; color: string }): string {
  const scale = at.size / GRID

  return `<g transform="translate(${at.x} ${at.y}) scale(${scale})" fill="none" style="stroke:${at.color}" stroke-width="${STROKE / scale > 2.4 ? 2.4 : STROKE / scale}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</g>`
}

const TILE_RADIUS = 10
const TILE_ICON = 18

/** The icon tile: a rounded square in the role's tint with its icon in the role's colour. */
export function tile(name: IconName, at: { x: number; y: number; size: number; role: string }): string {
  const inset = (at.size - TILE_ICON) / 2

  return `<rect x="${at.x}" y="${at.y}" width="${at.size}" height="${at.size}" rx="${TILE_RADIUS}" style="fill:var(--${at.role}-tint)"/>${icon(name, { x: at.x + inset, y: at.y + inset, size: TILE_ICON, color: `var(--${at.role})` })}`
}

export const svgOpen = (width: number, height: number): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
