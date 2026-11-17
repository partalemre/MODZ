import { fitText, textWidth, xml } from './format'
import { t } from './i18n'
import { roughSpan } from './insight'
import { upper } from './lang'
import { CHIP_H } from './strip-chips'
import { FONT, paneSvg } from './theme'

// The teammate chip: who else works on this project (the transceiver mod's `team` state), drawn in the chips' own
// manner, no frame, the app's button hover its only surface. A person is a neutral monogram, as names are across
// MODZ; an AI is a crab, as agents are in this mod, so "their AI wrote" is a tiny pixel crab beside the name.
// The words themselves are said in the scene, by the teammate's figure (strip-mate.ts); here an unread line is a
// count in the accent, and read, the chip falls back to who is there. It is a still drawing (it is pressed), and
// always one of three fixed widths, so nothing it says moves the row.

export type Mate = { name: string; at: number; branch?: string }
export type Line = { name: string; text: string; isAgent: boolean }
/** `mine`: the room's newest line when the owner wrote it; null when someone else spoke last, or it is not told. */
export type Team = { roomId: string; mates: [Mate, ...Mate[]]; unread: number; last: Line | null; mine: { text: string; ts: number } | null }
export type Drawing = { source: string; width: number; alt: string }
export type Tier = 'full' | 'bare' | 'face'
export type TeamArt = Record<Tier, Drawing>

// Someone counts as working now while their last work is this recent.
const WORKING_MS = 10 * 60_000
// The chip's widths: whole, without its side value, and its face alone when the row is tighter still.
export const TEAM_W: Readonly<Record<Tier, number>> = { full: 208, bare: 112, face: 40 }
const PAD = 12
const GAP = 6
const BASELINE = 18.5
const NAME_SIZE = 13
const SIDE_SIZE = 11.5
const NAME_MAX = 64
// Semibold runs a little wider than the body text the widths are measured for.
const BOLD = 1.14
const FACE = { r: 7.5, size: 9.5 }
// The working-now dot sits on the face's lower right, as presence marks do, so it stays when the chip narrows.
const DOT = { r: 2.75, off: 5.5 }
// The crab in the wordmark's pixel letters' manner, a size down: claws up, a body, legs.
export const CRAB = ['X.....X', 'XX...XX', '.XXXXX.', 'XXXXXXX', '.X.X.X.']
export const PIXEL = { pitch: 1.9, cell: 1.6 }

const isText = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''

const mateFrom = (one: unknown): Mate[] => {
  const m = one as { name?: unknown; at?: unknown; branch?: unknown } | null
  if (!isText(m?.name) || typeof m.at !== 'number') return []

  return [{ name: m.name, at: m.at, ...(isText(m.branch) ? { branch: m.branch } : {}) }]
}

const lastFrom = (value: unknown): Team['last'] => {
  const l = value as { name?: unknown; text?: unknown; isAgent?: unknown } | null | undefined
  if (!isText(l?.name) || !isText(l.text)) return null

  return { name: l.name, text: oneLine(l.text), isAgent: l.isAgent === true }
}

const oneLine = (s: string): string => s.replace(/\s+/g, ' ').trim()

// `recent` is newer than this mod's first reading of `team`, so an older transceiver leaves it out.
const mineFrom = (recent: unknown): Team['mine'] => {
  const newest = (Array.isArray(recent) ? recent.at(-1) : undefined) as { text?: unknown; ts?: unknown; isMine?: unknown } | undefined
  if (newest?.isMine !== true || !isText(newest.text) || typeof newest.ts !== 'number') return null

  return { text: oneLine(newest.text), ts: newest.ts }
}

/** Another mod's value, read at the boundary: null unless someone else is there. */
export function teamFrom(value: unknown): Team | null {
  const v = value as { roomId?: unknown; mates?: unknown; unread?: unknown; last?: unknown; recent?: unknown } | null | undefined
  const [first, ...rest] = Array.isArray(v?.mates) ? v.mates.flatMap(mateFrom) : []
  if (first === undefined || !isText(v?.roomId)) return null

  return { roomId: v.roomId, mates: [first, ...rest], unread: typeof v?.unread === 'number' ? v.unread : 0, last: lastFrom(v?.last), mine: mineFrom(v?.recent) }
}

type Ink = { x: number; out: string[] }

const put = (ink: Ink, svg: string, w: number): void => {
  ink.out.push(svg)
  ink.x += w + GAP
}

const text = (o: { cls: string; s: string; size: number; isBold?: boolean }, x: number): string =>
  `<text class="${o.cls}" x="${x.toFixed(1)}" y="${BASELINE}" font-family="${FONT}" font-size="${o.size}"${o.isBold === true ? ' font-weight="600"' : ''}>${xml(o.s)}</text>`

// `isNew`: unread words the chip has no room to show; the face takes the accent's tint instead.
function face(ink: Ink, o: { name: string; isWorking?: boolean; isNew?: boolean }): void {
  const cx = ink.x + FACE.r
  const initial = upper([...o.name][0] ?? '')
  const disc = `<circle class="${o.isNew === true ? 'b-edit' : 'k'}" cx="${cx}" cy="${CHIP_H / 2}" r="${FACE.r}"/>`
  const letter = `<text class="${o.isNew === true ? 'f-edit' : 's'}" x="${cx}" y="${CHIP_H / 2 + FACE.size * 0.36}" text-anchor="middle" font-family="${FONT}" font-size="${FACE.size}" font-weight="700">${xml(initial)}</text>`
  const dot = o.isWorking === true ? `<circle class="f-edit" cx="${cx + DOT.off}" cy="${CHIP_H / 2 + DOT.off}" r="${DOT.r}"/>` : ''
  put(ink, disc + letter + dot, FACE.r * 2)
}

