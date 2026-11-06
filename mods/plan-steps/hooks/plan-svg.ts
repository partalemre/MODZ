import type { Plan, Step } from './match'
import { anchorIndex, currentIndex, durationOf, etaOf, formatDuration, progressOf, windowOf } from './progress'
import type { Tracks, Window } from './progress'
import { DETAIL_CSS, detailBlock, hasDetails } from './plan-detail'
import type { Block, DeskDetails } from './plan-detail'
import { escape, fit, measure, wrap } from './ui/svg'
import { checkMark, hollowRing, stepDot, stepRail } from './ui/steps'
import type { DotState } from './ui/steps'
import { svgDoc } from './ui/theme'
import type { Theme } from './ui/theme'
import { words } from './words'

// `note`: what a plan not under way says instead of its ETA ("başlamadı", "bekliyor · 45dk önce").
export type PlanSvgModel = { plan: Plan; tracks: Tracks; now: number; theme: Theme; width: number; note: string }

const ROW = 30
const LINE = 17
const DOT_X = 7
const DOT_CY = 15
const TITLE_X = 24
const TITLE_BASE = 19.5
const MORE_H = 28
const MORE_BASE = 18.5
const ROOM_STEPS = 12
const HEADLINE_Y = 16
const META_Y = 36
const META_SIZE = 12
const META_GAP = 12
const METER_Y = 48
const METER_H = 3
const SEGMENT_GAP = 2
// Below this a segment stops reading as one step: the meter becomes one plain bar.
const SEGMENT_MIN = 5
const HEAD_H = 62
const TIME_SIZE = 11
const TIME_GAP = 12
const CURRENT_SIZE = 13.5
const TITLE_SIZE = 13
// Semibold runs wider than the regular advance `measure` assumes.
const BOLD_WIDEN = 1.06
const CURRENT_LINES_MAX = 5
const OTHER_LINES_MAX = 2
const DETAIL_PAD = 8
const CSS = `${DETAIL_CSS}.step{font-size:${TITLE_SIZE}px}.breathe{animation:br 1.8s ease-in-out infinite}@keyframes br{50%{opacity:.35}}`

type Placed = { step: Step; index: number; top: number; height: number; isCurrent: boolean; title: string[]; detail: Block | null }

// A plan nobody has started counts its steps; one under way says how many are done.
function headlineText(model: PlanSvgModel): string {
  const { plan, tracks } = model
  const progress = progressOf(plan)
  const isUnstarted = progress.done === 0 && currentIndex(plan.steps, tracks) < 0

  return isUnstarted ? words().drawnPlanned(progress.total) : words().drawnCount(progress.done, progress.total)
}

// The meta line's right side: a quiet plan's note, else the honest ETA, else nothing.
function rightOfMeta(model: PlanSvgModel): string {
  if (model.note !== '') return model.note
  const eta = etaOf(model.plan, model.tracks)

  return eta === null ? '' : words().left(formatDuration(eta))
}

function segmentFill(model: PlanSvgModel, step: Step, isCurrent: boolean): string {
  if (isCurrent && model.note === '') return '--edit'
  if (step.status === 'completed') return model.plan.steps.every(one => one.status === 'completed') ? '--ok' : '--mid'

  return step.status === 'in_progress' ? '--line2' : '--track'
}

// One segment per step, so the meter claims nothing the steps do not; a very long plan gets one plain bar.
function meter(model: PlanSvgModel): string {
  const { steps } = model.plan
  const cell = (model.width - (steps.length - 1) * SEGMENT_GAP) / steps.length
  const bar = (x: number, width: number, fill: string) => `<rect x="${x}" y="${METER_Y}" width="${width}" height="${METER_H}" rx="1.5" fill="var(${fill})"/>`
  if (cell >= SEGMENT_MIN) {
    const current = currentIndex(steps, model.tracks)

    return steps.map((step, n) => bar(n * (cell + SEGMENT_GAP), cell, segmentFill(model, step, n === current))).join('')
  }
  const { percent } = progressOf(model.plan)
  const fill = Math.round((model.width * percent) / 100)

  return bar(0, model.width, '--track') + (fill > 0 ? bar(0, fill, percent >= 100 ? '--ok' : '--mid') : '')
}

// One true sentence, then where the plan comes from with its ETA or state across from it, then the meter as the rule
// above the list. No "Plan" label: the pane's own title says that.
function header(model: PlanSvgModel): Block {
  const right = rightOfMeta(model)
  const room = model.width - (right === '' ? 0 : measure(right, META_SIZE) + META_GAP)
  const parts = [
    `<text x="0" y="${HEADLINE_Y}" class="headline hi">${escape(headlineText(model))}</text>`,
    `<text x="0" y="${META_Y}" class="label lo">${escape(fit(model.plan.source, room, { size: META_SIZE }))}</text>`,
    right === '' ? '' : `<text x="${model.width}" y="${META_Y}" text-anchor="end" class="label lo">${escape(right)}</text>`,
    meter(model),
  ]

  return { svg: parts.join(''), height: HEAD_H }
}

