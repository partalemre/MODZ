// The card's drawings: the proposal head (bare icon, label, confidence, the rule as the headline, the
// person's own words, the "Where" label), the saved state, and a destination row (one drawing, pressed whole).

import { ICONS } from './icons'
import { LABEL, doc, fit, icon, label, measure, text, wrap } from './svg'
import type { Font } from './svg'
import type { Palette } from './theme'
import { words } from './words'

const GLYPH = 18
const GLYPH_Y = 21
const TEXT_X = 30
const LABEL_Y = 13
const HEADLINE: Font = { size: 16, weight: 600 }
const HEADLINE_TOP = 35
const HEADLINE_STEP = 22
// A rule is one sentence; this many lines hold any the model writes, so none is cut.
const HEADLINE_LINES = 6
const BODY: Font = { size: 13 }
const BODY_STEP = 19
const META: Font = { size: 12 }
const META_GAP = 16
const PATH: Font = { size: 12, isMono: true }
const SAID_LINES = 2
const SECTION_GAP = 30
const BOTTOM = 8

export type Proposal = { rule: string; said: string; meta: string }

// The header: a bare icon, the label beside it and meta on the right.
function head(o: { width: number; glyph: string; text: string; meta: string; color?: string }, p: Palette): string[] {
  const { width, glyph, meta } = o
  const parts = [
    icon(glyph, { x: 0, y: GLYPH_Y, size: GLYPH, color: o.color ?? p.mid }),
    label({ x: TEXT_X, y: LABEL_Y, fill: p.lo }, o.text),
  ]
  // Meta (repeats, confidence) shares the label's line only when both fit whole; else it gives way.
  const hasRoom = measure(o.text, LABEL) + measure(meta, META) + META_GAP <= width - TEXT_X
  if (meta && hasRoom) parts.push(text({ ...META, x: width, y: LABEL_Y, fill: p.lo, text: meta, anchor: 'end' }))
  return parts
}

const lines = (rows: string[], spec: { top: number; step: number; font: Font; fill: string }): string[] =>
  rows.map((row, i) => text({ ...spec.font, x: TEXT_X, y: spec.top + i * spec.step, fill: spec.fill, text: row }))

/** "Söylediğin: “…”" in the person's own italic, wrapped beside the icon. */
function saidLines(o: { width: number; top: number; said: string }, p: Palette): { parts: string[]; count: number } {
  const { width, top, said } = o
  const label = words().said
  const labelW = measure(label, BODY)
  const [first = '', ...rest] = wrapAfter(`“${said}”`, width - TEXT_X, labelW)
  const parts = [
    text({ ...BODY, x: TEXT_X, y: top, fill: p.mid, text: label }),
    text({ ...BODY, x: TEXT_X + labelW, y: top, fill: p.hi, isItalic: true, text: first }),
    ...rest.map((row, i) => text({ ...BODY, x: TEXT_X, y: top + (i + 1) * BODY_STEP, fill: p.hi, isItalic: true, text: row })),
  ]
  return { parts, count: 1 + rest.length }
}

/** Wraps `quote` with its first line `indent` px shorter, the lines after it full width; at most SAID_LINES. */
function wrapAfter(quote: string, width: number, indent: number): string[] {
  const words = quote.split(/\s+/).filter(Boolean)
  const first: string[] = []
  while (words.length > 0 && (first.length === 0 || measure([...first, words[0]].join(' '), BODY) <= width - indent)) first.push(words.shift() ?? '')
  return words.length === 0 ? [first.join(' ')] : [first.join(' '), ...wrap(words.join(' '), { width, font: BODY, maxLines: SAID_LINES - 1 })]
}

export function proposalSvg(width: number, c: Proposal, p: Palette): { source: string; height: number } {
  const rule = wrap(`“${c.rule}”`, { width: width - TEXT_X, font: HEADLINE, maxLines: HEADLINE_LINES })
  const last = HEADLINE_TOP + (rule.length - 1) * HEADLINE_STEP
  const said = c.said ? saidLines({ width, top: last + BODY_STEP + 4, said: c.said }, p) : { parts: [], count: 0 }
  const bottomText = c.said ? last + BODY_STEP + 4 + (said.count - 1) * BODY_STEP : last
  const whereY = bottomText + SECTION_GAP
  const parts = [
    ...head({ width, glyph: ICONS.bookmarkPlus, text: words().ask, meta: c.meta }, p),
    ...lines(rule, { top: HEADLINE_TOP, step: HEADLINE_STEP, font: HEADLINE, fill: p.hi }),
    ...said.parts,
    label({ x: 0, y: whereY, fill: p.lo }, words().where),
  ]
  const height = whereY + BOTTOM
  return { source: doc({ width, height }, parts.join('')), height }
}

