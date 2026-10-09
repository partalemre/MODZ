import type { AgentRun } from '../types'
import type { Totals } from './agents'
import { ctxOf, elapsed } from './agents'
import { crab } from './crabs'
import type { Planned } from './flow'
import { fitText, fmtCost, fmtTime, fmtTokens, modelName, xml } from './format'
import { t } from './i18n'
import { partialOf } from './job'
import { countTasks } from './tasks'
import { FAIL, FONT, paneSvg } from './theme'
import { TIER_MODEL, plannedTierOf } from './tiers'

// The agents panel's small drawings: the crab, the live bar, the pulse and the header tiles. The
// words around them are native text; each drawing keeps one source while its state holds, so its
// motion runs on without restarting at the panel's once-a-second redraw.
export const COMPACT_H = 32
export const CRAB = { w: 36, h: 32 } as const
export const BAR_H = 8
export const PULSE = 12
const MUTED = 0.55
const SWEEP_SHARE = 0.28
const SWEEP_S = 1.8
const SHEEN_S = 2.4

// The narrative part: the worker's own steps or task list, then what it is doing now.
const stepsOf = (a: AgentRun): string => {
  if (a.stepTotal) return `${a.stepDone ?? 0}/${a.stepTotal}${a.stepNote ? ' · ' + a.stepNote : ''}`
  const own = countTasks(a.todos ?? [])
  if (!own.total) return ''
  const active = (a.todos ?? []).find(task => task.status === 'in_progress')
  return `${own.done}/${own.total}${active && a.status === 'running' ? ' · ' + active.title : ''}`
}

export const activityOf = (a: AgentRun): string => {
  const s = t()
  const steps = stepsOf(a)
  if (a.status === 'failed') return [steps, a.endReason === 'aborted' ? s.aborted : s.failed].filter(Boolean).join(' · ')
  if (a.status === 'done') return steps || s.completed
  const tool = a.lastTool ? `› ${a.lastTool}${a.lastTarget ? ' ' + a.lastTarget : ''}` : s.starting
  return steps ? `${steps}  ${tool}` : tool
}

export const modelLine = (a: AgentRun): string => {
  const parts = [a.effort ? `${modelName(a.model)} · ${a.effort}` : modelName(a.model)]
  if (a.round > 1) parts.push(`${t().round} ${a.round}`)
  return parts.join(' · ')
}

export const clockOf = (a: AgentRun, at: number): string => {
  const time = fmtTime(elapsed(a, at))
  return a.status === 'running' ? time : `${t().total} ${time}`
}

export const usageOf = (a: AgentRun): string => `ctx ${ctxOf(a)}% · ${fmtTokens(a.contextTokens)} · ≈${fmtCost(a.costUsd)}`

export const metaOf = (a: AgentRun, at: number): string => `${usageOf(a)} · ${clockOf(a, at)}`

export const progressOf = (a: AgentRun): number | null => (a.status === 'done' ? 1 : partialOf(a) ?? (a.status === 'failed' ? 1 : null))

export const crabSvg = (opts: { costume: string; isWalking?: boolean; isDim?: boolean }): string => paneSvg(CRAB.w, CRAB.h, crab(1, 0, opts))

const sweepCss = (name: string, from: number, to: number, seconds: number): string =>
  `<style>.${name}{animation:${name} ${seconds}s cubic-bezier(.45,0,.55,1) infinite}@keyframes ${name}{from{transform:translateX(${from}px)}to{transform:translateX(${to}px)}}@media (prefers-reduced-motion: reduce){.${name}{animation:none;opacity:0}}</style>`

const glow = (id: string, color: string): string =>
  `<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${color}" stop-opacity="0"/><stop offset=".5" stop-color="${color}" stop-opacity="1"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>`

// Measured work fills in the tier color with a sheen running over it while it runs; unmeasured
// running work is a soft comet sweeping the track; a finished bar rests, muted.
export const barSvg = (W: number, a: AgentRun, color: string): string => {
  const progress = progressOf(a)
  const y = (BAR_H - 4) / 2
  const track = `<rect class="k" x="0" y="${y}" width="${W}" height="4" rx="2"/>`
  if (progress === null) {
    const w = Math.round(W * SWEEP_SHARE)
    const comet = `${glow('cm', color)}<rect class="sw" x="0" y="${y}" width="${w}" height="4" rx="2" fill="url(#cm)"/>`
    return paneSvg(W, BAR_H, `${sweepCss('sw', -w, W, SWEEP_S)}${track}${comet}`)
  }
  const filled = Math.max(4, Math.round(W * progress))
  const fill = a.status === 'failed' ? FAIL : color
  const opacity = a.status === 'running' ? 1 : MUTED
  const bar = `<rect x="0" y="${y}" width="${filled}" height="4" rx="2" fill="${fill}" opacity="${opacity}"/>`
  if (a.status !== 'running') return paneSvg(W, BAR_H, track + bar)
  const sheenW = Math.max(16, Math.round(filled * 0.35))
  const sheen = `${glow('sh', '#ffffff')}<clipPath id="cl"><rect x="0" y="${y}" width="${filled}" height="4" rx="2"/></clipPath><g clip-path="url(#cl)"><rect class="sn" x="0" y="${y}" width="${sheenW}" height="4" fill="url(#sh)" opacity=".55"/></g>`
  return paneSvg(W, BAR_H, `${sweepCss('sn', -sheenW, filled, SHEEN_S)}${track}${bar}${sheen}`)
}

