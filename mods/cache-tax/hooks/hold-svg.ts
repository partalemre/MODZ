// The hold card's two drawings: the header (the bare cube, headline, why it is cold) and the inset
// comparison of sending now against a warm turn, as prices over proportional bars. Colour is kept for
// state: the cold price is the warning (Amber); everything else is ink.

import { cube } from './cube'
import { fmtUsd } from './fmt'
import { doc, fit, measure, text } from './svg'
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

export const HEADER_H = 50
const CUBE = 18
const TEXT_X = 28
const HEADLINE: Font = { size: 17, weight: 620 }
const BODY: Font = { size: 13 }
/** The cube's top and the baselines beside it: the icon sits on the headline's line. */
const CUBE_Y = 6
const HY = { headline: 20, body: 43 }

export function headerSvg(width: number, view: HoldView, p: Palette): string {
  const room = width - TEXT_X
  const reason = view.reason.find(said => measure(said, BODY) <= room) ?? fit(view.reason.at(-1) ?? '', room, BODY)
  const body = [
    cube({ x: 0, y: CUBE_Y, size: CUBE }, { lid: 'none', outline: p.mid }),
    text({ ...HEADLINE, x: TEXT_X, y: HY.headline, fill: p.hi, text: fit(bandWords().headline, room, HEADLINE) }),
    text({ ...BODY, x: 0, y: HY.body, fill: p.mid, text: reason }),
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
const CAPTION_GAP = 6
/** Digits run wider than the average glyph: the count gets this much room over its measure, so the rate never overlaps it. */
const DIGIT_SLACK = 1.1
/** Baselines and tops in a comparison column, top to bottom. */
const CY = { label: 26, price: 56, bar: 68, caption: 94 }

type Column = { x: number; w: number; label: string; usd: number | null; share: number | null; ink: string }

function column(c: Column, p: Palette): string {
  const fill = c.share === null ? '' : `<rect x="${c.x}" y="${CY.bar}" width="${Math.max(MIN_BAR, c.w * c.share)}" height="${BAR_H}" rx="${BAR_H / 2}" fill="${p.mid}"/>`
  return [
    text({ ...LABEL, x: c.x, y: CY.label, fill: p.mid, text: fit(c.label, c.w, LABEL) }),
    text({ ...PRICE, x: c.x, y: CY.price, fill: c.ink, text: fmtUsd(c.usd) }),
    `<rect x="${c.x}" y="${CY.bar}" width="${c.w}" height="${BAR_H}" rx="${BAR_H / 2}" fill="${p.track}"/>`,
    fill,
  ].join('')
}

/** The cold caption: the token count in ink, then the rate. */
function coldCaption({ x, w }: { x: number; w: number }, view: HoldView, p: Palette): string {
  const count = bandWords().tokens(view.tokens)
  const restX = x + measure(count, CAPTION) * DIGIT_SLACK + CAPTION_GAP
  // The rate goes first, then the verb, when the column is narrow: a caption is whole or not drawn.
  const room = Math.max(0, x + w - restX)
  const rest = bandWords().rewritten(view.rate).find(said => measure(said, CAPTION) <= room) ?? ''
  return [
    text({ ...CAPTION, x, y: CY.caption, fill: p.hi, text: count }),
    text({ ...CAPTION, x: restX, y: CY.caption, fill: p.lo, text: rest }),
  ].join('')
}

export function compareSvg(width: number, view: HoldView, p: Palette): string {
  const w = (width - 2 * PAD - GUTTER) / 2
  const right = PAD + w + GUTTER
  const share = view.coldUsd && view.warmUsd !== null ? Math.min(1, view.warmUsd / view.coldUsd) : null
  const body = [
    `<rect width="${width}" height="${COMPARE_H}" rx="${RADIUS}" fill="${p.inset}"/>`,
    // One colour per card: the price being asked is the warning, the warm turn it is weighed against is ink.
    column({ x: PAD, w, label: bandWords().sendNow, usd: view.coldUsd, share: view.coldUsd === null ? null : 1, ink: p.role.warn.fg }, p),
    column({ x: right, w, label: bandWords().warmTurn, usd: view.warmUsd, share, ink: p.hi }, p),
    coldCaption({ x: PAD, w }, view, p),
    text({ ...CAPTION, x: right, y: CY.caption, fill: p.lo, text: warmCaptions(view).find(said => measure(said, CAPTION) <= w) ?? '' }),
  ]
  return doc({ width, height: COMPARE_H }, body.join(''))
}
