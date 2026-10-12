import { themeCss } from './tidemark'
import type { Mode, Neutral, Role } from './tidemark'
import { upper } from './lang'

// Svg building blocks of the Tidemark language (DESIGN.md §3–§5): text, pills, eyebrows, icon
// tiles, badges and bars. Every color is a CSS variable, so one drawing serves both themes.

export type Ink = Neutral | Role | `${Role}-t` | `${Role}-l`
export type Font = { size: number; weight?: number; isMono?: boolean; spacing?: number }
export type Drawn = { svg: string; width: number }
export type IconName = 'check' | 'x' | 'bell' | 'history' | 'flask' | 'clock' | 'play'

export const SANS = `-apple-system, BlinkMacSystemFont, 'SF Pro Text', Inter, system-ui, sans-serif`
export const MONO = `ui-monospace, 'SF Mono', Menlo, monospace`
// Roughly how wide a reported column of the desktop surface is, erring small so nothing overflows.
export const PX_PER_COLUMN = 7

const MONO_EM = 0.6
const BOLD_FROM = 600
const BOLD_WIDEN = 1.06
const ICON_GRID = 24
const PILL_H = 20
const PILL_PAD = 9
const PILL_GLYPH = 10
const PILL_FONT: Font = { size: 11.5, weight: 600 }
const EYEBROW_FONT: Font = { size: 10.5, weight: 700, spacing: 1.05 }
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
const NARROW_EM = 0.3
const WIDE_EM = 0.72
const OTHER_EM = 0.56

function charEm(ch: string): number {
  if (/[\s.,:;'|!il1()[\]ıjtf`]/.test(ch)) return NARROW_EM

  return /[A-ZÇĞİÖŞÜmwMW@%]/.test(ch) ? WIDE_EM : OTHER_EM
}
export { upper }

export function measure(text: string, font: Font): number {
  const chars = [...text]
  const em = font.isMono === true ? chars.length * MONO_EM : chars.reduce((sum, ch) => sum + charEm(ch), 0)
  const widen = (font.weight ?? 0) >= BOLD_FROM ? BOLD_WIDEN : 1

  return em * font.size * widen + chars.length * (font.spacing ?? 0)
}

// Cuts `text` to `width` pixels with an ellipsis.
export function fit(text: string, width: number, font: Font): string {
  if (measure(text, font) <= width) return text
  const chars = [...text]
  while (chars.length > 1 && measure(`${chars.join('')}…`, font) > width) chars.pop()

  return `${chars.join('')}…`
}

// Like `fit`, but cuts from the start so the end survives (paths).
export function fitStart(text: string, width: number, font: Font): string {
  if (measure(text, font) <= width) return text
  const chars = [...text]
  while (chars.length > 1 && measure(`…${chars.join('')}`, font) > width) chars.shift()

  return `…${chars.join('')}`
}

// A word wider than the line is broken between characters: error text holds long paths and tokens.
function breakWord(word: string, width: number, font: Font): string[] {
  const pieces: string[] = []
  let piece = ''
  for (const ch of word) {
    if (piece !== '' && measure(piece + ch, font) > width) {
      pieces.push(piece)
      piece = ''
    }
    piece += ch
  }

  return piece === '' ? pieces : [...pieces, piece]
}

// Lays `text` into lines of `width` pixels; only past `maxLines` does the last line end in an ellipsis.
export function wrapText(text: string, box: { width: number; font: Font; maxLines: number }): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean).flatMap(part => breakWord(part, box.width, box.font))) {
    const tried = line === '' ? word : `${line} ${word}`
    if (line !== '' && measure(tried, box.font) > box.width) {
      lines.push(line)
      line = word
    } else line = tried
  }
  if (line !== '') lines.push(line)
  if (lines.length <= box.maxLines) return lines
  const kept = lines.slice(0, box.maxLines)
  kept[box.maxLines - 1] = fit(`${kept[box.maxLines - 1]} ${lines[box.maxLines]}`, box.width, box.font)

  return kept
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

export function icon(name: IconName, at: { x: number; y: number; size: number; ink: Ink; stroke?: number }): string {
  const scale = at.size / ICON_GRID
  const width = (at.stroke ?? 1.75) / scale

  return `<g transform="translate(${px(at.x)} ${px(at.y)}) scale(${scale})" fill="none" stroke-width="${px(width)}" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--${at.ink})">${ICONS[name]}</g>`
}

export type PillSpec = { x: number; y: number; label: string; role: Role | 'neutral'; glyph?: 'check' | 'x' | 'pulse' }

