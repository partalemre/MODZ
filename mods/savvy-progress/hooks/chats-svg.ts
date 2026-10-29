import { fitText, textWidth, xml } from './format'
import { FONT, paneSvg } from './theme'

// The "Other chats" card on the desktop: a quiet label, one row per chat that waits on the person (its
// project, its title, how long it has waited, the wait in Amber: that is the state) and a quiet "+2 more".
// A still drawing: it changes only when a chat starts or stops waiting, or a wait passes another minute.

const CARD = { padX: 14, rx: 10, labelY: 24, firstRowY: 48, rowH: 22, bottom: 14 } as const
const LABEL = { size: 12, weight: 600 } as const
const ROW = { size: 13, waitSize: 12, gap: 10 } as const
const BOLD = 1.06

export type WaitRow = { project: string; title: string; wait: string }

export type ChatsCard = { title: string; rows: WaitRow[]; more: string }

export type ChatsDrawing = { source: string; height: number; alt: string }

const rowSvg = (row: WaitRow, y: number, W: number): string => {
  const right = W - CARD.padX
  const waitW = Math.ceil(textWidth(row.wait, ROW.waitSize) * BOLD)
  const room = right - waitW - ROW.gap - CARD.padX
  const project = fitText(row.project, ROW.size * BOLD, room)
  const titleRoom = room - textWidth(project, ROW.size) * BOLD
  const title = row.title ? fitText(` · ${row.title}`, ROW.size, titleRoom) : ''
  const titleSpan = title && title !== '…' ? `<tspan class="s" font-weight="400">${xml(title)}</tspan>` : ''
  return [
    `<text x="${CARD.padX}" y="${y}" font-family="${FONT}" font-size="${ROW.size}" font-weight="560"><tspan class="t">${xml(project)}</tspan>${titleSpan}</text>`,
    `<text class="f-warn" x="${right}" y="${y}" text-anchor="end" font-family="${FONT}" font-size="${ROW.waitSize}" font-weight="600">${xml(row.wait)}</text>`,
  ].join('')
}

export const chatsCardSvg = (W: number, card: ChatsCard): ChatsDrawing => {
  const lines = card.rows.length + (card.more ? 1 : 0)
  const height = CARD.firstRowY + (lines - 1) * CARD.rowH + CARD.bottom
  const rows = card.rows.map((row, i) => rowSvg(row, CARD.firstRowY + i * CARD.rowH, W))
  const moreY = CARD.firstRowY + card.rows.length * CARD.rowH
  const more = card.more ? `<text class="m" x="${CARD.padX}" y="${moreY}" font-family="${FONT}" font-size="${ROW.waitSize}">${xml(card.more)}</text>` : ''
  const body = [
    `<rect class="card ln" x="0.5" y="0.5" width="${W - 1}" height="${height - 1}" rx="${CARD.rx}" stroke-width="1"/>`,
    `<text class="m" x="${CARD.padX}" y="${CARD.labelY}" font-family="${FONT}" font-size="${LABEL.size}" font-weight="${LABEL.weight}">${xml(fitText(card.title, LABEL.size * BOLD, W - CARD.padX * 2))}</text>`,
    ...rows,
    more,
  ]
  const alt = [card.title, ...card.rows.map(row => [row.project, row.title, row.wait].filter(Boolean).join(' · ')), card.more].filter(Boolean).join(', ')
  return { source: paneSvg(W, height, body.join('')), height, alt }
}
