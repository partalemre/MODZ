// The desktop pane's drawings: the "Now" card, the list of files Claude touched, and the tree's group label.

import type { Look } from '../types'
import type { Hero, Part } from './now'
import {
  badge,
  BADGE_H,
  escape,
  fitMiddle,
  groupLabel,
  icon,
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
// What reads put into context, written out (costtext.ts): this turn's, null with none, and the session's when
// earlier turns read too.
export type CostRow = { turn: string | null; session: string | null }

const PAD = 16
const GAP = 12
const TITLE = 16
const SUB = 13
const ROW = 13
const LINE = 24
// Baselines of the headline and the line under it; the git and cost lines follow after a little air.
const TITLE_Y = PAD + 20
const SUB_Y = TITLE_Y + 21
const LINES_TOP = SUB_Y + 8
// Where a line's text starts after its 16px icon.
const ICON_INDENT = 24
const ICON = 16
// The live dot before the headline: its radius, and how far it pushes the headline over.
const DOT_R = 3
const DOT_ROOM = 14

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
  return `<text x="${x}" y="${y}" font-size="${TITLE}" font-weight="600" class="hi">${escape(full)}</text>`
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
  const nameRoom = w - 2 * PAD - ICON_INDENT - statusW - measure(moves, ROW, true) - GAP
  const name = fitMiddle(git.branch, Math.max(40, nameRoom), { size: ROW, isBold: true })
  const upRoom = nameRoom - measure(name, ROW, true) - 10
  const upstream = git.upstream && upRoom > 40 ? `<tspan dx="8" font-size="12" class="lo">${escape(fitMiddle(git.upstream, upRoom, { size: 12 }))}</tspan>` : ''
  const branch = `<text x="${PAD + ICON_INDENT}" y="${y}" font-size="${ROW}"><tspan font-weight="560" class="hi">${escape(name)}</tspan>${git.ahead ? `<tspan font-weight="650" class="mid"> ↑${git.ahead}</tspan>` : ''}${git.behind ? `<tspan font-weight="650" class="f-warn"> ↓${git.behind}</tspan>` : ''}${upstream}</text>`
  const right = `<text x="${w - PAD}" y="${y}" text-anchor="end" font-size="${ROW}">${spans(status, statusW + 4, ROW)}</text>`
  return `${icon('branch', { x: PAD, y: y - 12.5, size: ICON })}${branch}${right}`
}

