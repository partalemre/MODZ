import type { AgentRun } from '../types'
import { elapsed } from './agents'
import { crab } from './crabs'
import { rings } from './kit/motion'
import type { CrabOptions } from './crabs'
import type { Planned } from './flow'
import { fmtTime, modelName } from './format'
import { t } from './i18n'
import type { Look } from './identity'
import { homeCrab, levelPill, levelWidth } from './mood-svg'
import type { HomeMark } from './mood-svg'
import { countTasks } from './tasks'
import { FONT, paneSvg } from './theme'
import { TIER_MODEL, plannedTierOf } from './tiers'

// The agents panel's small drawings: the crab, the open call's dot and the compact strip. The
// words around them are native text; each drawing keeps one source while its state holds, so its
// motion runs on without restarting at the panel's once-a-second redraw.
export const COMPACT_H = 32
const CRAB_PITCH = 36
const MORE_ROOM = 40
const LIVE_DOT = { x: 32, y: 4, r: 3 } as const
export const CRAB = { w: 36, h: 32 } as const
export const PULSE = 12
const PULSE_CORE = 3
// The kit's rings grow to 3.2 times their dot: from this one they stay inside the drawing's 12 px.
const PULSE_RINGS = 1.8

/** The worker's own count of its steps or its task list, when it keeps one: "3/5 · Hero copy". */
export const stepsOf = (a: AgentRun): string => {
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

// A spawn may not name its model yet (none, or `inherit`): the line waits for the first model
// request rather than show "—" or the alias.
const UNNAMED = ['', 'inherit']

export const modelLine = (a: AgentRun): string => {
  const round = a.round > 1 ? `${t().round} ${a.round}` : ''
  const model = UNNAMED.includes(a.model) ? '' : modelName(a.model)
  return [model, a.effort ?? '', round].filter(Boolean).join(' · ')
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

// The empty panel's host: the home crab, larger, in its mood, and its level under it.
export const HERO_CRAB = { w: 76, h: 88, scale: 2.3, crabH: 66, pillGap: 4 } as const
// The middle of the crab's 30-cell grid, where its level pill centres.
const GRID_MID = 15

export const heroCrabSvg = (home: HomeMark): string => {
  const pillX = Math.max(0, Math.round(GRID_MID * HERO_CRAB.scale - levelWidth(home.level) / 2))
  const pill = levelPill(home.level, pillX, HERO_CRAB.crabH + HERO_CRAB.pillGap)
  return paneSvg(HERO_CRAB.w, HERO_CRAB.h, homeCrab(0, 2, { home, scale: HERO_CRAB.scale }) + pill)
}

// The call still open, as an Iris dot in a faint ring, rings going out of it while the call runs.
export const pulseSvg = (): string => {
  const c = PULSE / 2
  const live = rings({ cx: c, cy: c, r: PULSE_RINGS, className: 'f-run' })
  return paneSvg(PULSE, PULSE, `<circle class="b-run l-run" cx="${c}" cy="${c}" r="${c - 1}" stroke-width="1"/>${live}<circle class="f-run" cx="${c}" cy="${c}" r="${PULSE_CORE}"/>`)
}

export const plannedLine = (p: Planned): string => {
  const tier = plannedTierOf(p.tier)
  const parts = [TIER_MODEL[tier] ?? '']
  if (p.after.length) parts.push(t().after(p.after.join(', ')))
  return parts.filter(Boolean).join(' · ')
}

type Icon = { costume: string; look: Look; color: string; isRunning: boolean; isDim: boolean }

// The whole crew as a row of crabs, a "+n" past what fits; the header above keeps the totals.
export const compactSvg = (W: number, icons: Icon[]): string => {
  const fit = Math.max(1, Math.floor((W - MORE_ROOM) / CRAB_PITCH))
  const shown = icons.slice(0, fit)
  const more = icons.length - shown.length
  const body = shown
    .map((ic, i) => crab(i * CRAB_PITCH, 0, { costume: ic.costume, look: ic.look, isDim: ic.isDim, isWalking: ic.isRunning }) + (ic.isRunning ? `<circle cx="${i * CRAB_PITCH + LIVE_DOT.x}" cy="${LIVE_DOT.y}" r="${LIVE_DOT.r}" fill="${ic.color}"/>` : ''))
    .join('')
  const plus = more ? `<text class="s" x="${shown.length * CRAB_PITCH + 4}" y="21" font-family="${FONT}" font-size="12">+${more}</text>` : ''
  return paneSvg(W, COMPACT_H, body + plus)
}
