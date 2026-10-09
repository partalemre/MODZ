import type { Plan, Step } from './match'
import type { AgentRun, StepStatus, StepTrack } from '../types'

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const PERCENT = 100
const ETA_MIN_DONE = 3
const FILES_MAX = 50
const AGENTS_MAX = 20

export type Tracks = Record<string, StepTrack>

export function emptyTrack(status: StepStatus): StepTrack {
  return { status, startedAt: null, finishedAt: null, files: [], agents: [] }
}

function moved(track: StepTrack, status: StepStatus, now: number): StepTrack {
  if (status === 'in_progress') return { ...track, status, startedAt: track.startedAt ?? now, finishedAt: null }
  if (status === 'completed') return { ...track, status, finishedAt: now }

  return { ...track, status, startedAt: null, finishedAt: null }
}

// Times come from status changes the session showed; a step first seen already done has no duration.
export function observe(tracks: Tracks, steps: Step[], now: number): Tracks {
  const next: Tracks = { ...tracks }
  for (const step of steps) {
    const track = next[step.key]
    if (track === undefined) {
      next[step.key] = step.status === 'in_progress' ? moved(emptyTrack('pending'), 'in_progress', now) : emptyTrack(step.status)
    } else if (track.status !== step.status) {
      next[step.key] = moved(track, step.status, now)
    }
  }

  return next
}

// The step under way; of several, the one begun last.
export function currentIndex(steps: Step[], tracks: Tracks): number {
  let best = -1
  let bestStart = -Infinity
  steps.forEach((step, index) => {
    const start = tracks[step.key]?.startedAt ?? 0
    if (step.status === 'in_progress' && start > bestStart) {
      best = index
      bestStart = start
    }
  })

  return best
}

// Where the list centres: the step under way, else the first not done, else the last.
export function anchorIndex(steps: Step[], tracks: Tracks): number {
  const current = currentIndex(steps, tracks)
  if (current >= 0) return current
  const next = steps.findIndex(step => step.status !== 'completed')

  return next >= 0 ? next : Math.max(0, steps.length - 1)
}

export type Progress = { done: number; total: number; percent: number; isEstimate: boolean }

export function progressOf(plan: Plan): Progress {
  const total = plan.steps.length
  const done = plan.steps.filter(step => step.status === 'completed').length
  const credit = plan.steps.reduce((sum, step) => sum + step.credit, 0)
  const percent = total === 0 ? 0 : Math.round((credit / total) * PERCENT)

  return { done, total, percent, isEstimate: credit > done }
}

export function durationOf(track: StepTrack | undefined, now: number): number | null {
  if (track === undefined || track.startedAt === null) return null
  const end = track.status === 'completed' ? track.finishedAt : now

  return end === null ? null : Math.max(0, end - track.startedAt)
}

// Average finished-step time times the steps left; only once three steps have a measured time.
export function etaOf(plan: Plan, tracks: Tracks): number | null {
  const measured = plan.steps
    .filter(step => step.status === 'completed')
    .map(step => durationOf(tracks[step.key], 0))
    .filter((ms): ms is number => ms !== null)
  const remaining = plan.steps.filter(step => step.status !== 'completed').length
  if (measured.length < ETA_MIN_DONE || remaining === 0) return null
  const average = measured.reduce((sum, ms) => sum + ms, 0) / measured.length

  return average * remaining
}

export function formatDuration(ms: number): string {
  if (ms < MINUTE) return `${Math.max(1, Math.round(ms / SECOND))}sn`
  if (ms < HOUR) return `${Math.round(ms / MINUTE)}dk`
  const hours = Math.floor(ms / HOUR)
  const minutes = Math.round((ms % HOUR) / MINUTE)

  return minutes === 0 ? `${hours}sa` : `${hours}sa ${minutes}dk`
}

export function percentText(progress: Progress): string {
  return `${progress.isEstimate ? '~' : ''}%${progress.percent}`
}

export function addFile(track: StepTrack, path: string): StepTrack {
  const files = [...track.files.filter(file => file !== path), path].slice(-FILES_MAX)

  return { ...track, files }
}

export function addAgent(track: StepTrack, agent: AgentRun): StepTrack {
  return { ...track, agents: [...track.agents.filter(one => one.key !== agent.key), agent].slice(-AGENTS_MAX) }
}

export function settleAgents(tracks: Tracks, isMatch: (agent: AgentRun) => boolean, patch: Partial<AgentRun>): Tracks {
  const next: Tracks = {}
  for (const [key, track] of Object.entries(tracks)) {
    next[key] = { ...track, agents: track.agents.map(agent => (isMatch(agent) ? { ...agent, ...patch } : agent)) }
  }

  return next
}

export type Window = { start: number; end: number }

// The rows of steps that fit, kept around the anchor; two rows go to the "more" lines when it overflows.
export function windowOf(total: number, anchor: number, room: number): Window {
  if (total <= room) return { start: 0, end: total }
  const inner = Math.max(1, room - 2)
  const lead = Math.min(anchor, Math.max(1, Math.floor(inner / 4)))
  const end = Math.min(total, anchor - lead + inner)
  const start = Math.max(0, end - inner)

  return { start, end }
}

const WORD_CUT_SHARE = 0.6

// Cuts at a word boundary when one lies near the end, so a title never ends mid-word without need.
export function clip(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, Math.max(1, max - 1))
  const space = cut.lastIndexOf(' ')

  return `${(space >= max * WORD_CUT_SHARE ? cut.slice(0, space) : cut).trimEnd()}…`
}
