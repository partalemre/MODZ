// MODZ kit — the head every mod pane opens with (DESIGN.md §0): the mod's pixel glyph (kit/pixels.ts), the pane's
// own title and, at the right, one fact in the mono. It is the row the person pressed on the hub, grown: the same
// glyph, the same state colour in it, so the pane reads as the place that row leads to.
import { pixelGlyph } from './pixels'
import { escapeXml, toPic } from './svg-core'
import type { SvgPic } from './svg-core'
import { fitText, textWidth } from './svg-metrics'

export type HeadTone = 'idle' | 'live' | 'warn' | 'bad'

export type PaneHeadOpts = { glyph: string; title: string; meta?: string; tone?: HeadTone; width: number }

const HEIGHT = 34
const GLYPH_BOX = 18
const GLYPH = { cell: 2.25, pitch: 2.8 }
const TITLE_X = 30
const TITLE = { size: 16, weight: 600 }
const META_SIZE = 11
const MONO_EM = 0.6
const GAP = 12
const BASELINE = 23

const INK: Record<HeadTone, string> = { idle: 'f-mid', live: 'f-edit', warn: 'f-warn', bad: 'f-danger' }

export function paneHead(o: PaneHeadOpts): SvgPic {
  const meta = o.meta ?? ''
  const metaWidth = [...meta].length * META_SIZE * MONO_EM
  const room = o.width - TITLE_X - (meta === '' ? 0 : metaWidth + GAP)
  const title = fitText(o.title, room, text => textWidth(text, TITLE.size, TITLE.weight))
  const body = [
    pixelGlyph(o.glyph, { x: 0, y: (HEIGHT - GLYPH_BOX) / 2, box: GLYPH_BOX, ...GLYPH, className: INK[o.tone ?? 'idle'] }),
    `<text x="${TITLE_X}" y="${BASELINE}" class="f-hi" font-size="${TITLE.size}" font-weight="${TITLE.weight}">${escapeXml(title)}</text>`,
    meta === '' ? '' : `<text x="${o.width}" y="${BASELINE - 1}" class="f-lo mono" font-size="${META_SIZE}" text-anchor="end">${escapeXml(meta)}</text>`,
  ].join('')

  return toPic({ body, width: o.width, height: HEIGHT, alt: [o.title, meta].filter(Boolean).join(' · ') })
}
