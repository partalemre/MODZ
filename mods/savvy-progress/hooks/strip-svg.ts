import type { AgentRun } from '../types'
import { crab } from './crabs'
import { fitText, fmtCost, fmtTokens, textWidth, xml } from './format'
import { t } from './i18n'
import { lookOf } from './identity'
import { FONT, MONO, paneSvg } from './theme'
import { kindOf } from './history'
import type { Kind } from './history'
import { costumeOf } from './tiers'

// The session strip above the prompt: what the session has used (cost, tokens, agent time) on the left, and on
// the right a stage where every agent at work walks its own lane, in its own costume and name. Motion is CSS
// only, so the stage moves without a redraw; a reduced-motion setting stills it.

export type Tally = { tokens: number; busyMs: number; turns: number; lastCost: number; costBefore: number }
export const NO_TALLY: Tally = { tokens: 0, busyMs: 0, turns: 0, lastCost: 0, costBefore: 0 }

export const STRIP_H = 70
const PAD = 12
const COL_W = 140
const LABEL = { y: 18, size: 11 }
const VALUE = { y: 41, size: 19 }
const SUB = { y: 58, size: 11 }
const CRAB_SCALE = 1.5
const CRAB_W = 30 * CRAB_SCALE
const CRAB_Y = 2
const NAME = { y: 62, size: 10.5 }
const STAGE_MIN = 90
const CREW_SHOWN = 5
// One lap of a lane, out and back; each crab starts at its own point of it so they never step in time.
const LAP_S = 7

const SECOND = 1000
const MINUTE = 60
const HOUR = 60 * MINUTE

// "12dk 57sn"-style time in the interface language, never a clock face.
export const spanText = (ms: number): string => {
  const s = Math.round(ms / SECOND)
  const words = t()
  if (s >= HOUR) return `${words.hours(Math.floor(s / HOUR))} ${words.minutes(Math.floor((s % HOUR) / MINUTE))}`
  if (s >= MINUTE) return `${words.minutes(Math.floor(s / MINUTE))} ${words.seconds(s % MINUTE)}`

  return words.seconds(s)
}

type Column = { label: string; value: string; sub: string }

export const columnsOf = (cost: number, tally: Tally): Column[] => {
  const words = t()
  const perTurn = tally.turns > 0 ? spanText(tally.busyMs / tally.turns) : ''

  return [
    { label: words.stripCost, value: fmtCost(cost), sub: tally.lastCost > 0 ? words.stripLast(fmtCost(tally.lastCost)) : '' },
    { label: words.stripTokens, value: fmtTokens(tally.tokens), sub: words.stripTurns(tally.turns) },
    { label: words.stripTime, value: spanText(tally.busyMs), sub: perTurn === '' ? '' : words.stripPerTurn(perTurn) },
  ]
}

const columnSvg = (c: Column, x: number, i: number): string =>
  [
    i === 0 ? '' : `<line class="ln" x1="${x - PAD}" y1="10" x2="${x - PAD}" y2="${STRIP_H - 10}" stroke-width="1"/>`,
    `<text class="m" x="${x}" y="${LABEL.y}" font-family="${FONT}" font-size="${LABEL.size}">${xml(c.label)}</text>`,
    `<text class="t" x="${x}" y="${VALUE.y}" font-family="${MONO}" font-size="${VALUE.size}" font-weight="650">${xml(c.value)}</text>`,
    `<text class="m" x="${x}" y="${SUB.y}" font-family="${FONT}" font-size="${SUB.size}">${xml(c.sub)}</text>`,
  ].join('')

