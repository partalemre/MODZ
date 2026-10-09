// The swimlane: one lane per agent, each tool call a segment colored by its kind (read Tide,
// edit Kiln, run Iris), a "şimdi" hairline at the right and an Amber notch on a lane that needs you.
import { roughText, shortText } from './format'
import { moodOf } from './insight'
import { isLive } from './roster'
import { esc, eyebrow, fit, measure, num, statusDot } from './svg-parts'
import type { DotState } from './svg-parts'
import { svgDoc } from './theme'
import type { Theme } from './theme'
import type { Drawing } from './desk-header'
import type { DeckAgent, DeckSpan, ToolKind } from '../types'

export type LaneInput = { width: number; agents: DeckAgent[]; nowMs: number; selected: string | null; theme: Theme }

type Scale = { x0: number; x1: number; t0: number; span: number }

const HEAD = 30
const LANE = 24
const AXIS = 24
const LANES_MAX = 8
const SEGMENT = 10
const SEGMENT_MIN = 2.5
const NOW_PAD = 16
const LABEL_MAX = 168
const LABEL_SHARE = 0.3
const MIN_SPAN_MS = 30_000
const SECOND = 1_000
const MINUTE = 60 * SECOND
const STEPS_MS = [10 * SECOND, 30 * SECOND, MINUTE, 2 * MINUTE, 5 * MINUTE, 10 * MINUTE, 15 * MINUTE, 30 * MINUTE, 60 * MINUTE]
const TICKS_MAX = 4
const LEGEND: { kind: ToolKind; label: string }[] = [
  { kind: 'read', label: 'okuma' },
  { kind: 'edit', label: 'düzenleme' },
  { kind: 'run', label: 'komut' },
]
const MOOD_DOTS: Record<string, DotState> = { busy: 'running', stuck: 'stuck', resting: 'waiting', happy: 'done', hurt: 'failed' }

function xOf(scale: Scale, ms: number): number {
  return scale.x0 + ((ms - scale.t0) / scale.span) * (scale.x1 - scale.x0)
}

function legendSvg(right: number): { svg: string; width: number } {
  let x = right
  const parts = [...LEGEND].reverse().map(item => {
    const width = measure(item.label, 10.5) * 1.1 + 24
    x -= width
    const at = x

    return `<rect x="${num(at)}" y="5" width="8" height="8" rx="2" class="fg-${item.kind}"/><text x="${num(at + 12)}" y="12.5" class="mi lo">${esc(item.label)}</text>`
  })

  return { svg: parts.join(''), width: right - x }
}

function segmentSvg(span: DeckSpan, spec: { scale: Scale; cy: number; nowMs: number }): string {
  const start = xOf(spec.scale, span.start)
  const width = Math.max(SEGMENT_MIN, xOf(spec.scale, span.end ?? spec.nowMs) - start)

  return `<rect x="${num(start)}" y="${num(spec.cy - SEGMENT / 2)}" width="${num(width)}" height="${SEGMENT}" rx="2.5" class="fg-${span.kind}"/>`
}

function laneSvg(agent: DeckAgent, spec: { index: number; input: LaneInput; scale: Scale; labelWidth: number }): string {
  const { index, input, scale } = spec
  const y = HEAD + index * LANE
  const cy = y + LANE / 2
  const mood = moodOf(agent, input.nowMs)
  const live = isLive(agent)
  const end = live ? input.nowMs : (agent.endedAt ?? input.nowMs)
  const band = agent.id === input.selected ? `<rect x="0" y="${y + 1}" width="${num(input.width)}" height="${LANE - 2}" rx="6" class="card"/>` : ''
  const start = xOf(scale, agent.startedAt)
  const track = `<rect x="${num(start)}" y="${num(cy - 1)}" width="${num(Math.max(SEGMENT_MIN, xOf(scale, end) - start))}" height="2" rx="1" class="track"/>`
  const segments = agent.spans.map(span => segmentSvg(span, { scale, cy, nowMs: input.nowMs })).join('')
  const notch = mood === 'stuck' || (live && agent.hasFailingTest) ? `<rect x="${num(scale.x1 - 1.5)}" y="${num(cy - 8)}" width="3" height="16" rx="1.5" class="fg-warn"/>` : ''
  const name = fit(agent.description === '' ? agent.type : agent.description, spec.labelWidth - 30, 12)
  const label = `${statusDot({ cx: 8, cy, state: MOOD_DOTS[mood] ?? 'running' })}<text x="22" y="${num(cy + 4)}" class="lb ${live ? 'hi' : 'lo'}">${esc(name)}</text>`

  return `<g>${band}${label}<g opacity="${live ? 1 : 0.5}">${track}${segments}</g>${notch}</g>`
}

// Ticks every round step back from now, at most four, labelled "−2 dk".
function axisSvg(scale: Scale, top: number): string {
  const step = STEPS_MS.find(ms => scale.span / ms <= TICKS_MAX) ?? STEPS_MS[STEPS_MS.length - 1] ?? MINUTE
  const nowMs = scale.t0 + scale.span
  const ticks: string[] = []
  for (let back = step; nowMs - back >= scale.t0; back += step) {
    const x = xOf(scale, nowMs - back)
    ticks.push(`<rect x="${num(x)}" y="${top}" width="1" height="4" class="f-line"/><text x="${num(x)}" y="${top + 16}" text-anchor="middle" class="mi lo num">${esc(`−${roughText(back)}`)}</text>`)
  }
  const line = `<rect x="${num(scale.x0)}" y="${top}" width="${num(scale.x1 - scale.x0)}" height="1" class="f-line"/>`

  return line + ticks.join('')
}

export function swimlaneSvg(input: LaneInput): Drawing | null {
  const lanes = [...input.agents].sort((a, b) => a.startedAt - b.startedAt).slice(-LANES_MAX)
  if (lanes.length === 0) return null
  const labelWidth = Math.min(LABEL_MAX, input.width * LABEL_SHARE)
  const t0 = Math.min(...lanes.map(agent => agent.startedAt))
  const scale: Scale = { x0: labelWidth, x1: input.width - NOW_PAD, t0, span: Math.max(MIN_SPAN_MS, input.nowMs - t0) }
  const bottom = HEAD + lanes.length * LANE
  const height = bottom + AXIS
  const legend = legendSvg(input.width)
  const head = eyebrow({ x: 0.5, y: 13, width: input.width - legend.width - 16, label: 'Zaman çizelgesi', role: null })
  const body = lanes.map((agent, index) => laneSvg(agent, { index, input, scale, labelWidth })).join('')
  const now = `<rect x="${num(scale.x1)}" y="${HEAD - 4}" width="1" height="${bottom - HEAD + 8}" class="f-mid" opacity=".7"/><text x="${num(scale.x1)}" y="${bottom + 18}" text-anchor="middle" class="mi mid" style="font-weight:600">şimdi</text>`
  const live = lanes.filter(isLive).length
  const source = svgDoc({ width: input.width, height, theme: input.theme, body: head + legend.svg + body + axisSvg(scale, bottom + 2) + now })

  return { source, alt: `Zaman çizelgesi: ${lanes.length} ajan, ${live} tanesi sürüyor; ${lanes.map(agent => shortText(agent.description || agent.type, 40)).join(', ')}`, height }
}
