// The hub's Svg: the head card (the pixel mark, then what matters now), a section's eyebrow, and one row per
// pane (icon tile, title, the mod's own live line or a quiet hint, a status dot). Motion is motion.ts's: the
// panel's drawings cascade in as it opens, a row sweeps once when what it shows changes, live work pulses, and a
// row answers the pointer. Each is drawn for an interactive frame, built once per what it shows (stable.ts).
import type { HubCard } from '../types'
import type { Drawing } from './draw'
import { esc, eyebrow, fit, measure, pill } from './draw'
import type { Focus, HubRow } from './hub'
import { ROLE_OF_TONE } from './hub'
import { ICON_GRID, icon } from './kit/icons'
import { entering, HOVER_CSS, isEntering, MOTION_CSS } from './motion'
import type { Cue } from './motion'
import { svgDoc } from './theme'
import type { RoleName, Theme } from './theme'
import { wordmark, wordmarkHeight } from './wordmark'
import { hubWords } from './words'

const HEAD = 132
const HEAD_PAD = 16
const MARK_PITCH = 4
const SECTION = 24
const ROW = 52
const TILE = 36
const ICON = 18
const TEXT_X = TILE + 12
const DOT_R = 3.5
const STROKE = 1.75
const BADGE_GAP = 8
// The badge's own padding and the gap before it.
const BADGE_ROOM = 24
const RADIUS = 12

const HUB_CSS = `${MOTION_CSS}${HOVER_CSS}.mark{fill:var(--hi)}`

type HeadSpec = { width: number; theme: Theme; focus: Focus | null; meta: string; cue: Cue }

const doc = (spec: { width: number; height: number; theme: Theme; body: string }) => svgDoc({ ...spec, css: HUB_CSS })

// A glow of the leading role in the card's corner, and while work is live a light running along its foot.
function headLight(spec: { width: number; role: RoleName; isLive: boolean; isFresh: boolean }): string {
  const { width, role } = spec
  const defs = [
    `<radialGradient id="hd-glow" cx="1" cy="0" r="1"><stop offset="0" style="stop-color:var(--${role});stop-opacity:.26"/><stop offset="1" style="stop-color:var(--${role});stop-opacity:0"/></radialGradient>`,
    `<linearGradient id="hd-beam" x1="0" x2="1"><stop offset="0" style="stop-color:var(--${role});stop-opacity:0"/><stop offset=".5" style="stop-color:var(--${role});stop-opacity:.9"/><stop offset="1" style="stop-color:var(--${role});stop-opacity:0"/></linearGradient>`,
    `<linearGradient id="hd-sheen" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".10"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
    `<clipPath id="hd-card"><rect x="0" y="0" width="${width}" height="${HEAD}" rx="${RADIUS}"/></clipPath>`,
  ].join('')
  const track = `<rect x="${HEAD_PAD}" y="${HEAD - 3}" width="${width - HEAD_PAD * 2}" height="1.5" rx=".75" class="track"/>`
  const beam = spec.isLive ? `<rect x="${HEAD_PAD}" y="${HEAD - 3}" width="${(width - HEAD_PAD * 2) * 0.4}" height="1.5" fill="url(#hd-beam)" class="shimmer"/>` : ''
  const sheen = spec.isFresh ? `<rect x="0" y="0" width="${width * 0.6}" height="${HEAD}" fill="url(#hd-sheen)" class="sweep"/>` : ''

  return `<defs>${defs}</defs><g clip-path="url(#hd-card)"><rect x="0" y="0" width="${width}" height="${HEAD}" fill="url(#hd-glow)" class="fade"/>${sheen}${spec.isLive ? `${track}${beam}` : ''}</g>`
}

// The head is the one card on the hub: the pixel mark and the mods on, then the most pressing thing now, or a
// calm line when nothing is.
export function hubHeadSvg(spec: HeadSpec): Drawing {
  const { width, focus, cue } = spec
  const role = focus === null ? null : ROLE_OF_TONE[focus.tone]
  const inner = width - HEAD_PAD * 2
  const words = hubWords()
  const card = focus?.row.card ?? null
  const title = focus === null ? words.idleTitle : (card?.detail ?? '')
  const line = focus === null ? words.idleLine : focus.row.entry.hint
  const frame = role === null ? 'card line' : `card ln-${role}`
  const label = focus === null ? null : `${words.now} · ${focus.row.entry.title}`
  const isLive = focus !== null && focus.tone === 'live'
  const light = role === null ? '' : headLight({ width, role, isLive, isFresh: cue.phase === 'change' })
  const markY = 18
  const text = [
    label === null ? '' : `<g transform="translate(${HEAD_PAD} 0)">${eyebrow({ y: 70, width: inner, label, role: role ?? 'edit', meta: '' })}</g>`,
    `<text x="${HEAD_PAD}" y="${label === null ? 82 : 96}" class="hl hi">${esc(fit(title, inner, { size: 17, weight: 620 }))}</text>`,
    `<text x="${HEAD_PAD}" y="${label === null ? 104 : 116}" class="lb lo">${esc(fit(line, inner, { size: 12 }))}</text>`,
  ].join('')
  const body = [
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${HEAD - 1}" rx="${RADIUS}" class="${frame}" style="stroke-width:1"/>`,
    light,
    wordmark({ x: HEAD_PAD, y: markY, pitch: MARK_PITCH, cue }),
    `<text x="${width - HEAD_PAD}" y="${markY + wordmarkHeight(MARK_PITCH) - 2}" text-anchor="end" class="lb lo">${esc(spec.meta)}</text>`,
    entering(text, { ...cue, order: cue.order + 2 }),
  ].join('')
  const alt = `${focus === null ? `MODZ: ${words.idleTitle}. ${words.idleLine}` : `${words.now}, ${focus.row.entry.title}: ${title}`} (${spec.meta})`

  return { source: doc({ width, height: HEAD, theme: spec.theme, body }), alt, height: HEAD }
}

