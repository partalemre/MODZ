// The hub's Svg: the head card (the mark, then what matters now), a section's eyebrow, and one row per pane
// (icon tile with a status dot on its corner, title, the mod's own live line or a quiet hint). Native buttons are
// laid over the right edge of the head and of each row (hub-pane.tsx), so each drawing leaves that room free. Motion is motion.ts's: the
// panel's drawings cascade in as it opens, a row sweeps once when what it shows changes, live work pulses, and a
// row answers the pointer. Each is drawn for an interactive frame, built once per what it shows (stable.ts).
import type { HubCard } from '../types'
import type { Drawing } from './draw'
import { esc, eyebrow, fit, measure, pill, PILL_HEIGHT } from './draw'
import type { Focus, HubRow } from './hub'
import { ROLE_OF_TONE } from './hub'
import { ICON_GRID, icon } from './kit/icons'
import { entering, isEntering, MOTION_CSS } from './kit/motion'
import type { Cue } from './kit/motion'
import { svgDoc } from './theme'
import type { RoleName, Theme } from './theme'
import { wordmark, wordmarkHeight } from './wordmark'
import { hubWords } from './words'

const HEAD = 132
// The band the focus button takes under the head's text: a native button and its one-cell inset from the foot.
const ACTION_BAND = 40
const HEAD_PAD = 16
const MARK_Y = 16
const SECTION = 24
const ROW = 52
const TILE = 36
const ICON = 18
const TEXT_X = TILE + 12
const DOT_R = 4
const DOT_RING = 2
const STROKE = 1.75
const BADGE_GAP = 8
// The badge's own padding and the gap before it.
const BADGE_ROOM = 24
const RADIUS = 12

const HUB_CSS = MOTION_CSS

// `hasAction`: the focus button sits in the card's bottom-right corner, on a band of its own under the text, so
// the title and its line keep the card's whole width.
type HeadSpec = { width: number; theme: Theme; focus: Focus | null; meta: string; hasAction: boolean; cue: Cue }

const doc = (spec: { width: number; height: number; theme: Theme; body: string }) => svgDoc({ ...spec, css: HUB_CSS })

// A glow of the leading role in the card's corner, and while work is live a light running along its foot.
function headLight(spec: { width: number; height: number; role: RoleName; isLive: boolean; isFresh: boolean }): string {
  const { width, height, role } = spec
  const defs = [
    `<radialGradient id="hd-glow" cx="1" cy="0" r="1"><stop offset="0" style="stop-color:var(--${role});stop-opacity:.26"/><stop offset="1" style="stop-color:var(--${role});stop-opacity:0"/></radialGradient>`,
    `<linearGradient id="hd-beam" x1="0" x2="1"><stop offset="0" style="stop-color:var(--${role});stop-opacity:0"/><stop offset=".5" style="stop-color:var(--${role});stop-opacity:.9"/><stop offset="1" style="stop-color:var(--${role});stop-opacity:0"/></linearGradient>`,
    `<linearGradient id="hd-sheen" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".10"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
    `<clipPath id="hd-card"><rect x="0" y="0" width="${width}" height="${height}" rx="${RADIUS}"/></clipPath>`,
  ].join('')
  const track = `<rect x="${HEAD_PAD}" y="${height - 3}" width="${width - HEAD_PAD * 2}" height="1.5" rx=".75" class="track"/>`
  const beam = spec.isLive ? `<rect x="${HEAD_PAD}" y="${height - 3}" width="${(width - HEAD_PAD * 2) * 0.4}" height="1.5" fill="url(#hd-beam)" class="m-shine"/>` : ''
  const sheen = spec.isFresh ? `<rect x="0" y="0" width="${width * 0.6}" height="${height}" fill="url(#hd-sheen)" class="m-sweep"/>` : ''

  return `<defs>${defs}</defs><g clip-path="url(#hd-card)"><rect x="0" y="0" width="${width}" height="${height}" fill="url(#hd-glow)" class="m-fade"/>${sheen}${spec.isLive ? `${track}${beam}` : ''}</g>`
}

// The head is the one card on the hub: the pixel mark and the mods on, then the most pressing thing now, or a
// calm line when nothing is.
export function hubHeadSvg(spec: HeadSpec): Drawing {
  const { width, focus, cue } = spec
  const role = focus === null ? null : ROLE_OF_TONE[focus.tone]
  const inner = width - HEAD_PAD * 2
  const height = spec.hasAction ? HEAD + ACTION_BAND : HEAD
  const words = hubWords()
  const card = focus?.row.card ?? null
  const title = focus === null ? words.idleTitle : (card?.detail ?? '')
  const line = focus === null ? words.idleLine : focus.row.entry.hint
  const frame = role === null ? 'card line' : `card ln-${role}`
  const label = focus === null ? null : `${words.now} · ${focus.row.entry.title}`
  const isLive = focus !== null && focus.tone === 'live'
  const light = role === null ? '' : headLight({ width, height, role, isLive, isFresh: cue.phase === 'change' })
  const text = [
    label === null ? '' : `<g transform="translate(${HEAD_PAD} 0)">${eyebrow({ y: 70, width: inner, label, role: role ?? 'edit', meta: '' })}</g>`,
    `<text x="${HEAD_PAD}" y="${label === null ? 82 : 96}" class="hl hi">${esc(fit(title, inner, { size: 17, weight: 620 }))}</text>`,
    `<text x="${HEAD_PAD}" y="${label === null ? 104 : 116}" class="lb lo">${esc(fit(line, inner, { size: 12 }))}</text>`,
  ].join('')
  const body = [
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${RADIUS}" class="${frame}" style="stroke-width:1"/>`,
    light,
    wordmark({ x: HEAD_PAD, y: MARK_Y, cue }),
    entering(pill({ right: width - HEAD_PAD, y: MARK_Y + (wordmarkHeight() - PILL_HEIGHT) / 2, text: spec.meta, role: null }).svg, { ...cue, order: cue.order + 1 }, 'fade'),
    entering(text, { ...cue, order: cue.order + 2 }),
  ].join('')
  const alt = `${focus === null ? `MODZ: ${words.idleTitle}. ${words.idleLine}` : `${words.now}, ${focus.row.entry.title}: ${title}`} (${spec.meta})`

  return { source: doc({ width, height, theme: spec.theme, body }), alt, height }
}