// h20 rx10: tint fill, line stroke, fg label; a neutral pill is inset fill with mid text.
export function pill(spec: PillSpec): Drawn {
  const isNeutral = spec.role === 'neutral'
  const fg: Ink = isNeutral ? 'mid' : (spec.role as Role)
  const lead = spec.glyph === undefined ? PILL_PAD : PILL_PAD + PILL_GLYPH + 5
  const width = Math.round(lead + measure(spec.label, PILL_FONT) + PILL_PAD)
  const mid = spec.y + PILL_H / 2
  const shell = rect({ x: spec.x + 0.5, y: spec.y + 0.5, w: width - 1, h: PILL_H - 1, rx: PILL_H / 2, fill: isNeutral ? 'inset' : `${spec.role as Role}-t`, stroke: isNeutral ? 'line' : `${spec.role as Role}-l` })
  let glyph = ''
  if (spec.glyph === 'pulse') glyph = `<circle class="breathe" cx="${px(spec.x + PILL_PAD + 4)}" cy="${px(mid)}" r="3.5" style="fill:var(--${fg})"/>`
  else if (spec.glyph !== undefined) glyph = icon(spec.glyph, { x: spec.x + PILL_PAD - 1, y: mid - 6, size: 12, ink: fg, stroke: 2 })
  const label = text({ ...PILL_FONT, x: spec.x + lead, y: mid + 4, text: spec.label, ink: fg })

  return { svg: shell + glyph + label, width }
}

// The card opener: a 6px role notch, the tracked uppercase label, a hairline, and meta on the right.
export function eyebrow(spec: { x: number; y: number; width: number; label: string; role: Role; meta?: string; isLive?: boolean }): string {
  const label = upper(spec.label)
  const labelEnd = spec.x + 13 + measure(label, EYEBROW_FONT)
  const meta = spec.meta ?? ''
  const metaStart = spec.x + spec.width - measure(meta, { size: 11 }) - (meta === '' ? 0 : 10)
  const notch = rect({ x: spec.x, y: spec.y - 7.5, w: 6, h: 6, rx: 1.5, fill: spec.role, className: spec.isLive === true ? 'breathe' : undefined })
  const hair = metaStart - labelEnd > 16 ? line({ x1: labelEnd + 8, y1: spec.y - 4, x2: metaStart, y2: spec.y - 4, ink: 'line' }) : ''
  const right = meta === '' ? '' : text({ size: 11, x: spec.x + spec.width, y: spec.y, text: meta, ink: 'lo', anchor: 'end' })

  return notch + text({ ...EYEBROW_FONT, x: spec.x + 13, y: spec.y, text: label, ink: spec.role }) + hair + right
}

const BADGE_ROLE: Record<string, Role> = {
  ts: 'amber', tsx: 'amber', js: 'amber', jsx: 'amber', mjs: 'amber', cjs: 'amber', py: 'tide', md: 'iris', txt: 'iris',
  json: 'moss', csv: 'moss', yaml: 'moss', yml: 'moss', pdf: 'flare', png: 'orchid', jpg: 'orchid', svg: 'orchid',
}

// 26×16 file-type badge: the extension in mono caps on its type's tint.
export function fileBadge(spec: { x: number; y: number; path: string }): string {
  const name = spec.path.split('/').pop() ?? spec.path
  const dot = name.lastIndexOf('.')
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
  const role = BADGE_ROLE[ext]
  const label = upper(ext === '' ? '·' : ext.slice(0, 3))
  const box = rect({ x: spec.x, y: spec.y, w: 26, h: 16, rx: 4, fill: role === undefined ? 'inset' : `${role}-t`, stroke: role === undefined ? 'line' : undefined })

  return box + text({ size: 9.5, weight: 700, isMono: true, x: spec.x + 13, y: spec.y + 11.5, text: label, ink: role ?? 'lo', anchor: 'middle' })
}

// A highlight span: tint behind fg text, hugging the glyphs (DESIGN.md §4).
export function highlight(spec: { x: number; y: number; text: string; role: Role; font: Font }): Drawn {
  const width = Math.round(measure(spec.text, spec.font) + 8)
  const box = rect({ x: spec.x, y: spec.y - spec.font.size - 1, w: width, h: spec.font.size + 7, rx: 3, fill: `${spec.role}-t` })

  return { svg: box + text({ ...spec.font, x: spec.x + 4, y: spec.y, text: spec.text, ink: spec.role }), width }
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
