import type { AgentRun } from '../types'
import type { Progress } from './estimate'
import { textWidth, xml } from './format'
import { DONE, FAIL, FONT, paneSvg } from './theme'
import type { Kind } from './history'

// The row's small drawings: the progress bar, the metric chips and the work-mix strip. Each keeps
// one source while its numbers hold, so its motion runs on through the panel's redraw.

export const BAR_H = 10
export const CHIPS_H = 22
export const MIX_H = 8
const TRACK_H = 6
const MUTED = 0.55
const SHEEN_S = 2.4
const STRIPE_S = 1.1
const STRIPE = 8
const CHIP_GAP = 6
const CHIP_PAD = 9
const CHIP_TEXT = 11.5
const RING_R = 5.5
const RING_W = 2.2
const RING_SLOT = 17
const MIX_GAP = 2

export const KIND_COLOR: Record<Kind, string> = { read: '#6aa6e6', edit: '#e58466', run: '#a48ff0', agent: '#5fbf8f', other: '#9a968c' }

const sweepCss = (name: string, from: number, to: number, seconds: number): string =>
  `<style>.${name}{animation:${name} ${seconds}s linear infinite}@keyframes ${name}{from{transform:translateX(${from}px)}to{transform:translateX(${to}px)}}@media (prefers-reduced-motion: reduce){.${name}{animation:none}}</style>`

type Motion = { filled: number; y: number; uid: string }

const sheenOf = ({ filled, y, uid }: Motion): string => {
  const w = Math.max(16, Math.round(filled * 0.35))
  return `<defs><linearGradient id="sh${uid}" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>${sweepCss(`sn${uid}`, -w, filled, SHEEN_S)}<rect class="sn${uid}" x="0" y="${y}" width="${w}" height="${TRACK_H}" fill="url(#sh${uid})"/>`
}

// An estimate wears soft moving stripes, so it never reads as a measured fill.
const stripesOf = ({ filled, y, uid }: Motion): string =>
  `<defs><pattern id="st${uid}" width="${STRIPE}" height="${STRIPE}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${STRIPE / 2}" height="${STRIPE}" fill="#fff" opacity=".28"/></pattern></defs>${sweepCss(`sp${uid}`, -STRIPE * 2, 0, STRIPE_S)}<rect class="sp${uid}" x="0" y="${y}" width="${filled + STRIPE * 2}" height="${TRACK_H}" fill="url(#st${uid})"/>`

const fillOf = (a: AgentRun, color: string): string => {
  if (a.status === 'failed') return FAIL
  return a.status === 'done' ? DONE : color
}

export const progressBarSvg = (W: number, a: AgentRun, opts: { progress: Progress; color: string }): string => {
  const y = (BAR_H - TRACK_H) / 2
  const filled = Math.max(TRACK_H, Math.round(W * opts.progress.value))
  const isLive = a.status === 'running'
  // Ids and animation names are per agent: drawings that share a page must not share defs.
  const uid = a.id.replace(/\W/g, '')
  const fill = fillOf(a, opts.color)
  const track = `<rect class="k" x="0" y="${y}" width="${W}" height="${TRACK_H}" rx="${TRACK_H / 2}"/>`
  const clip = `<clipPath id="cl${uid}"><rect x="0" y="${y}" width="${filled}" height="${TRACK_H}" rx="${TRACK_H / 2}"/></clipPath>`
  const bar = `<rect x="0" y="${y}" width="${filled}" height="${TRACK_H}" fill="${fill}" opacity="${isLive ? 1 : MUTED}"/>`
  const motion = { filled, y, uid }
  const live = opts.progress.isEstimate ? stripesOf(motion) : sheenOf(motion)
  return paneSvg(W, BAR_H, `${track}<defs>${clip}</defs><g clip-path="url(#cl${uid})">${bar}${isLive ? live : ''}</g>`)
}

export type Chip = { text: string; ring?: { ratio: number; color: string } }

const ringOf = (x: number, ring: NonNullable<Chip['ring']>): string => {
  const c = 2 * Math.PI * RING_R
  const dash = Math.max(0.6, Math.min(1, ring.ratio) * c)
  const cx = x + CHIP_PAD + RING_R - 1
  const cy = CHIPS_H / 2
  return `<circle cx="${cx}" cy="${cy}" r="${RING_R}" fill="none" class="rk" stroke-width="${RING_W}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${RING_R}" fill="none" stroke="${ring.color}" stroke-width="${RING_W}" stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`
}

const chipWidth = (chip: Chip): number => Math.ceil(textWidth(chip.text, CHIP_TEXT)) + CHIP_PAD * 2 + (chip.ring ? RING_SLOT : 0)

// Rounded chips left to right; the ones that do not fit drop from the end.
export const chipsSvg = (W: number, chips: Chip[]): string => {
  let x = 0
  const parts: string[] = []
  for (const chip of chips) {
    const w = chipWidth(chip)
    if (x + w > W) break
    const tx = x + CHIP_PAD + (chip.ring ? RING_SLOT : 0)
    parts.push(`<rect class="chip" x="${x}" y="0" width="${w}" height="${CHIPS_H}" rx="${CHIPS_H / 2}"/>`)
    if (chip.ring) parts.push(ringOf(x, chip.ring))
    parts.push(`<text class="s" x="${tx}" y="${CHIPS_H / 2 + 4}" font-family="${FONT}" font-size="${CHIP_TEXT}" font-weight="500" font-variant-numeric="tabular-nums">${xml(chip.text)}</text>`)
    x += w + CHIP_GAP
  }
  return paneSvg(W, CHIPS_H, parts.join(''))
}

export type MixPart = { kind: Kind; count: number }

// The work so far as one strip: reading, editing, commands, agents, each in its own color.
export const mixSvg = (W: number, parts: MixPart[]): string => {
  const total = parts.reduce((sum, p) => sum + p.count, 0)
  if (!total) return paneSvg(W, MIX_H, `<rect class="k" width="${W}" height="${MIX_H}" rx="${MIX_H / 2}"/>`)
  const room = W - MIX_GAP * (parts.length - 1)
  let x = 0
  const segs = parts.map(p => {
    const w = Math.max(MIX_H, (room * p.count) / total)
    const seg = `<rect x="${x.toFixed(1)}" width="${w.toFixed(1)}" height="${MIX_H}" rx="${MIX_H / 2}" fill="${KIND_COLOR[p.kind]}"/>`
    x += w + MIX_GAP
    return seg
  })
  return paneSvg(W, MIX_H, segs.join(''))
}