// A group's eyebrow: a section's name, or "Hidden" while the person customizes the hub; its rule draws in.
export function sectionSvg(spec: { width: number; theme: Theme; label: string; cue: Cue }): Drawing {
  const label = spec.label
  const drawn = eyebrow({ y: 16, width: spec.width, label, role: null, meta: '' })
  const body = isEntering(spec.cue) ? entering(drawn.replace('class="f-line"', 'class="f-line m-grow"'), spec.cue, 'fade') : drawn

  return { source: doc({ width: spec.width, height: SECTION, theme: spec.theme, body }), alt: label, height: SECTION }
}

function iconTile(row: HubRow): string {
  const { role } = row.entry
  const top = (ROW - TILE) / 2
  const scale = ICON / ICON_GRID
  const offset = (TILE - ICON) / 2

  return [
    '<g class="m-tile">',
    `<rect x="0.5" y="${top + 0.5}" width="${TILE - 1}" height="${TILE - 1}" rx="10" class="bg-${role} ln-${role}"/>`,
    `<g transform="translate(${offset} ${top + offset}) scale(${scale})" fill="none" stroke-width="${STROKE / scale}" stroke-linecap="round" stroke-linejoin="round" class="st-${role}">${icon(row.entry.icon)}</g>`,
    statusDot(row.card, { cx: TILE - 2, cy: top + 2 }),
    '</g>',
  ].join('')
}

// A dot on the tile's corner says the mod has something to say, ringed in the sheet so it reads as a badge; live
// work sends rings out of it, a quiet mod has none.
function statusDot(card: HubCard | null, at: { cx: number; cy: number }): string {
  if (card === null || card.detail === '') return ''
  const role = ROLE_OF_TONE[card.tone]
  if (role === null) return ''
  const ring = card.tone === 'live' ? `<circle cx="${at.cx}" cy="${at.cy}" r="${DOT_R}" class="fg-${role} m-ripple"/>` : ''

  return `${ring}<circle cx="${at.cx}" cy="${at.cy}" r="${DOT_R}" class="fg-${role}" style="stroke:var(--sheet);stroke-width:${DOT_RING}px"/>`
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
    `<rect x="0" y="2" width="${width}" height="${ROW - 4}" rx="10" class="bg-${role} m-flash"/>`,
    `<rect x="0" y="2" width="${width * 0.5}" height="${ROW - 4}" fill="url(#${id})" class="m-sweep"/>`,
  ].join('')
}

// `buttonRoom`: the width the row's buttons take over its right edge.
export function hubRowSvg(spec: { width: number; theme: Theme; row: HubRow; buttonRoom: number; cue: Cue }): Drawing {
  const { width, row } = spec
  const room = width - TEXT_X - spec.buttonRoom
  const detail = detailOf(row)
  const body = [
    `<rect x="0" y="2" width="${width}" height="${ROW - 4}" rx="10" class="m-wash"/>`,
    spec.cue.phase === 'change' ? freshLight(row, width) : '',
    iconTile(row),
    titleOf(row, room),
    `<text x="${TEXT_X}" y="40" class="lb ${detail.ink}">${esc(fit(detail.text, room, { size: 12 }))}</text>`,
  ].join('')
  const alt = `${row.entry.title}${row.entry.badge === null ? '' : ` (${row.entry.badge})`}: ${detail.text}`

  return { source: doc({ width, height: ROW, theme: spec.theme, body: entering(body, spec.cue) }), alt, height: ROW }
}
