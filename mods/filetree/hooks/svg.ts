// Vector pieces for the desktop pane: text measuring, the palette as CSS classes, icons,
// the icon box, badges and pills. Pure strings; the hooks module wraps them in Svg.

import type { Look } from '../types'
import { DARK, LIGHT, type Palette, paletteOf, type Role } from './theme'

export const FONT = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`
export const MONO = `ui-monospace, 'SF Mono', Menlo, monospace`
const BOLD_WIDTH = 1.07

export type Font = { size: number; isBold?: boolean }
export type Pt = { x: number; y: number }

export const escape = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Width of a string in pixels, close enough to lay out a row without a renderer.
export function measure(text: string, size: number, isBold = false): number {
  const plain = [...text].reduce((sum, ch) => {
    if ('iljtfıI.,:;|!\'` '.includes(ch)) return sum + size * 0.3
    if ('mwMW@%'.includes(ch)) return sum + size * 0.84
    return sum + (ch >= 'A' && ch <= 'Z' ? size * 0.65 : size * 0.55)
  }, 0)
  return isBold ? plain * BOLD_WIDTH : plain
}

// Cuts the middle out of a name that does not fit, so its extension stays readable.
export function fitMiddle(text: string, width: number, font: Font): string {
  const { size, isBold = false } = font
  if (measure(text, size, isBold) <= width) return text
  const chars = [...text]
  let keep = chars.length - 1
  while (keep > 2) {
    const head = Math.ceil(keep / 2)
    const cut = `${chars.slice(0, head).join('')}…${chars.slice(chars.length - (keep - head)).join('')}`
    if (measure(cut, size, isBold) <= width) return cut
    keep -= 1
  }
  return `${chars[0] ?? ''}…`
}

const ROLE_NAMES = Object.keys(DARK.roles) as Role[]

function rules(p: Palette): string {
  const base = `.hi{fill:${p.hi}}.mid{fill:${p.mid}}.lo{fill:${p.lo}}.card{fill:${p.card};stroke:${p.line}}.rule{stroke:${p.line}}`
  const roles = ROLE_NAMES.map(r => {
    const c = p.roles[r]
    return `.f-${r}{fill:${c.fg}}.t-${r}{fill:${c.tint}}.l-${r}{stroke:${c.line}}.s-${r}{stroke:${c.fg}}`
  })
  return base + roles.join('')
}

// The palette as classes. Following the system (`isAuto`), both schemes ride along, so
// the drawing turns with the app; a theme the person named is drawn as named.
export function style(look: Look): string {
  const fonts = `text{font-family:${FONT}}.num{font-family:${MONO};font-variant-numeric:tabular-nums}`
  const motion = '@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}'
  const scheme = look.isAuto
    ? `@media (prefers-color-scheme: light){${rules(LIGHT)}}@media (prefers-color-scheme: dark){${rules(DARK)}}`
    : ''
  return `<style>${fonts}${rules(paletteOf(look.isLight))}${scheme}${motion}</style>`
}

export const svgDoc = ({ width, height }: { width: number; height: number }, look: Look, body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${style(look)}${body}</svg>`

export type IconName = 'eye' | 'pencil' | 'check' | 'sparkle' | 'branch'

// Original line icons on a 24-unit grid.
const ICONS: Record<IconName, string> = {
  eye: '<path d="M2.5 12c2.2-4.3 5.4-6.5 9.5-6.5s7.3 2.2 9.5 6.5c-2.2 4.3-5.4 6.5-9.5 6.5S4.7 16.3 2.5 12z"/><circle cx="12" cy="12" r="3.2"/>',
  pencil: '<path d="M15.2 4.8l4 4L8.6 19.4 3.8 20.2l.8-4.8z"/><path d="M13 7l4 4"/>',
  check: '<path d="M4.5 12.8l4.6 4.4L19.5 6.8"/>',
  sparkle: '<path d="M12 3.5c.7 4.6 3 6.9 7.5 7.5-4.5.6-6.8 2.9-7.5 7.5-.7-4.6-3-6.9-7.5-7.5 4.5-.6 6.8-2.9 7.5-7.5z"/>',
  branch: '<circle cx="6.5" cy="5.5" r="2.2"/><circle cx="6.5" cy="18.5" r="2.2"/><circle cx="17.5" cy="7.5" r="2.2"/><path d="M6.5 7.7v8.6M17.5 9.7c0 4.6-5.2 4.2-9.6 7.2"/>',
}

export function icon(name: IconName, { x, y, size }: Pt & { size: number }, role: Role): string {
  const scale = size / 24
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" class="s-${role}" stroke-width="${1.8 / Math.max(scale, 0.6)}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</g>`
}

// DESIGN.md's icon box: a rounded square in the role's tint, the line icon in its color.
export const ICON_BOX = 38

export const iconBox = (name: IconName, { x, y }: Pt, role: Role): string =>
  `<rect x="${x}" y="${y}" width="${ICON_BOX}" height="${ICON_BOX}" rx="10" class="t-${role}"/>${icon(name, { x: x + 9.5, y: y + 9.5, size: 19 }, role)}`

export const BADGE_H = 16

export function badgeWidth(label: string): number {
  return Math.max(26, Math.ceil(measure(label, 9.5, true) + 10))
}

export function badge(label: string, { x, y }: Pt, role: Role): string {
  const w = badgeWidth(label)
  return `<rect x="${x}" y="${y}" width="${w}" height="${BADGE_H}" rx="4" class="t-${role}"/><text x="${x + w / 2}" y="${y + 11.5}" text-anchor="middle" font-size="9.5" font-weight="700" class="num f-${role}">${escape(label)}</text>`
}

export const PILL_H = 20

export const pillWidth = (text: string): number => Math.ceil(measure(text, 11, true) + 18)

// A status pill whose right edge sits at `right`.
export function pill(text: string, { right, y }: { right: number; y: number }, role: Role): string {
  const w = pillWidth(text)
  const x = right - w
  return `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${PILL_H - 1}" rx="${(PILL_H - 1) / 2}" class="t-${role} l-${role}"/><text x="${x + w / 2}" y="${y + 14}" text-anchor="middle" font-size="11" font-weight="600" class="f-${role}">${escape(text)}</text>`
}

export const eyebrowText = (text: string, { x, y, anchor = 'start' }: Pt & { anchor?: string }, cls: string): string =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="10.5" font-weight="700" letter-spacing="1.05" class="${cls}">${escape(text)}</text>`
