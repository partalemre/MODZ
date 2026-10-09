import { bar, eyebrow, fileBadge, fit, iconTile, line, measure, monogram, rect, runs, svgDoc, text } from './svg'
import type { Ink } from './svg'
import type { Mode, Role } from './tidemark'
import type { CheckpointMeta, PendingUndo, UndoFile } from '../types'

// The pane's vector parts: the header, one timeline row (a step dot on the rail), and the
// confirm card's heading and diffstat.

export type Drawing = { source: string; width: number; height: number; alt: string }
export type Frame = { width: number; mode: Mode }
export type RowSpec = { title: string; when: string; label: string; meta: CheckpointMeta; isNewest: boolean; isFirst: boolean; isLast: boolean }

const ROW_H = 48
const DOT_X = 8
const DOT_Y = 15
const TEXT_X = 26
const CHIP = 16
const CHIP_GAP = 4
const TITLE = { size: 13.5, weight: 650 }
const LABEL = { size: 12.5 }
const META = { size: 11, isMono: true }
const FILE_ROW_H = 24
const STRIKE_FIT = 0.9
const STAT_H = 30
const TOOL_ROLE: Record<string, Role> = { E: 'kiln', W: 'kiln', $: 'iris', R: 'tide', S: 'tide', G: 'tide', A: 'iris', T: 'orchid' }

const drawing = (frame: Frame, spec: { height: number; body: string; alt: string }): Drawing =>
  ({ source: svgDoc({ width: frame.width, height: spec.height, mode: frame.mode, body: spec.body }), width: frame.width, height: spec.height, alt: spec.alt })

// Icon tile, eyebrow and headline: the opening of the pane and of the confirm card.
export function headSvg(frame: Frame, spec: { role: Role; label: string; meta: string; lead: string; rest: string }): Drawing {
  const x = 48
  const body = iconTile({ x: 0, y: 2, size: 36, role: spec.role, icon: 'history' })
    + eyebrow({ x, y: 13, width: frame.width - x, label: spec.label, role: spec.role, meta: spec.meta })
    + runs({ x, y: 37, size: 17, parts: [{ text: spec.lead, ink: 'hi', weight: 620 }, { text: spec.rest, ink: 'mid', weight: 500 }] })

  const meta = spec.meta === '' ? '' : ` · ${spec.meta}`

  return drawing(frame, { height: 44, body, alt: `${spec.label}: ${spec.lead}${spec.rest}${meta}` })
}

function dotOf(spec: RowSpec): string {
  const { meta } = spec
  if (meta.isSafety === true) return rect({ x: DOT_X - 3.5, y: DOT_Y - 3.5, w: 7, h: 7, rx: 1.5, fill: 'amber-t', stroke: 'amber' })
  if (meta.isUndone === true) return `<circle cx="${DOT_X}" cy="${DOT_Y}" r="4" stroke-dasharray="2 1.6" style="fill:var(--card);stroke:var(--lo)"/>`
  if (spec.isNewest) return `<circle cx="${DOT_X}" cy="${DOT_Y}" r="7" style="fill:var(--kiln-t)"/><circle cx="${DOT_X}" cy="${DOT_Y}" r="4" style="fill:var(--kiln)"/>`

  return `<circle cx="${DOT_X}" cy="${DOT_Y}" r="4" style="fill:var(--strong)"/>`
}

function railOf(spec: RowSpec): string {
  const top = spec.isFirst ? DOT_Y : 0
  const bottom = spec.isLast ? DOT_Y : ROW_H

  return top === bottom ? '' : line({ x1: DOT_X, y1: top, x2: DOT_X, y2: bottom, ink: 'line' })
}

// Tool monograms then "+3 dosya", right-aligned; answers the drawing and where it starts.
function rightOf(frame: Frame, meta: CheckpointMeta): { svg: string; left: number } {
  const tools = meta.tools ?? []
  let left = frame.width - tools.length * (CHIP + CHIP_GAP) + CHIP_GAP
  const chips = tools.map((glyph, index) => monogram({ x: left + index * (CHIP + CHIP_GAP), y: 4, glyph, role: TOOL_ROLE[glyph] ?? 'tide' }))
  const files = meta.files === undefined || meta.files === 0 ? '' : `+${meta.files} dosya`
  if (files === '') return { svg: chips.join(''), left }
  left -= (tools.length > 0 ? 10 : 0) + measure(files, META)

  return { svg: chips.join('') + text({ ...META, x: left, y: 16, text: files, ink: meta.isUndone === true ? 'lo' : 'mid' }), left }
}