export type Saved = { title: string; rule: string; path: string; isNew: boolean }

const RULE_LINES = 4

export function savedSvg(width: number, c: Saved, p: Palette): { source: string; height: number } {
  const room = width - TEXT_X
  const quote = wrap(`“${c.rule}”`, { width: room, font: BODY, maxLines: RULE_LINES })
  const quoteTop = HEADLINE_TOP + BODY_STEP + 4
  const whereY = quoteTop + quote.length * BODY_STEP
  const says = words()
  const lead = `${c.isNew ? says.addedTo : says.alreadyIn}: `
  const leadW = measure(lead, BODY)
  const note = wrap(says.followsNext, { width: room, font: BODY, maxLines: RULE_LINES })
  const parts = [
    ...head({ width, glyph: ICONS.check, text: says.saved, meta: '', color: p.role.ok.fg }, p),
    text({ ...HEADLINE, x: TEXT_X, y: HEADLINE_TOP, fill: p.hi, text: fit(c.title, room, HEADLINE) }),
    ...lines(quote, { top: quoteTop, step: BODY_STEP, font: BODY, fill: p.mid }),
    text({ ...BODY, x: TEXT_X, y: whereY, fill: p.lo, text: lead }),
    text({ ...PATH, x: TEXT_X + leadW, y: whereY, fill: p.hi, weight: 600, text: fit(c.path, room - leadW, PATH) }),
    ...lines(note, { top: whereY + BODY_STEP, step: BODY_STEP, font: BODY, fill: p.lo }),
  ]
  const height = whereY + note.length * BODY_STEP + BOTTOM
  return { source: doc({ width, height }, parts.join('')), height }
}

const DEST_ICON = 16
const DEST_PAD = 10
const DEST_GAP = 16
const DEST_H = 34
const DEST_STACK_H = 54
const DEST_BASELINE = 22
const DEST_WASH_OPACITY = 0.55
const DEST_LABEL_X = DEST_PAD + DEST_ICON + 8
const DEST_LABEL: Font = { size: 13, weight: 560 }

export type Dest = { icon: string; label: string; path: string; isPicked: boolean; isStacked: boolean }

/** Whether any row's path would not fit beside its label at this width: then every row puts it underneath. */
export const isStackedAt = (rows: Pick<Dest, 'label' | 'path'>[], width: number): boolean =>
  rows.some(row => DEST_LABEL_X + measure(row.label, DEST_LABEL) + DEST_GAP + measure(row.path, PATH) + DEST_PAD > width)

/** A destination as one drawing the whole of which is the press: scope icon, label, path. The picked row rests on a neutral wash. */
export function destSvg(width: number, d: Dest, p: Palette): { source: string; height: number } {
  const height = d.isStacked ? DEST_STACK_H : DEST_H
  const room = width - DEST_LABEL_X - DEST_PAD
  const pathSpec = d.isStacked ? { x: DEST_LABEL_X, y: DEST_BASELINE + 20 } : { x: width - DEST_PAD, y: DEST_BASELINE, anchor: 'end' as const }
  const parts = [
    d.isPicked ? `<rect x="0" y="0" width="${width}" height="${height}" rx="8" fill="${p.track}" opacity="${DEST_WASH_OPACITY}"/>` : '',
    icon(d.icon, { x: DEST_PAD, y: (DEST_H - DEST_ICON) / 2, size: DEST_ICON, color: d.isPicked ? p.hi : p.lo }),
    text({ ...DEST_LABEL, x: DEST_LABEL_X, y: DEST_BASELINE, fill: d.isPicked ? p.hi : p.mid, text: d.label }),
    text({ ...PATH, ...pathSpec, fill: d.isPicked ? p.mid : p.lo, text: fit(d.path, room, PATH) }),
  ]
  return { source: doc({ width, height }, parts.join('')), height }
}
