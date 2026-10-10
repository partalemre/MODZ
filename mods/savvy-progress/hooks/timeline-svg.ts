import { fitText, fmtTime, textWidth, xml } from './format'
import type { Kind } from './history'
import { t } from './i18n'
import { KIND_COLOR } from './metrics-svg'
import type { Lane, Timeline } from './timeline'
import { FONT, MONO, paneSvg } from './theme'

// The timeline as one still drawing: a lane per agent (its shell-coloured dot and name), each tool
// call a segment in its kind's colour, an end cap that says how it went, a "şimdi" hairline while
// any runs and an Amber notch on a lane that went quiet. Ticks count from the crew's first start.

const LEGEND_H = 20
const LANE_H = 24
const AXIS_H = 20
const LABEL_W = 74
const RIGHT_PAD = 10
// Room the "şimdi" label takes left of the hairline: no tick label is drawn under it.
const NOW_ROOM = 44
const SEG_H = 10
const SEG_MIN = 3
const TRACK_H = 2
const DOT_R = 4
const CAP_R = 3.5
const NAME_SIZE = 12
const MICRO = 10.5
const SWATCH = 8
const SWATCH_GAP = 4
const LEGEND_GAP = 14
const TICKS_MAX = 4
const SECOND = 1000
const MINUTE = 60 * SECOND
const STEPS_MS = [10 * SECOND, 30 * SECOND, MINUTE, 2 * MINUTE, 5 * MINUTE, 10 * MINUTE, 15 * MINUTE, 30 * MINUTE, 60 * MINUTE]
const LEGEND: Kind[] = ['read', 'edit', 'run', 'agent']
const CAP: Record<string, string> = { running: 'f-run', done: 'f-ok', failed: 'f-danger' }
const ENDED_OPACITY = 0.6

type Scale = { x0: number; x1: number; t0: number; span: number }

export type TimelineDrawing = { source: string; height: number; alt: string }

const xOf = (scale: Scale, ms: number): number => scale.x0 + ((ms - scale.t0) / scale.span) * (scale.x1 - scale.x0)

const n1 = (v: number): string => v.toFixed(1)

// The swatches of the kinds the lanes hold, at the top right, laid right to left from the edge.
const legendSvg = (W: number, tl: Timeline): string => {
  const kinds = t().kinds
  const present = LEGEND.filter(kind => tl.lanes.some(lane => lane.segments.some(seg => seg.kind === kind)))
  let x = W - RIGHT_PAD
  return [...present].reverse().map(kind => {
    const label = kinds[kind]
    x -= Math.ceil(textWidth(label, MICRO)) + SWATCH + SWATCH_GAP
    const at = x
    x -= LEGEND_GAP
    return `<rect x="${at}" y="5" width="${SWATCH}" height="${SWATCH}" rx="2" fill="${KIND_COLOR[kind]}"/><text class="m" x="${at + SWATCH + SWATCH_GAP}" y="12.5" font-family="${FONT}" font-size="${MICRO}">${xml(label)}</text>`
  }).join('')
}

function laneSvg(lane: Lane, y: number, scale: Scale): string {
  const cy = y + LANE_H / 2
  const isLive = lane.status === 'running'
  const start = xOf(scale, lane.start)
  const end = Math.max(start + SEG_MIN, xOf(scale, lane.end))
  const label = `<circle cx="${DOT_R + 1}" cy="${cy}" r="${DOT_R}" fill="${lane.shell}"/><text class="${isLive ? 't' : 's'}" x="${DOT_R * 2 + 8}" y="${cy + 4}" font-family="${FONT}" font-size="${NAME_SIZE}" font-weight="600">${xml(fitText(lane.name, NAME_SIZE, LABEL_W - DOT_R * 2 - 12))}</text>`
  const track = `<rect class="k" x="${n1(start)}" y="${cy - TRACK_H / 2}" width="${n1(end - start)}" height="${TRACK_H}" rx="1"/>`
  const segs = lane.segments.map(seg => {
    const x = xOf(scale, seg.from)
    const w = Math.max(SEG_MIN, xOf(scale, seg.to) - x)
    return `<rect x="${n1(x)}" y="${cy - SEG_H / 2}" width="${n1(w)}" height="${SEG_H}" rx="2.5" fill="${KIND_COLOR[seg.kind]}"/>`
  }).join('')
  const cap = `<circle class="${lane.isStuck ? 'f-warn' : (CAP[lane.status] ?? 'f-run')}" cx="${n1(end)}" cy="${cy}" r="${CAP_R}"/>`
  const notch = lane.isStuck ? `<rect class="f-warn" x="${n1(end + CAP_R + 3)}" y="${cy - SEG_H / 2 - 2}" width="3" height="${SEG_H + 4}" rx="1.5"/>` : ''
  return `<g>${label}<g opacity="${isLive ? 1 : ENDED_OPACITY}">${track}${segs}</g>${cap}${notch}</g>`
}

