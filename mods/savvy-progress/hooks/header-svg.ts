import { fitText, textWidth, xml } from './format'
import { meterSvg } from './meter'
import type { Units } from './meter'
import { FONT, MONO, paneSvg } from './theme'

// The panel's header as one card: what the crew is doing in a headline, the job's percent beside
// it, its meter beneath, and the money, tokens, time and 5h share in a quiet row at the foot.
// A narrow pane folds the four figures into two rows; nothing is cut to fit.
const PAD = 16
const RADIUS = 14
const EYEBROW = { size: 10.5, tracking: 0.9, y: 27 } as const
const HEADLINE = { size: 17, y: 56 } as const
const PERCENT = { size: 26, y: 58 } as const
const MONO_EM = 0.6
const METER = { y: 70, h: 6 } as const
const DIVIDER_Y = 92
const STATS = { top: 104, label: 10, value: 31, valueSize: 15, labelSize: 9.5, rule: 34, pitch: 46 } as const
const BOLD = 1.06
const DOT_R = 3.5
const GAP = 12

export type Tone = 'run' | 'ok' | 'warn' | 'idle'

export type Stat = { label: string; value: string }

export type HeaderData = {
  eyebrow: string
  counts: string
  headline: string
  percent: string
  tone: Tone
  meter: Units | null
  stats: Stat[]
}

export type Drawing = { source: string; height: number }

const PERCENT_CLASS: Record<Tone, string> = { run: 'f-run', ok: 'f-ok', warn: 'f-warn', idle: 'm' }
// Nothing measurable yet reads as a quiet dash, not as a figure in the tone's colour.
const UNKNOWN = '—'
const DOT_CLASS: Record<Tone, string> = { run: 'f-run', ok: 'f-ok', warn: 'f-warn', idle: 'k' }

// The room a figure needs: its label or its value, whichever is wider, and the gaps around it.
const needOf = (stat: Stat): number =>
  Math.max(textWidth(stat.label.toLocaleUpperCase('tr'), STATS.labelSize + EYEBROW.tracking), textWidth(stat.value, STATS.valueSize) * BOLD) + GAP * 2

// All figures in one row when each fits its column, else two by two, else one a row: never cut.
const columnsOf = (inner: number, stats: Stat[]): number => {
  const need = Math.max(0, ...stats.map(needOf))
  const fits = (cols: number) => inner / cols >= need
  if (fits(stats.length)) return stats.length
  return fits(2) ? 2 : 1
}

const statSvg = (stat: Stat, x: number, y: number, w: number): string =>
  `<text class="m" x="${x}" y="${y + STATS.label}" font-family="${FONT}" font-size="${STATS.labelSize}" font-weight="700" letter-spacing="${EYEBROW.tracking}">${xml(fitText(stat.label.toLocaleUpperCase('tr'), STATS.labelSize + EYEBROW.tracking, w))}</text>
<text class="t" x="${x}" y="${y + STATS.value}" font-family="${FONT}" font-size="${STATS.valueSize}" font-weight="650" font-variant-numeric="tabular-nums">${xml(fitText(stat.value, STATS.valueSize, w))}</text>`

// Four figures in one row, or two by two; a hairline stands between neighbours in a row.
const statsSvg = (stats: Stat[], inner: number): { body: string; height: number } => {
  const cols = columnsOf(inner, stats)
  const rows = Math.ceil(stats.length / cols)
  const colW = inner / cols
  const parts = stats.map((stat, i) => {
    const col = i % cols
    const y = STATS.top + Math.floor(i / cols) * STATS.pitch
    const x = PAD + col * colW + (col ? GAP : 0)
    const rule = col ? `<line class="ln" x1="${PAD + col * colW}" x2="${PAD + col * colW}" y1="${y}" y2="${y + STATS.rule}" stroke-width="1"/>` : ''
    return rule + statSvg(stat, x, y, colW - GAP * (col ? 2 : 1))
  })
  return { body: parts.join('\n'), height: STATS.top + (rows - 1) * STATS.pitch + STATS.rule + PAD }
}

export const headerSvg = (W: number, data: HeaderData): Drawing => {
  const inner = W - PAD * 2
  const percentW = Math.ceil(data.percent.length * PERCENT.size * MONO_EM)
  const counts = fitText(data.counts, EYEBROW.size + 1.5, inner - textWidth(data.eyebrow, EYEBROW.size + EYEBROW.tracking) - 24)
  const headline = fitText(data.headline, HEADLINE.size * 1.06, inner - percentW - GAP)
  const stats = statsSvg(data.stats, inner)
  const dot = `<circle class="${DOT_CLASS[data.tone]}" cx="${PAD + DOT_R}" cy="${EYEBROW.y - DOT_R}" r="${DOT_R}"/>`
  const body = [
    `<rect class="tile ln" x="0.5" y="0.5" width="${W - 1}" height="${stats.height - 1}" rx="${RADIUS}" stroke-width="1"/>`,
    dot,
    `<text class="m" x="${PAD + DOT_R * 2 + 6}" y="${EYEBROW.y}" font-family="${FONT}" font-size="${EYEBROW.size}" font-weight="700" letter-spacing="${EYEBROW.tracking}">${xml(data.eyebrow)}</text>`,
    `<text class="s" x="${W - PAD}" y="${EYEBROW.y}" text-anchor="end" font-family="${FONT}" font-size="${EYEBROW.size + 1.5}" font-variant-numeric="tabular-nums">${xml(counts)}</text>`,
    `<text class="t" x="${PAD}" y="${HEADLINE.y}" font-family="${FONT}" font-size="${HEADLINE.size}" font-weight="620">${xml(headline)}</text>`,
    `<text class="${data.percent === UNKNOWN ? 'm' : PERCENT_CLASS[data.tone]}" x="${W - PAD}" y="${PERCENT.y}" text-anchor="end" font-family="${MONO}" font-size="${PERCENT.size}" font-weight="650">${xml(data.percent)}</text>`,
    meterSvg(data.meter ?? { units: 0, done: 0, failed: 0, active: 0 }, { x: PAD, y: METER.y, w: inner, h: METER.h }),
    `<line class="ln" x1="${PAD}" x2="${W - PAD}" y1="${DIVIDER_Y}" y2="${DIVIDER_Y}" stroke-width="1"/>`,
    stats.body,
  ]
  return { source: paneSvg(W, stats.height, body.join('\n')), height: stats.height }
}
