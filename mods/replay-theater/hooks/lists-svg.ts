import { ageText, dateText } from './age'
import { escape, eyebrow, fit, measure, wrap } from './ui/svg'
import { svgDoc } from './ui/theme'
import type { Theme } from './ui/theme'
import { words } from './words'
import type { ReplaySession, ReplayTurnRow } from '../types'

// The desktop drawings of the two lists the pane browses: a head (eyebrow, headline, one or two lines under
// it) and one drawing per row; each row's button sits beside its drawing.

export type Drawing = { source: string; height: number; alt: string }
export type ListHead = { width: number; theme: Theme; title: string; meta: string; lines: string[]; quote?: string }

const ROW_H = 44
const TITLE_SIZE = 13.5
const META_SIZE = 12
const LINE_H = 18
const NOTE_SIZE = 13
const NOTE_LINES_MAX = 3

// The eyebrow with its meta on the right, the headline, the quoted title (italic) and the facts lines.
export function headSvg(head: ListHead): Drawing {
  const w = words()
  const quote = head.quote === undefined || head.quote === '' ? '' : `<text x="0" y="62" class="mid" font-size="12.5" font-style="italic">${escape(fit(`“${head.quote}”`, head.width, 12.5))}</text>`
  const top = quote === '' ? 62 : 84
  const lines = head.lines.map((line, n) => `<text x="0" y="${top + n * LINE_H}" class="label lo">${escape(fit(line, head.width, META_SIZE))}</text>`)
  const body = [
    `<rect x="0" y="5" width="6" height="6" rx="1.5" fill="var(--plan)"/><text x="13" y="12" class="eyebrow f-plan">${eyebrow(w.title)}</text>`,
    head.meta === '' ? '' : `<text x="${head.width}" y="12" text-anchor="end" class="label lo">${escape(head.meta)}</text>`,
    `<text x="0" y="40" class="headline hi">${escape(fit(head.title, head.width, 17))}</text>`,
    quote,
    ...lines,
  ]
  const height = top + Math.max(0, head.lines.length - 1) * LINE_H + 8

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

function rowText(spec: { x: number; width: number; title: string; meta: string; tag?: string }): string {
  const tag = spec.tag === undefined ? '' : `<tspan class="f-plan" font-weight="650">${escape(spec.tag)}</tspan><tspan class="lo"> · </tspan>`
  const tagWidth = spec.tag === undefined ? 0 : measure(`${spec.tag} · `, META_SIZE)
  const room = spec.width - spec.x - 4
  const title = `<text x="${spec.x}" y="18" class="title hi">${escape(fit(spec.title, room, TITLE_SIZE))}</text>`
  const meta = `<text x="${spec.x}" y="36" class="label">${tag}<tspan class="lo">${escape(fit(spec.meta, room - tagWidth, META_SIZE))}</tspan></text>`

  return title + meta
}

export const turnTitle = (row: ReplayTurnRow): string => (row.ask === '' ? words().untitled : `“${row.ask}”`)

// "Turn 3 · 4 edits · 3 files · 2h ago" under the prompt that started the turn.
export const turnMeta = (row: ReplayTurnRow, now: number): string =>
  [words().turnN(row.n), words().editsAndFiles(row.edits, row.files), ageText(row.at, now)].filter(Boolean).join(' · ')

export function turnRowSvg(row: ReplayTurnRow, look: { width: number; theme: Theme; now: number }): Drawing {
  const title = turnTitle(row)
  const meta = turnMeta(row, look.now)
  const body = rowText({ x: 0, width: look.width, title, meta })

  return { source: svgDoc({ width: look.width, height: ROW_H, theme: look.theme }, body), height: ROW_H, alt: `${title}. ${meta}` }
}

export function sessionFacts(row: ReplaySession): string {
  const w = words()
  if (row.isUnreadable === true) return w.unreadable
  if (row.turns === null || row.edits === null) return w.reading
  const facts = row.edits === 0 ? `${w.turnCount(row.turns)} · ${w.noEdits}` : w.turnsAndEdits(row.turns, row.edits)

  return row.isCut ? `${facts} · ${w.cut}` : facts
}

// The session's first prompt, then when it was last written and its turns and edits; this session is tagged.
export function sessionRowSvg(row: ReplaySession, look: { width: number; theme: Theme }): Drawing {
  const w = words()
  const title = row.title === '' ? w.untitled : row.title
  const meta = [dateText(row.at), sessionFacts(row)].filter(Boolean).join(' · ')
  const tag = row.isCurrent ? w.thisSession : undefined
  const body = rowText({ x: 0, width: look.width, title, meta, ...(tag === undefined ? {} : { tag }) })

  return { source: svgDoc({ width: look.width, height: ROW_H, theme: look.theme }, body), height: ROW_H, alt: [tag, title, meta].filter(Boolean).join('. ') }
}