// A group's eyebrow: a section's name, or "Hidden" while the person customizes the hub; its rule draws in.
export function sectionSvg(spec: { width: number; theme: Theme; label: string; cue: Cue }): Drawing {
  const label = spec.label
  const drawn = eyebrow({ y: 16, width: spec.width, label, role: null, meta: '' })
  const body = isEntering(spec.cue) ? entering(drawn.replace('class="f-line"', 'class="f-line grow"'), spec.cue, 'fade') : drawn

  return { source: doc({ width: spec.width, height: SECTION, theme: spec.theme, body }), alt: label, height: SECTION }
}

function iconTile(row: HubRow, isLive: boolean): string {
  const { role } = row.entry
  const top = (ROW - TILE) / 2
  const scale = ICON / ICON_GRID
  const offset = (TILE - ICON) / 2
  const halo = isLive ? `<rect x="-2" y="${top - 2}" width="${TILE + 4}" height="${TILE + 4}" rx="11" class="ln-${role} breathe" fill="none" style="stroke-width:1.5"/>` : ''

  return [
    halo,
    '<g class="tile">',
    `<rect x="0.5" y="${top + 0.5}" width="${TILE - 1}" height="${TILE - 1}" rx="10" class="bg-${role} ln-${role}"/>`,
    `<g transform="translate(${offset} ${top + offset}) scale(${scale})" fill="none" stroke-width="${STROKE / scale}" stroke-linecap="round" stroke-linejoin="round" class="st-${role}">${icon(row.entry.icon)}</g>`,
    '</g>',
  ].join('')
}

// A dot on the right says the mod has something to say; live work sends rings out of it, a quiet mod has none.
function statusDot(card: HubCard | null, width: number): string {
  if (card === null || card.detail === '') return ''
  const role = ROLE_OF_TONE[card.tone]
  if (role === null) return ''
  const cx = width - DOT_R - 6
  const ring = card.tone === 'live' ? `<circle cx="${cx}" cy="${ROW / 2}" r="${DOT_R}" class="fg-${role} ripple"/>` : ''

  return `${ring}<circle cx="${cx}" cy="${ROW / 2}" r="${DOT_R}" class="fg-${role}"/>`
}

function detailOf(row: HubRow): { text: string; ink: string } {
  const card = row.card
  if (card === null || card.detail === '') return { text: row.entry.hint, ink: 'lo' }
  const role = ROLE_OF_TONE[card.tone]

  return { text: card.detail, ink: role === null ? 'mid' : `fg-${role}` }
}

// The title, and the row's badge ("Beta") right after it when it has one.
function titleOf(row: HubRow, room: number): string {
  const font = { size: 13.5, weight: 600 }
  const badge = row.entry.badge
  const badgeRoom = badge === null ? 0 : measure(badge, 10.5, 600) + BADGE_ROOM
  const title = fit(row.entry.title, room - badgeRoom, font)
  const text = `<text x="${TEXT_X}" y="23" class="ti hi" style="font-size:13.5px">${esc(title)}</text>`
  if (badge === null) return text

  return text + pill({ right: TEXT_X + measure(title, font.size, font.weight) + BADGE_GAP, y: 9, text: badge, role: 'plan', isLeft: true }).svg
}

// A card that just changed lights its row once: a tint that fades and a beam of the row's role passing over it.
function freshLight(row: HubRow, width: number): string {
  const role = ROLE_OF_TONE[row.card?.tone ?? 'idle'] ?? row.entry.role
  const id = `f-${row.entry.pane}`

  return [
    `<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" style="stop-color:var(--${role});stop-opacity:0"/><stop offset=".5" style="stop-color:var(--${role});stop-opacity:.22"/><stop offset="1" style="stop-color:var(--${role});stop-opacity:0"/></linearGradient></defs>`,
    `<rect x="0" y="2" width="${width}" height="${ROW - 4}" rx="10" class="bg-${role} flash"/>`,
    `<rect x="0" y="2" width="${width * 0.5}" height="${ROW - 4}" fill="url(#${id})" class="sweep"/>`,
  ].join('')
}

export function hubRowSvg(spec: { width: number; theme: Theme; row: HubRow; cue: Cue }): Drawing {
  const { width, row } = spec
  const room = width - TEXT_X - DOT_R * 2 - 14
  const detail = detailOf(row)
  const isLive = row.card?.tone === 'live' && row.card.detail !== ''
  const body = [
    `<rect x="0" y="2" width="${width}" height="${ROW - 4}" rx="10" class="wash"/>`,
    spec.cue.phase === 'change' ? freshLight(row, width) : '',
    iconTile(row, isLive),
    titleOf(row, room),
    `<text x="${TEXT_X}" y="40" class="lb ${detail.ink}">${esc(fit(detail.text, room, { size: 12 }))}</text>`,
    statusDot(row.card, width),
  ].join('')
  const alt = `${row.entry.title}${row.entry.badge === null ? '' : ` (${row.entry.badge})`}: ${detail.text}`

  return { source: doc({ width, height: ROW, theme: spec.theme, body: entering(body, spec.cue) }), alt, height: ROW }
}
