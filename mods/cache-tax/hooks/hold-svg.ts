// The hold card's two drawings: the header (cube tile, eyebrow, headline, why it is cold) and the
// inset comparison of sending now against a warm turn, as prices over proportional bars.

import { cube } from './cube'
import { fmtUsd } from './fmt'
import { doc, eyebrow, fit, measure, text, tile } from './svg'
import type { Font } from './svg'
import type { Palette } from './theme'
import { bandWords } from './ui-words'

export type HoldView = {
  held: string
  /** The line under the headline, longest first: why this send is cold. */
  reason: string[]
  tokens: string
  coldUsd: number | null
  warmUsd: number | null
  rate: string
  autoWarm: string
}

/** How many times cheaper a warm turn is than the cold write (list prices), or null without both prices. */
export function timesCheaper(view: HoldView): number | null {
  return view.coldUsd && view.warmUsd ? Math.round(view.coldUsd / view.warmUsd) : null
}

/** What the warm side's caption says, longest first: the ratio makes the comparison read at a glance. */
export function warmCaptions(view: HoldView): string[] {
  return bandWords().warmCaptions(timesCheaper(view))
}

export const HEADER_H = 64
const TILE = 38
const CUBE = 22
const TEXT_X = 52
const HEADLINE: Font = { size: 17, weight: 620 }
const BODY: Font = { size: 13 }
/** The tile's top and the baselines beside it: the same header every MODZ card opens with. */
const TILE_Y = 4
const HY = { eyebrow: 16, headline: 38, body: 59 }

export function headerSvg(width: number, view: HoldView, p: Palette): string {
  const kiln = p.role.edit
  const room = width - TEXT_X
  const reason = view.reason.find(said => measure(said, BODY) <= room) ?? fit(view.reason.at(-1) ?? '', room, BODY)
  const body = [
    tile({ x: 0, y: TILE_Y, size: TILE }, kiln.tint),
    cube({ x: (TILE - CUBE) / 2, y: TILE_Y + (TILE - CUBE) / 2, size: CUBE }, { lid: kiln.fg, outline: p.hi }),
    eyebrow({ x: TEXT_X, y: HY.eyebrow, fill: kiln.fg }, bandWords().eyebrow),
    text({ ...HEADLINE, x: TEXT_X, y: HY.headline, fill: p.hi, text: fit(bandWords().headline, room, HEADLINE) }),
    text({ ...BODY, x: TEXT_X, y: HY.body, fill: p.mid, text: reason }),
  ]
  return doc({ width, height: HEADER_H }, body.join(''))
}

export const COMPARE_H = 112
const PAD = 16
const GUTTER = 20
const RADIUS = 10
const BAR_H = 6
/** The warm bar never shrinks below a visible sliver. */
const MIN_BAR = 6
const LABEL: Font = { size: 12, weight: 500 }
const PRICE: Font = { size: 24, weight: 650, isMono: true }
const CAPTION: Font = { size: 12 }
const SPAN_PAD = 4
const SPAN_H = 19
const SPAN_RADIUS = 4
const SPAN_GAP = 6
/** Digits run wider than the average glyph: the span gets this much room over its measure, so it never clips. */
const SPAN_SLACK = 1.1
/** Baselines and tops in a comparison column, top to bottom. */
const CY = { label: 26, price: 56, bar: 68, span: 83, caption: 97 }

type Column = { x: number; w: number; label: string; usd: number | null; share: number | null; fg: string }

function column(c: Column, p: Palette): string {
  const fill = c.share === null ? '' : `<rect x="${c.x}" y="${CY.bar}" width="${Math.max(MIN_BAR, c.w * c.share)}" height="${BAR_H}" rx="${BAR_H / 2}" fill="${c.fg}"/>`
  return [
    text({ ...LABEL, x: c.x, y: CY.label, fill: p.mid, text: fit(c.label, c.w, LABEL) }),
    text({ ...PRICE, x: c.x, y: CY.price, fill: c.fg, text: fmtUsd(c.usd) }),
    `<rect x="${c.x}" y="${CY.bar}" width="${c.w}" height="${BAR_H}" rx="${BAR_H / 2}" fill="${p.track}"/>`,
    fill,
  ].join('')
}

/** The cold caption: the token count as a highlight span, then the rate. */
function coldCaption({ x, w }: { x: number; w: number }, view: HoldView, p: Palette): string {
  const kiln = p.role.edit
  const count = bandWords().tokens(view.tokens)
  const spanW = measure(count, CAPTION) * SPAN_SLACK + 2 * SPAN_PAD
  const restX = x + spanW - SPAN_PAD + SPAN_GAP
  // The rate goes first, then the verb, when the column is narrow: a caption is whole or not drawn.
  const room = Math.max(0, PAD + w - restX)
  const rest = bandWords().rewritten(view.rate).find(said => measure(said, CAPTION) <= room) ?? ''
  return [
    `<rect x="${x - SPAN_PAD}" y="${CY.span}" width="${spanW}" height="${SPAN_H}" rx="${SPAN_RADIUS}" fill="${kiln.tint}"/>`,
    text({ ...CAPTION, x, y: CY.caption, fill: kiln.fg, text: count }),
    text({ ...CAPTION, x: restX, y: CY.caption, fill: p.mid, text: rest }),
  ].join('')
}

export function compareSvg(width: number, view: HoldView, p: Palette): string {
  const w = (width - 2 * PAD - GUTTER) / 2
  const right = PAD + w + GUTTER
  const share = view.coldUsd && view.warmUsd !== null ? Math.min(1, view.warmUsd / view.coldUsd) : null
  const body = [
    `<rect width="${width}" height="${COMPARE_H}" rx="${RADIUS}" fill="${p.inset}"/>`,
    column({ x: PAD, w, label: bandWords().sendNow, usd: view.coldUsd, share: view.coldUsd === null ? null : 1, fg: p.role.edit.fg }, p),
    // One accent per card: the price being asked is Kiln, the warm turn it is weighed against is neutral.
    column({ x: right, w, label: bandWords().warmTurn, usd: view.warmUsd, share, fg: p.hi }, p),
    coldCaption({ x: PAD + SPAN_PAD, w }, view, p),
    text({ ...CAPTION, x: right, y: CY.caption, fill: p.lo, text: warmCaptions(view).find(said => measure(said, CAPTION) <= w) ?? '' }),
  ]
  return doc({ width, height: COMPARE_H }, body.join(''))
}
