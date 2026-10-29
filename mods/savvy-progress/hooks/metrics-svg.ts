import type { AgentRun } from '../types'
import type { Progress } from './estimate'
import { textWidth, xml } from './format'
import { FONT, MONO, paneSvg } from './theme'
import type { Kind } from './history'

// The row's small drawings: the progress bar, the metric chips and the work-mix strip.

export const BAR_H = 18
export const CHIPS_H = 22
export const MIX_H = 8
const TRACK_H = 8
// Room the percent takes after the bar: the gap, then "~%100" in 12.5px mono.
const PCT_GAP = 8
const PCT_W = 46
const PCT_SIZE = 12.5
const STRIPE = 8
const CHIP_GAP = 6
const CHIP_PAD = 9
const CHIP_TEXT = 11.5
const RING_R = 5.5
const RING_W = 2.2
const RING_SLOT = 17
const MIX_GAP = 2


// An estimate wears soft still stripes, so it never reads as a measured fill.
const stripesOf = (filled: number, y: number, uid: string): string =>
  `<defs><pattern id="st${uid}" width="${STRIPE}" height="${STRIPE}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${STRIPE / 2}" height="${STRIPE}" fill="#fff" opacity=".28"/></pattern></defs><rect x="0" y="${y}" width="${filled}" height="${TRACK_H}" fill="url(#st${uid})"/>`

const FILL: Record<string, string> = { running: 'f-edit', done: 'm', failed: 'f-danger' }
const LABEL: Record<string, string> = { running: 's', done: 'm', failed: 'f-danger' }

// A plain track and one fill in its state's colour (the accent while live, quiet once done, red after a failure);
// the crab carries the tier.
// The percent sits right after the bar's end, in a slot of one width, so every card's bar ends at
// the same x and its percent starts there.
export const progressBarSvg = (W: number, a: AgentRun, opts: { progress: Progress; label: string }): string => {
  const y = (BAR_H - TRACK_H) / 2
  const barW = Math.max(TRACK_H, W - PCT_W - PCT_GAP)
  const filled = Math.max(TRACK_H, Math.round(barW * opts.progress.value))
  // Ids are per agent: drawings that share a page must not share defs.
  const uid = a.id.replace(/\W/g, '')
  const track = `<rect class="k" x="0" y="${y}" width="${barW}" height="${TRACK_H}" rx="${TRACK_H / 2}"/>`
  const clip = `<clipPath id="cl${uid}"><rect x="0" y="${y}" width="${filled}" height="${TRACK_H}" rx="${TRACK_H / 2}"/></clipPath>`
  const bar = `<rect class="${FILL[a.status] ?? 'f-edit'}" x="0" y="${y}" width="${filled}" height="${TRACK_H}"/>`
  const isRunning = a.status === 'running'
  const stripes = isRunning && opts.progress.isEstimate ? stripesOf(filled, y, uid) : ''
  const label = `<text class="${LABEL[a.status] ?? 's'}" x="${barW + PCT_GAP}" y="${BAR_H / 2 + PCT_SIZE * 0.34}" font-family="${MONO}" font-size="${PCT_SIZE}" font-weight="650">${xml(opts.label)}</text>`
  return paneSvg(W, BAR_H, `${track}<defs>${clip}</defs><g clip-path="url(#cl${uid})">${bar}${stripes}</g>${label}`)
}

export type Chip = { text: string; ring?: { ratio: number } }

const ringOf = (x: number, ring: NonNullable<Chip['ring']>): string => {
  const c = 2 * Math.PI * RING_R
  const dash = Math.max(0.6, Math.min(1, ring.ratio) * c)
  const cx = x + CHIP_PAD + RING_R - 1
  const cy = CHIPS_H / 2
  return `<circle cx="${cx}" cy="${cy}" r="${RING_R}" fill="none" class="rk" stroke-width="${RING_W}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${RING_R}" fill="none" class="i-s" stroke-width="${RING_W}" stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`
}

const chipWidth = (chip: Chip): number => Math.ceil(textWidth(chip.text, CHIP_TEXT)) + CHIP_PAD * 2 + (chip.ring ? RING_SLOT : 0)

// Rounded chips left to right; one that does not fit starts the next line, so none is lost.
export const chipsSvg = (W: number, chips: Chip[]): { source: string; height: number } => {
  let x = 0
  let y = 0
  const parts: string[] = []
  for (const chip of chips) {
    const w = Math.min(W, chipWidth(chip))
    if (x > 0 && x + w > W) {
      x = 0
      y += CHIPS_H + CHIP_GAP
    }
    const tx = x + CHIP_PAD + (chip.ring ? RING_SLOT : 0)
    parts.push(`<rect class="chip" x="${x}" y="${y}" width="${w}" height="${CHIPS_H}" rx="${CHIPS_H / 2}"/>`)
    if (chip.ring) parts.push(`<g transform="translate(0,${y})">${ringOf(x, chip.ring)}</g>`)
    parts.push(`<text class="s" x="${tx}" y="${y + CHIPS_H / 2 + 4}" font-family="${FONT}" font-size="${CHIP_TEXT}" font-weight="500" font-variant-numeric="tabular-nums">${xml(chip.text)}</text>`)
    x += w + CHIP_GAP
  }
  const height = y + CHIPS_H
  return { source: paneSvg(W, height, parts.join('')), height }
}

export type MixPart = { kind: Kind; count: number }

// The work so far as one strip: reading, editing, commands, agents, each its own span in one quiet ink, in the
// legend's order beneath (no colour per kind: colour is kept for state).
export const mixSvg = (W: number, parts: MixPart[]): string => {
  const total = parts.reduce((sum, p) => sum + p.count, 0)
  if (!total) return paneSvg(W, MIX_H, `<rect class="k" width="${W}" height="${MIX_H}" rx="${MIX_H / 2}"/>`)
  const room = W - MIX_GAP * (parts.length - 1)
  let x = 0
  const segs = parts.map(p => {
    const w = Math.max(MIX_H, (room * p.count) / total)
    const seg = `<rect class="m" x="${x.toFixed(1)}" width="${w.toFixed(1)}" height="${MIX_H}" rx="${MIX_H / 2}"/>`
    x += w + MIX_GAP
    return seg
  })
  return paneSvg(W, MIX_H, segs.join(''))
}
