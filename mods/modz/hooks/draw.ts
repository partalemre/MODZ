// The desktop pane's Svg: the head, a group's eyebrow and one row per mod (monogram tile, name,
// version pill, health dot, one line of description and a quiet line of surfaces and source).
import type { ModInfo } from './catalog'
import { upper } from './kit/lang'
import { eyebrowWidth } from './kit/svg-text'
import { textWidth } from './kit/svg-metrics'
import { monogram } from './meta'
import type { Group } from './meta'
import { svgDoc } from './theme'
import type { RoleName, Theme } from './theme'
import { catalogWords, placeLine } from './words'

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

const MONO_EM = 0.6
const WEIGHT_BODY = 500

// Measured SF Pro advances (the kit's table), so a badge sits right after the name it follows.
export function measure(text: string, size: number, weight = WEIGHT_BODY): number {
  return textWidth(text, size, weight)
}

const monoMeasure = (text: string, size: number): number => [...text].length * size * MONO_EM

export function fit(text: string, width: number, font: { size: number; weight?: number }): string {
  const { size, weight = WEIGHT_BODY } = font
  if (measure(text, size, weight) <= width) return text
  const chars = [...text]
  while (chars.length > 1 && measure(`${chars.join('').trimEnd()}…`, size, weight) > width) chars.pop()

  return `${chars.join('').trimEnd()}…`
}

export function eyebrow(spec: { y: number; width: number; label: string; role: RoleName | null; meta: string }): string {
  const label = upper(spec.label)
  const end = NOTCH + 6 + eyebrowWidth(label)
  const metaStart = spec.width - measure(spec.meta, 12)
  const notch = spec.role === null ? 'f-strong' : `fg-${spec.role}`
  const rule = metaStart - end > 24 ? `<rect x="${end + 8}" y="${spec.y - 4}" width="${metaStart - end - 16}" height="1" class="f-line"/>` : ''

  return `<rect x="0.5" y="${spec.y - 7.5}" width="${NOTCH}" height="${NOTCH}" rx="1.5" class="${notch}"/><text x="${NOTCH + 6.5}" y="${spec.y}" class="eb ${spec.role === null ? 'lo' : `fg-${spec.role}`}">${esc(label)}</text>${rule}<text x="${spec.width}" y="${spec.y}" text-anchor="end" class="lb lo">${esc(spec.meta)}</text>`
}

type PillSpec = { right: number; y: number; text: string; role: RoleName | null; isMono?: boolean; isLeft?: boolean }

// A badge whose right edge is at `right` (its left edge, given `isLeft`); neutral without a role.
export function pill(spec: PillSpec): { svg: string; width: number } {
  const textSize = spec.isMono === true ? monoMeasure(spec.text, 10.5) : measure(spec.text, 10.5, 600)
  const width = Math.ceil(textSize + PILL_PAD * 2)
  const x = spec.isLeft === true ? spec.right : spec.right - width
  const frame = spec.role === null ? 'inset line' : `bg-${spec.role} ln-${spec.role}`
  const ink = spec.role === null ? 'mid' : `fg-${spec.role}`
  const font = spec.isMono === true ? ' num' : ''

  return {
    svg: `<rect x="${x + 0.5}" y="${spec.y + 0.5}" width="${width - 1}" height="${PILL - 1}" rx="${PILL / 2}" class="${frame}"/><text x="${x + width / 2}" y="${spec.y + 12.5}" text-anchor="middle" style="font-size:10.5px;font-weight:600" class="${ink}${font}">${esc(spec.text)}</text>`,
    width,
  }
}

export function headSvg(spec: { width: number; theme: Theme; title: string; meta: string; metaRole: RoleName | null }): Drawing {
  const meta = spec.meta === '' ? '' : `<text x="${spec.width}" y="40" text-anchor="end" class="lb ${spec.metaRole === null ? 'lo' : `fg-${spec.metaRole}`}">${esc(spec.meta)}</text>`
  const title = fit(spec.title, spec.width - measure(spec.meta, 12) - GAP * 2, { size: 17, weight: 620 })
  const allMods = catalogWords().allMods
  const body = eyebrow({ y: 12, width: spec.width, label: allMods, role: 'edit', meta: '' }) + `<text x="0" y="40" class="hl hi">${esc(title)}</text>${meta}`

  return { source: svgDoc({ width: spec.width, height: HEAD, theme: spec.theme, body }), alt: `${allMods}: ${spec.title}${spec.meta === '' ? '' : ` · ${spec.meta}`}`, height: HEAD }
}

