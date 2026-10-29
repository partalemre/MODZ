import { themeCss } from './tidemark'
import type { Mode, Neutral, Role } from './tidemark'

// Svg building blocks of the Tidemark language (DESIGN.md §3–§5): text, shapes and bare line
// icons. Every color is a CSS variable, so one drawing serves both themes.

export type Ink = Neutral | Role | `${Role}-t` | `${Role}-l`
export type Font = { size: number; weight?: number; isMono?: boolean; spacing?: number }
export type IconName = 'check' | 'x' | 'bell' | 'history' | 'flask' | 'clock' | 'play'

export const SANS = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`
export const MONO = `ui-monospace, 'SF Mono', Menlo, monospace`
// Roughly how wide a reported column of the desktop surface is, erring small so nothing overflows.
export const PX_PER_COLUMN = 7

const MONO_EM = 0.6
const BOLD_FROM = 600
const BOLD_WIDEN = 1.06
const ICON_GRID = 24
const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
const MOTION = [
  '@keyframes tm-breathe{0%,100%{opacity:1}50%{opacity:.45}}.breathe{animation:tm-breathe 1.8s ease-in-out infinite}',
  '@keyframes tm-shimmer{0%,100%{opacity:.5}50%{opacity:1}}.shimmer{animation:tm-shimmer 1.4s linear infinite}',
  '@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}',
].join('')

const ICONS: Record<IconName, string> = {
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  bell: '<path d="M18 16.5V11a6 6 0 1 0-12 0v5.5l-1.5 2h15z"/><path d="M10 21.2a2.3 2.3 0 0 0 4 0"/>',
  history: '<path d="M4.6 12.4a7.5 7.5 0 1 0 2.3-5.6"/><path d="M4.5 4.2v4.3h4.3"/><path d="M12 8.2V12l2.8 1.8"/>',
  flask: '<path d="M9.5 3.5h5M10.5 3.5v6.2L5.3 18.4a1.5 1.5 0 0 0 1.3 2.1h10.8a1.5 1.5 0 0 0 1.3-2.1l-5.2-8.7V3.5"/><path d="M7.6 15h8.8"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.8V12l3 2"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
}

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

  return em * font.size * widen + chars.length * (font.spacing ?? 0)
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
  if (spec.spacing !== undefined) attrs.push(`letter-spacing="${spec.spacing}"`)
  if (spec.isMono === true) attrs.push('class="mono"')

  return `<text ${attrs.join(' ')} style="fill:var(--${spec.ink})">${esc(spec.text)}</text>`
}

export type Run = { text: string; ink: Ink; weight?: number; size?: number; isMono?: boolean }

// One line of differently inked runs; the renderer places each run after the last.
export function runs(spec: { x: number; y: number; size: number; parts: Run[] }): string {
  const spans = spec.parts.map(part => {
    const weight = (part.weight === undefined ? '' : ` font-weight="${part.weight}"`) + (part.size === undefined ? '' : ` font-size="${part.size}"`)
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

export function icon(name: IconName, at: { x: number; y: number; size: number; ink: Ink; stroke?: number }): string {
  const scale = at.size / ICON_GRID
  const width = (at.stroke ?? 1.75) / scale

  return `<g transform="translate(${px(at.x)} ${px(at.y)}) scale(${scale})" fill="none" stroke-width="${px(width)}" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--${at.ink})">${ICONS[name]}</g>`
}
