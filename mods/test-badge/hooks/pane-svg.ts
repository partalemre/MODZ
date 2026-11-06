import { dotOf } from './ci-svg'
import { durationText, spanOf, suiteTag } from './summary'
import { PART_H, bar, fileBadge, fit, fitStart, icon, measure, partHead, runs, svgDoc, text, wrapText } from './svg'
import type { Ink } from './svg'
import type { Mode } from './tidemark'
import { words } from './words'
import type { LocalRow, Verdict } from './verdict'
import type { Failure } from '../types'

// The details pane's vector parts: the one sentence, the head of "On this computer" (a row per check, with its
// command and result), a file's heading, a failure row (pressed as a whole when it has a file to open, so it ends in
// a chevron) and the heading of output no parser could place. Colour is the outcome's alone.

export type Drawing = { source: string; width: number; height: number; alt: string }
type Frame = { width: number; mode: Mode }

const VERDICT = { size: 16, weight: 600 }
const VERDICT_LINE = 22
const VERDICT_BASE = 18
const VERDICT_LINES = 3
const NAME = { size: 13, weight: 500 }
const RESULT = { size: 12 }
const COMMAND = { size: 11.5, isMono: true }
const NOTE = { size: 12 }
const NOTE_LINE = 17
const NOTE_LINES = 8
const LOCAL_ROW_H = 42
const BARE_ROW_H = 26
const LOCAL_NAME_BASE = 16
const LOCAL_COMMAND_BASE = 33
const LOCAL_DOT_Y = 12
const LOCAL_NAME_X = 20
const LOCAL_GAP = 12
const METER_H = 4
const METER_ROOM = 10
// `measure` runs a little short on dotted names, and wrapped lines must not reach the drawing's edge.
const WRAP_SLACK = 12
const NOTE_GAP = 18
const BOTTOM = 6
const TITLE = { size: 13, weight: 560 }
const SPAN = { size: 11.5, isMono: true }
const MESSAGE = { size: 11.5, isMono: true }
const META = { size: 12 }
const PATH = { size: 13, weight: 560 }
const FILE_H = 26
const ROW_BASE = 17
const NAME_LINE = 18
const MESSAGE_GAP = 19
const MESSAGE_LINE = 16
const ROW_PAD = 9
const ROW_TOP = 4
// Rows start inside their hover wash, level with the file name above them (view.tsx indents the row by 2 columns).
const TEXT_INDENT = 16
const SPAN_GAP = 10
const CHEVRON = 14
const CHEVRON_ROOM = 24
// A row that opens nothing still keeps its meta off the edge.
const EDGE = 8
const NAME_LINES = 4
const MESSAGE_LINES = 8

const inkOf = (tone: string): Ink => (tone === 'neutral' ? 'hi' : (tone as Ink))

export function verdictSvg(frame: Frame, verdict: Verdict): Drawing {
  const lines = wrapText(verdict.sentence, { width: frame.width, font: VERDICT, maxLines: VERDICT_LINES })
  const body = lines.map((line, n) => text({ ...VERDICT, x: 0, y: VERDICT_BASE + n * VERDICT_LINE, text: line, ink: inkOf(verdict.tone) }))
  const height = VERDICT_BASE + (lines.length - 1) * VERDICT_LINE + BOTTOM

  return { source: svgDoc({ width: frame.width, height, mode: frame.mode, body: body.join('') }), width: frame.width, height, alt: verdict.sentence }
}

function localRow(frame: Frame, row: LocalRow, spec: { top: number; meter: LocalPart['meter'] }): { svg: string; height: number } {
  const { top, meter } = spec
  const room = frame.width - LOCAL_NAME_X - measure(row.result, RESULT) - LOCAL_GAP
  const command = row.command === null ? '' : text({ ...COMMAND, x: LOCAL_NAME_X, y: top + LOCAL_COMMAND_BASE, text: fit(row.command, frame.width - LOCAL_NAME_X, COMMAND), ink: 'lo' })
  const svg = dotOf(row.state, { cy: top + LOCAL_DOT_Y, role: row.role })
    + text({ ...NAME, x: LOCAL_NAME_X, y: top + LOCAL_NAME_BASE, text: fit(row.name, room, NAME), ink: 'hi' })
    + text({ ...RESULT, x: frame.width, y: top + LOCAL_NAME_BASE, text: row.result, ink: row.role, anchor: 'end' })
    + command

  const height = row.command === null ? BARE_ROW_H : LOCAL_ROW_H
  if (meter === null) return { svg, height }
  const drawn = bar({ x: LOCAL_NAME_X, y: top + height - METER_H / 2, width: frame.width - LOCAL_NAME_X, height: METER_H, total: meter.total, value: meter.passed, ink: meter.passed === meter.total ? 'moss' : 'lo' })

  return { svg: svg + drawn, height: height + METER_ROOM }
}

// `meter`: how many tests passed, drawn under the tests' row, the first.
export type LocalPart = { title: string; meta: string; isLive: boolean; rows: LocalRow[]; meter: { passed: number; total: number } | null; note: string }

