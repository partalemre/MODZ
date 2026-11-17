import type { AgentRun, CrabMood } from '../types'
import { crab } from './crabs'
import { clip, textWidth, xml } from './format'
import { kindOf } from './history'
import type { Kind } from './history'
import { t } from './i18n'
import { lookOf } from './identity'
import { HOME_LOOK } from './mood-svg'
import { groundLine, groundY, landOf, SCENE_H } from './strip-land'
import { MATE_W, mateSvg, mateX, ownBubble, ownRoom } from './strip-mate'
import { SCENE_CSS, strollCss, walkInCss } from './strip-motion'
import type { Talk } from './strip-team'
import type { Sky } from './sun'
import { FONT, paneSvg } from './theme'
import { costumeOf } from './tiers'

// The strip's scene: a small world (strip-land.ts) with the plan as a path of stones in its ground, the session's
// crab standing at the step under way. Helper agents stand on their own rows of the conversation (row-crab.ts). Nothing dashes about: the crab works
// in place (a thought bubble says what kind of work), walks one stretch over the hills when the plan moves on,
// and strolls with long rests when idle. The scene is drawn in a frame (an interactive Svg), so its loops run on
// while its source stays the same: nothing that ticks (cost, time) is drawn here.

export { SCENE_H } from './strip-land'
const PAD = 14
// Room past each end of the path for half a crab and its thought bubble.
const EDGE = 36
// The plan's path runs this far under the ground's surface, so the crab stands over its stone, not on it.
const PATH_LIFT = 8
const GRID = { w: 30, feet: 26 }
const LEAD_SCALE = 1.3
const LEAD_W = GRID.w * LEAD_SCALE
const AMBLE_MAX = 240
// Past this many steps the stones would touch: the path alone tells how far the plan is.
const STONES_MAX = 24
const PIPS = { shown: 4, size: 3, step: 4.5, y: 6.5 }
const SCHEME = '<style>:root{color-scheme:light dark}</style>'

/** `crew`: the helper agents seen at work on the step. */
export type Step = { subject: string; status: string; crew?: readonly { name: string; shell: string }[] }

/** `from` is where the crab stood before the plan moved on: it walks in from there. `talk`: a teammate on the project. */
export type SceneSpec = { width: number; crew: readonly AgentRun[]; mood: CrabMood; steps: readonly Step[]; sky: Sky; from?: number; talk?: Talk }

type Layout = { x0: number; x1: number; at: number[]; stand: number; standIndex: number }

const isDone = (step: Step): boolean => step.status === 'completed'

// The step the crab stands at: the one under way, else the first not done, else the last.
const standIndexOf = (steps: readonly Step[]): number => {
  const current = steps.findIndex(step => step.status === 'in_progress')
  if (current >= 0) return current
  const next = steps.findIndex(step => !isDone(step))

  return next >= 0 ? next : steps.length - 1
}

export function layoutOf(spec: Pick<SceneSpec, 'width' | 'steps'>): Layout {
  const x0 = PAD + EDGE
  const x1 = Math.max(x0, spec.width - PAD - EDGE)
  const last = spec.steps.length - 1
  const at = spec.steps.map((_, i) => (last <= 0 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / last))
  const standIndex = standIndexOf(spec.steps)

  return { x0, x1, at, stand: Math.round(at[standIndex] ?? x0), standIndex }
}

const titled = (title: string, body: string): string => `<title>${xml(title)}</title>${body}`

const markOf = (step: Step, isCurrent: boolean): string => {
  if (isDone(step)) return '<circle class="f-ok" r="3.5"/>'
  if (isCurrent) return '<circle class="i-run now" r="5" fill="none" stroke-width="1.5"/><circle class="f-run" r="2.5"/>'

  return '<circle class="card i-m" r="3" stroke-width="1.2"/>'
}

const stone = (step: Step, i: number, lay: Layout): string => {
  const x = lay.at[i] ?? lay.x0
  const crew = (step.crew ?? []).slice(0, PIPS.shown)
  // One small square per helper that worked on the step, in its shell's colour, under the stone.
  const pips = crew.map((a, k) => `<rect x="${((k - (crew.length - 1) / 2) * PIPS.step - PIPS.size / 2).toFixed(1)}" y="${PIPS.y}" width="${PIPS.size}" height="${PIPS.size}" rx=".6" fill="${a.shell}"/>`).join('')
  const names = (step.crew ?? []).map(a => a.name).join(', ')
  const said = names === '' ? t().stripStep(i + 1, step.subject) : `${t().stripStep(i + 1, step.subject)} · ${names}`
  const body = `<circle r="9" fill="transparent"/>${markOf(step, i === lay.standIndex)}${pips}`

  return `<g transform="translate(${x.toFixed(1)},${(groundY(x) + PATH_LIFT).toFixed(1)})"><g class="st">${titled(said, body)}</g></g>`
}

