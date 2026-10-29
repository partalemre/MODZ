import { escape, groupLabel, meter, sparkline, svgDoc } from './svg'
import type { SvgDoc } from './svg'
import { fillOf } from './theme'
import type { Tone } from './theme'
import { words } from './words'

// `/hud full` on the desktop: a header, then one figure per limit and one for the session's cost, laid
// on the pane in a grid with no box around each. Each: label + meta, the Display value, a slim meter with
// its pace tick, a note on pace, and a sparkline of its history. While a turn runs, a dot breathes by the title.

export type Tile = {
  label: string
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

export type TilesSpec = { title: string; meta: string; tiles: readonly Tile[]; maxWidth: number; isLive?: boolean }

// One tile's place in the grid, and whether its meter is live.
type TileBox = { x: number; y: number; width: number }

const TILE = { minW: 168, maxW: 260, h: 132, gap: 28, rowGap: 24 } as const
const BAR = { top: 42, height: 6 } as const
const HEADER_H = 44
const LIVE = { r: 3, gap: 9 } as const
// The accent is Claude's own clay: the one hue that says "happening now".
const BREATHE_CSS = '.breathe{animation:breathe 1.8s ease-in-out infinite}@keyframes breathe{50%{opacity:.35}}'
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

function valueAndMeter(tile: Tile, spec: TileBox): string {
  const value = textAt({ x: spec.x, y: spec.y + 28, cls: `${fillOf(tile.tone)} num`, size: 24, value: tile.value, weight: 650 })
  if (tile.arc === null) return value
  const bar = { x: spec.x, y: spec.y + BAR.top, width: spec.width, height: BAR.height, percent: tile.arc.percent }

  return value + meter({ ...bar, tone: tile.tone, pace: tile.arc.pace })
}

function tileSvg(tile: Tile, box: TileBox): string {
  const { x, y, width } = box
  const right = x + width
  const sparkTop = y + 84

  return [
    groupLabel(tile.label, { x, y: y + 10 }),
    textAt({ x: right, y: y + 10, cls: 'f-lo num', size: 10.5, value: tile.meta, anchor: 'end' }),
    valueAndMeter(tile, { x, y: y + 16, width }),
    textAt({ x, y: y + 76, cls: fillOf(tile.noteTone, 'lo'), size: 11, value: tile.note }),
    sparkline({ x, y: sparkTop, width, height: SPARK_H, values: tile.series, max: tile.seriesMax, tone: tile.tone }),
    `<rect class="f-line" x="${x}" y="${sparkTop + SPARK_H}" width="${width}" height="1"/>`,
    textAt({ x, y: y + TILE.h - 4, cls: 'f-lo', size: 10.5, value: tile.caption }),
  ].join('')
}

function headerSvg(spec: TilesSpec, width: number): string {
  const isLive = spec.isLive === true
  const titleX = isLive ? LIVE.r * 2 + LIVE.gap : 0
  const dot = isLive ? `<circle class="f-edit breathe" cx="${LIVE.r}" cy="15" r="${LIVE.r}"/>` : ''

  return [
    dot,
    textAt({ x: titleX, y: 20, cls: 'f-hi', size: 16, value: spec.title, weight: 600 }),
    textAt({ x: width, y: 20, cls: 'f-lo', size: 12, value: spec.meta, anchor: 'end' }),
  ].join('')
}

export function tilesSvg(spec: TilesSpec): SvgDoc {
  const { cols, tileW } = columnsFor(spec.tiles.length, spec.maxWidth)
  const rows = Math.ceil(spec.tiles.length / cols)
  const width = cols * tileW + (cols - 1) * TILE.gap
  const tiles = spec.tiles.map((tile, index) => {
    const x = (index % cols) * (tileW + TILE.gap)
    const y = HEADER_H + Math.floor(index / cols) * (TILE.h + TILE.rowGap)

    return tileSvg(tile, { x, y, width: tileW })
  })
  const alt = [spec.title, ...spec.tiles.map(tile => `${tile.label} ${tile.value} · ${tile.note} · ${tile.caption}`)].join('; ')

  return svgDoc({ width, height: HEADER_H + rows * TILE.h + (rows - 1) * TILE.rowGap + 1, body: headerSvg(spec, width) + tiles.join(''), alt, css: BREATHE_CSS })
}
