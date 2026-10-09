import { CRAB_CSS, crab } from './crabs'
import { fitText, textWidth, xml } from './format'
import type { JobView } from './job'
import { percentText } from './job'
import { ACCENT, DONE, FONT, WARN, bandCss } from './theme'

// The whole row is one SVG: the desktop wraps sibling elements onto new lines,
// so title, track, percent and the crab live in one drawing; only the crew
// count and the dismiss are Buttons beside it.
export const BAND_H = 22
const BAR_H = 16
const CRAB_W = 26
const CELL = 3
const TITLE_X = 16
const TITLE_SIZE = 13
const PILL_SIZE = 11
const PILL_PAD = 18
const PERCENT_SLOT = 46
const MIN_BAR = 60
const TITLE_SHARE = 0.4
const FAINT = 0.2
const CRAB_SCALE = 0.8

// Deterministic noise so the dither does not shimmer between redraws.
const noise = (x: number, y: number): number => {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return s - Math.floor(s)
}

const cell = (c: number, r: number, size: number, group: number): string =>
  `<rect class="t${group}" x="${c * CELL + 1}" y="${r * CELL + 1}" width="${size}" height="${size}"/>`

// Done: sparse at the start, dense toward the head.
const doneCells = (fillW: number): string[] => {
  const cols = Math.floor(fillW / CELL)
  const rows = Math.floor(BAR_H / CELL)
  const out: string[] = []
  for (let c = 0; c < cols; c++) {
    const density = 0.35 + 0.6 * Math.pow(c / Math.max(1, cols), 1.2)
    for (let r = 0; r < rows; r++) if (noise(c, r) < density) out.push(cell(c, r, 2, Math.floor(noise(r, c) * 4)))
  }
  return out
}

// Handed out, not yet done: a faint second layer.
const faintCells = (fillW: number, runW: number): string[] => {
  const rows = Math.floor(BAR_H / CELL)
  const out: string[] = []
  for (let c = Math.floor(fillW / CELL); c < Math.floor(runW / CELL); c++) {
    for (let r = 0; r < rows; r++) if (noise(c + 7, r + 3) < FAINT) out.push(cell(c, r, 1.7, Math.floor(noise(r + 5, c) * 4)))
  }
  return out
}

const ticks = (units: number, barW: number, fillW: number): string[] => {
  const out: string[] = []
  for (let i = 1; i < units; i++) {
    const x = Math.round((barW * i) / units)
    if (x > fillW + 4) out.push(`<rect x="${x}" y="${BAR_H / 2 - 4}" width="1.5" height="8" rx="0.75"/>`)
  }
  return out
}

const colorOfView = (view: JobView): string => {
  if (!view.isFinished) return ACCENT
  return view.failed ? WARN : DONE
}

type Track = { barW: number; fillW: number; color: string }

const trackSvg = (view: JobView, track: Track): string => {
  const { barW, fillW, color } = track
  const runW = Math.max(fillW, Math.round(barW * view.launched))
  const pillW = Math.round(PILL_PAD + textWidth(view.label, PILL_SIZE))
  const pillX = Math.max(0, Math.min(barW - pillW, fillW - pillW))
  return `<defs><clipPath id="c"><rect x="0" y="0" width="${barW}" height="${BAR_H}" rx="${BAR_H / 2}"/></clipPath></defs>
<rect class="k" width="${barW}" height="${BAR_H}" rx="${BAR_H / 2}"/>
<g clip-path="url(#c)">
<g fill="${color}">${doneCells(fillW).join('')}</g>
<g fill="${color}" opacity="0.45">${faintCells(fillW, runW).join('')}</g>
<g class="tk">${ticks(view.units, barW, fillW).join('')}</g>
</g>
<rect x="${pillX}" width="${pillW}" height="${BAR_H}" rx="${BAR_H / 2}" fill="${color}"/>
<text x="${pillX + pillW / 2}" y="${BAR_H / 2 + 4}" text-anchor="middle" font-family="${FONT}" font-size="${PILL_SIZE}" font-weight="600" fill="#ffffff">${xml(view.label)}</text>`
}

export const bandSvg = (view: JobView, W: number): string => {
  // The title takes what it needs, up to 40% of the row; the track takes the rest.
  const title = fitText(view.title, TITLE_SIZE, Math.max(MIN_BAR, W * TITLE_SHARE))
  const barX = Math.round(TITLE_X + textWidth(title, TITLE_SIZE) + 12)
  const barW = Math.max(MIN_BAR, W - barX - PERCENT_SLOT - CRAB_W)
  const color = colorOfView(view)
  const fillW = Math.round(barW * (view.ratio ?? 0))
  const crabSvg = crab(W - CRAB_W + 1, 0, { costume: 'other', isWalking: view.isWorking, scale: CRAB_SCALE })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${BAND_H}" viewBox="0 0 ${W} ${BAND_H}">
${bandCss(view.isFinished)}
<circle cx="5" cy="${BAND_H / 2}" r="4" fill="${color}"/>
<text class="t" x="${TITLE_X}" y="${BAND_H / 2 + 4.5}" font-family="${FONT}" font-size="${TITLE_SIZE}" font-weight="500">${xml(title)}</text>
<g transform="translate(${barX},${(BAND_H - BAR_H) / 2})">${trackSvg(view, { barW, fillW, color })}</g>
<text class="m" x="${W - CRAB_W - 6}" y="${BAND_H / 2 + 4.5}" text-anchor="end" font-family="${FONT}" font-size="12.5" font-variant-numeric="tabular-nums">${xml(percentText(view))}</text>
${CRAB_CSS}${crabSvg}
</svg>`
}
