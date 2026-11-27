// MODZ kit — composites drawn as one Svg, so the desktop never wraps their parts apart:
// a card's header block, and a row of stat tiles.
import { place, toPic } from './svg-core'
import type { Part, SvgPic } from './svg-core'
import type { IconName } from './icons'
import { iconTilePart, statTilePart, STAT_HEIGHT } from './svg-shapes'
import type { StatTileOpts } from './svg-shapes'
import { bodyPart, EYEBROW_H, eyebrowPart, linesPart } from './svg-text'
import type { Role } from './tokens'

export type HeaderOpts = {
  eyebrow: string
  width: number
  icon?: IconName
  role?: Role
  headline?: string
  sub?: string
  meta?: string
  mark?: string
  hasDot?: boolean
}

const TILE = 36
const TILE_GAP = 12
const EYEBROW_TO_HEADLINE = 4
const HEADLINE_TO_SUB = 4

// [tile] 12 [EYEBROW ··· meta] / [Headline, two lines at most] / [sub in text.mid]
export function headerPart(o: HeaderOpts): Part {
  const textX = o.icon ? TILE + TILE_GAP : 0
  const textW = o.width - textX
  const tile = o.icon ? iconTilePart({ icon: o.icon, role: o.role, size: TILE }) : null
  const eyebrow = eyebrowPart({ text: o.eyebrow, width: textW, role: o.role, meta: o.meta, hasDot: o.hasDot })
  const headlineTop = EYEBROW_H + EYEBROW_TO_HEADLINE
  const title = o.headline ? linesPart({ text: o.headline, width: textW, mark: o.mark, markRole: o.role }) : null
  const subTop = headlineTop + (title ? title.height + HEADLINE_TO_SUB : 0)
  const sub = o.sub ? bodyPart({ text: o.sub, width: textW }) : null
  const titleBottom = title ? headlineTop + title.height : EYEBROW_H
  const bottom = sub ? subTop + sub.height : titleBottom
  const body = [
    tile ? tile.body : '',
    place(eyebrow.body, textX, 0),
    title ? place(title.body, textX, headlineTop) : '',
    sub ? place(sub.body, textX, subTop) : '',
  ]
  const alt = [eyebrow.alt, o.headline, o.sub].filter(Boolean).join(' — ')

  return { body: body.join(''), width: o.width, height: Math.max(tile ? TILE : 0, bottom), alt }
}

export const headerSvg = (o: HeaderOpts): SvgPic => toPic(headerPart(o))

// ---------------------------------------------------------------------------

export type StatRowOpts = { stats: readonly StatTileOpts[]; width: number; gap?: number }

const STAT_GAP = 8

export function statRowPart(o: StatRowOpts): Part {
  const gap = o.gap ?? STAT_GAP
  const count = Math.max(1, o.stats.length)
  const tileW = Math.floor((o.width - gap * (count - 1)) / count)
  const tiles = o.stats.map((stat, i) => place(statTilePart({ ...stat, width: tileW }).body, i * (tileW + gap), 0))
  const alt = o.stats.map(stat => `${stat.label}: ${stat.value}${stat.unit ? ` ${stat.unit}` : ''}`).join(' · ')

  return { body: tiles.join(''), width: o.width, height: STAT_HEIGHT, alt }
}

export const statRowSvg = (o: StatRowOpts): SvgPic => toPic(statRowPart(o))
