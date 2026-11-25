import type { AgentRun, ToolEvent, WorkKind } from '../types'
import { crab } from './crabs'
import { fitText, textWidth, xml } from './format'
import { t } from './i18n'
import { lookOf } from './identity'
import { ROW_CSS, lineAct, thoughtOf } from './row-acts'
import { SCENE_CSS } from './strip-motion'
import { bubble } from './strip-scene'
import { FONT, paneSvg } from './theme'
import { costumeOf } from './tiers'

// A helper agent on its own row of the conversation, under the Agent call that started it: the same crab as in
// the Agents pane, born there. The card says two things and no more: what the agent is doing, and why. The crab
// stands at the line of its work and walks down to each new one; the work itself plays on that line (row-acts.ts).
// Agents that ended stand together in one short row. Each card is one drawing, so the crab and its lines move
// together; it is redrawn at each new call, and every motion starts from rest, so a redraw never jumps.

const CARD_W = 520
const GRID = { w: 30, feet: 26 }
// The crab's lane on the left: room for the crab, its small moves, and the bubble up and to its left.
const LANE = { crabX: 24, textX: 74 }
const LINE_H = 19
const TITLE_Y = 14
const SIZE = { title: 13, line: 12.5, why: 11.5 }
const PAD_BOTTOM = 7
const THOUGHT_DROP = 7
// Room kept at a line's end for the work that plays there.
const ACT_ROOM = 74
const TEXT_W = CARD_W - LANE.textX - 6
const MARK_GAP = 13

const text = (cls: string, at: { x: number; y: number }, size: number, said: string, weight = 400): string =>
  `<text class="${cls}" x="${at.x}" y="${at.y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}">${xml(said)}</text>`

const stroke = (cls: string, d: string): string => `<path class="${cls}" d="${d}" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`
const DONE_MARK = stroke('i-ok', 'M-3 0l2.2 2.2 4-4.4')
const FAILED_MARK = stroke('i-danger', 'M-2.6 -2.6l5.2 5.2M2.6 -2.6l-5.2 5.2')

const wordsOf = (event: ToolEvent): string => event.why || event.plain || event.tool

// The work before this one: how it went, in quiet words.
const pastLine = (event: ToolEvent, y: number): string =>
  `<g transform="translate(${LANE.textX + 4},${y - 4})">${event.isError === true ? FAILED_MARK : DONE_MARK}</g>${text('m', { x: LANE.textX + MARK_GAP, y }, SIZE.line, fitText(wordsOf(event), SIZE.line, TEXT_W - MARK_GAP))}`

// The work under way: its words, and the work itself played on the line.
function liveLine(said: string, y: number, kind: WorkKind): string {
  const x = LANE.textX + MARK_GAP
  const fitted = fitText(said, SIZE.line, TEXT_W - MARK_GAP - ACT_ROOM)

  return `<g class="fresh"><circle class="f-run live" cx="${LANE.textX + 4}" cy="${y - 4}" r="3"/>${text('t', { x, y }, SIZE.line, fitted)}${lineAct(kind, { x, y, width: textWidth(fitted, SIZE.line) })}</g>`
}

// Why it is doing this: the sentence it wrote before the call, else its own note on its step, else its part of the
// plan, said once for a run of helpers on the same step (`isPlanSaid`: the row above already said it).
function whyOf(run: AgentRun, event: ToolEvent | undefined, isPlanSaid: boolean): string {
  if (event?.because) return event.because
  if (run.stepNote) return run.stepTotal ? `${t().rowStep(run.stepDone ?? 0, run.stepTotal)}: ${run.stepNote}` : run.stepNote

  return run.planStep === undefined || isPlanSaid ? '' : t().rowPlan(run.planStep.at, run.planStep.of, run.planStep.subject)
}

// `thought` empty: no bubble, for a crab at rest.
type Stand = { x: number; feetY: number; scale: number; thought: string; kind?: WorkKind; arrival: string }

