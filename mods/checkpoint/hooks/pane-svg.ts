import { bar, eyebrow, eyebrowWidth, fileBadge, fit, iconTile, line, measure, monogram, rect, runs, svgDoc, text, wrap } from './svg'
import type { Font, Ink } from './svg'
import type { Mode, Role } from './tidemark'
import type { CheckpointMeta, PendingUndo, UndoFile } from '../types'

// The pane's vector parts: the header, one timeline row (a step dot on the rail), and the
// confirm card's heading and diffstat. A narrow panel stacks what a wide one puts side by side,
// so nothing has to be cut.

export type Drawing = { source: string; width: number; height: number; alt: string }
export type Frame = { width: number; mode: Mode }
export type RowSpec = { title: string; when: string; label: string; meta: CheckpointMeta; isNewest: boolean; isFirst: boolean; isLast: boolean }
export type HeadSpec = { role: Role; label: string; meta: string; lead: string; rest: string; joiner?: string }

const HEAD_X = 48
const HEAD_LEAD_Y = 37
const HEAD_MIN_H = 44
const SUB_LINE_H = 19
const LEAD: Font = { size: 17, weight: 620 }
const SUB: Font = { size: 13 }
const HEAD_META: Font = { size: 11.5 }
const ROW_MIN_H = 48
const ROW_PAD_BOTTOM = 10
const DOT_X = 8
const DOT_Y = 15
const TEXT_X = 26
const TITLE_Y = 19
const LABEL_Y = 38
const LABEL_LINE_H = 17
const LABEL_LINES = 2
const CHIP = 16
const CHIP_GAP = 4
const RIGHT_GAP = 12
const FILES_GAP = 10
const TITLE: Font = { size: 13.5, weight: 650 }
const WHEN: Font = { size: 13.5 }
const LABEL: Font = { size: 12.5 }
const META: Font = { size: 11, isMono: true }
const STRIKE_FIT = 0.95
const TOOL_ROLE: Record<string, Role> = { E: 'kiln', W: 'kiln', $: 'iris', R: 'tide', S: 'tide', G: 'tide', A: 'iris', T: 'orchid' }

const drawing = (frame: Frame, spec: { height: number; body: string; alt: string }): Drawing =>
  ({ source: svgDoc({ width: frame.width, height: spec.height, mode: frame.mode, body: spec.body }), width: frame.width, height: spec.height, alt: spec.alt })

// The lines under the headline: `rest` when it does not fit beside the lead, then `meta` when the eyebrow has no room for it.
function headLines(room: number, spec: HeadSpec): { inline: string; sub: { text: string; font: Font; ink: Ink }[]; isMetaUp: boolean } {
  const joiner = spec.joiner ?? ' '
  const isMetaUp = spec.meta === '' || eyebrowWidth(spec.label, spec.meta) <= room
  const isRestInline = spec.rest === '' || measure(`${spec.lead}${joiner}${spec.rest}`, LEAD) <= room
  const rest = isRestInline ? [] : wrap(spec.rest, room, { font: SUB, maxLines: LABEL_LINES }).map(part => ({ text: part, font: SUB, ink: 'mid' as Ink }))
  const meta = isMetaUp ? [] : [{ text: fit(spec.meta, room, HEAD_META), font: HEAD_META, ink: 'lo' as Ink }]

  return { inline: isRestInline && spec.rest !== '' ? `${joiner}${spec.rest}` : '', sub: [...rest, ...meta], isMetaUp }
}

