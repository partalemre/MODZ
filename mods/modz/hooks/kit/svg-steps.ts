// MODZ kit — steps: dots joined by a hairline (progress through a plan), and the numbered
// circle of a step list (replay, plan), with rail halves so stacked rows read as one line.
import { baseline, iconEl, num, rectEl, sans, TYPE, textEl, toPic } from './svg-core'
import type { Part, SvgPic } from './svg-core'
import type { Role } from './tokens'

export type StepState = 'done' | 'active' | 'pending' | 'failed' | 'skipped'

export type StepDotsOpts = { steps: readonly StepState[]; caption?: string; role?: Role }

const DOT = 8
const PITCH = 24
const DOTS_H = 12
const RING_STROKE = 1.5
const CORE_R = 1.75
const LINK_GAP = 3
const LINK_DONE_OPACITY = 0.55
const DASH = '1.6 1.6'
const CAPTION_GAP = 12
const MARK = 3

const ringR = DOT / 2 - RING_STROKE / 2

function dot(state: StepState, cx: number, role: Role): string {
  const cy = DOTS_H / 2
  const ring = (paint: string, extra = ''): string =>
    `<circle cx="${cx}" cy="${cy}" r="${ringR}" class="s-${paint}" stroke-width="${RING_STROKE}" fill="none"${extra}/>`

  if (state === 'done') return `<circle cx="${cx}" cy="${cy}" r="${DOT / 2}" class="f-ok"/>`
  if (state === 'active') return ring(role) + `<circle cx="${cx}" cy="${cy}" r="${CORE_R}" class="f-${role} breathe"/>`
  if (state === 'pending') return ring('line-strong')
  if (state === 'skipped') return ring('line-strong', ` stroke-dasharray="${DASH}"`)

  return `<path d="M${cx - MARK} ${cy - MARK}l${MARK * 2} ${MARK * 2}M${cx + MARK} ${cy - MARK}l${-MARK * 2} ${MARK * 2}" class="s-danger" stroke-width="${RING_STROKE + 0.25}" stroke-linecap="round"/>`
}

function link(from: number, isDone: boolean): string {
  const x = from + DOT / 2 + LINK_GAP
  const width = PITCH - DOT - LINK_GAP * 2

  return rectEl({ x, y: DOTS_H / 2, width, height: 1, paint: isDone ? 'ok' : 'line-strong' }, isDone ? ` fill-opacity="${LINK_DONE_OPACITY}"` : '')
}

export function stepDotsPart(o: StepDotsOpts): Part {
  const role = o.role ?? 'run'
  const centers = o.steps.map((_, i) => DOT / 2 + i * PITCH)
  const links = centers.slice(1).map((_, i) => link(centers[i] ?? 0, o.steps[i] === 'done' && o.steps[i + 1] === 'done'))
  const dots = o.steps.map((state, i) => dot(state, centers[i] ?? 0, role))
  const end = (centers[centers.length - 1] ?? 0) + DOT / 2
  const caption = o.caption ?? ''
  const captionX = end + CAPTION_GAP
  const width = Math.ceil(caption ? captionX + sans(TYPE.label.size, TYPE.label.weight)(caption) : end)
  const text = caption ? textEl({ x: captionX, y: baseline(0, DOTS_H, TYPE.label.size), text: caption, paint: 'mid', ...TYPE.label }) : ''
  const done = o.steps.filter(state => state === 'done').length

  return { body: links.join('') + dots.join('') + text, width, height: DOTS_H, alt: `${done}/${o.steps.length}${caption ? ` · ${caption}` : ''}` }
}

export const stepDots = (o: StepDotsOpts): SvgPic => toPic(stepDotsPart(o))

// ---------------------------------------------------------------------------

export type StepCircleOpts = {
  n: number
  state: 'current' | 'done' | 'future'
  role?: Role
  rowHeight?: number
  hasRailAbove?: boolean
  hasRailBelow?: boolean
}

const CIRCLE = 22
const RAIL_GAP = 2
const CHECK = 12
const NUMBER = { size: 11, weight: 700 }

function rails(o: StepCircleOpts, height: number): string {
  const x = CIRCLE / 2 - 0.5
  const top = height / 2 - CIRCLE / 2 - RAIL_GAP
  const bottom = height / 2 + CIRCLE / 2 + RAIL_GAP

  return [
    o.hasRailAbove && top > 0 ? rectEl({ x, y: 0, width: 1, height: top, paint: 'line-strong' }) : '',
    o.hasRailBelow && bottom < height ? rectEl({ x, y: bottom, width: 1, height: height - bottom, paint: 'line-strong' }) : '',
  ].join('')
}

export function stepCirclePart(o: StepCircleOpts): Part {
  const height = Math.max(CIRCLE, o.rowHeight ?? CIRCLE)
  const c = CIRCLE / 2
  const cy = height / 2
  const role = o.role ?? 'run'
  const label = String(o.n)
  const y = baseline(cy - c, CIRCLE, NUMBER.size)
  const face = {
    current: `<circle cx="${c}" cy="${num(cy)}" r="${c}" class="f-${role}"/>${textEl({ x: c, y, text: label, paint: 'card', ...NUMBER, anchor: 'middle' })}`,
    done: `<circle cx="${c}" cy="${num(cy)}" r="${c}" class="f-track"/>${iconEl({ name: 'check', x: c - CHECK / 2, y: cy - CHECK / 2, size: CHECK, paint: 'mid' })}`,
    future: `<circle cx="${c}" cy="${num(cy)}" r="${c - RING_STROKE / 2}" class="s-line-strong" stroke-width="${RING_STROKE}" fill="none"/>${textEl({ x: c, y, text: label, paint: 'lo', ...NUMBER, weight: 600, anchor: 'middle' })}`,
  }[o.state]

  return { body: rails(o, height) + face, width: CIRCLE, height, alt: `${label}. adım, ${{ current: 'şimdiki', done: 'bitti', future: 'sırada' }[o.state]}` }
}

export const stepCircle = (o: StepCircleOpts): SvgPic => toPic(stepCirclePart(o))
