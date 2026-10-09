import type { AgentRun } from '../types'
import type { Totals } from './agents'
import { elapsed } from './agents'
import { crab } from './crabs'
import type { CrabOptions } from './crabs'
import type { Planned } from './flow'
import { fmtCost, fmtTime, fmtTokens, modelName, textWidth, xml } from './format'
import { t } from './i18n'
import type { Look } from './identity'
import { countTasks } from './tasks'
import { FONT, paneSvg } from './theme'
import { TIER_MODEL, plannedTierOf } from './tiers'

// The agents panel's small drawings: the crab, the pulse and the status pill. The
// words around them are native text; each drawing keeps one source while its state holds, so its
// motion runs on without restarting at the panel's once-a-second redraw.
export const COMPACT_H = 32
export const CRAB = { w: 36, h: 32 } as const
export const PULSE = 12

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

export const crabSvg = (opts: CrabOptions): string => paneSvg(CRAB.w, CRAB.h, crab(1, 0, opts))

// The card's crab: the same sprite drawn larger, so each agent's shell, eyes and costume read at a glance.
export const CARD_CRAB = { w: 50, h: 44, scale: 1.5 } as const

export const cardCrabSvg = (opts: Omit<CrabOptions, 'scale'>): string =>
  paneSvg(CARD_CRAB.w, CARD_CRAB.h, crab(1, 0, { ...opts, scale: CARD_CRAB.scale }))

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

type Icon = { costume: string; look: Look; color: string; isRunning: boolean; isDim: boolean }

export const compactSvg = (W: number, icons: Icon[], sum: Totals): string => {
  const pitch = 36
  const fit = Math.max(1, Math.floor((W - 150) / pitch))
  const shown = icons.slice(0, fit)
  const more = icons.length - shown.length
  const body = shown
    .map((ic, i) => crab(i * pitch, 0, { costume: ic.costume, look: ic.look, isDim: ic.isDim, isWalking: ic.isRunning }) + (ic.isRunning ? `<circle class="live" cx="${i * pitch + 32}" cy="4" r="3" fill="${ic.color}"/>` : ''))
    .join('')
  const x = shown.length * pitch + (more ? 4 : 0)
  return paneSvg(
    W,
    COMPACT_H,
    `${body}${more ? `<text class="s" x="${x}" y="21" font-family="${FONT}" font-size="12">+${more}</text>` : ''}
<text class="s" x="${W}" y="21" text-anchor="end" font-family="${FONT}" font-size="12" font-variant-numeric="tabular-nums">≈${fmtCost(sum.cost)} · ${fmtTokens(sum.tokens)} · ${fmtTime(sum.time)}</text>`,
  )
}

type PillRole = 'run' | 'ok' | 'warn' | 'danger'

const PILL = { h: 20, padX: 9, size: 11, dot: 3, dotGap: 6 } as const
const BOLD = 1.06

export type Pill = { source: string; width: number; height: number }

// The status as a small pill: a running one carries a pulsing dot, the others read as a word.
export const pillSvg = (label: string, role: PillRole, isLive: boolean): Pill => {
  const dot = isLive ? PILL.dot * 2 + PILL.dotGap : 0
  const width = Math.ceil(textWidth(label, PILL.size) * BOLD + PILL.padX * 2 + dot)
  const x = PILL.padX
  const mid = PILL.h / 2
  const body = [
    `<rect class="b-${role} l-${role}" x="0.5" y="0.5" width="${width - 1}" height="${PILL.h - 1}" rx="${(PILL.h - 1) / 2}" stroke-width="1"/>`,
    isLive ? `<circle class="f-${role} live" cx="${x + PILL.dot}" cy="${mid}" r="${PILL.dot}"/>` : '',
    `<text class="f-${role}" x="${x + dot}" y="${mid + PILL.size * 0.35}" font-family="${FONT}" font-size="${PILL.size}" font-weight="600">${xml(label)}</text>`,
  ]
  return { source: paneSvg(width, PILL.h, body.join('')), width, height: PILL.h }
}
