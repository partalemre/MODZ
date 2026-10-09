import { escape, eyebrow, meter, sparkline, svgDoc } from './svg'
import type { SvgDoc } from './svg'
import { fillOf } from './theme'
import type { Tone } from './theme'

// `/hud full` on the desktop: a header, then one stat tile per limit and one for the session's
// cost. Each tile: eyebrow + meta, the Display value, a slim meter with its pace tick, a note on
// pace, and a sparkline of its history.

export type Tile = {
  eyebrow: string
  meta: string
  value: string
  note: string
  noteTone: Tone
  tone: Tone
  arc: { percent: number; pace: number | null } | null
  series: readonly number[]
  seriesMax: number
  caption: string
}

export type TilesSpec = { title: string; meta: string; tiles: readonly Tile[]; maxWidth: number }

const TILE = { minW: 176, maxW: 260, h: 172, gap: 12, pad: 14, radius: 10 } as const
const BAR = { top: 42, height: 6 } as const
const HEADER_H = 50
const SPARK_H = 30
const COLUMN_CHOICES = [4, 2, 1] as const

function columnsFor(count: number, maxWidth: number): { cols: number; tileW: number } {
  const fits = (cols: number) => cols * TILE.minW + (cols - 1) * TILE.gap <= maxWidth
  const cols = Math.min(count, COLUMN_CHOICES.find(fits) ?? 1)
  const tileW = Math.min(TILE.maxW, (maxWidth - (cols - 1) * TILE.gap) / cols)

  return { cols, tileW: Math.max(TILE.minW, Math.floor(tileW)) }
}

const textAt = (spec: { x: number; y: number; cls: string; size: number; value: string; weight?: number; anchor?: 'end' }): string =>
  `<text class="${spec.cls}" x="${spec.x}" y="${spec.y}" font-size="${spec.size}" font-weight="${spec.weight ?? 500}"${spec.anchor === undefined ? '' : ` text-anchor="${spec.anchor}"`}>${escape(spec.value)}</text>`

function valueAndMeter(tile: Tile, spec: { x: number; y: number; width: number }): string {
  const value = textAt({ x: spec.x, y: spec.y + 28, cls: `${fillOf(tile.tone)} num`, size: 24, value: tile.value, weight: 650 })
  if (tile.arc === null) return value

  return value + meter({ x: spec.x, y: spec.y + BAR.top, width: spec.width, height: BAR.height, percent: tile.arc.percent, tone: tile.tone, pace: tile.arc.pace })
}

function tileSvg(tile: Tile, x: number, y: number, width: number): string {
  const inner = x + TILE.pad
  const right = x + width - TILE.pad
  const frame = tile.tone === 'neutral' ? 's-line' : `s-${tile.tone}-l`
  // A critical tile sits on a Flare tint, the pane's one accent; the others on the inset.
  const fill = tile.tone === 'danger' ? 'f-danger-t' : 'f-inset'
  const sparkTop = y + 104

  return [
    `<rect class="${fill} ${frame}" x="${x + 0.5}" y="${y + 0.5}" width="${width - 1}" height="${TILE.h - 1}" rx="${TILE.radius}"/>`,
    eyebrow(tile.eyebrow, inner, y + TILE.pad + 9, tile.tone === 'neutral' ? 'f-lo' : `f-${tile.tone}`),
    textAt({ x: right, y: y + TILE.pad + 9, cls: 'f-lo num', size: 10.5, value: tile.meta, anchor: 'end' }),
    valueAndMeter(tile, { x: inner, y: y + 30, width: right - inner }),
    textAt({ x: inner, y: y + 94, cls: fillOf(tile.noteTone, 'lo'), size: 11, value: tile.note }),
    sparkline({ x: inner, y: sparkTop, width: right - inner, height: SPARK_H, values: tile.series, max: tile.seriesMax, tone: tile.tone }),
    `<rect class="f-line" x="${inner}" y="${sparkTop + SPARK_H}" width="${right - inner}" height="1"/>`,
    textAt({ x: inner, y: y + TILE.h - 14, cls: 'f-lo', size: 10.5, value: tile.caption }),
  ].join('')
}

function headerSvg(spec: TilesSpec, width: number): string {
  return [
    eyebrow('HUD · kullanım', 0, 12, 'f-lo'),
    textAt({ x: 0, y: 36, cls: 'f-hi', size: 17, value: spec.title, weight: 620 }),
    textAt({ x: width, y: 36, cls: 'f-lo', size: 11.5, value: spec.meta, anchor: 'end' }),
  ].join('')
}

export function tilesSvg(spec: TilesSpec): SvgDoc {
  const { cols, tileW } = columnsFor(spec.tiles.length, spec.maxWidth)
  const rows = Math.ceil(spec.tiles.length / cols)
  const width = cols * tileW + (cols - 1) * TILE.gap
  const tiles = spec.tiles.map((tile, index) => {
    const x = (index % cols) * (tileW + TILE.gap)
    const y = HEADER_H + Math.floor(index / cols) * (TILE.h + TILE.gap)

    return tileSvg(tile, x, y, tileW)
  })
  const alt = [spec.title, ...spec.tiles.map(tile => `${tile.eyebrow} ${tile.value} · ${tile.note} · ${tile.caption}`)].join('; ')

  return svgDoc({ width, height: HEADER_H + rows * TILE.h + (rows - 1) * TILE.gap + 1, body: headerSvg(spec, width) + tiles.join(''), alt })
}