function rightText(model: PlanSvgModel, step: Step, isCurrent: boolean): { text: string; cls: string } {
  const elapsed = durationOf(model.tracks[step.key], model.now)
  const time = elapsed === null ? '' : formatDuration(elapsed)
  if (step.status === 'completed') return { text: time, cls: 'lo' }
  if (isCurrent) return { text: time, cls: model.note === '' ? 'mid' : 'lo' }
  const checks = step.checksTotal > 0 ? `${step.checksDone}/${step.checksTotal}` : ''

  return { text: [checks, step.status === 'in_progress' ? time : ''].filter(Boolean).join(' · '), cls: 'lo' }
}

const TITLE_CLASS: Record<DotState, string> = { current: 'title hi', done: 'step lo', next: 'step mid' }

function dotState(row: Placed): DotState {
  if (row.isCurrent) return 'current'

  return row.step.status === 'completed' ? 'done' : 'next'
}

function rowSvg(model: PlanSvgModel, row: Placed): string {
  const state = dotState(row)
  const right = rightText(model, row.step, row.isCurrent)
  const parts = [
    stepDot({ cx: DOT_X, cy: row.top + DOT_CY, state, isLive: model.note === '' }),
    ...row.title.map((line, n) => `<text x="${TITLE_X}" y="${row.top + TITLE_BASE + n * LINE}" class="${TITLE_CLASS[state]}">${escape(line)}</text>`),
    right.text === '' ? '' : `<text x="${model.width}" y="${row.top + TITLE_BASE}" text-anchor="end" class="mono ${right.cls}" font-size="${TIME_SIZE}">${right.text}</text>`,
    row.detail?.svg ?? '',
  ]

  return parts.join('')
}

function titleLines(model: PlanSvgModel, step: Step, isCurrent: boolean): string[] {
  const right = rightText(model, step, isCurrent)
  const rightWidth = right.text === '' ? 0 : measure(right.text, TIME_SIZE, true) + TIME_GAP
  const size = isCurrent ? CURRENT_SIZE * BOLD_WIDEN : TITLE_SIZE

  return wrap(step.title, { width: model.width - TITLE_X - rightWidth, size, maxLines: isCurrent ? CURRENT_LINES_MAX : OTHER_LINES_MAX })
}

function place(model: PlanSvgModel, details: DeskDetails, at: { top: number; shown: Window }): Placed[] {
  const { steps } = model.plan
  const { shown } = at
  const current = currentIndex(steps, model.tracks)
  let y = at.top
  return steps.slice(shown.start, shown.end).map((step, offset) => {
    const index = shown.start + offset
    const isCurrent = index === current
    const title = titleLines(model, step, isCurrent)
    const titleHeight = ROW + (title.length - 1) * LINE
    const frame = { x: TITLE_X, top: y + titleHeight - 4, width: model.width - TITLE_X }
    const detail = isCurrent && hasDetails(details) ? detailBlock(details, frame) : null
    const height = titleHeight + (detail === null ? 0 : detail.height + DETAIL_PAD)
    const placed = { step, index, top: y, height, isCurrent, title, detail }
    y += height

    return placed
  })
}

// A row standing in for the steps out of view, on the rail like the rows it stands for.
function moreRow(top: number, glyph: string, text: string): string {
  return `${glyph}<text x="${TITLE_X}" y="${top + MORE_BASE}" class="label lo">${escape(text)}</text>`
}

// The plan as one drawing: what is done, an honest ETA, then every step on a thin rail of status glyphs.
export function planSvg(model: PlanSvgModel, details: DeskDetails): { source: string; height: number } {
  const { steps } = model.plan
  const head = header(model)
  const shown = windowOf(steps.length, anchorIndex(steps, model.tracks), ROOM_STEPS)
  const rows = place(model, details, { top: head.height + (shown.start > 0 ? MORE_H : 0), shown })
  const last = rows[rows.length - 1]
  const bottom = last === undefined ? head.height : last.top + last.height
  const aboveCy = head.height + MORE_H / 2
  const belowCy = bottom + MORE_H / 2
  const hasAbove = shown.start > 0
  const hasBelow = shown.end < steps.length
  const above = hasAbove ? moreRow(head.height, checkMark(DOT_X, aboveCy), words().earlierSteps(shown.start)) : ''
  const below = hasBelow ? moreRow(bottom, hollowRing(DOT_X, belowCy), words().moreSteps(steps.length - shown.end)) : ''
  const stops = [
    ...(hasAbove ? [{ cy: aboveCy, isDone: true }] : []),
    ...rows.map(row => ({ cy: row.top + DOT_CY, isDone: row.step.status === 'completed' })),
    ...(hasBelow ? [{ cy: belowCy, isDone: false }] : []),
  ]
  const rails = stops.slice(1).map((stop, n) => {
    const from = stops[n] as (typeof stops)[number]

    return stepRail(DOT_X, { from: from.cy, to: stop.cy, isWalked: from.isDone })
  })
  const height = bottom + (hasBelow ? MORE_H : 4)
  const body = [head.svg, ...rails, above, ...rows.map(row => rowSvg(model, row)), below].join('')

  return { source: svgDoc({ width: model.width, height, theme: model.theme }, body, CSS), height }
}
