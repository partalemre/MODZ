// MODZ kit — small shapes: icon tile, pill, stat tile, file badge, size bar, skeleton.
import { baseline, iconEl, mono, num, outlineEl, rectEl, sans, TYPE, textEl, toPic } from './svg-core'
import type { Part, SvgPic } from './svg-core'
import type { IconName } from './icons'
import { fitText } from './svg-metrics'
import { eyebrowPart } from './svg-text'
import { sparklinePart } from './svg-meters'
import { badgePaints, fileType } from './tokens'
import type { Role } from './tokens'

const HAIRLINE_OPACITY = 0.6

// ---------------------------------------------------------------------------
// Icon tile: rounded square in the role's tint, an 18 px line icon in its fg.

export type IconTileOpts = { icon: IconName; role?: Role; size?: number }

const TILE = 36
const TILE_RADIUS = 9
const TILE_ICON = 18
const SMALL_TILE = 32
const SMALL_ICON_RATIO = 0.5

export function iconTilePart(o: IconTileOpts): Part {
  const size = o.size ?? TILE
  const glyph = size >= SMALL_TILE ? TILE_ICON : Math.round(size * SMALL_ICON_RATIO)
  const radius = Math.min(TILE_RADIUS, size / 4)
  const box = { x: 0, y: 0, width: size, height: size, radius }
  const fill = o.role ? `${o.role}-tint` : 'track'
  const body = [
    rectEl({ ...box, paint: fill }),
    o.role ? outlineEl({ ...box, paint: `${o.role}-line` }, HAIRLINE_OPACITY) : '',
    iconEl({ name: o.icon, x: (size - glyph) / 2, y: (size - glyph) / 2, size: glyph, paint: o.role ?? 'mid' }),
  ]

  return { body: body.join(''), width: size, height: size, alt: o.icon }
}

export const iconTile = (o: IconTileOpts): SvgPic => toPic(iconTilePart(o))

// ---------------------------------------------------------------------------
// Pill: h20, full radius, tint + hairline + 11/600 fg; an optional 12 px leading icon.

export type PillOpts = { text: string; role?: Role; icon?: IconName }

const PILL_H = 20
const PILL_PAD = 8
const PILL_ICON = 12
const PILL_ICON_GAP = 4
const PILL_TEXT = { size: 11, weight: 600 }

const evenUp = (value: number): number => Math.ceil(value / 2) * 2

export function pillPart(o: PillOpts): Part {
  const paint = o.role ?? 'mid'
  const textX = o.icon ? PILL_PAD - 1 + PILL_ICON + PILL_ICON_GAP : PILL_PAD
  const width = evenUp(textX + sans(PILL_TEXT.size, PILL_TEXT.weight)(o.text) + PILL_PAD)
  const box = { x: 0, y: 0, width, height: PILL_H, radius: PILL_H / 2 }
  const body = [
    rectEl({ ...box, paint: o.role ? `${o.role}-tint` : 'track' }),
    outlineEl({ ...box, paint: o.role ? `${o.role}-line` : 'line-strong' }),
    o.icon ? iconEl({ name: o.icon, x: PILL_PAD - 1, y: (PILL_H - PILL_ICON) / 2, size: PILL_ICON, paint }) : '',
    textEl({ x: textX, y: baseline(0, PILL_H, PILL_TEXT.size), text: o.text, paint, ...PILL_TEXT }),
  ]

  return { body: body.join(''), width, height: PILL_H, alt: o.text }
}

export const pill = (o: PillOpts): SvgPic => toPic(pillPart(o))

// ---------------------------------------------------------------------------
// Stat tile: inset, eyebrow label, Display value (mono, tabular), unit, optional sparkline.

export type StatTileOpts = {
  label: string
  value: string
  unit?: string
  role?: Role
  width?: number
  spark?: readonly number[]
}

const STAT_W = 120
const STAT_H = 58
const STAT_RADIUS = 10
const STAT_PAD = 12
const STAT_LABEL_TOP = 8
const UNIT_GAP = 4
const SPARK_MIN_W = 120
const SPARK_FROM = 0.55
const SPARK_TOP = 26
const SPARK_H = 20

