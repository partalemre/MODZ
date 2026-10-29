import { measure } from './ui/svg'
import { svgDoc } from './ui/theme'
import type { Theme } from './ui/theme'
import { words } from './words'

// The empty pane: one sentence saying where a plan comes from (no label above it: the pane's title says "Plan"),
// and the faint outline of the rail a plan will fill, so the pane reads as waiting rather than broken.

const SIZE = 13
const LINE = 18
const FIRST_BASE = 14
const GHOST_GAP = 16
const GHOST_ROW = 30
const GHOST_SHARES = [0.62, 0.46, 0.54]
const DOT_X = 11
const DOT_R = 7.5
const BAR_X = 30
const BAR_H = 8
// Semibold runs wider than the regular advance `measure` assumes.
const BOLD_WIDEN = 1.06

type Word = { text: string; isLead: boolean }

// The sentence's words laid into lines; the lead keeps its weight wherever the break falls.
function layout(width: number): Word[][] {
  const say = words()
  const all: Word[] = [
    ...`${say.emptyLead} ·`.split(' ').map(text => ({ text, isLead: text !== '·' })),
    ...say.emptyHow.split(' ').map(text => ({ text, isLead: false })),
  ]
  const widthOf = (word: Word) => measure(word.text, SIZE) * (word.isLead ? BOLD_WIDEN : 1)
  const lines: Word[][] = [[]]
  let used = 0
  for (const word of all) {
    const line = lines[lines.length - 1] as Word[]
    const room = used + (line.length === 0 ? 0 : measure(' ', SIZE)) + widthOf(word)
    if (line.length > 0 && room > width) {
      lines.push([word])
      used = widthOf(word)
    } else {
      line.push(word)
      used = room
    }
  }

  return lines
}

function sentence(width: number): { svg: string; bottom: number } {
  const lines = layout(width).map((line, n) => {
    const spans = line.map((word, k) => `<tspan class="${word.isLead ? 'hi' : 'mid'}"${word.isLead ? ' font-weight="600"' : ''}>${k === 0 ? '' : ' '}${word.text}</tspan>`)

    return `<text x="0" y="${FIRST_BASE + n * LINE}" font-size="${SIZE}" xml:space="preserve">${spans.join('')}</text>`
  })

  return { svg: lines.join(''), bottom: FIRST_BASE + (lines.length - 1) * LINE }
}

function ghost(width: number, top: number): string {
  return GHOST_SHARES.map((share, n) => {
    const cy = top + n * GHOST_ROW + DOT_R
    const rail = n === 0 ? '' : `<line x1="${DOT_X}" y1="${cy - GHOST_ROW + DOT_R + 2}" x2="${DOT_X}" y2="${cy - DOT_R - 2}" stroke="var(--line)" stroke-width="1.5" stroke-linecap="round"/>`
    const dot = `<circle cx="${DOT_X}" cy="${cy}" r="${DOT_R}" fill="none" stroke="var(--line2)" stroke-width="1.5" stroke-dasharray="2 2.5"/>`
    const bar = `<rect x="${BAR_X}" y="${cy - BAR_H / 2}" width="${Math.round((width - BAR_X) * share)}" height="${BAR_H}" rx="4" fill="var(--track)" opacity=".7"/>`

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
