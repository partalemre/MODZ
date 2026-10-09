// MODZ kit — type in Svg: the eyebrow row that opens every card, and wrapped lines
// (headline, body) with an optional highlighted phrase.
import { baseline, escapeXml, num, rectEl, sans, TYPE, textEl, toPic, upperTr } from './svg-core'
import type { Part, SvgPic } from './svg-core'
import { fitText, wrapText } from './svg-metrics'
import type { Role } from './tokens'

export const EYEBROW_H = 16
const DOT = 6
const DOT_GAP = 6
const META_GAP = 12
const RULE_GAP = 8
const RULE_Y = EYEBROW_H / 2 + 0.5
const META = TYPE.label

export type EyebrowOpts = {
  text: string
  width: number
  role?: Role
  hasDot?: boolean
  meta?: string
  hasRule?: boolean
}

const eyebrowTracking = (): number => TYPE.eyebrow.size * TYPE.eyebrow.tracking

// Width of an uppercased, tracked eyebrow label (Svg letter-spacing follows every glyph).
export const eyebrowWidth = (label: string): number =>
  sans(TYPE.eyebrow.size, TYPE.eyebrow.weight)(label) + [...label].length * eyebrowTracking()

export function eyebrowPart(o: EyebrowOpts): Part {
  const paint = o.role ?? 'lo'
  const y = baseline(0, EYEBROW_H, TYPE.eyebrow.size)
  const left = o.hasDot ? DOT + DOT_GAP : 0
  const meta = o.meta ? fitText(o.meta, o.width / 2, sans(META.size, META.weight)) : ''
  const metaW = meta ? sans(META.size, META.weight)(meta) + META_GAP : 0
  const label = fitText(upperTr(o.text), o.width - left - metaW, eyebrowWidth)
  const labelEnd = left + eyebrowWidth(label)
  const ruleEnd = o.width - metaW
  const parts = [
    o.hasDot ? `<circle cx="${DOT / 2}" cy="${EYEBROW_H / 2}" r="${DOT / 2}" class="f-${paint}"/>` : '',
    textEl({ x: left, y, text: label, paint, ...TYPE.eyebrow, tracking: eyebrowTracking() }),
    o.hasRule && ruleEnd - labelEnd > RULE_GAP * 2
      ? `<path d="M${num(labelEnd + RULE_GAP)} ${RULE_Y}H${num(ruleEnd)}" class="s-line"/>`
      : '',
    meta ? textEl({ x: o.width, y, text: meta, paint: 'lo', ...META, anchor: 'end' }) : '',
  ]

  return { body: parts.join(''), width: o.width, height: EYEBROW_H, alt: [label, meta].filter(Boolean).join(' · ') }
}

export const eyebrow = (o: EyebrowOpts): SvgPic => toPic(eyebrowPart(o))

// ---------------------------------------------------------------------------

export type LinesOpts = {
  text: string
  width: number
  size?: number
  weight?: number
  lineHeight?: number
  paint?: string
  maxLines?: number
  mark?: string
  markRole?: Role
}

const MARK_PAD = 3
const MARK_RADIUS = 4
const MARK_INSET = 1
const LINE_RATIO = 1.3

type Span = { from: number; to: number }
type Resolved = LinesOpts & { size: number; weight: number; lineHeight: number; paint: string; maxLines: number }

// Where `mark` falls in each line, as the lines were cut from the words of `text`.
function markSpans(lines: readonly string[], text: string, mark: string | undefined): (Span | null)[] {
  const flat = text.split(/\s+/).filter(Boolean).join(' ')
  const start = mark ? flat.indexOf(mark.trim()) : -1
  const end = start + (mark?.trim().length ?? 0)
  let offset = 0

  return lines.map(line => {
    const visible = line.endsWith('…') ? line.length - 1 : line.length
    const from = Math.max(start, offset) - offset
    const to = Math.min(end, offset + visible) - offset
    offset += line.length + 1

    return start >= 0 && to > from ? { from, to } : null
  })
}

function lineMarkup(o: { line: string; span: Span | null; top: number; opts: Resolved }): string {
  const { line, span, top, opts } = o
  const measure = sans(opts.size, opts.weight)
  const y = baseline(top, opts.lineHeight, opts.size)
  const role = opts.markRole ?? 'warn'
  const font = `font-size="${opts.size}" font-weight="${opts.weight}"`

  if (span === null) return textEl({ x: 0, y, text: line, size: opts.size, weight: opts.weight, paint: opts.paint })

  const x0 = measure(line.slice(0, span.from))
  const x1 = measure(line.slice(0, span.to))
  const rect = rectEl({ x: x0 - MARK_PAD, y: top + MARK_INSET, width: x1 - x0 + MARK_PAD * 2, height: opts.lineHeight - MARK_INSET * 2, radius: MARK_RADIUS, paint: `${role}-tint` })
  const pieces = [line.slice(0, span.from), line.slice(span.from, span.to), line.slice(span.to)].map(escapeXml)

  return `${rect}<text x="0" y="${y}" class="f-${opts.paint}" ${font}>${pieces[0]}<tspan class="f-${role}">${pieces[1]}</tspan>${pieces[2]}</text>`
}

export function linesPart(o: LinesOpts): Part {
  const size = o.size ?? TYPE.headline.size
  const opts: Resolved = {
    ...o,
    size,
    weight: o.weight ?? TYPE.headline.weight,
    lineHeight: o.lineHeight ?? Math.round(size * LINE_RATIO),
    paint: o.paint ?? 'hi',
    maxLines: o.maxLines ?? 2,
  }
  const lines = wrapText(o.text, o.width - MARK_PAD, opts.maxLines, sans(size, opts.weight))
  const spans = markSpans(lines, o.text, o.mark)
  const body = lines.map((line, i) => lineMarkup({ line, span: spans[i] ?? null, top: i * opts.lineHeight, opts })).join('')

  return { body, width: o.width, height: lines.length * opts.lineHeight, alt: o.text }
}

// The card title: 17/620, wraps to `width`, two lines at most.
export const headline = (o: LinesOpts): SvgPic => toPic(linesPart(o))

// Body copy at 13/400 in text.mid, for a line that must align with Svg type.
export const bodyPart = (o: LinesOpts): Part =>
  linesPart({ size: TYPE.body.size, weight: TYPE.body.weight, lineHeight: TYPE.body.line, paint: 'mid', ...o })
