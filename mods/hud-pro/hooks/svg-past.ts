import { compact } from './format'
import { LEVELS } from './past'
import { escape, groupLabel, svgDoc } from './svg'
import type { SvgDoc } from './svg'
import { words } from './words'
import type { HudCell, HudPast } from '../types'

// The history section on the desktop, on the pane with no box: its label and the range, four figures in two columns (active days, sessions,
// tokens, the most used model), and beside them a GitHub-style heatmap, a column per week and a row per weekday,
// Sunday on top, each day shaded in plain ink by its tokens against the range's busiest day. Where the
// card is too narrow for both side by side, the heatmap goes under the figures.

const PAD = 0
const LABEL_Y = 13
const TOP = 28
const STAT = { w: 104, h: 48, value: 17, label: 10.5, labelY: 34 } as const
const STAT_COLUMNS = 2
const CELL = { size: 11, gap: 3, radius: 2 } as const
const DAYS_PER_WEEK = 7
const HEAT_GAP = 16
const BOTTOM_PAD = 2
// The shade of each level above none, in ink: the busiest day is full strength.
const LEVEL_OPACITY = [0, 0.3, 0.5, 0.75, 1] as const

export type PastCardSpec = { past: HudPast; width: number }

const stride = CELL.size + CELL.gap
const weeksOf = (cells: readonly HudCell[]): number => Math.ceil(((cells[0]?.weekday ?? 0) + cells.length) / DAYS_PER_WEEK)

function statsOf(past: HudPast): Array<{ value: string; label: string }> {
  return [
    { value: `${past.activeDays}/${past.range}`, label: words().activeDays },
    { value: String(past.sessions), label: words().sessions },
    { value: compact(past.tokens), label: words().tokens },
    { value: past.model ?? '—', label: words().topModel },
  ]
}

function statsSvg(past: HudPast, top: number): string {
  return statsOf(past)
    .map((stat, index) => {
      const x = PAD + (index % STAT_COLUMNS) * STAT.w
      const y = top + Math.floor(index / STAT_COLUMNS) * STAT.h
      const value = `<text class="f-hi num" x="${x}" y="${y + STAT.value + 2}" font-size="${STAT.value}" font-weight="620">${escape(stat.value)}</text>`

      return `${value}<text class="f-lo" x="${x}" y="${y + STAT.labelY}" font-size="${STAT.label}">${escape(stat.label)}</text>`
    })
    .join('')
}

function cellSvg(cell: HudCell, at: { x: number; y: number }): string {
  const paint = cell.level === 0 ? 'class="f-track"' : `class="f-mid" fill-opacity="${LEVEL_OPACITY[Math.min(LEVELS, cell.level)]}"`
  const tip = escape(words().dayTokens(cell.day, compact(cell.tokens)))

  return `<rect ${paint} x="${at.x}" y="${at.y}" width="${CELL.size}" height="${CELL.size}" rx="${CELL.radius}"><title>${tip}</title></rect>`
}

function heatSvg(cells: readonly HudCell[], origin: { x: number; y: number }): string {
  const first = cells[0]?.weekday ?? 0

  return cells
    .map((cell, index) => {
      const place = first + index
      const x = origin.x + Math.floor(place / DAYS_PER_WEEK) * stride
      const y = origin.y + (place % DAYS_PER_WEEK) * stride

      return cellSvg(cell, { x, y })
    })
    .join('')
}

export function pastSvg(spec: PastCardSpec): SvgDoc {
  const { past, width } = spec
  const statsW = STAT_COLUMNS * STAT.w
  const heatW = weeksOf(past.cells) * stride - CELL.gap
  const heatH = DAYS_PER_WEEK * stride - CELL.gap
  const isBeside = PAD + statsW + HEAT_GAP + heatW + PAD <= width
  const statsH = Math.ceil(statsOf(past).length / STAT_COLUMNS) * STAT.h
  const heatAt = isBeside ? { x: width - PAD - heatW, y: TOP } : { x: PAD, y: TOP + statsH }
  const height = (isBeside ? TOP + Math.max(statsH, heatH) : heatAt.y + heatH) + BOTTOM_PAD
  const range = words().lastDays(past.range)
  const head = [
    groupLabel(words().pastTitle, { x: PAD, y: LABEL_Y }),
    `<text class="f-lo" x="${width - PAD}" y="${LABEL_Y}" font-size="12" text-anchor="end">${escape(range)}</text>`,
  ].join('')
  const alt = [words().pastTitle, range, ...statsOf(past).map(stat => `${stat.label} ${stat.value}`)].join(' · ')

  return svgDoc({ width, height, body: head + statsSvg(past, TOP) + heatSvg(past.cells, heatAt), alt })
}