// Icon tile, eyebrow and headline: the opening of the pane and of the confirm card.
export function headSvg(frame: Frame, spec: HeadSpec): Drawing {
  const room = frame.width - HEAD_X
  const lines = headLines(room, spec)
  const lead = fit(spec.lead, room, LEAD)
  const subs = lines.sub.map((part, index) => text({ ...part.font, x: HEAD_X, y: HEAD_LEAD_Y + SUB_LINE_H * (index + 1), text: part.text, ink: part.ink }))
  const body = iconTile({ x: 0, y: 2, size: 36, role: spec.role, icon: 'history' })
    + eyebrow({ x: HEAD_X, y: 13, width: room, label: spec.label, role: spec.role, meta: lines.isMetaUp ? spec.meta : '' })
    + runs({ x: HEAD_X, y: HEAD_LEAD_Y, size: LEAD.size, parts: [{ text: lead, ink: 'hi', weight: LEAD.weight }, { text: lines.inline, ink: 'mid', weight: 500 }] })
    + subs.join('')
  const height = Math.max(HEAD_MIN_H, HEAD_MIN_H + SUB_LINE_H * lines.sub.length)
  const meta = spec.meta === '' ? '' : ` · ${spec.meta}`
  const rest = spec.rest === '' ? '' : `${spec.joiner ?? ' '}${spec.rest}`

  return drawing(frame, { height, body, alt: `${spec.label}: ${spec.lead}${rest}${meta}` })
}

function dotOf(spec: RowSpec): string {
  const { meta } = spec
  if (meta.isSafety === true) return rect({ x: DOT_X - 3.5, y: DOT_Y - 3.5, w: 7, h: 7, rx: 1.5, fill: 'amber-t', stroke: 'amber' })
  if (meta.isUndone === true) return `<circle cx="${DOT_X}" cy="${DOT_Y}" r="4" stroke-dasharray="2 1.6" style="fill:var(--card);stroke:var(--lo)"/>`
  if (spec.isNewest) return `<circle cx="${DOT_X}" cy="${DOT_Y}" r="7" style="fill:var(--kiln-t)"/><circle cx="${DOT_X}" cy="${DOT_Y}" r="4" style="fill:var(--kiln)"/>`

  return `<circle cx="${DOT_X}" cy="${DOT_Y}" r="4" style="fill:var(--strong)"/>`
}

function railOf(spec: RowSpec, height: number): string {
  const top = spec.isFirst ? DOT_Y : 0
  const bottom = spec.isLast ? DOT_Y : height

  return top === bottom ? '' : line({ x1: DOT_X, y1: top, x2: DOT_X, y2: bottom, ink: 'line' })
}

const filesText = (meta: CheckpointMeta): string => (meta.files === undefined || meta.files === 0 ? '' : `+${meta.files} dosya`)

// Tool monograms and "+3 dosya" as one strip starting at `x`, top at `y`; answers the drawing and its width.
// Beside the title the count leads so the chips sit flush right; stacked under the label the chips lead.
function factsOf(meta: CheckpointMeta, at: { x: number; y: number; isCountFirst: boolean }): { svg: string; width: number } {
  const tools = meta.tools ?? []
  const chipsW = tools.length === 0 ? 0 : tools.length * (CHIP + CHIP_GAP) - CHIP_GAP
  const files = filesText(meta)
  const filesW = files === '' ? 0 : measure(files, META)
  const gap = chipsW > 0 && filesW > 0 ? FILES_GAP : 0
  const chipsX = at.isCountFirst ? at.x + filesW + gap : at.x
  const filesX = at.isCountFirst ? at.x : at.x + chipsW + gap
  const chips = tools.map((glyph, index) => monogram({ x: chipsX + index * (CHIP + CHIP_GAP), y: at.y, glyph, role: TOOL_ROLE[glyph] ?? 'tide' }))
  const label = files === '' ? '' : text({ ...META, x: filesX, y: at.y + 12, text: files, ink: meta.isUndone === true ? 'lo' : 'mid' })

  return { svg: chips.join('') + label, width: chipsW + gap + filesW }
}

const factsWidth = (meta: CheckpointMeta): number => factsOf(meta, { x: 0, y: 0, isCountFirst: false }).width
const headWidth = (spec: RowSpec): number => measure(spec.title, TITLE) + measure(`  ${spec.when}`, WHEN)

// Whether the title line has room for the facts on its right; otherwise every row stacks them below.
export function rowFits(frame: Frame, spec: RowSpec): boolean {
  const facts = factsWidth(spec.meta)

  return facts === 0 || TEXT_X + headWidth(spec) + RIGHT_GAP + facts <= frame.width
}