// Each kind of work moves its own way: reading strolls and peeks, a command dashes, an edit hammers in place, a
// helper agent sent off makes it hop, and a crab between tools sways while it thinks.
const STAGE_CSS = `<style>
.lane{animation:lane ${LAP_S}s ease-in-out infinite alternate}
.m-read .lane{animation-duration:${LAP_S * 2}s}
.m-run .lane{animation-duration:${LAP_S / 3}s;animation-timing-function:linear}
.m-edit .lane,.m-agent .lane,.m-other .lane{animation:none;transform:translateX(calc(var(--d) / 2))}
.hop{transform-box:fill-box;transform-origin:50% 100%}
.m-read .hop{animation:peek 3s ease-in-out infinite}
.m-edit .hop{animation:hammer .45s ease-in-out infinite}
.m-agent .hop{animation:hop 1s ease-in-out infinite}
.m-other .hop{animation:sway 2.4s ease-in-out infinite}
@keyframes lane{from{transform:translateX(0)}to{transform:translateX(var(--d))}}
@keyframes peek{0%,70%,100%{transform:translateY(0)}80%{transform:translateY(-3px)}}
@keyframes hammer{0%,100%{transform:rotate(0)}50%{transform:rotate(-9deg) translateY(-2px)}}
@keyframes hop{0%,100%{transform:translateY(0)}40%{transform:translateY(-9px)}}
@keyframes sway{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
@media (prefers-reduced-motion: reduce){.lane,.hop,.run *{animation:none!important}}
</style>`

// Legs step only where the crab goes somewhere.
const IS_WALKING: Record<Kind, boolean> = { read: true, run: true, edit: false, agent: false, other: false }

// One agent in its lane, moving as its current work moves, its name and that work under it.
function walker(a: AgentRun, at: { x: number; laneW: number; index: number }): string {
  const look = lookOf(a)
  const kind = kindOf(a.lastTool ?? '')
  const said = `${a.isMain ? t().mainName : look.name} · ${t().stripDoing[kind]}`
  const name = fitText(said, NAME.size, at.laneW - 4)
  const free = Math.max(0, at.laneW - Math.max(CRAB_W, textWidth(name, NAME.size)))
  const delay = ((at.index * LAP_S) / CREW_SHOWN).toFixed(2)
  const body = crab(0, CRAB_Y, { costume: costumeOf(a), look, isWalking: IS_WALKING[kind], scale: CRAB_SCALE })
  const label = `<text class="s" x="${CRAB_W / 2}" y="${NAME.y}" text-anchor="middle" font-family="${FONT}" font-size="${NAME.size}" font-weight="600">${xml(name)}</text>`

  return `<g class="m-${kind}" transform="translate(${at.x},0)"><g class="lane" style="--d:${free.toFixed(1)}px;animation-delay:-${delay}s"><g class="hop" style="animation-delay:-${delay}s">${body}</g>${label}</g></g>`
}

function stageSvg(crew: readonly AgentRun[], x: number, w: number): string {
  if (crew.length === 0) return ''
  const shown = crew.slice(0, CREW_SHOWN)
  const rest = crew.length - shown.length
  const restW = rest > 0 ? 34 : 0
  const laneW = (w - restW) / shown.length
  const walkers = shown.map((a, index) => walker(a, { x: x + index * laneW, laneW, index }))
  const more = rest > 0 ? `<text class="m" x="${x + w}" y="${VALUE.y}" text-anchor="end" font-family="${MONO}" font-size="12">+${rest}</text>` : ''

  return STAGE_CSS + walkers.join('') + more
}

/** The strip at `width` px: the session's use, then its working agents on the move. */
export function stripSvg(opts: { width: number; cost: number; tally: Tally; crew: readonly AgentRun[] }): { source: string; alt: string } {
  const cols = columnsOf(opts.cost, opts.tally)
  const body = cols.map((c, i) => columnSvg(c, PAD + i * (COL_W + PAD), i)).join('')
  const stageX = PAD + cols.length * (COL_W + PAD) + PAD
  const stageW = opts.width - stageX - PAD
  const stage = stageW >= STAGE_MIN ? stageSvg(opts.crew, stageX, stageW) : ''
  const names = opts.crew.map(a => (a.isMain ? t().mainName : lookOf(a).name)).join(', ')
  const alt = [...cols.map(c => `${c.label} ${c.value}`), names === '' ? '' : t().crew(opts.crew.length) + `: ${names}`].filter(Boolean).join(' · ')

  return { source: paneSvg(opts.width, STRIP_H, body + stage), alt }
}
