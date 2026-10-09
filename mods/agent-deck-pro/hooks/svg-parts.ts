// Small Svg pieces the deck composes: eyebrow, pill, monogram chip, status dot, signal bars,
// phase dots and the icon box. Each returns markup; the ones that take room return their width.
import type { RoleName } from './theme'
import type { WorkPhase } from '../types'

export type Piece = { svg: string; width: number }

export type DotState = 'running' | 'waiting' | 'stuck' | 'done' | 'failed'

const PILL_HEIGHT = 20
const PILL_PAD = 9
const CHIP = 16
const NOTCH = 6
const BAR_WIDTH = 3
const BAR_GAP = 2
const BAR_HEIGHTS = [4, 7, 10]
const PHASES: WorkPhase[] = ['explore', 'edit', 'test', 'report']
const PHASE_STEP = 13
const PHASE_RADIUS = 3.5
// Line icons on a 24 grid, drawn original for the deck.
export const ICONS = {
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  flask: '<path d="M9.5 3.5h5"/><path d="M10.5 3.5v5.2L5.2 18a1.6 1.6 0 0 0 1.4 2.5h10.8a1.6 1.6 0 0 0 1.4-2.5l-5.3-9.3V3.5"/><path d="M8 14.5h8"/>',
  cross: '<circle cx="12" cy="12" r="8.5"/><path d="M9 9l6 6M15 9l-6 6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
}

export function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function num(value: number): string {
  return String(Math.round(value * 10) / 10)
}

// A width close enough to lay out a row without a renderer (system sans; mono is 0.6em a glyph).
export function measure(text: string, size: number, isMono = false): number {
  if (isMono) return [...text].length * size * 0.6

  return [...text].reduce((sum, char) => {
    if ('iljtfrI.,:;|!\'` ·'.includes(char)) return sum + size * 0.3
    if ('mwMW@%'.includes(char)) return sum + size * 0.84

    return sum + (char >= 'A' && char <= 'Z' ? size * 0.66 : size * 0.56)
  }, 0)
}

export function fit(text: string, width: number, size: number, isMono = false): string {
  if (measure(text, size, isMono) <= width) return text
  const chars = [...text]
  while (chars.length > 1 && measure(`${chars.join('')}…`, size, isMono) > width) chars.pop()

  return `${chars.join('')}…`
}

export function upper(text: string): string {
  return text.toLocaleUpperCase('tr')
}

type EyebrowSpec = { x: number; y: number; width: number; label: string; role: RoleName | null; meta?: string }

// Notch, tracked uppercase label, a hairline to the meta on the right.
export function eyebrow(spec: EyebrowSpec): string {
  const { x, y, width, role } = spec
  const label = upper(spec.label)
  const color = role === null ? 'lo' : `fg-${role}`
  const labelEnd = x + NOTCH + 6 + measure(label, 10.5) * 1.12
  const meta = spec.meta ?? ''
  const metaStart = x + width - measure(meta, 11.5)
  const rule = metaStart - 10 > labelEnd + 10 ? `<rect x="${num(labelEnd + 8)}" y="${num(y - 4)}" width="${num(metaStart - labelEnd - 18)}" height="1" class="f-line"/>` : ''
  const metaText = meta === '' ? '' : `<text x="${num(x + width)}" y="${num(y)}" text-anchor="end" class="lb lo">${esc(meta)}</text>`

  return `<rect x="${num(x)}" y="${num(y - 7.5)}" width="${NOTCH}" height="${NOTCH}" rx="1.5" class="${role === null ? 'f-strong' : `fg-${role}`}"/><text x="${num(x + NOTCH + 6)}" y="${num(y)}" class="eb ${color}">${esc(label)}</text>${rule}${metaText}`
}

type PillSpec = { x: number; y: number; text: string; role: RoleName; anchor?: 'start' | 'end' }

export function pill(spec: PillSpec): Piece {
  const width = Math.ceil(measure(spec.text, 11) + PILL_PAD * 2)
  const left = spec.anchor === 'end' ? spec.x - width : spec.x
  const svg = `<rect x="${num(left + 0.5)}" y="${num(spec.y + 0.5)}" width="${width - 1}" height="${PILL_HEIGHT - 1}" rx="${PILL_HEIGHT / 2}" class="bg-${spec.role} ln-${spec.role}"/><text x="${num(left + width / 2)}" y="${num(spec.y + 14)}" text-anchor="middle" style="font-size:11px;font-weight:600" class="fg-${spec.role}">${esc(spec.text)}</text>`

  return { svg, width }
}