function struck(spec: { x: number; y: number; text: string; font: Font }): string {
  // Glyph widths are estimated a touch wide; the rule hugs the text a little tighter.
  const width = measure(spec.text, spec.font) * STRIKE_FIT
  const y = spec.y - spec.font.size * 0.32

  return line({ x1: spec.x - 1, y1: y, x2: spec.x + width + 1, y2: y, ink: 'lo' })
}

export function rowSvg(frame: Frame, spec: RowSpec & { isStacked: boolean }): Drawing {
  const { meta } = spec
  const isUndone = meta.isUndone === true
  const titleInk: Ink = meta.isSafety === true ? 'amber' : isUndone ? 'lo' : 'hi'
  const head = runs({ x: TEXT_X, y: TITLE_Y, size: TITLE.size, parts: [{ text: spec.title, ink: titleInk, weight: TITLE.weight }, { text: `  ${spec.when}`, ink: 'lo', weight: 400 }] })
  const labels = wrap(spec.label, frame.width - TEXT_X, { font: LABEL, maxLines: LABEL_LINES })
  const labelY = (index: number) => LABEL_Y + index * LABEL_LINE_H
  const body = labels.map((part, index) => text({ ...LABEL, x: TEXT_X, y: labelY(index), text: part, ink: isUndone ? 'lo' : 'mid' })).join('')
  const lastY = labelY(Math.max(0, labels.length - 1))
  const hasFacts = factsWidth(meta) > 0
  const factsTop = spec.isStacked ? lastY + ROW_PAD_BOTTOM - 2 : TITLE_Y - 15
  const facts = factsOf(meta, { x: spec.isStacked ? TEXT_X : frame.width - factsWidth(meta), y: factsTop, isCountFirst: !spec.isStacked })
  const bottom = spec.isStacked && hasFacts ? factsTop + CHIP : lastY
  const height = Math.max(ROW_MIN_H, Math.ceil(bottom + ROW_PAD_BOTTOM))
  const strikes = isUndone ? [struck({ x: TEXT_X, y: TITLE_Y, text: spec.title, font: TITLE }), ...labels.map((part, index) => struck({ x: TEXT_X, y: labelY(index), text: part, font: LABEL }))].join('') : ''
  const all = railOf(spec, height) + dotOf(spec) + head + facts.svg + body + strikes
  const files = filesText(meta)

  return drawing(frame, { height, body: all, alt: `${spec.title}, ${spec.when}${isUndone ? ', geri alındı' : ''}${files === '' ? '' : `, ${files}`}: ${spec.label}` })
}

const STAT_LINE_Y = 17
const STAT_NOTE_Y = 37
const STAT_BAR_W = 60
const STAT_GAP = 12
const FILE_X = 34
const FILE_ROW_H = 24
const FILE_ROW_TALL = 38
const FILE_NAME: Font = { size: 12.5 }
const FILE_DIR: Font = { size: 11 }
const TAG: Font = { size: 11 }
const REMOVED_TAG = 'silinecek'

const countsOf = (file: UndoFile): string => `+${file.added} −${file.removed}`
const rightOfFile = (file: UndoFile): number => measure(countsOf(file), META) + (file.isRemoved ? measure(REMOVED_TAG, TAG) + STAT_GAP : 0)
const fileFits = (frame: Frame, file: UndoFile): boolean => FILE_X + measure(file.path, FILE_NAME) + STAT_GAP + rightOfFile(file) <= frame.width

