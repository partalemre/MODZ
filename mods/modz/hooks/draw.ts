// The desktop pane's Svg: the head, a group's eyebrow and one row per mod (monogram tile, name,
// version pill, health dot, one line of description and a quiet line of surfaces and source).
import type { ModInfo } from './catalog'
import { monogram } from './meta'
import { svgDoc } from './theme'
import type { RoleName, Theme } from './theme'

export type Drawing = { source: string; alt: string; height: number }

const HEAD = 48
const GROUP = 22
const ROW = 66
const TILE = 36
const TEXT_X = TILE + 12
const PILL = 18
const PILL_PAD = 8
const GAP = 6
const NOTCH = 6
const DOT_ROOM = 16

export function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function measure(text: string, size: number): number {
  return [...text].reduce((sum, char) => sum + size * ('iljtfrI.,:;|!/ ·'.includes(char) ? 0.33 : char >= 'A' && char <= 'Z' ? 0.68 : 0.6), 0)
}

export function fit(text: string, width: number, size: number): string {
  if (measure(text, size) <= width) return text
  const chars = [...text]
  while (chars.length > 1 && measure(`${chars.join('')}…`, size) > width) chars.pop()

  return `${chars.join('')}…`
}

export function eyebrow(spec: { y: number; width: number; label: string; role: RoleName | null; meta: string }): string {
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
  if (!mod.isHealthy) return `<path d="M${cx - 3} 19l6 6M${cx + 3} 19l-6 6" stroke-width="1.8" stroke-linecap="round" class="st-danger"/>`
  // Off is a hollow ring, unknown a dashed one; only a known-on mod gets the green dot.
  if (mod.isEnabled !== true) return `<circle cx="${cx}" cy="22" r="3.5" fill="none" stroke-width="1.3"${mod.isEnabled === null ? ' stroke-dasharray="2 1.6"' : ''} class="strong"/>`

  return `<circle cx="${cx}" cy="22" r="4" class="fg-ok"/>`
}

// The quiet third line: where it draws and where it comes from, as words rather than a row of badges.
function metaLine(mod: ModInfo): string {
  const source = mod.upstream === null ? 'MODZ' : `asıl: ${mod.upstream}`

  return `${mod.surfaces.join(' · ')} · ${source}`
}

function stateLabel(mod: ModInfo): string {
  if (!mod.isHealthy) return 'sağlıksız'
  if (mod.isEnabled === null) return 'durum bilinmiyor'

  return mod.isEnabled ? 'sağlıklı' : 'kapalı'
}

export function rowSvg(spec: { width: number; theme: Theme; mod: ModInfo }): Drawing {
  const { mod, width } = spec
  const room = width - TEXT_X - DOT_ROOM
  const versionText = `v${mod.version}`
  const versionWidth = measure(versionText, 10.5) * 1.12 + PILL_PAD * 2
  const nameRoom = room - versionWidth - GAP
  const name = fit(mod.name, nameRoom, 14)
  const version = pill({ right: TEXT_X + Math.min(measure(name, 14) * 1.04, nameRoom) + GAP, y: 9, text: versionText, role: null, isMono: true, isLeft: true })
  const top = (ROW - TILE) / 2
  const body = [
    `<rect x="0.5" y="${top + 0.5}" width="${TILE - 1}" height="${TILE - 1}" rx="9" class="bg-edit ln-edit"/>`,
    `<text x="${TILE / 2}" y="${top + 22.5}" text-anchor="middle" style="font-size:13px;font-weight:700;letter-spacing:.04em" class="num fg-edit">${esc(monogram(mod.name))}</text>`,
    `<text x="${TEXT_X}" y="22" style="font-size:14px;font-weight:600" class="${mod.isEnabled === false ? 'lo' : 'hi'}">${esc(name)}</text>`,
    version.svg,
    healthDot(mod, width - 5),
    `<text x="${TEXT_X}" y="41" class="lb mid">${esc(fit(mod.description, width - TEXT_X - 4, 12))}</text>`,
    `<text x="${TEXT_X}" y="58" class="mi lo">${esc(fit(metaLine(mod), width - TEXT_X - 4, 10.5))}</text>`,
  ].join('')
  const alt = `${mod.name} v${mod.version} · ${metaLine(mod)} · ${stateLabel(mod)} · ${mod.description}`

  return { source: svgDoc({ width, height: ROW, theme: spec.theme, body }), alt, height: ROW }
}
