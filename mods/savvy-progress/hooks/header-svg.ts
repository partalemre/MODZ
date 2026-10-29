import { fitText, textWidth, xml } from './format'
import { meterSvg } from './meter'
import type { Units } from './meter'
import { LEVEL_PILL, homeCrab, levelPill, levelWidth } from './mood-svg'
import type { HomeMark } from './mood-svg'
import { FONT, MONO, paneSvg } from './theme'

// The panel's header as its one card: what the crew is doing in a headline, the job's percent beside
// it, its meter beneath, and the money, tokens, time and 5h share in a quiet row at the foot.
// A narrow pane folds the four figures into two rows; nothing is cut to fit. Only state takes colour:
// a live crew's dot breathes in the accent, a warning turns the percent amber.
const PAD = 16
const RADIUS = 10
const LABEL = { size: 12, weight: 600, y: 27 } as const
const HEADLINE = { size: 17, y: 56 } as const
const PERCENT = { size: 26, y: 58 } as const
const MONO_EM = 0.6
const METER = { y: 70, h: 6 } as const
const DIVIDER_Y = 92
const STATS = { top: 104, label: 11, value: 31, valueSize: 15, labelSize: 12, rule: 34, pitch: 46 } as const
const BOLD = 1.06
const DOT_R = 3
const GAP = 12
// The home crab stands left of the label and the headline; the words move over by its room.
const HOME = { y: 11, scale: 1.5, room: 58 } as const
const PILL_GAP = 8
// The level pill sits a little under the label's cap height, centred on its letters.
const PILL_DROP = 4

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
  home?: HomeMark
}

export type Drawing = { source: string; height: number }

const PERCENT_CLASS: Record<Tone, string> = { run: 't', ok: 't', warn: 'f-warn', idle: 'm' }
// Nothing measurable yet reads as a quiet dash, not as a figure in the tone's colour.
const UNKNOWN = '—'

// The room a figure needs: its label or its value, whichever is wider, and the gaps around it.
const needOf = (stat: Stat): number =>
  Math.max(textWidth(stat.label, STATS.labelSize), textWidth(stat.value, STATS.valueSize) * BOLD) + GAP * 2

// All figures in one row when each fits its column, else two by two, else one a row: never cut.
const columnsOf = (inner: number, stats: Stat[]): number => {
  const need = Math.max(0, ...stats.map(needOf))
  const fits = (cols: number) => inner / cols >= need
  if (fits(stats.length)) return stats.length
  return fits(2) ? 2 : 1
}

type Slot = { x: number; y: number; w: number }

const statSvg = (stat: Stat, { x, y, w }: Slot): string =>
  `<text class="m" x="${x}" y="${y + STATS.label}" font-family="${FONT}" font-size="${STATS.labelSize}">${xml(fitText(stat.label, STATS.labelSize, w))}</text>
<text class="t" x="${x}" y="${y + STATS.value}" font-family="${FONT}" font-size="${STATS.valueSize}" font-weight="650" font-variant-numeric="tabular-nums">${xml(fitText(stat.value, STATS.valueSize, w))}</text>`

// Four figures in one row, or two by two; the columns' spacing keeps them apart.
const statsSvg = (stats: Stat[], inner: number): { body: string; height: number } => {
  const cols = columnsOf(inner, stats)
  const rows = Math.ceil(stats.length / cols)
  const colW = inner / cols
  const parts = stats.map((stat, i) => {
    const col = i % cols
    const y = STATS.top + Math.floor(i / cols) * STATS.pitch
    const x = PAD + col * colW
    return statSvg(stat, { x, y, w: colW - GAP })
  })
  return { body: parts.join('\n'), height: STATS.top + (rows - 1) * STATS.pitch + STATS.rule + PAD }
}

// The crab and its level beside the label: the drawing, the label's end, and the room both take.
const homeParts = (data: HeaderData, eyebrowEnd: number): { body: string; room: number } => {
  if (!data.home) return { body: '', room: 0 }
  const crab = homeCrab(PAD, HOME.y, { home: data.home, scale: HOME.scale })
  const pill = levelPill(data.home.level, eyebrowEnd + PILL_GAP, LABEL.y - LEVEL_PILL.h + PILL_DROP)
  return { body: crab + pill, room: PILL_GAP + levelWidth(data.home.level) }
}

export const headerSvg = (W: number, data: HeaderData): Drawing => {
  const inner = W - PAD * 2
  const left = PAD + (data.home ? HOME.room : 0)
  const isLive = data.tone === 'run'
  const eyebrowX = left + (isLive ? DOT_R * 2 + 7 : 0)
  const eyebrowEnd = eyebrowX + textWidth(data.eyebrow, LABEL.size) * BOLD
  const home = homeParts(data, eyebrowEnd)
  const percentW = Math.ceil(data.percent.length * PERCENT.size * MONO_EM)
  const counts = fitText(data.counts, LABEL.size, W - PAD - eyebrowEnd - home.room - 24)
  const headline = fitText(data.headline, HEADLINE.size * 1.06, W - PAD - left - percentW - GAP)
  const stats = statsSvg(data.stats, inner)
  // Only while the crew runs does a dot stand before the label, breathing.
  const dot = isLive ? `<circle class="f-edit live" cx="${left + DOT_R}" cy="${LABEL.y - 4}" r="${DOT_R}"/>` : ''
  const body = [
    `<rect class="card ln" x="0.5" y="0.5" width="${W - 1}" height="${stats.height - 1}" rx="${RADIUS}" stroke-width="1"/>`,
    home.body,
    dot,
    `<text class="m" x="${eyebrowX}" y="${LABEL.y}" font-family="${FONT}" font-size="${LABEL.size}" font-weight="${LABEL.weight}">${xml(data.eyebrow)}</text>`,
    `<text class="m" x="${W - PAD}" y="${LABEL.y}" text-anchor="end" font-family="${FONT}" font-size="${LABEL.size}" font-variant-numeric="tabular-nums">${xml(counts)}</text>`,
    `<text class="t" x="${left}" y="${HEADLINE.y}" font-family="${FONT}" font-size="${HEADLINE.size}" font-weight="620">${xml(headline)}</text>`,
    `<text class="${data.percent === UNKNOWN ? 'm' : PERCENT_CLASS[data.tone]}" x="${W - PAD}" y="${PERCENT.y}" text-anchor="end" font-family="${MONO}" font-size="${PERCENT.size}" font-weight="650">${xml(data.percent)}</text>`,
    meterSvg(data.meter ?? { units: 0, done: 0, failed: 0, active: 0 }, { x: PAD, y: METER.y, w: inner, h: METER.h }),
    `<line class="ln" x1="${PAD}" x2="${W - PAD}" y1="${DIVIDER_Y}" y2="${DIVIDER_Y}" stroke-width="1"/>`,
    stats.body,
  ]
  return { source: paneSvg(W, stats.height, body.join('\n')), height: stats.height }
}
