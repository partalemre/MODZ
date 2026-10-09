// The desktop deck's head: eyebrow and headline, four stat tiles, and the attention card's face.
import { compact, costText } from './format'
import { totalsOf } from './cost'
import { countsOf } from './roster'
import { esc, eyebrow, fit, iconBox, measure, num, upper } from './svg-parts'
import { svgDoc } from './theme'
import type { RoleName, Theme } from './theme'
import type { DeckAgent } from '../types'

export type Drawing = { source: string; alt: string; height: number }

type Tile = { label: string; value: string; unit: string; role: RoleName | null }

const TITLE_HEIGHT = 46
const TILE_HEIGHT = 62
const TILE_GAP = 8
const TILE_PAD = 12
const ATTENTION_HEIGHT = 40
const ICON = 36

export function titleSvg(spec: { width: number; theme: Theme; agents: DeckAgent[]; summary: string }): Drawing {
  const counts = countsOf(spec.agents)
  const live = counts.running + counts.waiting
  const headline = live === 0 ? 'Şu an çalışan ajan yok' : `${counts.running} ajan çalışıyor${counts.waiting > 0 ? `, ${counts.waiting} bekliyor` : ''}`
  const body = [
    eyebrow({ x: 0.5, y: 12, width: spec.width - 1, label: 'Ajan güvertesi', role: 'run' }),
    `<text x="0" y="38" class="hl hi">${esc(fit(headline, spec.width, 17))}</text>`,
  ].join('')

  return { source: svgDoc({ width: spec.width, height: TITLE_HEIGHT, theme: spec.theme, body }), alt: `${headline}. ${spec.summary}`, height: TITLE_HEIGHT }
}

function tilesOf(agents: DeckAgent[]): Tile[] {
  const counts = countsOf(agents)
  const totals = totalsOf(agents)

  return [
    { label: 'Çalışıyor', value: String(counts.running), unit: 'ajan', role: counts.running > 0 ? 'run' : null },
    { label: 'Bekliyor', value: String(counts.waiting), unit: 'ajan', role: counts.waiting > 0 ? 'warn' : null },
    { label: 'Token', value: totals.tokens > 0 ? compact(totals.tokens) : '—', unit: totals.tokens > 0 ? 'token' : '', role: null },
    { label: 'Maliyet', value: totals.costUsd > 0 ? costText(totals.costUsd) : '—', unit: '', role: null },
  ]
}

function tileSvg(tile: Tile, box: { x: number; width: number }): string {
  const { x, width } = box
  const frame = `<rect x="${num(x + 0.5)}" y="0.5" width="${num(width - 1)}" height="${TILE_HEIGHT - 1}" rx="10" class="card line"/>`
  const head = eyebrow({ x: x + TILE_PAD, y: 20, width: width - TILE_PAD * 2, label: tile.label, role: tile.role })
  const valueWidth = measure(tile.value, 24, true)
  const unit = tile.unit === '' || valueWidth + measure(tile.unit, 12) + 6 > width - TILE_PAD * 2 ? '' : `<text x="${num(x + TILE_PAD + valueWidth + 6)}" y="49" class="lb mid">${esc(tile.unit)}</text>`
  const value = `<text x="${num(x + TILE_PAD)}" y="49" class="dp num hi">${esc(tile.value)}</text>`

  return frame + head + value + unit
}

export function tilesSvg(spec: { width: number; theme: Theme; agents: DeckAgent[]; summary: string }): Drawing {
  const tiles = tilesOf(spec.agents)
  const tileWidth = (spec.width - TILE_GAP * (tiles.length - 1)) / tiles.length
  const body = tiles.map((tile, index) => tileSvg(tile, { x: index * (tileWidth + TILE_GAP), width: tileWidth })).join('')
  const alt = tiles.map(tile => `${tile.label} ${tile.value}`).join(' · ')

  return { source: svgDoc({ width: spec.width, height: TILE_HEIGHT, theme: spec.theme, body }), alt: `${alt}. ${spec.summary}`, height: TILE_HEIGHT }
}

export type AttentionFace = { name: string; reason: string; isBroken: boolean }

// Icon box, an Amber eyebrow, then the agent's name and why it needs you.
export function attentionSvg(spec: { width: number; theme: Theme; face: AttentionFace }): Drawing {
  const { width, face } = spec
  const textX = ICON + 12
  const reasonRole: RoleName = face.isBroken ? 'danger' : 'warn'
  const reasonWidth = measure(face.reason, 13)
  const name = fit(face.name, Math.max(40, width - textX - reasonWidth - 24), 13)
  const nameWidth = measure(name, 13) * 1.04
  const body = [
    iconBox({ x: 0, y: 2, size: ICON, role: 'warn', icon: face.isBroken ? 'flask' : 'bell' }),
    `<text x="${textX}" y="15" class="eb fg-warn">${esc(upper('Seni bekliyor'))}</text>`,
    `<text x="${textX}" y="34" class="ti hi">${esc(name)}</text>`,
    `<text x="${num(textX + nameWidth + 6)}" y="34" class="lb lo">·</text>`,
    `<text x="${num(textX + nameWidth + 16)}" y="34" class="ti fg-${reasonRole}">${esc(face.reason)}</text>`,
  ].join('')

  return { source: svgDoc({ width, height: ATTENTION_HEIGHT, theme: spec.theme, body }), alt: `${face.name}: ${face.reason}`, height: ATTENTION_HEIGHT }
}
