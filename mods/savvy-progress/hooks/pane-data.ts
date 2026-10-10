import type { AgentRun, AgentType, Flow, Job, LimitTrack, Panel, TrackedTask } from '../types'
import { isRunning, totals } from './agents'
import type { Totals } from './agents'
import type { Planned } from './flow'
import { plannedOf } from './flow'
import { fmtCost, fmtTime, fmtTokens } from './format'
import type { HeaderData, Tone } from './header-svg'
import { t } from './i18n'
import { attentionOf } from './insight'
import type { Attention } from './insight'
import { deriveJob, percentText } from './job'
import type { JobView } from './job'
import { shareNumber, shareOf } from './limit'

// Everything the panel draws from, built once per draw from the state pane.tsx reads, and the
// header card's words.

export type PaneData = {
  list: AgentRun[]
  running: AgentRun[]
  finished: AgentRun[]
  planned: Planned[]
  sum: Totals
  view: JobView | null
  at: number
  panel: Panel
  limit: LimitTrack | null
  attention: Attention | null
  types: AgentType[]
}

// With no job of its own (none yet, or dismissed), the header describes the crew as a whole.
const crewView = (list: AgentRun[]): JobView | null =>
  deriveJob({ flow: null, agents: list, job: { agentIds: list.map(a => a.id), startedAt: 0, isSealed: true, isHidden: false }, tasks: [] })

/** The values pane.tsx read from state, as they are stored. */
export type PaneState = {
  list: AgentRun[]
  flow: Flow | null
  job: Job | null
  tasks: TrackedTask[]
  now: number
  panel: Panel
  limit: LimitTrack | null
  types: AgentType[]
}

export function paneDataOf(state: PaneState): PaneData {
  const { list } = state
  const at = Math.max(state.now, ...list.map(a => a.startedAt), 0)
  const view = deriveJob({ flow: state.flow, agents: list, job: state.job, tasks: state.tasks }) ?? crewView(list)
  const ended = (a: AgentRun) => a.endedAt ?? a.startedAt
  return {
    list,
    running: list.filter(isRunning).reverse(),
    finished: list.filter(a => !isRunning(a)).sort((a, b) => ended(b) - ended(a)),
    planned: plannedOf(state.flow, list),
    sum: totals(list, at),
    view,
    at,
    panel: state.panel,
    limit: state.limit,
    attention: attentionOf(list, at),
    types: state.types,
  }
}

export const summaryOf = (sum: Totals): string => `≈${fmtCost(sum.cost)} · ${fmtTokens(sum.tokens)} ${t().tokensWord} · ${fmtTime(sum.time)}`

const toneOf = (d: PaneData): Tone => {
  if (d.running.length) return 'run'
  if (!d.list.length) return 'idle'
  return d.view && d.view.failed > 0 ? 'warn' : 'ok'
}

// "2 çalışıyor · 3 bitti · 1 planlı": only the parts that are not zero.
const countsOf = (d: PaneData): string => {
  const s = t()
  const ended = d.list.length - d.running.length
  return [d.running.length && s.liveCount(d.running.length), ended && s.endedCount(ended), d.planned.length && s.plannedCount(d.planned.length)]
    .filter(Boolean)
    .join(' · ')
}

export function headerOf(d: PaneData): HeaderData {
  const s = t()
  const share = shareOf(d.sum.cost, d.limit)
  const view = d.view
  return {
    eyebrow: s.pane.toLocaleUpperCase('tr'),
    counts: countsOf(d),
    headline: view?.title || s.crew(d.list.length),
    percent: view ? percentText(view) : '—',
    tone: toneOf(d),
    meter: view,
    stats: [
      { label: s.cost, value: `≈${fmtCost(d.sum.cost)}` },
      { label: s.tokens, value: fmtTokens(d.sum.tokens) },
      { label: s.time, value: fmtTime(d.sum.time) },
      { label: s.limitTile, value: share === null ? '—' : `≈${s.pct(shareNumber(share))}` },
    ],
  }
}

export const totalsLineOf = (data: HeaderData): string => data.stats.map(stat => `${stat.label} ${stat.value}`).join(' · ')