// The session's count gives way first when the line is short of room.
function costLine(cost: CostRow, y: number, w: number): string {
  const said = words()
  const [lead = '', tail = ''] = said.costTurn
  const left: Part[] = cost.turn
    ? [{ text: lead, cls: 'mid' }, { text: cost.turn, cls: 'hi', isBold: true, isNum: true }, { text: tail, cls: 'mid' }]
    : [{ text: said.costNone, cls: 'lo' }]
  const leftW = left.reduce((s, p) => s + measure(p.text, ROW, p.isBold), 0)
  const room = w - 2 * PAD - ICON_INDENT
  const right = cost.session ? said.costSession(cost.session) : ''
  const rightW = right ? measure(right, 12) + GAP : 0
  const isRightShown = right !== '' && leftW + rightW <= room
  const head = `<text x="${PAD + ICON_INDENT}" y="${y}" font-size="${ROW}">${spans(left, room - (isRightShown ? rightW : 0), ROW)}</text>`
  const tailText = isRightShown ? `<text x="${w - PAD}" y="${y}" text-anchor="end" font-size="12" class="lo">${escape(right)}</text>` : ''
  return `${icon('eye', { x: PAD, y: y - 12.5, size: ICON })}${head}${tailText}`
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

// Before the headline while Claude works, the accent's dot breathing; none once the turn ends.
const liveDot = (hero: Hero): string =>
  hero.isLive === true ? `<circle cx="${PAD + DOT_R}" cy="${TITLE_Y - 5.5}" r="${DOT_R}" class="f-edit breathe"/>` : ''

export function heroCard(hero: Hero, { git, cost, legend }: { git: GitRow | null; cost: CostRow | null; legend: LegendItem[] }, { look, w }: Canvas): Drawn {
  const titleX = PAD + (hero.isLive === true ? DOT_ROOM : 0)
  const top = [
    liveDot(hero),
    titleLine(hero, { x: titleX, y: TITLE_Y, width: w - titleX - PAD }),
    `<text x="${PAD}" y="${SUB_Y}" font-size="${SUB}">${spans(hero.sub, w - 2 * PAD, SUB)}</text>`,
  ]
  const rows: string[] = []
  let y = LINES_TOP
  if (git) rows.push(gitLine(git, (y += LINE), w))
  if (cost) rows.push(costLine(cost, (y += LINE), w))
  if (legend.length) rows.push(legendLine(legend, (y += LINE)))
  const h = (rows.length ? y : SUB_Y) + PAD
  const [lead = '', tail = ''] = words().costTurn
  const costAlt = cost?.turn ? ` · ${lead}${cost.turn}${tail}` : ''
  const alt = `${hero.label}: ${hero.title.lead}${hero.title.name}${hero.title.tail}. ${hero.sub.map(p => p.text).join('')}${costAlt}`
  return { source: svgDoc({ width: w, height: h }, look, frame(w, h) + top.join('') + rows.join('')), width: w, height: h, alt }
}

// `cost` is what the file's reads put into context this turn, written out ("≈1,157").
// `pill.role` is set while Claude is on the file: then its badge and pill take the activity's colour.
export type TouchedRow = { name: string; dir: string; badge: string; pill: { text: string; role: Role | null }; diff?: [number, number]; cost?: string }

const ROW_H = 30
const HEAD_H = 26
const MAX_ROWS = 6

function touchedRow(r: TouchedRow, y: number, w: number): string {
  const pillW = pillWidth(r.pill.text)
  const diff = r.diff ? `${r.diff[0] ? `+${r.diff[0]}` : ''}${r.diff[0] && r.diff[1] ? ' ' : ''}${r.diff[1] ? `−${r.diff[1]}` : ''}` : ''
  const diffW = diff ? measure(diff, 12) + GAP : 0
  const unit = r.cost ? ` ${words().tokUnit}` : ''
  const costW = r.cost ? measure(`${r.cost}${unit}`, 12) + GAP : 0
  const nameX = 38
  const room = w - nameX - 2 - pillW - diffW - costW - GAP
  const name = fitMiddle(r.name, Math.max(48, room * 0.7), { size: ROW, isBold: true })
  const dirRoom = room - measure(name, ROW, true) - 8
  const dir = r.dir && dirRoom > 24 ? fitMiddle(r.dir, dirRoom, { size: 12 }) : ''
  const parts = [
    badge(r.badge, { x: 2, y: y + (ROW_H - BADGE_H) / 2 }, r.pill.role),
    `<text x="${nameX}" y="${y + 19.5}" font-size="${ROW}"><tspan font-weight="560" class="hi">${escape(name)}</tspan>${dir ? `<tspan dx="8" font-size="12" class="lo">${escape(dir)}</tspan>` : ''}</text>`,
    pill(r.pill.text, { right: w - 2, y: y + (ROW_H - PILL_H) / 2 }, r.pill.role),
  ]
  if (diff) {
    const [add = 0, del = 0] = r.diff ?? []
    const plus = add ? `<tspan class="f-ok">+${add}</tspan>` : ''
    const minus = del ? `<tspan class="f-danger">${add ? ' ' : ''}−${del}</tspan>` : ''
    parts.push(`<text x="${w - 2 - pillW - GAP}" y="${y + 19.5}" text-anchor="end" font-size="12" class="num">${plus}${minus}</text>`)
  }
  if (r.cost) {
    const tokens = `<tspan class="num mid">${escape(r.cost)}</tspan><tspan class="lo">${escape(unit)}</tspan>`
    parts.push(`<text x="${w - 2 - pillW - diffW - GAP}" y="${y + 19.5}" text-anchor="end" font-size="12">${tokens}</text>`)
  }
  return parts.join('')
}

// The files Claude touched this turn, as a list under its group label: rows rest on spacing, not on a card.
export function touchedCard(rows: TouchedRow[], look: Look, w: number): Drawn {
  const said = words()
  const title = said.touchedTitle(rows.length)
  const shown = rows.slice(0, MAX_ROWS)
  const more = rows.length - shown.length
  const body = shown.length
    ? shown.map((r, i) => touchedRow(r, HEAD_H + i * ROW_H, w)).join('')
    : `<text x="2" y="${HEAD_H + 16}" font-size="${SUB}" class="lo">${escape(said.noTouchThisTurn)}</text>`
  const listH = shown.length ? HEAD_H + shown.length * ROW_H : HEAD_H + 22
  const moreLine = more > 0 ? `<text x="2" y="${listH + 14}" font-size="12" class="lo">${escape(said.moreFiles(more))}</text>` : ''
  const h = listH + (more > 0 ? 20 : 0)
  const head = groupLabel(title, { x: 2, y: 15 })
  const alt = `${title}: ${rows.map(r => `${r.name} ${r.pill.text}${r.cost ? ` ${r.cost} ${said.tokUnit}` : ''}`).join(', ') || said.noneYet}`
  return { source: svgDoc({ width: w, height: h }, look, head + body + moreLine), width: w, height: h, alt }
}

export function sectionLine({ left, right }: { left: string; right: string }, { look, w }: Canvas): Drawn {
  const h = 22
  const body = `${groupLabel(left, { x: 2, y: 15 })}${right ? groupLabel(right, { x: w - 2, y: 15, anchor: 'end' }) : ''}`
  return { source: svgDoc({ width: w, height: h }, look, body), width: w, height: h, alt: right ? `${left} · ${right}` : left }
}
