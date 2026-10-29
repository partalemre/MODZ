// The Ideas pane's desktop head: a bare icon, the label, meta on the right, the headline, and a
// shimmering skeleton while `/mine` reads.

import { ICONS } from './icons'
import { LABEL, doc, fit, icon, label, measure, text, wrap } from './svg'
import type { Font } from './svg'
import type { Palette } from './theme'

const GLYPH = 18
const GLYPH_Y = 21
const TEXT_X = 30
const LABEL_Y = 13
const HEADLINE: Font = { size: 16, weight: 600 }
const HEADLINE_TOP = 35
const HEADLINE_STEP = 22
const HEADLINE_LINES = 2
const META: Font = { size: 12 }
const META_GAP = 16
const BOTTOM = 8
const SKELETON_H = 8
const SKELETON_PITCH = 14
const SKELETON_TOP = 14
const SKELETON_WIDTHS = [1, 0.82, 0.6]
const SKELETON_STAGGER_MS = 160
/** The kit's shimmer (DESIGN.md §5); `doc` ends every style with the reduced-motion rule, which stills it. */
const SHIMMER_S = 1.4
const SHIMMER = `@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.4}}.shimmer{animation:shimmer ${SHIMMER_S}s linear infinite}`

export type Head = { eyebrow: string; headline: string; meta: string; isLoading: boolean }

function skeleton(o: { top: number; width: number }, p: Palette): string {
  return SKELETON_WIDTHS.map((share, i) => {
    const y = o.top + i * SKELETON_PITCH
    const w = Math.round((o.width - TEXT_X) * share)
    return `<rect class="shimmer" style="animation-delay:${i * SKELETON_STAGGER_MS}ms" x="${TEXT_X}" y="${y}" width="${w}" height="${SKELETON_H}" rx="${SKELETON_H / 2}" fill="${p.track}"/>`
  }).join('')
}

export function headSvg(width: number, h: Head, p: Palette): { source: string; height: number } {
  const lines = wrap(h.headline, { width: width - TEXT_X, font: HEADLINE, maxLines: HEADLINE_LINES })
  const last = HEADLINE_TOP + (lines.length - 1) * HEADLINE_STEP
  const parts = [
    icon(ICONS.bulb, { x: 0, y: GLYPH_Y, size: GLYPH, color: p.mid }),
    label({ x: TEXT_X, y: LABEL_Y, fill: p.lo }, h.eyebrow),
    ...lines.map((line, i) => text({ ...HEADLINE, x: TEXT_X, y: HEADLINE_TOP + i * HEADLINE_STEP, fill: p.hi, text: line })),
  ]
  const room = width - TEXT_X - measure(h.eyebrow, LABEL) - META_GAP
  if (h.meta !== '' && room > 0) parts.push(text({ ...META, x: width, y: LABEL_Y, fill: p.lo, anchor: 'end', text: fit(h.meta, room, META) }))
  const skeletonTop = last + SKELETON_TOP
  if (h.isLoading) parts.push(skeleton({ top: skeletonTop, width }, p))
  const height = h.isLoading ? skeletonTop + (SKELETON_WIDTHS.length - 1) * SKELETON_PITCH + SKELETON_H + BOTTOM : last + BOTTOM
  return { source: doc({ width, height, style: h.isLoading ? SHIMMER : '' }, parts.join('')), height }
}