// One file of the undo: on one line when its whole path fits, else its name over its folder.
function fileRow(frame: Frame, file: UndoFile, at: { y: number; isTall: boolean }): string {
  const countsW = measure(countsOf(file), META)
  const room = frame.width - FILE_X - STAT_GAP - rightOfFile(file)
  const cut = file.path.lastIndexOf('/')
  const name = at.isTall && cut >= 0 ? file.path.slice(cut + 1) : file.path
  const folder = at.isTall && cut >= 0 ? file.path.slice(0, cut + 1) : ''
  const tag = file.isRemoved ? text({ ...TAG, x: frame.width - countsW - STAT_GAP, y: at.y + 15, text: REMOVED_TAG, ink: 'flare', anchor: 'end' }) : ''
  const under = folder === '' ? '' : text({ ...FILE_DIR, x: FILE_X, y: at.y + 30, text: fit(folder, frame.width - FILE_X, FILE_DIR, true), ink: 'lo' })

  return fileBadge({ x: 0, y: at.y + 3, path: file.path })
    + text({ ...FILE_NAME, x: FILE_X, y: at.y + 15, text: fit(name, room, FILE_NAME, true), ink: 'hi' })
    + under + tag
    + runs({ x: frame.width - countsW, y: at.y + 15, size: META.size, parts: [{ text: `+${file.added}`, ink: countInk(file.added, 'moss'), isMono: true }, { text: ` −${file.removed}`, ink: countInk(file.removed, 'flare'), isMono: true }] })
}

// A zero count is meta, not a change: it stays text.lo.
const countInk = (count: number, ink: Ink): Ink => (count === 0 ? 'lo' : ink)

const MORE_H = 22

// The files the card has no row for, counted as the terminal card counts them.
function moreOf(pending: PendingUndo, y: number): { svg: string; height: number; text: string } {
  const more = pending.restore + pending.remove - pending.files.length
  if (more <= 0) return { svg: '', height: 0, text: '' }
  const said = `+${more} dosya daha`

  return { svg: text({ size: 11.5, x: FILE_X, y: y + 15, text: said, ink: 'lo' }), height: MORE_H, text: said }
}

// "+42 −17" with a bar and what the undo does, then up to five files with their own counts.
export function diffstatSvg(frame: Frame, pending: PendingUndo): Drawing {
  const total = pending.added + pending.removed
  const sumFont: Font = { size: 13, isMono: true }
  const summary = runs({ x: 0, y: STAT_LINE_Y, size: sumFont.size, parts: [{ text: `+${pending.added}`, ink: 'moss', weight: 650, isMono: true }, { text: ` −${pending.removed}`, ink: 'flare', weight: 650, isMono: true }] })
  const sumW = measure(`+${pending.added} −${pending.removed}`, sumFont) + STAT_GAP
  const blocks = bar({ x: sumW, y: STAT_LINE_Y - 8, width: STAT_BAR_W, height: 6, total: Math.max(1, total), parts: [{ value: pending.added, ink: 'moss' }, { value: pending.removed, ink: 'flare' }] })
  const parts = [`${pending.restore} geri yüklenecek`, pending.remove > 0 ? `${pending.remove} silinecek` : ''].filter(part => part !== '').join(' · ')
  const noteX = sumW + STAT_BAR_W + STAT_GAP
  const isNoteBeside = noteX + measure(parts, { size: 11.5 }) <= frame.width
  const note = text({ size: 11.5, x: isNoteBeside ? noteX : 0, y: isNoteBeside ? STAT_LINE_Y : STAT_NOTE_Y, text: parts, ink: 'lo' })
  const statH = (isNoteBeside ? STAT_LINE_Y : STAT_NOTE_Y) + 13
  const isTall = pending.files.some(file => !fileFits(frame, file))
  const rowH = isTall ? FILE_ROW_TALL : FILE_ROW_H
  const files = pending.files.map((file, index) => fileRow(frame, file, { y: statH + index * rowH, isTall }))
  const more = moreOf(pending, statH + pending.files.length * rowH)
  const height = statH + pending.files.length * rowH + more.height
  const listed = [...pending.files.map(file => file.path), ...(more.text === '' ? [] : [more.text])].join(', ')

  return drawing(frame, { height, body: summary + blocks + note + files.join('') + more.svg, alt: `+${pending.added} −${pending.removed} satır, ${parts}: ${listed}` })
}
