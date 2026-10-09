import type { JobView } from './job'

// The job's meter, shared by the band and the panel's header: one segment per unit (a task or an
// agent), the settled ones first (failures last among them), then the running, then the waiting.

const GAP = 3
const MIN_SEG = 6

export type Track = { x: number; y: number; w: number; h: number }
export type Units = Pick<JobView, 'units' | 'done' | 'failed' | 'active'>

const classOf = (view: Units, i: number): string => {
  const ok = view.done - view.failed
  if (i < ok) return 'f-ok'
  if (i < view.done) return 'f-danger'
  return i < view.done + view.active ? 'f-run' : 'k'
}

const rect = (track: Track, x: number, w: number, cls: string): string =>
  `<rect class="${cls}" x="${x.toFixed(1)}" y="${track.y}" width="${Math.max(0, w).toFixed(1)}" height="${track.h}" rx="${track.h / 2}"/>`

// Many units on a short meter run together: one track, filled in proportion, no gaps.
const solid = (view: Units, track: Track): string => {
  const unit = track.w / Math.max(1, view.units)
  const ok = view.done - view.failed
  const parts = [rect(track, track.x, track.w, 'k')]
  const spans: [number, number, string][] = [[0, ok, 'f-ok'], [ok, view.done, 'f-danger'], [view.done, view.done + view.active, 'f-run']]
  for (const [from, to, cls] of spans) if (to > from) parts.push(rect(track, track.x + from * unit, (to - from) * unit, cls))
  return parts.join('')
}

export const meterSvg = (view: Units, track: Track): string => {
  const units = view.units
  if (units < 1) return rect(track, track.x, track.w, 'k')
  const seg = (track.w - GAP * (units - 1)) / units
  if (seg < MIN_SEG) return solid(view, track)
  return Array.from({ length: units }, (_, i) => rect(track, track.x + i * (seg + GAP), seg, classOf(view, i))).join('')
}