export function chip(spec: { x: number; y: number; glyph: string; role: RoleName }): Piece {
  const svg = `<rect x="${num(spec.x)}" y="${num(spec.y)}" width="${CHIP}" height="${CHIP}" rx="4" class="bg-${spec.role}"/><text x="${num(spec.x + CHIP / 2)}" y="${num(spec.y + 11.5)}" text-anchor="middle" style="font-size:10px;font-weight:700" class="num fg-${spec.role}">${esc(spec.glyph)}</text>`

  return { svg, width: CHIP }
}

const CHECK = (cx: number, cy: number, role: RoleName) =>
  `<path d="M${num(cx - 3.5)} ${num(cy)}l2.4 2.4 4.6-5" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="st-${role}"/>`
const CROSS = (cx: number, cy: number) =>
  `<path d="M${num(cx - 3)} ${num(cy - 3)}l6 6M${num(cx + 3)} ${num(cy - 3)}l-6 6" stroke-width="1.8" stroke-linecap="round" class="st-danger"/>`

// 8px status dot: live breathes Iris, needs-you gets an Amber ring, done is a Moss check.
export function statusDot(spec: { cx: number; cy: number; state: DotState }): string {
  const { cx, cy, state } = spec
  if (state === 'done') return CHECK(cx, cy, 'ok')
  if (state === 'failed') return CROSS(cx, cy)
  if (state === 'running') return `<circle cx="${num(cx)}" cy="${num(cy)}" r="4" class="fg-run breathe"/>`
  const ring = `<circle cx="${num(cx)}" cy="${num(cy)}" r="6.5" fill="none" stroke-width="1.2" class="st-warn" opacity=".55"/>`

  return `${state === 'stuck' ? ring : ''}<circle cx="${num(cx)}" cy="${num(cy)}" r="4" class="fg-warn"/>`
}

// Three bars for the model tier, so tier never needs a color.
export function signalBars(spec: { x: number; baseline: number; level: number }): Piece {
  const svg = BAR_HEIGHTS.map((height, index) => {
    const lit = index < spec.level ? 'f-mid' : 'track'

    return `<rect x="${num(spec.x + index * (BAR_WIDTH + BAR_GAP))}" y="${num(spec.baseline - height)}" width="${BAR_WIDTH}" height="${height}" rx="1" class="${lit}"/>`
  }).join('')

  return { svg, width: BAR_HEIGHTS.length * (BAR_WIDTH + BAR_GAP) - BAR_GAP }
}

// Four phase dots joined by a hairline: done Moss, the active one an Iris ring with a breathing core.
export function phaseDots(spec: { x: number; cy: number; phase: WorkPhase; isLive: boolean }): Piece {
  const reached = PHASES.indexOf(spec.phase)
  const xs = PHASES.map((_, index) => spec.x + PHASE_RADIUS + index * PHASE_STEP)
  const line = `<rect x="${num(xs[0] ?? spec.x)}" y="${num(spec.cy - 0.5)}" width="${num(PHASE_STEP * (PHASES.length - 1))}" height="1" class="f-line"/>`
  const dots = xs.map((cx, index) => {
    if (index < reached || (index === reached && !spec.isLive)) return `<circle cx="${num(cx)}" cy="${num(spec.cy)}" r="${PHASE_RADIUS}" class="fg-ok"/>`
    if (index === reached) {
      return `<circle cx="${num(cx)}" cy="${num(spec.cy)}" r="${PHASE_RADIUS + 0.6}" class="bg-run st-run" stroke-width="1.3"/><circle cx="${num(cx)}" cy="${num(spec.cy)}" r="1.6" class="fg-run breathe"/>`
    }

    return `<circle cx="${num(cx)}" cy="${num(spec.cy)}" r="${PHASE_RADIUS - 0.4}" class="card strong" stroke-width="1.2"/>`
  })

  return { svg: line + dots.join(''), width: PHASE_STEP * (PHASES.length - 1) + PHASE_RADIUS * 2 }
}

export function iconBox(spec: { x: number; y: number; size: number; role: RoleName; icon: keyof typeof ICONS }): string {
  const glyph = 18
  const offset = (spec.size - glyph) / 2

  return `<rect x="${num(spec.x)}" y="${num(spec.y)}" width="${spec.size}" height="${spec.size}" rx="9" class="bg-${spec.role}"/><g transform="translate(${num(spec.x + offset)} ${num(spec.y + offset)}) scale(${glyph / 24})" fill="none" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="st-${spec.role}">${ICONS[spec.icon]}</g>`
}
