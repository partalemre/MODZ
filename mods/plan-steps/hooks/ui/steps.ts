// The numbered step circle (DESIGN.md §4): current = a filled circle with its number (clay while the work is live,
// quiet ink while it waits), done = a gray ✓ (Moss where finishing is the point), upcoming = a ring with its number.

export type DotState = 'done' | 'current' | 'next'
export type DotTone = 'gray' | 'moss'

export const DOT_RADIUS = 11
const CHECK = { left: 4.4, low: 3.3, right: 4.6, rise: 3.4, dip: 1.2 }
const NUMBER_DROP = 4

export type Dot = { cx: number; cy: number; n: number; state: DotState; tone?: DotTone; isLive?: boolean }

function check(cx: number, cy: number, stroke: string): string {
  const path = `M${cx - CHECK.left} ${cy + 0.2}L${cx - CHECK.dip} ${cy + CHECK.low}L${cx + CHECK.right} ${cy - CHECK.rise}`

  return `<path d="${path}" fill="none" stroke="${stroke}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`
}

function number(dot: Dot, cls: string): string {
  return `<text x="${dot.cx}" y="${dot.cy + NUMBER_DROP}" text-anchor="middle" class="${cls}">${dot.n}</text>`
}

export function stepDot(dot: Dot): string {
  const { cx, cy, state } = dot
  const r = DOT_RADIUS
  if (state === 'current') {
    return dot.isLive === false
      ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--line2)"/>${number(dot, 'dot-n hi')}`
      : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--edit)"/>${number(dot, 'dot-n on-edit')}`
  }
  if (state === 'done' && dot.tone === 'moss') {
    return `<circle cx="${cx}" cy="${cy}" r="${r - 0.5}" fill="var(--ok-t)" stroke="var(--ok-l)"/>${check(cx, cy, 'var(--ok)')}`
  }
  if (state === 'done') return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--track)"/>${check(cx, cy, 'var(--mid)')}`

  return `<circle cx="${cx}" cy="${cy}" r="${r - 0.75}" fill="none" stroke="var(--line2)" stroke-width="1.5"/>${number(dot, 'dot-n lo')}`
}

// The hairline joining two circles: drawn in the gap only, so it never shows through a ring.
export function stepRail(cx: number, fromCy: number, toCy: number): string {
  const top = fromCy + DOT_RADIUS + 1.5
  const bottom = toCy - DOT_RADIUS - 1.5
  if (bottom <= top) return ''

  return `<line x1="${cx}" y1="${top}" x2="${cx}" y2="${bottom}" stroke="var(--line2)" stroke-width="1.5" stroke-linecap="round"/>`
}

// The styles the circles use; added once to a drawing's style block.
export const DOT_CSS = '.dot-n{font-size:11px;font-weight:700}.on-edit{fill:var(--on-edit)}'