export function statTilePart(o: StatTileOpts): Part {
  const width = o.width ?? STAT_W
  const inner = width - STAT_PAD * 2
  const { size, weight } = TYPE.display
  const hasSpark = o.spark !== undefined && o.spark.length > 1 && width >= SPARK_MIN_W
  const valueRoom = hasSpark ? inner * SPARK_FROM : inner
  const value = fitText(o.value, valueRoom, mono(size))
  const unitX = STAT_PAD + mono(size)(value) + UNIT_GAP
  const y = STAT_H - STAT_PAD
  const label = eyebrowPart({ text: o.label, width: inner, role: o.role })
  const spark = hasSpark
    ? sparklinePart({ values: o.spark ?? [], width: Math.round(inner * (1 - SPARK_FROM)), height: SPARK_H, role: o.role, bg: 'inset' })
    : null
  const body = [
    rectEl({ x: 0, y: 0, width, height: STAT_H, radius: STAT_RADIUS, paint: 'inset' }),
    `<g transform="translate(${STAT_PAD} ${STAT_LABEL_TOP})">${label.body}</g>`,
    textEl({ x: STAT_PAD, y, text: value, paint: 'hi', size, weight, isMono: true }),
    o.unit && unitX + sans(TYPE.label.size, TYPE.label.weight)(o.unit) <= STAT_PAD + valueRoom
      ? textEl({ x: unitX, y, text: o.unit, paint: 'mid', ...TYPE.label })
      : '',
    spark ? `<g transform="translate(${num(width - STAT_PAD - spark.width)} ${SPARK_TOP})">${spark.body}</g>` : '',
  ]

  return { body: body.join(''), width, height: STAT_H, alt: `${o.label}: ${o.value}${o.unit ? ` ${o.unit}` : ''}` }
}

export const statTile = (o: StatTileOpts): SvgPic => toPic(statTilePart(o))

export const STAT_HEIGHT = STAT_H

// ---------------------------------------------------------------------------
// File badge: 26×16, kind tint + 9.5/700 mono label; a read/edit activity colour wins.

export type FileBadgeOpts = { name: string; activity?: 'read' | 'edit' }

const BADGE_W = 26
const BADGE_H = 16
const BADGE_RADIUS = 4
const BADGE_TEXT = { size: 9.5, weight: 700 }

export function fileBadgePart(o: FileBadgeOpts): Part {
  const type = fileType(o.name)
  const paints = o.activity ? { fg: o.activity, tint: `${o.activity}-tint` } : badgePaints(type.kind)
  const body = [
    rectEl({ x: 0, y: 0, width: BADGE_W, height: BADGE_H, radius: BADGE_RADIUS, paint: paints.tint }),
    textEl({ x: BADGE_W / 2, y: baseline(0, BADGE_H, BADGE_TEXT.size), text: type.label, paint: paints.fg, ...BADGE_TEXT, anchor: 'middle', isMono: true }),
  ]

  return { body: body.join(''), width: BADGE_W, height: BADGE_H, alt: `${type.label} ${o.name}` }
}

export const fileBadge = (o: FileBadgeOpts): SvgPic => toPic(fileBadgePart(o))

// ---------------------------------------------------------------------------
// Size bar: 96×6, a share of the whole (never of the largest row); never invisible when > 0.

export type SizeBarOpts = { size: number; total: number; width?: number; isStrong?: boolean }

const SIZE_W = 96
const SIZE_H = 6

export function sizeBarPart(o: SizeBarOpts): Part {
  const width = o.width ?? SIZE_W
  const ratio = o.total > 0 ? Math.max(0, Math.min(1, o.size / o.total)) : 0
  const fill = ratio > 0 ? Math.max(SIZE_H, Math.round(width * ratio)) : 0
  const bar = { x: 0, y: 0, height: SIZE_H, radius: SIZE_H / 2 }
  const body = [
    rectEl({ ...bar, width, paint: 'track' }),
    fill > 0 ? rectEl({ ...bar, width: fill, paint: o.isStrong ? 'mid' : 'lo' }) : '',
  ]

  return { body: body.join(''), width, height: SIZE_H, alt: `%${Math.round(ratio * 100)}` }
}

export const sizeBar = (o: SizeBarOpts): SvgPic => toPic(sizeBarPart(o))

// ---------------------------------------------------------------------------
// Loading skeleton: track bars that shimmer in a stagger (still under reduced motion).

export type SkeletonOpts = { width: number; lines?: number }

const SKELETON_H = 8
const SKELETON_PITCH = 14
const SKELETON_WIDTHS = [1, 0.82, 0.6]
const SKELETON_STAGGER_MS = 160

export function skeletonPart(o: SkeletonOpts): Part {
  const lines = o.lines ?? SKELETON_WIDTHS.length
  const bars = Array.from({ length: lines }, (_, i) => {
    const share = SKELETON_WIDTHS[i % SKELETON_WIDTHS.length] ?? 1
    const style = ` style="animation-delay:${i * SKELETON_STAGGER_MS}ms"`
    return rectEl({ x: 0, y: i * SKELETON_PITCH, width: Math.round(o.width * share), height: SKELETON_H, radius: SKELETON_H / 2, paint: 'track', className: 'shimmer' }, style)
  })

  return { body: bars.join(''), width: o.width, height: (lines - 1) * SKELETON_PITCH + SKELETON_H, alt: 'Yükleniyor' }
}

export const skeleton = (o: SkeletonOpts): SvgPic => toPic(skeletonPart(o))
