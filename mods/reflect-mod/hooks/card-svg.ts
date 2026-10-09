// The card's drawings: the proposal head (disc, eyebrow, confidence, the rule as the headline, the
// person's own words, "NEREYE"), the saved state, and the small path and icon pieces of a row.

import { ICONS } from './icons'
import { disc, doc, eyebrow, fit, icon, measure, text, wrap } from './svg'
import type { Font } from './svg'
import type { Palette } from './theme'

const DISC = 32
const GLYPH = 18
const EYEBROW_X = 44
const EYEBROW_Y = 20
const HEADLINE: Font = { size: 17, weight: 620 }
const HEADLINE_STEP = 23
const HEADLINE_TOP = 58
const HEADLINE_LINES = 3
const BODY: Font = { size: 13 }
const BODY_STEP = 20
const META: Font = { size: 12 }
const PATH: Font = { size: 12, isMono: true }
const GAP = 25
const SECTION_GAP = 30
const BOTTOM = 8

export type Proposal = { rule: string; said: string; meta: string }

function head(width: number, glyph: string, label: string, meta: string, p: Palette): string[] {
  const moss = p.role.ok
  const parts = [disc(0, 0, DISC, moss.tint), icon(glyph, (DISC - GLYPH) / 2, (DISC - GLYPH) / 2, GLYPH, moss.fg), eyebrow(EYEBROW_X, EYEBROW_Y, label, moss.fg)]
  if (meta) parts.push(text({ ...META, x: width, y: EYEBROW_Y, fill: p.lo, text: meta, anchor: 'end' }))
  return parts
}

function headlines(lines: string[], top: number, p: Palette): string[] {
  return lines.map((line, i) => text({ ...HEADLINE, x: 0, y: top + i * HEADLINE_STEP, fill: p.hi, text: line }))
}

/** "Söylediğin: “…”" on one line, the quote in the person's own italic. */
function saidLine(width: number, y: number, said: string, p: Palette): string {
  const label = 'Söylediğin: '
  const labelW = measure(label, BODY)
  return text({ ...BODY, x: 0, y, fill: p.mid, text: label }) +
    text({ ...BODY, x: labelW, y, fill: p.hi, isItalic: true, text: fit(`“${said}”`, width - labelW, BODY) })
}

export function proposalSvg(width: number, c: Proposal, p: Palette): { source: string; height: number } {
  const lines = wrap(`“${c.rule}”`, width, HEADLINE, HEADLINE_LINES)
  const last = HEADLINE_TOP + (lines.length - 1) * HEADLINE_STEP
  const saidY = last + GAP
  const whereY = (c.said ? saidY : last) + SECTION_GAP
  const parts = [...head(width, ICONS.bookmarkPlus, 'Kural olarak kaydedilsin mi?', c.meta, p), ...headlines(lines, HEADLINE_TOP, p)]
  if (c.said) parts.push(saidLine(width, saidY, c.said, p))
  parts.push(eyebrow(0, whereY, 'Nereye', p.lo))
  const height = whereY + BOTTOM
  return { source: doc(width, height, parts.join('')), height }
}

export type Saved = { title: string; rule: string; path: string; isNew: boolean }

const RULE_LINES = 2

export function savedSvg(width: number, c: Saved, p: Palette): { source: string; height: number } {
  const quote = wrap(`“${c.rule}”`, width, BODY, RULE_LINES)
  const quoteTop = HEADLINE_TOP + GAP
  const whereY = quoteTop + (quote.length - 1) * BODY_STEP + GAP
  const lead = c.isNew ? 'Eklendiği yer: ' : 'Zaten burada: '
  const leadW = measure(lead, BODY)
  const parts = [
    ...head(width, ICONS.check, 'Kural kaydedildi', '', p),
    text({ ...HEADLINE, x: 0, y: HEADLINE_TOP, fill: p.hi, text: fit(c.title, width, HEADLINE) }),
    ...quote.map((line, i) => text({ ...BODY, x: 0, y: quoteTop + i * BODY_STEP, fill: p.mid, text: line })),
    text({ ...BODY, x: 0, y: whereY, fill: p.lo, text: lead }),
    text({ ...PATH, x: leadW, y: whereY, fill: p.hi, weight: 600, text: fit(c.path, width - leadW, PATH) }),
    text({ ...BODY, x: 0, y: whereY + BODY_STEP, fill: p.lo, text: 'Claude bir sonraki mesajından itibaren buna uyar.' }),
  ]
  const height = whereY + BODY_STEP + BOTTOM
  return { source: doc(width, height, parts.join('')), height }
}

const PATH_H = 18
const PATH_BASELINE = 13

/** A file path in mono, sized to itself. */
export function pathSvg(path: string, color: string): { source: string; width: number; height: number } {
  const width = Math.ceil(measure(path, PATH)) + 2
  return { source: doc(width, PATH_H, text({ ...PATH, x: 0, y: PATH_BASELINE, fill: color, text: path })), width, height: PATH_H }
}