// A live dot with a ring breathing out of it.
export const pulseSvg = (color: string): string => {
  const c = PULSE / 2
  const css = `<style>.rg{transform-origin:${c}px ${c}px;animation:rg 1s ease-out infinite}@keyframes rg{from{transform:scale(.45);opacity:.9}to{transform:scale(1);opacity:0}}@media (prefers-reduced-motion: reduce){.rg{animation:none;opacity:0}}</style>`
  return paneSvg(PULSE, PULSE, `${css}<circle class="rg" cx="${c}" cy="${c}" r="${c - 0.5}" fill="${color}"/><circle cx="${c}" cy="${c}" r="3" fill="${color}"/>`)
}

export const plannedLine = (p: Planned): string => {
  const tier = plannedTierOf(p.tier)
  const parts = [TIER_MODEL[tier] ?? '']
  if (p.after.length) parts.push(t().after(p.after.join(', ')))
  return parts.filter(Boolean).join(' · ')
}

export const HEADER_H = 52
const TILE_GAP = 8

type TileSpec = { x: number; w: number; label: string; value: string; isLive?: boolean }

const tile = (spec: TileSpec): string => {
  const dot = spec.isLive ? `<circle class="live" cx="${spec.x + spec.w - 12}" cy="14" r="3.5" fill="#6FC593"/>` : ''
  return `<rect class="tile" x="${spec.x}" y="0" width="${spec.w}" height="${HEADER_H}" rx="10"/>
<text class="s" x="${spec.x + 12}" y="19" font-family="${FONT}" font-size="12" font-weight="500">${xml(fitText(spec.label, 12, spec.w - 30))}</text>
<text class="t" x="${spec.x + 12}" y="41" font-family="${FONT}" font-size="18" font-weight="650" font-variant-numeric="tabular-nums">${xml(fitText(spec.value, 18, spec.w - 20))}</text>${dot}`
}

export type HeaderCounts = { running: number; total: number }

// Four tiles: how many agents run, what they cost, their tokens and the wall time.
export const headerSvg = (W: number, sum: Totals, counts: HeaderCounts): string => {
  const s = t()
  const w = (W - TILE_GAP * 3) / 4
  const tiles: Omit<TileSpec, 'x' | 'w'>[] = [
    { label: s.agentsTile, value: counts.running ? `${counts.running}/${counts.total}` : `${counts.total}`, isLive: counts.running > 0 },
    { label: s.cost, value: '≈' + fmtCost(sum.cost) },
    { label: s.tokens, value: fmtTokens(sum.tokens) },
    { label: s.time, value: fmtTime(sum.time) },
  ]
  return paneSvg(W, HEADER_H, tiles.map((spec, i) => tile({ ...spec, x: i * (w + TILE_GAP), w })).join(''))
}

type Icon = { costume: string; color: string; isRunning: boolean; isDim: boolean }

export const compactSvg = (W: number, icons: Icon[], sum: Totals): string => {
  const pitch = 36
  const fit = Math.max(1, Math.floor((W - 150) / pitch))
  const shown = icons.slice(0, fit)
  const more = icons.length - shown.length
  const body = shown
    .map((ic, i) => crab(i * pitch, 0, { costume: ic.costume, isDim: ic.isDim, isWalking: ic.isRunning }) + (ic.isRunning ? `<circle class="live" cx="${i * pitch + 32}" cy="4" r="3" fill="${ic.color}"/>` : ''))
    .join('')
  const x = shown.length * pitch + (more ? 4 : 0)
  return paneSvg(
    W,
    COMPACT_H,
    `${body}${more ? `<text class="s" x="${x}" y="21" font-family="${FONT}" font-size="12">+${more}</text>` : ''}
<text class="s" x="${W}" y="21" text-anchor="end" font-family="${FONT}" font-size="12" font-variant-numeric="tabular-nums">≈${fmtCost(sum.cost)} · ${fmtTokens(sum.tokens)} · ${fmtTime(sum.time)}</text>`,
  )
}