function struck(spec: { x: number; y: number; text: string; size: number; weight?: number }): string {
  // Glyph widths are estimated generously; the rule hugs the text a little tighter.
  const width = measure(spec.text, spec) * STRIKE_FIT

  return line({ x1: spec.x - 1, y1: spec.y - spec.size * 0.32, x2: spec.x + width + 1, y2: spec.y - spec.size * 0.32, ink: 'lo' })
}

export function rowSvg(frame: Frame, spec: RowSpec): Drawing {
  const { meta } = spec
  const isUndone = meta.isUndone === true
  const right = rightOf(frame, meta)
  const titleInk: Ink = meta.isSafety === true ? 'amber' : isUndone ? 'lo' : 'hi'
  const head = runs({ x: TEXT_X, y: 19, size: TITLE.size, parts: [{ text: spec.title, ink: titleInk, weight: TITLE.weight }, { text: `  ${spec.when}`, ink: 'lo', weight: 400 }] })
  const label = fit(spec.label, frame.width - TEXT_X, LABEL)
  const body = text({ ...LABEL, x: TEXT_X, y: 38, text: label, ink: isUndone ? 'lo' : 'mid' })
  const strikes = isUndone ? struck({ x: TEXT_X, y: 19, text: spec.title, ...TITLE }) + struck({ x: TEXT_X, y: 38, text: label, ...LABEL }) : ''
  const all = railOf(spec) + dotOf(spec) + head + right.svg + body + strikes

  return drawing(frame, { height: ROW_H, body: all, alt: `${spec.title}, ${spec.when}${isUndone ? ', geri alındı' : ''}: ${spec.label}` })
}

function fileRow(frame: Frame, file: UndoFile, y: number): string {
  const counts = `+${file.added} −${file.removed}`
  const tag = file.isRemoved ? 'silinecek' : 'değişecek'
  const tagW = measure(tag, { size: 11 })
  const countsW = measure(counts, META)
  const room = frame.width - 34 - countsW - tagW - 24
  const path = fit(file.path, room, { size: 12.5 }, true)

  return fileBadge({ x: 0, y: y + 3, path: file.path })
    + text({ size: 12.5, x: 34, y: y + 15, text: path, ink: 'hi' })
    + text({ size: 11, x: frame.width - countsW - 12, y: y + 15, text: tag, ink: file.isRemoved ? 'flare' : 'lo', anchor: 'end' })
    + runs({ x: frame.width - countsW, y: y + 15, size: META.size, parts: [{ text: `+${file.added}`, ink: 'moss', isMono: true }, { text: ` −${file.removed}`, ink: 'flare', isMono: true }] })
}

// "+42 −17" with a five-block bar, then up to five files with their own counts.
export function diffstatSvg(frame: Frame, pending: PendingUndo): Drawing {
  const total = pending.added + pending.removed
  const summary = runs({ x: 0, y: 17, size: 13, parts: [{ text: `+${pending.added}`, ink: 'moss', weight: 650, isMono: true }, { text: ` −${pending.removed}`, ink: 'flare', weight: 650, isMono: true }] })
  const sumW = measure(`+${pending.added} −${pending.removed}`, { size: 13, isMono: true }) + 12
  const blocks = bar({ x: sumW, y: 9, width: 60, height: 6, total: Math.max(1, total), parts: [{ value: pending.added, ink: 'moss' }, { value: pending.removed, ink: 'flare' }] })
  const parts = [`${pending.restore} geri yüklenecek`, pending.remove > 0 ? `${pending.remove} silinecek` : ''].filter(part => part !== '').join(' · ')
  const note = text({ size: 11.5, x: sumW + 72, y: 17, text: parts, ink: 'lo' })
  const files = pending.files.map((file, index) => fileRow(frame, file, STAT_H + index * FILE_ROW_H))
  const height = STAT_H + pending.files.length * FILE_ROW_H

  return drawing(frame, { height, body: summary + blocks + note + files.join(''), alt: `+${pending.added} −${pending.removed} satır, ${parts}: ${pending.files.map(file => file.path).join(', ')}` })
}
