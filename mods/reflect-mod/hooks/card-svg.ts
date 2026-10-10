// The card's drawings: the proposal head (tile, eyebrow, confidence, the rule as the headline, the
// person's own words, "NEREYE"), the saved state, and the small path and icon pieces of a row.

import { ICONS } from './icons'
import { EYEBROW, doc, eyebrow, fit, icon, measure, text, tile, wrap } from './svg'
import { upper } from './theme'
import type { Font } from './svg'
import type { Palette } from './theme'

const TILE = 38
const TILE_Y = 4
const GLYPH = 18
const TEXT_X = 52
const EYEBROW_Y = 16
const HEADLINE: Font = { size: 17, weight: 620 }
const HEADLINE_TOP = 38
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

// The header every MODZ card opens with: a 38 px tile, the eyebrow beside it and meta on the right.
function head(o: { width: number; glyph: string; label: string; meta: string }, p: Palette): string[] {
  const { width, glyph, label, meta } = o
  const moss = p.role.ok
  const inset = (TILE - GLYPH) / 2
  const parts = [
    tile({ x: 0, y: TILE_Y, size: TILE, tint: moss.tint }),
    icon(glyph, { x: inset, y: TILE_Y + inset, size: GLYPH, color: moss.fg }),
    eyebrow({ x: TEXT_X, y: EYEBROW_Y, fill: moss.fg }, label),
  ]
  // Meta (repeats, confidence) shares the eyebrow's line only when both fit whole; else it gives way.
  const hasRoom = measure(upper(label), EYEBROW) + measure(meta, META) + META_GAP <= width - TEXT_X
  if (meta && hasRoom) parts.push(text({ ...META, x: width, y: EYEBROW_Y, fill: p.lo, text: meta, anchor: 'end' }))
  return parts
}

const lines = (rows: string[], spec: { top: number; step: number; font: Font; fill: string }): string[] =>
  rows.map((row, i) => text({ ...spec.font, x: TEXT_X, y: spec.top + i * spec.step, fill: spec.fill, text: row }))

/** "Söylediğin: “…”" in the person's own italic, wrapped beside the tile. */
function saidLines(o: { width: number; top: number; said: string }, p: Palette): { parts: string[]; count: number } {
  const { width, top, said } = o
  const label = 'Söylediğin: '
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
    ...head({ width, glyph: ICONS.bookmarkPlus, label: 'Kural olarak kaydedilsin mi?', meta: c.meta }, p),
    ...lines(rule, { top: HEADLINE_TOP, step: HEADLINE_STEP, font: HEADLINE, fill: p.hi }),
    ...said.parts,
    eyebrow({ x: 0, y: whereY, fill: p.lo }, 'Nereye'),
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
  const lead = c.isNew ? 'Eklendiği yer: ' : 'Zaten burada: '
  const leadW = measure(lead, BODY)
  const note = wrap('Claude bir sonraki mesajından itibaren buna uyar.', { width: room, font: BODY, maxLines: RULE_LINES })
  const parts = [
    ...head({ width, glyph: ICONS.check, label: 'Kural kaydedildi', meta: '' }, p),
    text({ ...HEADLINE, x: TEXT_X, y: HEADLINE_TOP, fill: p.hi, text: fit(c.title, room, HEADLINE) }),
    ...lines(quote, { top: quoteTop, step: BODY_STEP, font: BODY, fill: p.mid }),
    text({ ...BODY, x: TEXT_X, y: whereY, fill: p.lo, text: lead }),
    text({ ...PATH, x: TEXT_X + leadW, y: whereY, fill: p.hi, weight: 600, text: fit(c.path, room - leadW, PATH) }),
    ...lines(note, { top: whereY + BODY_STEP, step: BODY_STEP, font: BODY, fill: p.lo }),
  ]
  const height = whereY + note.length * BODY_STEP + BOTTOM
  return { source: doc({ width, height }, parts.join('')), height }
}

const PATH_H = 18
const PATH_BASELINE = 13

/** A file path in mono, sized to itself. */
export function pathSvg(path: string, color: string): { source: string; width: number; height: number } {
  const width = Math.ceil(measure(path, PATH)) + 2
  return { source: doc({ width, height: PATH_H }, text({ ...PATH, x: 0, y: PATH_BASELINE, fill: color, text: path })), width, height: PATH_H }
}