// The flag at the path's end; it turns green once every step is done.
const goal = (x: number, isReached: boolean): string =>
  `<g transform="translate(${x.toFixed(1)},${groundY(x).toFixed(1)})" shape-rendering="crispEdges"><rect class="m" x="0" y="-17" width="1.5" height="17"/><g class="wave"><rect class="${isReached ? 'f-ok' : 'm'}" x="1.5" y="-17" width="8" height="5.5"/></g></g>`

function trackSvg(spec: SceneSpec, lay: Layout): string {
  if (spec.steps.length === 0) return ''
  const line = (cls: string, to: number, more = '') => `<path class="${cls}" d="${groundLine(lay.x0, to, PATH_LIFT)}" fill="none" stroke-width="2" stroke-linecap="round"${more}/>`
  const isReached = spec.steps.every(isDone)
  const stones = spec.steps.length > STONES_MAX ? '' : spec.steps.map((step, i) => stone(step, i, lay)).join('')

  return line('i-m', lay.x1, ' opacity=".4"') + (isReached || lay.stand > lay.x0 ? line('i-ok', isReached ? lay.x1 : lay.stand) : '') + stones + goal(lay.x1 + EDGE + 2, isReached)
}

// What the crab's thought bubble shows, by the kind of its work: each a small loop that starts and ends at rest.
export const THOUGHT: Record<Kind, string> = {
  other: [7, 12, 17].map((cx, i) => `<circle class="s d${i + 1}" cx="${cx}" cy="7.5" r="1.6"/>`).join(''),
  read: `<rect class="i-read" x="7" y="2.5" width="10" height="10" rx="1.5" fill="none" stroke-width="1.2"/>${[5, 7.5, 10].map((y, i) => `<rect class="f-read ty${i + 1}" x="9.5" y="${y}" width="5" height="1"/>`).join('')}`,
  edit: [5.5, 10.25, 15].map((x, i) => `<rect class="f-edit ty${i + 1}" x="${x}" y="5.5" width="3.5" height="4" rx=".8"/>`).join(''),
  run: '<polyline class="i-run" points="6.5,4.5 10,7.5 6.5,10.5" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><rect class="f-run car" x="12.5" y="9" width="5.5" height="1.6"/>',
  agent: [6, 11, 16].map((x, i) => `<rect class="f-plan d${i + 1}" x="${x}" y="6" width="3" height="3"/>`).join(''),
}
const HAPPY = '<path class="i-ok chk" d="M7.5 7.8l3 3 6-6.2" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
const WORRIED = '<rect class="f-warn live" x="11" y="3" width="2" height="6" rx="1"/><rect class="f-warn live" x="11" y="10.4" width="2" height="2" rx="1"/>'
const BUBBLE = { x: -19, y: -45, w: 24, h: 15 }

// A thought bubble up and to the left of the crab, where no costume holds a prop.
export const bubble = (inner: string): string =>
  `<g transform="translate(${BUBBLE.x},${BUBBLE.y})"><rect class="card ln" x=".5" y=".5" width="${BUBBLE.w - 1}" height="${BUBBLE.h - 1}" rx="7" stroke-width="1"/><circle class="card ln" cx="21" cy="17.5" r="1.8" stroke-width="1"/><circle class="card ln" cx="24.5" cy="21" r="1.1" stroke-width="1"/>${inner}</g>`

const SNOOZE = [
  { x: 34, y: -31, size: 9, cls: 'zz' },
  { x: 39, y: -37, size: 7, cls: 'zz zz2' },
].map(z => `<text class="m ${z.cls}" x="${z.x}" y="${z.y}" font-size="${z.size}" font-weight="700" font-family="sans-serif">z</text>`).join('')

const RESTING: Record<CrabMood, string> = { sleeping: SNOOZE, working: bubble(THOUGHT.other), happy: bubble(HAPPY), worried: bubble(WORRIED) }
// Legs step only where the work is hands-on; reading, thinking and leading agents breathe.
export const IS_BUSY: Record<Kind, boolean> = { read: false, run: true, edit: true, agent: false, other: false }

type Lead = { body: string; extra: string; title: string; breath: string; canAmble: boolean }

// The session's own crab: at work in its costume, or resting in its mood.
function leadOf(spec: SceneSpec, isWalkingIn: boolean): Lead {
  const main = spec.crew.find(a => a.isMain === true)
  if (main === undefined) {
    const isAwake = spec.mood === 'happy' || spec.mood === 'worried'
    const body = crab(0, -GRID.feet * LEAD_SCALE, { costume: 'other', look: HOME_LOOK, mood: spec.mood, isWalking: isWalkingIn, scale: LEAD_SCALE })

    return { body, extra: RESTING[spec.mood], title: `${t().mainName} · ${t().stripResting[spec.mood]}`, breath: spec.mood === 'sleeping' ? 'sl' : 'br', canAmble: isAwake && spec.steps.length === 0 }
  }
  const kind = kindOf(main.lastTool ?? '')
  const body = crab(0, -GRID.feet * LEAD_SCALE, { costume: costumeOf(main), look: lookOf(main), isWalking: IS_BUSY[kind] || isWalkingIn, scale: LEAD_SCALE })

  return { body, extra: bubble(THOUGHT[kind]), title: `${t().mainName} · ${main.lastPlain || t().stripDoing[kind]}`, breath: IS_BUSY[kind] ? '' : 'br', canAmble: false }
}

