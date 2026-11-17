import { crab } from './crabs'
import { fitText, textWidth, xml } from './format'
import { t } from './i18n'
import type { Look } from './identity'
import { groundY } from './strip-land'
import { CRAB, PIXEL } from './strip-team'
import type { Line, Talk } from './strip-team'
import { FONT } from './theme'

// The teammate in the strip's scene: a person, so a crab in a knit cap no agent wears and a quiet grey shell, a size
// smaller than the session's own crab, standing on open ground as far from it as the path allows. Working now it
// breathes; away it stands dim and still. The newest line said between them shows as one speech bubble, by whoever
// said it. Everything here follows what changed, never the clock, so the frame keeps its source between changes.

const MATE_LOOK: Look = { shell: '#A8A29A', eyes: 'dot', name: '' }
export const MATE_W = 30
const FEET = 26
const SPEECH = { h: 16, size: 10, pad: 6, gap: 4, max: 240, min: 72, tail: 12, lift: 3 }
// Semibold runs a little wider than the body text the widths are measured for.
const BOLD = 1.14
// The scene's edges a bubble keeps clear of.
const EDGE = 4

type Ground = { at: readonly number[]; x0: number; x1: number; stand: number }

/** Where the teammate stands: between two stones (or at an end of the path) as far from the session's crab as it gets. */
export function mateX(g: Ground): number {
  const gaps = g.at.slice(1).map((x, i) => (x + (g.at[i] ?? x)) / 2)
  const spots = g.at.length < 2 ? [g.x0, g.x1] : gaps

  return spots.reduce((best, x) => (Math.abs(x - g.stand) >= Math.abs(best - g.stand) ? x : best))
}

const mark = (x: number): string =>
  CRAB.flatMap((row, r) =>
    [...row].flatMap((c, i) => (c === 'X' ? [`<rect class="f-edit" x="${(x + i * PIXEL.pitch).toFixed(1)}" y="${(4 + r * PIXEL.pitch).toFixed(1)}" width="${PIXEL.cell}" height="${PIXEL.cell}"/>`] : [])),
  ).join('')

const MARK_W = Math.max(...CRAB.map(row => row.length)) * PIXEL.pitch

/** How wide the bubble for `said` is at most `maxW`, or 0 when too little of it would show. */
const widthOf = (said: Line, maxW: number): number => {
  const lead = said.name === '' ? 0 : textWidth(said.name, SPEECH.size) * BOLD + SPEECH.gap
  const want = SPEECH.pad * 2 + lead + (said.isAgent ? MARK_W + SPEECH.gap : 0) + textWidth(said.text, SPEECH.size)
  const w = Math.ceil(Math.min(SPEECH.max, maxW, want))

  return w < SPEECH.min ? 0 : w
}

// The bubble's words: the speaker's name (none for the owner's own crab), the tiny crab when their AI wrote it, the text.
function words(said: Line, w: number): string {
  const y = SPEECH.h / 2 + SPEECH.size * 0.36
  const name = said.name === '' ? '' : fitText(said.name, SPEECH.size, (w / 3) / BOLD)
  const nameW = name === '' ? 0 : textWidth(name, SPEECH.size) * BOLD + SPEECH.gap
  const markAt = SPEECH.pad + nameW
  const textAt = markAt + (said.isAgent ? MARK_W + SPEECH.gap : 0)
  const text = fitText(said.text, SPEECH.size, w - textAt - SPEECH.pad)
  const who = name === '' ? '' : `<text class="t" x="${SPEECH.pad}" y="${y.toFixed(1)}" font-family="${FONT}" font-size="${SPEECH.size}" font-weight="600">${xml(name)}</text>`

  return `${who}${said.isAgent ? mark(markAt) : ''}<text class="s" x="${textAt.toFixed(1)}" y="${y.toFixed(1)}" font-family="${FONT}" font-size="${SPEECH.size}">${xml(text)}</text>`
}

/** A speech bubble `w` wide with its top-left at (x, y), its tail down to `tail` (from the bubble's left). */
const bubbleAt = (said: Line, o: { x: number; y: number; w: number; tail: number }): string => {
  const { h } = SPEECH
  const tip = `M${o.tail - 3} ${h - 0.5}L${o.tail} ${h + SPEECH.lift + 1}L${o.tail + 3} ${h - 0.5}`

  return `<g transform="translate(${o.x.toFixed(1)},${o.y.toFixed(1)})"><path class="card ln" d="${tip}" stroke-width="1"/><rect class="card ln" x=".5" y=".5" width="${o.w - 1}" height="${h - 1}" rx="6" stroke-width="1"/><rect class="card" x="${o.tail - 2.4}" y="${h - 1.5}" width="4.8" height="1.6"/>${words(said, o.w)}</g>`
}

/** The owner's own fresh line, up and to the right of his crab (`top`: his head, in the crab group's own units). */
export function ownBubble(text: string, o: { from: number; top: number; maxW: number }): string {
  const said = { name: '', text, isAgent: false }
  const w = widthOf(said, o.maxW)

  return w === 0 ? '' : bubbleAt(said, { x: o.from, y: o.top - SPEECH.h - SPEECH.lift, w, tail: SPEECH.tail })
}

/** How far right of the owner's crab his bubble may reach before it meets the teammate. */
export const ownRoom = (o: { from: number; mate: number | undefined; width: number }): number =>
  (o.mate === undefined ? o.width - EDGE : o.mate - MATE_W) - o.from

export type MateSpec = { talk: Talk; x: number; stand: number; width: number }

// Their line goes toward the open side: away from the scene's edge, and never past the session's crab.
function mateBubble(said: Line, m: MateSpec): string {
  const isLeftward = m.x > m.stand
  const room = isLeftward ? m.x - m.stand - MATE_W * 2 : m.stand - m.x - MATE_W * 2
  const w = widthOf(said, room)
  if (w === 0) return ''
  const tail = isLeftward ? w - SPEECH.tail : SPEECH.tail
  const x = Math.min(m.width - EDGE - w, Math.max(EDGE, m.x - tail))

  return bubbleAt(said, { x, y: groundY(m.x) + 1 - FEET - SPEECH.h - SPEECH.lift - 1, w, tail: m.x - x })
}

/** The teammate, their bubble when they said the newest line, and what it all says in words. */
export function mateSvg(m: MateSpec): { svg: string; alt: string } {
  const { talk } = m
  const body = crab(0, -FEET, { costume: 'mate', look: MATE_LOOK, isDim: !talk.isWorking, scale: 1 })
  const state = talk.isWorking ? t().stripTeam.isWorking(talk.name) : t().stripTeam.away(talk.name)
  const figure = `<g transform="translate(${(m.x - MATE_W / 2).toFixed(1)},${(groundY(m.x) + 1).toFixed(1)})"><title>${xml(state)}</title><g class="${talk.isWorking ? 'br' : ''}">${body}</g></g>`
  const said = talk.said === null ? '' : `${talk.said.isAgent ? t().stripTeam.aiWrote(talk.said.name) : t().stripTeam.wrote(talk.said.name)}: ${talk.said.text}`

  return { svg: figure + (talk.said === null ? '' : mateBubble(talk.said, m)), alt: [state, said].filter(Boolean).join(' · ') }
}
