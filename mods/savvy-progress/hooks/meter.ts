import type { JobView } from './job'

// The job's meter, shared by the band and the panel's header: one segment per unit (a task or an
// agent), the settled ones first (failures last among them), then the running, then the waiting. Done is
// quiet ink, running the accent, a failure red: colour only for state (DESIGN.md §0).

const GAP = 3
const MIN_SEG = 6

export type Track = { x: number; y: number; w: number; h: number }
export type Units = Pick<JobView, 'units' | 'done' | 'failed' | 'active'>

const classOf = (view: Units, i: number): string => {
  const ok = view.done - view.failed
  if (i < ok) return 'm'
  if (i < view.done) return 'f-danger'
  return i < view.done + view.active ? 'f-edit' : 'k'
}

type Span = { x: number; w: number; cls: string }

const rect = (track: Track, { x, w, cls }: Span): string =>
  `<rect class="${cls}" x="${x.toFixed(1)}" y="${track.y}" width="${Math.max(0, w).toFixed(1)}" height="${track.h}" rx="${track.h / 2}"/>`

// Many units on a short meter run together: one track, filled in proportion, no gaps.
const solid = (view: Units, track: Track): string => {
  const unit = track.w / Math.max(1, view.units)
  const ok = view.done - view.failed
  const parts = [rect(track, { x: track.x, w: track.w, cls: 'k' })]
  const spans: [number, number, string][] = [[0, ok, 'm'], [ok, view.done, 'f-danger'], [view.done, view.done + view.active, 'f-edit']]
  for (const [from, to, cls] of spans) if (to > from) parts.push(rect(track, { x: track.x + from * unit, w: (to - from) * unit, cls }))
  return parts.join('')
}

export const meterSvg = (view: Units, track: Track): string => {
  const units = view.units
  if (units < 1) return rect(track, { x: track.x, w: track.w, cls: 'k' })
  const seg = (track.w - GAP * (units - 1)) / units
  if (seg < MIN_SEG) return solid(view, track)
  return Array.from({ length: units }, (_, i) => rect(track, { x: track.x + i * (seg + GAP), w: seg, cls: classOf(view, i) })).join('')
}
