// The hub's Svg: the head card (what matters now), a section's eyebrow, and one row per pane
// (icon tile, title, the mod's own live line or a quiet hint, a status dot).
import type { HubCard } from '../types'
import type { Drawing } from './draw'
import { esc, eyebrow, fit } from './draw'
import type { Focus, HubRow } from './hub'
import { ROLE_OF_TONE } from './hub'
import { ICON_GRID, icon } from './kit/icons'
import { svgDoc } from './theme'
import type { Theme } from './theme'

const HEAD = 96
const HEAD_PAD = 16
const SECTION = 24
const ROW = 48
const TILE = 34
const ICON = 18
const TEXT_X = TILE + 12
const DOT_R = 3.5
const STROKE = 1.75

type HeadSpec = { width: number; theme: Theme; focus: Focus | null; meta: string }

const IDLE_TITLE = 'Sakin'
const IDLE_LINE = 'Ajan, test ya da plan hareketlenince burada görünür.'

// The head is the one card on the hub: the most pressing thing now, or a calm line when nothing is.
export function hubHeadSvg(spec: HeadSpec): Drawing {
  const { width, focus } = spec
  const role = focus === null ? null : ROLE_OF_TONE[focus.tone]
  const inner = width - HEAD_PAD * 2
  const label = focus === null ? 'MODZ' : `Şu an · ${focus.row.entry.title}`
  const title = focus === null ? IDLE_TITLE : (focus.row.card?.detail ?? '')
  const line = focus === null ? IDLE_LINE : focus.row.entry.hint
  const frame = role === null ? 'card line' : `card ln-${role}`
  const body = [
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${HEAD - 1}" rx="12" class="${frame}" style="stroke-width:1"/>`,
    `<g transform="translate(${HEAD_PAD} 0)">${eyebrow({ y: 26, width: inner, label, role: role ?? 'edit', meta: spec.meta })}</g>`,
    `<text x="${HEAD_PAD}" y="56" class="hl hi">${esc(fit(title, inner, 17, 620))}</text>`,
    `<text x="${HEAD_PAD}" y="78" class="lb lo">${esc(fit(line, inner, 12))}</text>`,
  ].join('')
  const alt = `${focus === null ? `MODZ: ${IDLE_TITLE}. ${IDLE_LINE}` : `Şu an, ${focus.row.entry.title}: ${title}`} (${spec.meta})`

  return { source: svgDoc({ width, height: HEAD, theme: spec.theme, body }), alt, height: HEAD }
}

export function sectionSvg(spec: { width: number; theme: Theme; label: string }): Drawing {
  const body = eyebrow({ y: 16, width: spec.width, label: spec.label, role: null, meta: '' })

  return { source: svgDoc({ width: spec.width, height: SECTION, theme: spec.theme, body }), alt: spec.label, height: SECTION }
}

function iconTile(row: HubRow): string {
  const { role } = row.entry
  const top = (ROW - TILE) / 2
  const scale = ICON / ICON_GRID
  const offset = (TILE - ICON) / 2

  return [
    `<rect x="0.5" y="${top + 0.5}" width="${TILE - 1}" height="${TILE - 1}" rx="9" class="bg-${role} ln-${role}"/>`,
    `<g transform="translate(${offset} ${top + offset}) scale(${scale})" fill="none" stroke-width="${STROKE / scale}" stroke-linecap="round" stroke-linejoin="round" class="st-${role}">${icon(row.entry.icon)}</g>`,
  ].join('')
}

// A dot on the right says the mod has something to say; live work breathes, a quiet mod has none.
function statusDot(card: HubCard | null, width: number): string {
  if (card === null || card.detail === '') return ''
  const role = ROLE_OF_TONE[card.tone]
  if (role === null) return ''
  const motion = card.tone === 'live' ? ' breathe' : ''

  return `<circle cx="${width - DOT_R - 2}" cy="${ROW / 2}" r="${DOT_R}" class="fg-${role}${motion}"/>`
}

function detailOf(row: HubRow): { text: string; ink: string } {
  const card = row.card
  if (card === null || card.detail === '') return { text: row.entry.hint, ink: 'lo' }
  const role = ROLE_OF_TONE[card.tone]

  return { text: card.detail, ink: role === null ? 'mid' : `fg-${role}` }
}

export function hubRowSvg(spec: { width: number; theme: Theme; row: HubRow }): Drawing {
  const { width, row } = spec
  const room = width - TEXT_X - DOT_R * 2 - 10
  const detail = detailOf(row)
  const body = [
    iconTile(row),
    `<text x="${TEXT_X}" y="21" class="ti hi" style="font-size:13.5px">${esc(fit(row.entry.title, room, 13.5, 600))}</text>`,
    `<text x="${TEXT_X}" y="38" class="lb ${detail.ink}">${esc(fit(detail.text, room, 12))}</text>`,
    statusDot(row.card, width),
  ].join('')
  const alt = `${row.entry.title}: ${detail.text}`

  return { source: svgDoc({ width, height: ROW, theme: spec.theme, body }), alt, height: ROW }
}