// The head of "On this computer": each check's name, command and result, and when it runs.
// With no rows (no command found) the note is the message, so it reads in body ink.
export function localPartSvg(frame: Frame, part: LocalPart): Drawing {
  const rows: string[] = []
  let y = PART_H
  for (const [index, row] of part.rows.entries()) {
    const drawn = localRow(frame, row, { top: y, meter: index === 0 ? part.meter : null })
    rows.push(drawn.svg)
    y += drawn.height
  }
  const notes = wrapText(part.note, { width: frame.width - WRAP_SLACK, font: NOTE, maxLines: NOTE_LINES })
  const noteSvg = notes.map((line, n) => text({ ...NOTE, x: 0, y: y + NOTE_GAP + n * NOTE_LINE, text: line, ink: part.rows.length === 0 ? 'mid' : 'lo' }))
  const height = y + NOTE_GAP + (notes.length - 1) * NOTE_LINE + BOTTOM
  const body = partHead({ width: frame.width, label: part.title, meta: part.meta, isLive: part.isLive }) + rows.join('') + noteSvg.join('')
  const said = part.rows.map(row => `${row.name}${row.command === null ? '' : ` (${row.command})`}: ${row.result}`)

  return { source: svgDoc({ width: frame.width, height, mode: frame.mode, body }), width: frame.width, height, alt: [part.title, ...said, part.note].join('. ') }
}

export function fileHeadSvg(frame: Frame, spec: { file: string | null; count: number }): Drawing {
  const count = words().errorCount(spec.count)
  const room = frame.width - 34 - measure(count, META) - CHEVRON_ROOM
  const path = spec.file ?? words().noFile
  const cut = path.lastIndexOf('/')
  const name = fit(path.slice(cut + 1), room, PATH)
  const dir = fitStart(path.slice(0, cut + 1), Math.max(0, room - measure(name, PATH)), { size: PATH.size })
  const body = fileBadge({ x: 0, y: 5, path })
    + runs({ x: 34, y: 17.5, size: PATH.size, parts: [{ text: dir === '…' ? '' : dir, ink: 'lo', weight: 500 }, { text: name, ink: 'hi', weight: PATH.weight }] })
    + text({ ...META, x: frame.width - CHEVRON_ROOM, y: 17.5, text: count, ink: 'lo', anchor: 'end' })

  return { source: svgDoc({ width: frame.width, height: FILE_H, mode: frame.mode, body }), width: frame.width, height: FILE_H, alt: `${path}: ${count}` }
}

// One failure: its `file:line` in mono, suite and time on the right, the test's name beside the place when it
// fits and on lines of its own when not, then the error, wrapped rather than cut. `isPressable`: it opens its file.
export function rowSvg(frame: Frame, failure: Failure, isPressable: boolean): Drawing {
  const right = frame.width - (isPressable ? CHEVRON_ROOM : EDGE)
  const base = ROW_TOP + ROW_BASE
  const place = text({ ...SPAN, x: TEXT_INDENT, y: base, text: spanOf(failure), ink: 'lo' })
  const meta = [suiteTag(failure.suite), durationText(failure.durationMs)].filter(part => part !== '').join(' · ')
  const titleX = TEXT_INDENT + measure(spanOf(failure), SPAN) + SPAN_GAP
  const isInline = measure(failure.name, TITLE) <= right - titleX - measure(meta, META) - 14
  const names = isInline ? [failure.name] : wrapText(failure.name, { width: right - TEXT_INDENT * 2, font: TITLE, maxLines: NAME_LINES })
  const title = names.map((line, n) => text({ ...TITLE, x: isInline ? titleX : TEXT_INDENT, y: base + (isInline ? 0 : (n + 1) * NAME_LINE), text: line, ink: 'hi' }))
  const metaText = text({ ...META, x: right, y: base, text: meta, ink: 'lo', anchor: 'end' })
  const nameBottom = base + (isInline ? 0 : names.length * NAME_LINE)
  const messages = failure.message === '' ? [] : wrapText(failure.message, { width: right - TEXT_INDENT * 2, font: MESSAGE, maxLines: MESSAGE_LINES })
  const message = messages.map((line, n) => text({ ...MESSAGE, x: TEXT_INDENT, y: nameBottom + MESSAGE_GAP + n * MESSAGE_LINE, text: line, ink: 'mid' }))
  const height = (messages.length === 0 ? nameBottom : nameBottom + MESSAGE_GAP + (messages.length - 1) * MESSAGE_LINE) + ROW_PAD
  const chevron = isPressable ? icon('chevron', { x: frame.width - CHEVRON - 4, y: (height - CHEVRON) / 2, size: CHEVRON, ink: 'lo', stroke: 1.5 }) : ''
  const source = svgDoc({ width: frame.width, height, mode: frame.mode, body: place + title.join('') + metaText + message.join('') + chevron })

  return { source, width: frame.width, height, alt: `${spanOf(failure)} ${failure.name}${failure.message === '' ? '' : `: ${failure.message}`}` }
}

export function tailHeadSvg(frame: Frame, title: string): Drawing {
  const body = icon('x', { x: 0, y: 5, size: 16, ink: 'flare', stroke: 1.5 }) + text({ ...TITLE, x: 24, y: 16.5, text: fit(title, frame.width - 24, TITLE), ink: 'hi' })

  return { source: svgDoc({ width: frame.width, height: FILE_H, mode: frame.mode, body }), width: frame.width, height: FILE_H, alt: title }
}