// Elapsed-time ticks from the first start ("0:00", "1:00", …), at most four, on a round step.
function axisSvg(scale: Scale, top: number, nowX: number | null): string {
  const step = STEPS_MS.find(ms => scale.span / ms <= TICKS_MAX) ?? STEPS_MS.at(-1) ?? MINUTE
  const ticks: string[] = []
  for (let ms = 0; ms <= scale.span; ms += step) {
    const x = xOf(scale, scale.t0 + ms)
    if (nowX !== null && Math.abs(x - nowX) < NOW_ROOM && ms > 0) continue
    const anchor = ms === 0 ? 'start' : 'middle'
    ticks.push(`<rect class="k" x="${n1(x)}" y="${top}" width="1" height="4"/><text class="m" x="${n1(x)}" y="${top + 16}" text-anchor="${anchor}" font-family="${MONO}" font-size="${MICRO}">${fmtTime(ms)}</text>`)
  }
  return `<rect class="k" x="${scale.x0}" y="${top}" width="${n1(scale.x1 - scale.x0)}" height="1"/>${ticks.join('')}`
}

// The hairline stands at now, which a young crew's minimum span leaves short of the right edge.
const nowSvg = (scale: Scale, at: number, rows: { top: number; bottom: number }): string => {
  const x = xOf(scale, at)
  const anchor = x > scale.x1 - NOW_ROOM / 2 ? 'end' : 'middle'
  return `<rect class="s" x="${n1(x)}" y="${rows.top - 4}" width="1" height="${rows.bottom - rows.top + 8}" opacity=".55"/>` +
    `<text class="s" x="${n1(anchor === 'end' ? scale.x1 : x)}" y="${rows.bottom + 18}" text-anchor="${anchor}" font-family="${FONT}" font-size="${MICRO}" font-weight="600">${xml(t().now)}</text>`
}

const altOf = (tl: Timeline): string => {
  const s = t()
  const words: Record<string, string> = { running: s.isRunning, done: s.isFinished, failed: s.failed }
  return `${s.timeline}: ${tl.lanes.map(lane => `${lane.name} ${fmtTime(lane.end - lane.start)} ${words[lane.status] ?? ''}`.trim()).join(', ')}`
}

export function timelineSvg(W: number, tl: Timeline): TimelineDrawing {
  const scale: Scale = { x0: LABEL_W, x1: W - RIGHT_PAD, t0: tl.t0, span: tl.span }
  const bottom = LEGEND_H + tl.lanes.length * LANE_H
  const height = bottom + AXIS_H + 4
  const lanes = tl.lanes.map((lane, i) => laneSvg(lane, LEGEND_H + i * LANE_H, scale)).join('')
  const nowX = tl.isLive ? xOf(scale, tl.t1) : null
  const body = legendSvg(W, tl) + lanes + axisSvg(scale, bottom + 2, nowX) + (tl.isLive ? nowSvg(scale, tl.t1, { top: LEGEND_H, bottom }) : '')
  return { source: paneSvg(W, height, body), height, alt: altOf(tl) }
}
