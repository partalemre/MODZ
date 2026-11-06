import { upper } from './kit/lang'
import { escape, wrap } from './ui/svg'
import { svgDoc } from './ui/theme'
import type { Theme } from './ui/theme'
import { words } from './words'

// The empty pane: one line saying there is none, one sentence saying where a plan comes from (no label above it: the
// pane's title says "Plan"), and the faint outline of the rail a plan will fill, so it reads as waiting, not broken.

const LEAD_BASE = 16
const HOW_BASE = 36
const HOW_SIZE = 12
const LINE = 17
const HOW_LINES_MAX = 4
const GHOST_GAP = 18
const GHOST_ROW = 30
const GHOST_SHARES = [0.62, 0.46, 0.54]
const DOT_X = 7
const DOT_R = 3.5
const RAIL_GAP = 10
const BAR_X = 24
const BAR_H = 6

function sentence(width: number): { svg: string; bottom: number } {
  const say = words()
  // Beside the lead elsewhere it runs on in lower case; alone on its line it starts a sentence.
  const how = wrap(`${upper(say.emptyHow.slice(0, 1))}${say.emptyHow.slice(1)}`, { width, size: HOW_SIZE, maxLines: HOW_LINES_MAX })
  const lines = how.map((line, n) => `<text x="0" y="${HOW_BASE + n * LINE}" class="label lo">${escape(line)}</text>`)

  return { svg: `<text x="0" y="${LEAD_BASE}" class="headline hi">${escape(say.emptyLead)}</text>${lines.join('')}`, bottom: HOW_BASE + (how.length - 1) * LINE }
}

function ghost(width: number, top: number): string {
  return GHOST_SHARES.map((share, n) => {
    const cy = top + n * GHOST_ROW + DOT_R
    const rail = n === 0 ? '' : `<line x1="${DOT_X}" y1="${cy - GHOST_ROW + RAIL_GAP}" x2="${DOT_X}" y2="${cy - RAIL_GAP}" stroke="var(--line)"/>`
    const dot = `<circle cx="${DOT_X}" cy="${cy}" r="${DOT_R}" fill="none" stroke="var(--line2)" stroke-width="1.5"/>`
    const bar = `<rect x="${BAR_X}" y="${cy - BAR_H / 2}" width="${Math.round((width - BAR_X) * share)}" height="${BAR_H}" rx="3" fill="var(--track)" opacity=".7"/>`

    return rail + dot + bar
  }).join('')
}

export function emptySvg(theme: Theme, width: number): { source: string; height: number; alt: string } {
  const text = sentence(width)
  const top = text.bottom + GHOST_GAP
  const height = top + (GHOST_SHARES.length - 1) * GHOST_ROW + 2 * DOT_R + 2
  const body = `${text.svg}${ghost(width, top)}`

  return { source: svgDoc({ width, height, theme }, body), height, alt: `Plan: ${words().emptyLead} · ${words().emptyHow}` }
}