function name(ink: Ink, o: { s: string; cls: string }): void {
  const s = fitText(o.s, NAME_SIZE, NAME_MAX / BOLD)
  put(ink, text({ cls: o.cls, s, size: NAME_SIZE, isBold: true }, ink.x), Math.ceil(textWidth(s, NAME_SIZE) * BOLD))
}

function crab(ink: Ink): void {
  const top = (CHIP_H - CRAB.length * PIXEL.pitch) / 2
  const cells = CRAB.flatMap((row, r) =>
    [...row].flatMap((c, i) => (c === 'X' ? [`<rect class="f-edit" x="${(ink.x + i * PIXEL.pitch).toFixed(1)}" y="${(top + r * PIXEL.pitch).toFixed(1)}" width="${PIXEL.cell}" height="${PIXEL.cell}"/>`] : [])),
  )
  put(ink, cells.join(''), Math.max(...CRAB.map(row => row.length)) * PIXEL.pitch)
}

// The side value takes what is left of the slot; cut to less than a word, it is left out.
const SIDE_MIN = 24
function side(ink: Ink, o: { s: string; cls: string; width: number }): void {
  const room = o.width - PAD - ink.x
  if (room < SIDE_MIN) return
  put(ink, text({ cls: o.cls, s: fitText(o.s, SIDE_SIZE, room), size: SIDE_SIZE }, ink.x), room)
}

export const isWorking = (at: number, now: number): boolean => now - at < WORKING_MS

/** What the scene says: who is there, and the one line it shows, theirs unread or the owner's own fresh one. */
export type Talk = { name: string; isWorking: boolean; said: Line | null; mine: string | null }

export function talkOf(team: Team, now: number): Talk {
  const [mate] = team.mates
  const mine = team.mine !== null && isWorking(team.mine.ts, now) ? team.mine.text : null
  const said = mine === null && team.unread > 0 ? team.last : null

  return { name: mate.name, isWorking: isWorking(mate.at, now), said, mine }
}

type Said = { body: string; alt: string }

function presence(team: Team, o: { now: number; tier: Tier }): Said {
  const [mate, ...others] = team.mates
  const ink: Ink = { x: PAD, out: [] }
  const working = isWorking(mate.at, o.now)
  const ago = t().ago(roughSpan(Math.max(0, o.now - mate.at)))
  face(ink, { name: mate.name, isWorking: working })
  if (o.tier !== 'face') name(ink, { s: mate.name, cls: 't' })
  const more = `+${others.length}`
  // The count belongs with the name, so it takes the name's weight and keeps apart from the dim side value.
  if (o.tier !== 'face' && others.length > 0) put(ink, text({ cls: 's', s: more, size: SIDE_SIZE, isBold: true }, ink.x), Math.ceil(textWidth(more, SIDE_SIZE) * BOLD) + GAP)
  if (o.tier === 'full') side(ink, { s: working ? (mate.branch ?? t().stripTeam.working) : ago, cls: 'm', width: TEAM_W.full })
  const said = working ? t().stripTeam.isWorking(mate.name) : t().stripTeam.worked(mate.name, ago)
  const alt = [said, working && mate.branch !== undefined ? t().stripTeam.on(mate.branch) : '', others.length > 0 ? t().stripTeam.more(others.length) : '']

  return { body: ink.out.join(''), alt: alt.filter(Boolean).join(', ') }
}

// Narrowed, the words go first, then the name: what is left wears the accent, so it still says there is something to read.
// The line itself is said in the scene, so here it is only how many are new: the chip never repeats the words.
function message(last: Line, o: { tier: Tier; unread: number }): Said {
  const { tier } = o
  const ink: Ink = { x: PAD, out: [] }
  face(ink, { name: last.name, isNew: tier !== 'full' })
  if (tier !== 'face') name(ink, { s: last.name, cls: tier === 'full' ? 't' : 'f-edit' })
  if (tier !== 'face' && last.isAgent) crab(ink)
  if (tier === 'full') side(ink, { s: t().stripTeam.fresh(o.unread), cls: 'f-edit', width: TEAM_W.full })
  const who = last.isAgent ? t().stripTeam.aiWrote(last.name) : t().stripTeam.wrote(last.name)

  return { body: ink.out.join(''), alt: `${who}: ${last.text}` }
}

function drawn(team: Team, o: { now: number; tier: Tier }): Drawing {
  const said = team.unread > 0 && team.last !== null ? message(team.last, { tier: o.tier, unread: team.unread }) : presence(team, o)
  const width = TEAM_W[o.tier]

  return { source: paneSvg(width, CHIP_H, said.body), width, alt: said.alt }
}

/** The chip at each of its widths; each is fixed, whatever the chip says. */
export const teamArt = (team: Team, now: number): TeamArt => ({
  full: drawn(team, { now, tier: 'full' }),
  bare: drawn(team, { now, tier: 'bare' }),
  face: drawn(team, { now, tier: 'face' }),
})
