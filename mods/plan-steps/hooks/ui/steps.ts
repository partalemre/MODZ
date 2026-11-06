// The quiet status glyphs on the plan's rail: done = a bare gray check, under way = the breathing clay dot in a thin
// ring (a still dot while the work waits), upcoming = a small hollow ring. No numbers and no fills: order is the list's.

export type DotState = 'done' | 'current' | 'next'

export type Dot = { cx: number; cy: number; state: DotState; isLive?: boolean }

const CHECK = { left: 4.5, low: 3.5, right: 5, rise: 3.5, dip: 1.5 }
const SMALL_R = 3.5
const LIVE_R = 3
const RING_R = 6.5
// The rail stops short of a glyph by this much, so a line never touches or shows through one.
const RAIL_GAP = 9

export function checkMark(cx: number, cy: number): string {
  const path = `M${cx - CHECK.left} ${cy + 0.25}L${cx - CHECK.dip} ${cy + CHECK.low}L${cx + CHECK.right} ${cy - CHECK.rise}`

  return `<path d="${path}" fill="none" stroke="var(--lo)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`
}

export function hollowRing(cx: number, cy: number): string {
  return `<circle cx="${cx}" cy="${cy}" r="${SMALL_R}" fill="none" stroke="var(--line2)" stroke-width="1.5"/>`
}

export function stepDot(dot: Dot): string {
  const { cx, cy, state } = dot
  if (state === 'done') return checkMark(cx, cy)
  if (state === 'next') return hollowRing(cx, cy)
  if (dot.isLive === false) return `<circle cx="${cx}" cy="${cy}" r="${SMALL_R}" fill="var(--lo)"/>`

  return `<circle cx="${cx}" cy="${cy}" r="${RING_R}" fill="none" stroke="var(--edit-l)"/><circle cx="${cx}" cy="${cy}" r="${LIVE_R}" class="f-edit breathe"/>`
}

// The hairline joining two glyphs: firmer along the stretch already walked.
export function stepRail(cx: number, span: { from: number; to: number; isWalked: boolean }): string {
  const top = span.from + RAIL_GAP
  const bottom = span.to - RAIL_GAP
  if (bottom <= top) return ''

  return `<line x1="${cx}" y1="${top}" x2="${cx}" y2="${bottom}" stroke="var(${span.isWalked ? '--line2' : '--line'})"/>`
}
