import { ageText, dateText } from './age'
import { escape, fit, measure, wrap } from './ui/svg'
import { svgDoc } from './ui/theme'
import type { Theme } from './ui/theme'
import { words } from './words'
import type { ReplaySession, ReplayTurnRow } from '../types'

// The desktop drawings of the two lists the pane browses: a head (headline, one or two lines under it) and one
// drawing per row. A row that opens something is pressed as a whole (lists.tsx lays a button over it), so its
// drawing ends in a chevron; the hover wash is moving.ts's.

export type Drawing = { source: string; height: number; alt: string }
export type ListHead = { width: number; theme: Theme; title: string; meta: string; lines: string[]; quote?: string }

const ROW_H = 48
const ROW_X = 12
const CHEVRON_ROOM = 28
const TITLE_SIZE = 13
const META_SIZE = 12
const LINE_H = 18
const NOTE_SIZE = 13
const NOTE_LINES_MAX = 3

const CHEVRON_CSS = '.chev{transition:transform .16s cubic-bezier(.2,.8,.2,1)}svg:hover .chev{transform:translateX(2px)}'

// The headline with its meta on the right, the quoted title (italic) and the facts lines.
export function headSvg(head: ListHead): Drawing {
  const metaWidth = head.meta === '' ? 0 : measure(head.meta, META_SIZE) + 12
  const quote = head.quote === undefined || head.quote === '' ? '' : `<text x="0" y="42" class="mid" font-size="12.5" font-style="italic">${escape(fit(`“${head.quote}”`, head.width, 12.5))}</text>`
  const top = quote === '' ? 40 : 62
  const lines = head.lines.map((line, n) => `<text x="0" y="${top + n * LINE_H}" class="label lo">${escape(fit(line, head.width, META_SIZE))}</text>`)
  const body = [
    `<text x="0" y="20" class="headline hi">${escape(fit(head.title, head.width - metaWidth, 17))}</text>`,
    head.meta === '' ? '' : `<text x="${head.width}" y="20" text-anchor="end" class="label lo">${escape(head.meta)}</text>`,
    quote,
    ...lines,
  ]
  const last = head.lines.length > 0 ? top + (head.lines.length - 1) * LINE_H : top - LINE_H - 2
  const height = last + 8

  return { source: svgDoc({ width: head.width, height, theme: head.theme }, body.join('')), height, alt: [head.title, head.quote ?? '', ...head.lines].filter(Boolean).join('. ') }
}

// A lead line and a sentence under it: loading, nothing to read, nothing edited.
export function noteSvg(note: { width: number; theme: Theme; lead: string; rest: string }): Drawing {
  const rest = wrap(note.rest, { width: note.width, size: NOTE_SIZE, maxLines: NOTE_LINES_MAX })
  const lead = `<text x="0" y="16" class="title hi">${escape(fit(note.lead, note.width, TITLE_SIZE))}</text>`
  const lines = rest.map((part, n) => `<text x="0" y="${16 + (n + 1) * LINE_H}" class="mid" font-size="${NOTE_SIZE}">${escape(part)}</text>`)
  const height = 22 + rest.length * LINE_H

  return { source: svgDoc({ width: note.width, height, theme: note.theme }, lead + lines.join('')), height, alt: [note.lead, note.rest].filter(Boolean).join('. ') }
}

type RowSpec = { width: number; theme: Theme; title: string; meta: string; tag?: string; isPressable: boolean }

const chevron = (x: number, y: number) =>
  `<g class="chev"><path d="M${x} ${y - 4.5}l4.5 4.5-4.5 4.5" fill="none" stroke="var(--lo)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g>`

// The title over its meta; a tag ("This session") leads the meta in body ink, no colour of its own.
function rowSvg(spec: RowSpec): string {
  const tag = spec.tag === undefined ? '' : `<tspan class="mid" font-weight="600">${escape(spec.tag)}</tspan><tspan class="lo"> · </tspan>`
  const tagWidth = spec.tag === undefined ? 0 : measure(`${spec.tag} · `, META_SIZE)
  const room = spec.width - ROW_X - (spec.isPressable ? CHEVRON_ROOM : ROW_X)
  const title = `<text x="${ROW_X}" y="21" class="title hi">${escape(fit(spec.title, room, TITLE_SIZE))}</text>`
  const meta = `<text x="${ROW_X}" y="37" class="label">${tag}<tspan class="lo">${escape(fit(spec.meta, room - tagWidth, META_SIZE))}</tspan></text>`
  const body = `${title}${meta}${spec.isPressable ? chevron(spec.width - 18, ROW_H / 2) : ''}`

  return svgDoc({ width: spec.width, height: ROW_H, theme: spec.theme }, body, spec.isPressable ? CHEVRON_CSS : '')
}

export const turnTitle = (row: ReplayTurnRow): string => (row.ask === '' ? words().untitled : `“${row.ask}”`)

// "Turn 3 · 4 edits · 3 files · 2h ago" under the prompt that started the turn.
export const turnMeta = (row: ReplayTurnRow, now: number): string =>
  [words().turnN(row.n), words().editsAndFiles(row.edits, row.files), ageText(row.at, now)].filter(Boolean).join(' · ')

export function turnRowSvg(row: ReplayTurnRow, look: { width: number; theme: Theme; now: number }): Drawing {
  const title = turnTitle(row)
  const meta = turnMeta(row, look.now)

  return { source: rowSvg({ width: look.width, theme: look.theme, title, meta, isPressable: true }), height: ROW_H, alt: `${title}. ${meta}` }
}

export function sessionFacts(row: ReplaySession): string {
  const w = words()
  if (row.isUnreadable === true) return w.unreadable
  if (row.turns === null || row.edits === null) return w.reading
  const facts = row.edits === 0 ? `${w.turnCount(row.turns)} · ${w.noEdits}` : w.turnsAndEdits(row.turns, row.edits)

  return row.isCut ? `${facts} · ${w.cut}` : facts
}

// The session's first prompt, then when it was last written and its turns and edits; this session is tagged.
// `isPressable`: it has edits to open, so the row ends in a chevron.
export function sessionRowSvg(row: ReplaySession, look: { width: number; theme: Theme; isPressable: boolean }): Drawing {
  const w = words()
  const title = row.title === '' ? w.untitled : row.title
  const meta = [dateText(row.at), sessionFacts(row)].filter(Boolean).join(' · ')
  const tag = row.isCurrent ? w.thisSession : undefined
  const source = rowSvg({ ...look, title, meta, ...(tag === undefined ? {} : { tag }) })

  return { source, height: ROW_H, alt: [tag, title, meta].filter(Boolean).join('. ') }
}