const TIP = { h: 18, size: 10.5, pad: 7, max: 40, gap: 6 }

// What a crab is doing right now, said beside it while the pointer is on it; it grows to the left near the
// scene's right edge, so it never runs out of the frame.
const tip = (text: string, at: { x: number; y: number; isLeft: boolean }): string => {
  const said = clip(text, TIP.max)
  const w = Math.ceil(textWidth(said, TIP.size)) + TIP.pad * 2

  return `<g class="tip" transform="translate(${at.isLeft ? at.x - w : at.x},${at.y})"><rect class="card ln" x=".5" y=".5" width="${w - 1}" height="${TIP.h - 1}" rx="5" stroke-width="1"/><text class="t" x="${TIP.pad}" y="12.5" font-family="${FONT}" font-size="${TIP.size}">${xml(said)}</text></g>`
}

// Feet on the ground at `x`, the drawing `w` wide.
const standing = (x: number, w: number, body: string): string => `<g transform="translate(${(x - w / 2).toFixed(1)},${(groundY(x) + 1).toFixed(1)})">${body}</g>`

// The owner's own line starts this far into his crab, right of its thought bubble.
const OWN_FROM = 22

// With a teammate there, the crab strolls only up to them, and stands still while a line is said between them.
const strollOf = (spec: SceneSpec, lay: Layout, mate: number | undefined): number => {
  const isTalking = spec.talk !== undefined && (spec.talk.said !== null || spec.talk.mine !== null)
  if (isTalking) return 0
  const reach = mate === undefined ? lay.x1 - lay.x0 : mate - MATE_W - LEAD_W - lay.stand

  return Math.min(AMBLE_MAX, reach)
}

// Each motion gets its own group: a CSS transform would replace a group's own `transform` attribute.
function leadSvg(spec: SceneSpec, lay: Layout, mate: number | undefined): string {
  const isWalkingIn = spec.from !== undefined && Math.round(spec.from) !== lay.stand
  const lead = leadOf(spec, isWalkingIn)
  const isLeft = lay.stand > spec.width * 0.6
  const said = tip(lead.title, { x: isLeft ? BUBBLE.x - TIP.gap : LEAD_W + TIP.gap, y: -GRID.feet * LEAD_SCALE + 4, isLeft })
  const mine = spec.talk?.mine ?? null
  const room = ownRoom({ from: lay.stand - LEAD_W / 2 + OWN_FROM, mate, width: spec.width })
  const own = mine === null ? '' : ownBubble(mine, { from: OWN_FROM, top: -GRID.feet * LEAD_SCALE, maxW: room })
  const who = `<g class="who"><g class="lift"><g class="${lead.breath}">${lead.body}</g>${lead.extra}${own}</g>${said}</g>`
  const distance = strollOf(spec, lay, mate)
  const stroll = lead.canAmble && distance > 0 ? strollCss(lay.stand, distance) : ''
  const amble = stroll === '' ? who : `${stroll}<g class="amble">${who}</g>`
  const walk = isWalkingIn && spec.from !== undefined ? `${walkInCss(spec.from, lay.stand)}<g class="walkin">${amble}</g>` : amble

  return standing(lay.stand, LEAD_W, walk)
}

/** The scene at `width` px, and what it says in words. */
export function sceneSvg(spec: SceneSpec): { source: string; alt: string } {
  const lay = layoutOf(spec)
  const land = landOf(spec.width, spec.sky)
  const done = spec.steps.filter(isDone).length
  const plan = spec.steps.length === 0 ? '' : `${t().stripPlan} ${done}/${spec.steps.length}`
  const names = spec.crew.map(a => lookOf(a).name).join(', ')
  const alt = [plan, names === '' ? `${t().mainName} · ${t().stripResting[spec.mood]}` : names].filter(Boolean).join(' · ')
  const x = spec.talk === undefined ? undefined : mateX(lay)
  const mate = spec.talk === undefined || x === undefined ? undefined : mateSvg({ talk: spec.talk, x, stand: lay.stand, width: spec.width })
  const body = land.open + land.back + trackSvg(spec, lay) + (mate?.svg ?? '') + leadSvg(spec, lay, x) + land.front + land.close

  return { source: paneSvg(spec.width, SCENE_H, SCHEME + SCENE_CSS + body), alt: [alt, mate?.alt ?? ''].filter(Boolean).join(' · ') }
}
