// The desktop pane's vector cards: "NOW", "TOUCHED BY CLAUDE" and section eyebrows.

import type { Look } from '../types'
import type { BadgeKind } from './badges'
import type { Hero, Part } from './now'
import {
  badge,
  BADGE_H,
  escape,
  eyebrowText,
  fitMiddle,
  icon,
  ICON_BOX,
  iconBox,
  measure,
  pill,
  type Font,
  type Pt,
  PILL_H,
  pillWidth,
  svgDoc,
} from './svg'
import type { Role } from './theme'
import { words } from './words'

export type Drawn = { source: string; width: number; height: number; alt: string }
export type GitRow = { branch: string; upstream: string; ahead: number; behind: number; changed: number; add: number; del: number }
export type LegendItem = { role: Role; label: string }

const PAD = 16
const GAP = 12
const TITLE = 17
const SUB = 13
const ROW = 13
const LINE = 24
const TOP_BLOCK = 66

const frame = (w: number, h: number): string =>
  `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="12" class="card"/>`

function fitEnd(text: string, width: number, font: Font): string {
  const { size, isBold = false } = font
  if (measure(text, size, isBold) <= width) return text
  const chars = [...text]
  while (chars.length > 1 && measure(`${chars.join('')}…`, size, isBold) > width) chars.pop()
  return `${chars.join('')}…`
}

// Tspans for a line of parts, cut at `width` so the last part ends in an ellipsis.
export function spans(parts: Part[], width: number, size: number): string {
  let used = 0
  const out: string[] = []
  for (const p of parts) {
    const room = width - used
    if (room < size) break
    const text = fitEnd(p.text, room, { size, isBold: p.isBold })
    used += measure(text, size, p.isBold)
    const weight = p.isBold ? ' font-weight="650"' : ''
    out.push(`<tspan class="${p.cls}${p.isNum ? ' num' : ''}"${weight}>${escape(text)}</tspan>`)
    if (text !== p.text) break
  }
  return out.join('')
}

function titleLine(hero: Hero, { x, y, width }: Pt & { width: number }): string {
  const { lead, name, tail } = hero.title
  const room = width - measure(lead + tail, TITLE, true)
  const fitted = name ? fitMiddle(name, Math.max(TITLE * 3, room), { size: TITLE, isBold: true }) : ''
  const full = fitEnd(`${lead}${fitted}${tail}`, width, { size: TITLE, isBold: true })
  return `<text x="${x}" y="${y}" font-size="${TITLE}" font-weight="620" class="hi">${escape(full)}</text>`
}

function gitLine(git: GitRow, y: number, w: number): string {
  const said = words()
  const status: Part[] = git.changed
    ? [
        ...(git.add ? [{ text: `+${git.add} `, cls: 'f-ok', isNum: true }] : []),
        ...(git.del ? [{ text: `−${git.del} `, cls: 'f-danger', isNum: true }] : []),
        ...(git.add || git.del ? [{ text: '· ', cls: 'lo' }] : []),
        { text: said.changes(git.changed), cls: 'f-warn', isBold: true },
      ]
    : [{ text: said.cleanNoChanges, cls: 'mid' }]
  const statusW = status.reduce((s, p) => s + measure(p.text, ROW, p.isBold), 0)
  const moves = `${git.ahead ? ` ↑${git.ahead}` : ''}${git.behind ? ` ↓${git.behind}` : ''}`
  const nameRoom = w - 2 * PAD - 22 - statusW - measure(moves, ROW, true) - GAP
  const name = fitMiddle(git.branch, Math.max(40, nameRoom), { size: ROW, isBold: true })
  const upRoom = nameRoom - measure(name, ROW, true) - 10
  const upstream = git.upstream && upRoom > 40 ? `<tspan dx="8" font-size="12" class="lo">${escape(fitMiddle(git.upstream, upRoom, { size: 12 }))}</tspan>` : ''
  const branch = `<text x="${PAD + 22}" y="${y}" font-size="${ROW}"><tspan font-weight="650" class="hi">${escape(name)}</tspan>${git.ahead ? `<tspan font-weight="650" class="f-ok"> ↑${git.ahead}</tspan>` : ''}${git.behind ? `<tspan font-weight="650" class="f-warn"> ↓${git.behind}</tspan>` : ''}${upstream}</text>`
  const right = `<text x="${w - PAD}" y="${y}" text-anchor="end" font-size="${ROW}">${spans(status, statusW + 4, ROW)}</text>`
  return `${icon('branch', { x: PAD, y: y - 12, size: 15 }, 'read')}${branch}${right}`
}

function legendLine(items: LegendItem[], y: number): string {
  let x = PAD
  return items
    .map(item => {
      const dot = `<circle cx="${x + 3.5}" cy="${y - 4}" r="3.5" class="f-${item.role}"/>`
      const label = `<text x="${x + 12}" y="${y}" font-size="12" class="mid">${escape(item.label)}</text>`
      x += 12 + measure(item.label, 12) + 18
      return dot + label
    })
    .join('')
}

export type Canvas = { look: Look; w: number }