// The crab with its bubble, feet at `feetY`. `arrival` is how it got there (born, walked down); `kind` its small
// move while it works. Each motion has a group of its own: a CSS transform would replace a group's own.
function crabAt(run: AgentRun, stand: Stand): string {
  const isWalking = stand.kind === 'edit' || stand.kind === 'run' || stand.kind === 'test' || stand.kind === 'save'
  const body = crab(0, -GRID.feet, { costume: costumeOf(run), look: lookOf(run), isWalking })
  const thought = stand.thought === '' ? '' : `<g transform="translate(0,${THOUGHT_DROP})">${bubble(stand.thought)}</g>`
  const who = `<g class="lift"><g class="wig"><g class="${isWalking ? '' : 'br'}">${body}</g></g>${thought}</g>`
  const moving = stand.kind === undefined ? who : `<g class="mv-${stand.kind}">${who}</g>`

  return `<g transform="translate(${stand.x},${stand.feetY}) scale(${stand.scale})"><g class="${stand.arrival}">${moving}</g></g>`
}

export type RowCrab = { source: string; alt: string; width: number; height: number }

const card = (height: number, body: string): string => paneSvg(CARD_W, height, SCENE_CSS + ROW_CSS + `<g class="who"><rect width="${CARD_W}" height="${height}" fill="transparent"/>${body}</g>`)

/** An agent at work: its crab at the line of what it is doing now, the work before it, and why. */
export function rowCrab(run: AgentRun, isPlanSaid = false): RowCrab {
  const kind = run.lastKind ?? 'other'
  const name = lookOf(run).name
  const history = run.history ?? []
  const now = history.at(-1)
  const before = history.at(-2)
  const nowY = TITLE_Y + (before === undefined ? 1 : 2) * LINE_H
  const doing = now === undefined ? run.lastPlain || t().rowDoing[kind] : wordsOf(now)
  const why = whyOf(run, now, isPlanSaid)
  const whyY = nowY + LINE_H - 3
  const lines = (before === undefined ? '' : pastLine(before, TITLE_Y + LINE_H)) + liveLine(doing, nowY, kind) + (why === '' ? '' : text('m', { x: LANE.textX + MARK_GAP, y: whyY }, SIZE.why, fitText(`↳ ${why}`, SIZE.why, TEXT_W - MARK_GAP)))
  const height = Math.max(why === '' ? nowY : whyY, nowY + 4) + PAD_BOTTOM
  const title = text('t', { x: LANE.textX, y: TITLE_Y }, SIZE.title, fitText(`${name} · ${run.description}`, SIZE.title, TEXT_W), 600)
  const stand = { x: LANE.crabX, feetY: nowY + 7, scale: 1, thought: thoughtOf(kind), kind, arrival: history.length <= 1 ? 'born' : 'down' }

  return { source: card(height, title + lines + crabAt(run, stand)), alt: [name, run.description, doing, why].filter(Boolean).join(' · '), width: CARD_W, height }
}

const BENCH = { slot: 104, h: 28, scale: 0.72, nameX: 30 }

/** The agents that ended, together in one row: each crab at rest with its name and how it ended. */
export function benchCard(runs: readonly AgentRun[]): RowCrab {
  const perRow = Math.floor(CARD_W / BENCH.slot)
  const height = Math.ceil(runs.length / perRow) * BENCH.h
  const seats = runs.map((run, i) => {
    const isDone = run.status === 'done'
    const at = { x: (i % perRow) * BENCH.slot, y: Math.floor(i / perRow) * BENCH.h }
    const mark = `<g transform="translate(${BENCH.nameX + textWidth(lookOf(run).name, SIZE.line) + 9},${BENCH.h - 14})">${isDone ? DONE_MARK : FAILED_MARK}</g>`
    const seat = crabAt(run, { x: 2, feetY: BENCH.h - 3, scale: BENCH.scale, thought: '', arrival: '' })

    return `<g transform="translate(${at.x},${at.y})"><title>${xml(`${lookOf(run).name} · ${run.description}`)}</title>${seat}${text(isDone ? 's' : 't', { x: BENCH.nameX, y: BENCH.h - 10 }, SIZE.line, lookOf(run).name, 600)}${mark}</g>`
  })
  const alt = runs.map(run => `${lookOf(run).name} · ${run.status === 'done' ? t().rowEnded.done : t().rowEnded.failed}`).join(', ')

  return { source: paneSvg(CARD_W, height, SCENE_CSS + ROW_CSS + seats.map(seat => `<g class="who">${seat}</g>`).join('')), alt, width: CARD_W, height }
}
