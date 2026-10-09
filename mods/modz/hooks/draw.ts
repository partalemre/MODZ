// The desktop pane's Svg: the head, a group's eyebrow and one row per mod (monogram tile, name,
// version pill, surface and source badges, health dot, one line of description).
import type { ModInfo } from './catalog'
import { monogram } from './meta'
import { svgDoc } from './theme'
import type { RoleName, Theme } from './theme'

export type Drawing = { source: string; alt: string; height: number }

const HEAD = 48
const GROUP = 22
const ROW = 54
const TILE = 36
const TEXT_X = TILE + 12
const PILL = 18
const PILL_PAD = 8
const GAP = 6
const NOTCH = 6

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function measure(text: string, size: number): number {
  return [...text].reduce((sum, char) => sum + size * ('iljtfrI.,:;|!/ ·'.includes(char) ? 0.33 : char >= 'A' && char <= 'Z' ? 0.68 : 0.6), 0)
}

function fit(text: string, width: number, size: number): string {
  if (measure(text, size) <= width) return text
  const chars = [...text]
  while (chars.length > 1 && measure(`${chars.join('')}…`, size) > width) chars.pop()

  return `${chars.join('')}…`
}

function eyebrow(spec: { y: number; width: number; label: string; role: RoleName | null; meta: string }): string {
  const label = spec.label.toLocaleUpperCase('tr')
  const end = NOTCH + 6 + measure(label, 10.5) * 1.12
  const metaStart = spec.width - measure(spec.meta, 12)
  const notch = spec.role === null ? 'f-strong' : `fg-${spec.role}`
  const rule = metaStart - end > 24 ? `<rect x="${end + 8}" y="${spec.y - 4}" width="${metaStart - end - 16}" height="1" class="f-line"/>` : ''

  return `<rect x="0.5" y="${spec.y - 7.5}" width="${NOTCH}" height="${NOTCH}" rx="1.5" class="${notch}"/><text x="${NOTCH + 6.5}" y="${spec.y}" class="eb ${spec.role === null ? 'lo' : `fg-${spec.role}`}">${esc(label)}</text>${rule}<text x="${spec.width}" y="${spec.y}" text-anchor="end" class="lb lo">${esc(spec.meta)}</text>`
}

type PillSpec = { right: number; y: number; text: string; role: RoleName | null; isMono?: boolean; isLeft?: boolean }

// A badge whose right edge is at `right` (its left edge, given `isLeft`); neutral without a role.
function pill(spec: PillSpec): { svg: string; width: number } {
  const width = Math.ceil(measure(spec.text, 10.5) * (spec.isMono === true ? 1.12 : 1) + PILL_PAD * 2)
  const x = spec.isLeft === true ? spec.right : spec.right - width
  const frame = spec.role === null ? 'inset line' : `bg-${spec.role} ln-${spec.role}`
  const ink = spec.role === null ? 'mid' : `fg-${spec.role}`
  const font = spec.isMono === true ? ' num' : ''

  return {
    svg: `<rect x="${x + 0.5}" y="${spec.y + 0.5}" width="${width - 1}" height="${PILL - 1}" rx="${PILL / 2}" class="${frame}"/><text x="${x + width / 2}" y="${spec.y + 12.5}" text-anchor="middle" style="font-size:10.5px;font-weight:600" class="${ink}${font}">${esc(spec.text)}</text>`,
    width,
  }
}

export function headSvg(spec: { width: number; theme: Theme; title: string; meta: string }): Drawing {
  const body = eyebrow({ y: 12, width: spec.width, label: 'MODZ', role: 'edit', meta: spec.meta }) + `<text x="0" y="40" class="hl hi">${esc(spec.title)}</text>`

  return { source: svgDoc({ width: spec.width, height: HEAD, theme: spec.theme, body }), alt: `MODZ: ${spec.title}`, height: HEAD }
}

export function groupSvg(spec: { width: number; theme: Theme; label: string; count: number }): Drawing {
  const body = eyebrow({ y: 15, width: spec.width, label: spec.label, role: null, meta: `${spec.count} mod` })

  return { source: svgDoc({ width: spec.width, height: GROUP, theme: spec.theme, body }), alt: `${spec.label}: ${spec.count} mod`, height: GROUP }
}

function healthDot(mod: ModInfo, cx: number): string {
  if (!mod.isHealthy) return `<path d="M${cx - 3} 17l6 6M${cx + 3} 17l-6 6" stroke-width="1.8" stroke-linecap="round" class="st-danger"/>`
  // Off is a hollow ring, unknown a dashed one; only a known-on mod gets the green dot.
  if (mod.isEnabled !== true) return `<circle cx="${cx}" cy="20" r="3.5" fill="none" stroke-width="1.3"${mod.isEnabled === null ? ' stroke-dasharray="2 1.6"' : ''} class="strong"/>`

  return `<circle cx="${cx}" cy="20" r="4" class="fg-ok"/>`
}

// Right side of line one, right to left: health, source, surfaces, version.
function badges(mod: ModInfo, width: number): { svg: string; left: number } {
  let right = width - 16
  const parts: string[] = [healthDot(mod, width - 5)]
  const add = (spec: Omit<PillSpec, 'right' | 'y'>) => {
    const piece = pill({ ...spec, right, y: 11 })
    parts.push(piece.svg)
    right -= piece.width + GAP
  }
  add(mod.upstream === null ? { text: 'MODZ', role: 'edit' } : { text: `asıl: ${mod.upstream}`, role: null })
  for (const surface of [...mod.surfaces].reverse()) add({ text: surface, role: null })

  return { svg: parts.join(''), left: right }
}

function stateLabel(mod: ModInfo): string {
  if (!mod.isHealthy) return 'sağlıksız'
  if (mod.isEnabled === null) return 'durum bilinmiyor'

  return mod.isEnabled ? 'sağlıklı' : 'kapalı'
}

export function rowSvg(spec: { width: number; theme: Theme; mod: ModInfo }): Drawing {
  const { mod, width } = spec
  const right = badges(mod, width)
  const nameWidth = Math.min(measure(mod.name, 14) * 1.04, right.left - TEXT_X - 70)
  const version = pill({ right: TEXT_X + nameWidth + 8, y: 11, text: `v${mod.version}`, role: null, isMono: true, isLeft: true })
  const body = [
    `<rect x="0" y="${(ROW - TILE) / 2 - 2}" width="${TILE}" height="${TILE}" rx="9" class="bg-edit ln-edit"/>`,
    `<text x="${TILE / 2}" y="${(ROW - TILE) / 2 + 21}" text-anchor="middle" style="font-size:13px;font-weight:700;letter-spacing:.04em" class="num fg-edit">${esc(monogram(mod.name))}</text>`,
    `<text x="${TEXT_X}" y="24" style="font-size:14px;font-weight:600" class="${mod.isEnabled === false ? 'lo' : 'hi'}">${esc(fit(mod.name, nameWidth + 4, 14))}</text>`,
    version.svg,
    right.svg,
    `<text x="${TEXT_X}" y="44" class="lb lo">${esc(fit(mod.description, width - TEXT_X - 8, 12))}</text>`,
  ].join('')
  const source = mod.upstream === null ? 'MODZ' : `asıl: ${mod.upstream}`
  const state = stateLabel(mod)
  const alt = `${mod.name} v${mod.version} · ${mod.surfaces.join(', ')} · ${source} · ${state} · ${mod.description}`

  return { source: svgDoc({ width, height: ROW, theme: spec.theme, body }), alt, height: ROW }
}