export function heroCard(hero: Hero, { git, legend }: { git: GitRow | null; legend: LegendItem[] }, { look, w }: Canvas): Drawn {
  const textX = PAD + ICON_BOX + GAP
  const textW = w - textX - PAD
  const top = [
    iconBox(hero.icon, { x: PAD, y: PAD + 2 }, hero.role),
    eyebrowText(hero.eyebrow, { x: textX, y: PAD + 10 }, hero.role === 'neutral' ? 'lo' : `f-${hero.role}`),
    titleLine(hero, { x: textX, y: PAD + 31, width: textW }),
    `<text x="${textX}" y="${PAD + 50}" font-size="${SUB}">${spans(hero.sub, textW, SUB)}</text>`,
  ]
  const rows: string[] = []
  let y = TOP_BLOCK + PAD
  if (git || legend.length) rows.push(`<line x1="${PAD}" x2="${w - PAD}" y1="${y + 0.5}" y2="${y + 0.5}" class="rule"/>`)
  if (git) rows.push(gitLine(git, (y += LINE), w))
  if (legend.length) rows.push(legendLine(legend, (y += LINE)))
  const h = rows.length ? y + PAD - 2 : TOP_BLOCK + PAD
  const alt = `${hero.eyebrow}: ${hero.title.lead}${hero.title.name}${hero.title.tail}. ${hero.sub.map(p => p.text).join('')}`
  return { source: svgDoc({ width: w, height: h }, look, frame(w, h) + top.join('') + rows.join('')), width: w, height: h, alt }
}

export type TouchedRow = { name: string; dir: string; badge: BadgeKind; pill: { text: string; role: Role }; diff?: [number, number] }

const ROW_H = 30
const HEAD_H = 40
const MAX_ROWS = 6

function touchedRow(r: TouchedRow, y: number, w: number): string {
  const pillW = pillWidth(r.pill.text)
  const diff = r.diff ? `${r.diff[0] ? `+${r.diff[0]}` : ''}${r.diff[0] && r.diff[1] ? ' ' : ''}${r.diff[1] ? `−${r.diff[1]}` : ''}` : ''
  const diffW = diff ? measure(diff, 12) + GAP : 0
  const nameX = PAD + 38
  const room = w - nameX - PAD - pillW - diffW - GAP
  const name = fitMiddle(r.name, Math.max(48, room * 0.7), { size: ROW, isBold: true })
  const dirRoom = room - measure(name, ROW, true) - 8
  const dir = r.dir && dirRoom > 24 ? fitMiddle(r.dir, dirRoom, { size: 12 }) : ''
  const parts = [
    badge(r.badge.label, { x: PAD, y: y + (ROW_H - BADGE_H) / 2 }, r.badge.role),
    `<text x="${nameX}" y="${y + 19.5}" font-size="${ROW}"><tspan font-weight="650" class="hi">${escape(name)}</tspan>${dir ? `<tspan dx="8" font-size="12" class="lo">${escape(dir)}</tspan>` : ''}</text>`,
    pill(r.pill.text, { right: w - PAD, y: y + (ROW_H - PILL_H) / 2 }, r.pill.role),
  ]
  if (diff) {
    const [add = 0, del = 0] = r.diff ?? []
    const plus = add ? `<tspan class="f-ok">+${add}</tspan>` : ''
    const minus = del ? `<tspan class="f-danger">${add ? ' ' : ''}−${del}</tspan>` : ''
    parts.push(`<text x="${w - PAD - pillW - GAP}" y="${y + 19.5}" text-anchor="end" font-size="12" class="num">${plus}${minus}</text>`)
  }
  return parts.join('')
}

export function touchedCard(rows: TouchedRow[], look: Look, w: number): Drawn {
  const said = words()
  const title = said.touchedTitle(rows.length)
  const shown = rows.slice(0, MAX_ROWS)
  const more = rows.length - shown.length
  const body = shown.length
    ? shown.map((r, i) => touchedRow(r, HEAD_H - 6 + i * ROW_H, w)).join('')
    : `<text x="${PAD}" y="${HEAD_H + 13}" font-size="${SUB}" class="lo">${escape(said.noTouchThisTurn)}</text>`
  const listH = shown.length ? HEAD_H - 6 + shown.length * ROW_H : HEAD_H + 18
  const moreLine = more > 0 ? `<text x="${PAD}" y="${listH + 14}" font-size="12" class="lo">${escape(said.moreFiles(more))}</text>` : ''
  const h = listH + (more > 0 ? 22 : 0) + 10
  const head = eyebrowText(title, { x: PAD, y: PAD + 10 }, 'lo')
  const alt = `${title}: ${rows.map(r => `${r.name} ${r.pill.text}`).join(', ') || said.noneYet}`
  return { source: svgDoc({ width: w, height: h }, look, frame(w, h) + head + body + moreLine), width: w, height: h, alt }
}

export function sectionLine({ left, right }: { left: string; right: string }, { look, w }: Canvas): Drawn {
  const h = 22
  const body = `${eyebrowText(left, { x: 2, y: 15 }, 'lo')}${right ? eyebrowText(right, { x: w - 2, y: 15, anchor: 'end' }, 'lo') : ''}`
  return { source: svgDoc({ width: w, height: h }, look, body), width: w, height: h, alt: right ? `${left} · ${right}` : left }
}