// Each group keeps one colour, on its eyebrow notch and on every monogram tile beneath it.
export const GROUP_ROLE: Record<Group, RoleName | null> = { look: 'edit', safety: 'ok', meter: 'read', flow: 'run', other: null }

export function groupSvg(spec: { width: number; theme: Theme; group: Group; count: number }): Drawing {
  const words = catalogWords()
  const label = words.groups[spec.group]
  const count = words.mods(spec.count)
  const body = eyebrow({ y: 15, width: spec.width, label, role: GROUP_ROLE[spec.group], meta: count })

  return { source: svgDoc({ width: spec.width, height: GROUP, theme: spec.theme, body }), alt: `${label}: ${count}`, height: GROUP }
}

// The right edge says only what is unusual: a problem or a switched-off mod gets a word,
// an unknown state a dashed ring, and an on mod one quiet green dot.
function stateMark(mod: ModInfo, right: number): { svg: string; width: number } {
  const words = catalogWords()
  if (!mod.isHealthy) return pill({ right, y: 9, text: words.brokenWord, role: 'danger' })
  if (mod.isEnabled === false) return pill({ right, y: 9, text: words.offWord, role: null })
  const cx = right - DOT_ROOM / 2
  if (mod.isEnabled === null) return { svg: `<circle cx="${cx}" cy="18" r="3.5" fill="none" stroke-width="1.3" stroke-dasharray="2 1.6" class="strong"/>`, width: DOT_ROOM }

  return { svg: `<circle cx="${cx}" cy="18" r="3.5" class="fg-ok"/>`, width: DOT_ROOM }
}

function stateLabel(mod: ModInfo): string {
  const words = catalogWords()
  if (!mod.isHealthy) return words.brokenWord
  if (mod.isEnabled === null) return words.stateUnknown

  return mod.isEnabled ? words.onWord : words.offWord
}

function monogramTile(mod: ModInfo): string {
  const role = mod.isHealthy ? GROUP_ROLE[mod.group] : 'danger'
  const top = (ROW - TILE) / 2
  const frame = role === null ? 'inset strong' : `bg-${role} ln-${role}`
  const ink = role === null ? 'mid' : `fg-${role}`
  const fade = mod.isEnabled === false ? ' opacity=".5"' : ''

  return `<g${fade}><rect x="0.5" y="${top + 0.5}" width="${TILE - 1}" height="${TILE - 1}" rx="9" class="${frame}"/><text x="${TILE / 2}" y="${top + 22.5}" text-anchor="middle" style="font-size:13px;font-weight:700;letter-spacing:.04em" class="num ${ink}">${esc(monogram(mod.name))}</text></g>`
}

export function rowSvg(spec: { width: number; theme: Theme; mod: ModInfo }): Drawing {
  const { mod, width } = spec
  const mark = stateMark(mod, width)
  const versionText = `v${mod.version}`
  const versionWidth = monoMeasure(versionText, 10.5) + PILL_PAD * 2
  const nameRoom = width - TEXT_X - mark.width - versionWidth - GAP * 2
  const name = fit(mod.name, nameRoom, { size: 14, weight: 600 })
  const version = pill({ right: TEXT_X + measure(name, 14, 600) + GAP, y: 9, text: versionText, role: null, isMono: true, isLeft: true })
  const lineRoom = width - TEXT_X - 4
  const body = [
    monogramTile(mod),
    `<text x="${TEXT_X}" y="22" style="font-size:14px;font-weight:600" class="${mod.isEnabled === false ? 'lo' : 'hi'}">${esc(name)}</text>`,
    version.svg,
    mark.svg,
    `<text x="${TEXT_X}" y="41" class="lb ${mod.isHealthy ? 'mid' : 'fg-danger'}">${esc(fit(mod.description, lineRoom, { size: 12 }))}</text>`,
    `<text x="${TEXT_X}" y="58" class="mi lo">${esc(fit(placeLine(mod), lineRoom, { size: 10.5 }))}</text>`,
  ].join('')
  const alt = `${mod.name} v${mod.version} · ${placeLine(mod)} · ${stateLabel(mod)} · ${mod.description}`

  return { source: svgDoc({ width, height: ROW, theme: spec.theme, body }), alt, height: ROW }
}
