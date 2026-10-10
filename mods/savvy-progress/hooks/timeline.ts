import type { AgentRun, AgentStatus } from '../types'
import { kindOf } from './history'
import type { Kind } from './history'
import { lookOf } from './identity'
import { stuckOf } from './insight'

// The timeline's facts, shared by both surfaces: one lane per agent over the crew's shared clock,
// each tool call a segment coloured by its kind. The desktop draws them (timeline-svg.ts); the
// terminal reads them as runs of cells.

const LANES_MAX = 8
// A crew a few seconds old still gets a readable scale.
const MIN_SPAN_MS = 30_000

export type Segment = { from: number; to: number; kind: Kind }

export type Lane = {
  id: string
  name: string
  shell: string
  title: string
  status: AgentStatus
  isStuck: boolean
  start: number
  end: number
  segments: Segment[]
}

/** `t1` is now while any runs, else the last end; `span` is at least the minimum, so `t1` may stop short of it. */
export type Timeline = { lanes: Lane[]; t0: number; t1: number; span: number; isLive: boolean }

const laneOf = (a: AgentRun, at: number): Lane => {
  const isLive = a.status === 'running'
  const end = isLive ? at : (a.endedAt ?? a.startedAt)
  const look = lookOf(a)
  return {
    id: a.id,
    name: look.name,
    shell: look.shell,
    title: a.description || a.type,
    status: a.status,
    isStuck: stuckOf(a, at) !== null,
    start: a.startedAt,
    end: Math.max(end, a.startedAt),
    segments: (a.history ?? []).map(e => ({ from: e.at, to: e.endAt ?? (isLive ? at : e.at), kind: kindOf(e.tool) })),
  }
}

/** The latest agents' lanes, oldest first, on one clock from the first start to now (or the last end). */
export function timelineOf(list: AgentRun[], at: number): Timeline | null {
  const lanes = [...list].sort((a, b) => a.startedAt - b.startedAt).slice(-LANES_MAX).map(a => laneOf(a, at))
  if (lanes.length === 0) return null
  const t0 = Math.min(...lanes.map(lane => lane.start))
  const t1 = Math.max(...lanes.map(lane => lane.end))
  return { lanes, t0, t1, span: Math.max(MIN_SPAN_MS, t1 - t0), isLive: lanes.some(lane => lane.status === 'running') }
}

export type Cell = { kind: Kind | 'idle' | 'none' }

// The kind that covers most of the cell's slice of time; a live stretch with no call reads idle.
const cellOf = (lane: Lane, from: number, to: number): Cell => {
  if (to <= lane.start || from > lane.end) return { kind: 'none' }
  let best: Kind | null = null
  let most = 0
  for (const seg of lane.segments) {
    const overlap = Math.min(to, Math.max(seg.to, seg.from + 1)) - Math.max(from, seg.from)
    if (overlap > most) [best, most] = [seg.kind, overlap]
  }
  return { kind: best ?? 'idle' }
}

/** A lane as `width` cells across the timeline's span. */
export const laneCells = (lane: Lane, tl: Timeline, width: number): Cell[] => {
  const slice = tl.span / Math.max(1, width)
  return Array.from({ length: width }, (_, i) => cellOf(lane, tl.t0 + i * slice, tl.t0 + (i + 1) * slice))
}

export type Run = { kind: Cell['kind']; length: number }

/** Neighbouring cells of one kind joined, so the terminal draws one Text per run. */
export const runsOf = (cells: Cell[]): Run[] => {
  const runs: Run[] = []
  for (const cell of cells) {
    const last = runs.at(-1)
    if (last && last.kind === cell.kind) last.length += 1
    else runs.push({ kind: cell.kind, length: 1 })
  }
  return runs
}
