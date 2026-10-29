import type { Plan, Step } from './match'
import { anchorIndex, currentIndex, durationOf, etaOf, formatDuration, percentText, progressOf, windowOf } from './progress'
import type { Tracks, Window } from './progress'
import { DETAIL_CSS, detailBlock, hasDetails } from './plan-detail'
import type { Block, DeskDetails } from './plan-detail'
import { escape, measure, wrap } from './ui/svg'
import { DOT_CSS, stepDot, stepRail } from './ui/steps'
import type { DotState } from './ui/steps'
import { svgDoc } from './ui/theme'
import type { Theme } from './ui/theme'
import { words } from './words'

// `note`: what a plan not under way says instead of its ETA ("başlamadı", "bekliyor · 45dk önce").
export type PlanSvgModel = { plan: Plan; tracks: Tracks; now: number; theme: Theme; width: number; note: string }

const ROW = 32
const LINE = 17
const DOT_X = 16
const DOT_CY = 16
const TITLE_X = 38
const TITLE_BASE = 20.5
const RIGHT_GAP = 10
const MORE_H = 22
const ROOM_STEPS = 12
const HEADLINE_Y = 18
const METER_Y = 32
const METER_H = 4
const SOURCE_Y = 56
const SOURCE_LINE = 15
const SOURCE_SIZE = 11
const LIST_GAP = 14
const TITLE_SIZE = 13
const CURRENT_SIZE = 13.5
// Semibold runs wider than the regular advance `measure` assumes.
const BOLD_WIDEN = 1.06
const TITLE_LINES_MAX = 5
const DETAIL_PAD = 8
const LIVE_DOT = 3
const LIVE_GAP = 8
const CSS = `${DOT_CSS}${DETAIL_CSS}.breathe{animation:br 1.8s ease-in-out infinite}@keyframes br{50%{opacity:.35}}`

type Placed = { step: Step; index: number; top: number; height: number; isCurrent: boolean; title: string[]; detail: Block | null }

// The headline's right side: a quiet plan's note, else the honest ETA, else nothing.
function rightOfHead(model: PlanSvgModel): string {
  if (model.note !== '') return model.note
  const eta = etaOf(model.plan, model.tracks)

  return eta === null ? '' : words().left(formatDuration(eta))
}

// The count as the headline with the ETA or the plan's state on its right, a plain meter, then the plan's source.
// No "Plan" label above it: the pane's own title says that. The meter is ink, green only once every step is done.
function header(model: PlanSvgModel): Block {
  const progress = progressOf(model.plan)
  const right = rightOfHead(model)
  const fill = Math.round((model.width * progress.percent) / 100)
  const source = wrap(model.plan.source, { width: model.width, size: SOURCE_SIZE, maxLines: 2 })
  const parts = [
    `<text x="0" y="${HEADLINE_Y}"><tspan class="headline hi">${escape(words().drawnCount(progress.done, progress.total))}</tspan><tspan class="headline lo"> · ${percentText(progress)}</tspan></text>`,
    right === '' ? '' : `<text x="${model.width}" y="${HEADLINE_Y}" text-anchor="end" class="label lo">${escape(right)}</text>`,
    `<rect x="0" y="${METER_Y}" width="${model.width}" height="${METER_H}" rx="2" fill="var(--track)"/>`,
    fill > 0 ? `<rect x="0" y="${METER_Y}" width="${Math.max(METER_H, fill)}" height="${METER_H}" rx="2" fill="var(${progress.percent >= 100 ? '--ok' : '--mid'})"/>` : '',
    ...source.map((line, n) => `<text x="0" y="${SOURCE_Y + n * SOURCE_LINE}" class="micro lo" font-size="${SOURCE_SIZE}">${escape(line)}</text>`),
  ]

  return { svg: parts.join(''), height: SOURCE_Y + (source.length - 1) * SOURCE_LINE + LIST_GAP }
}

function rightText(model: PlanSvgModel, step: Step, isCurrent: boolean): { text: string; cls: string } {
  const elapsed = durationOf(model.tracks[step.key], model.now)
  const time = elapsed === null ? '' : formatDuration(elapsed)
  if (step.status === 'completed') return { text: time, cls: 'lo' }
  if (isCurrent) return { text: time, cls: model.note === '' ? 'f-edit' : 'lo' }
  const checks = step.checksTotal > 0 ? `${step.checksDone}/${step.checksTotal}` : ''

  return { text: [checks, step.status === 'in_progress' ? time : ''].filter(Boolean).join(' · '), cls: 'lo' }
}

const TITLE_CLASS: Record<DotState, string> = { current: 'title hi', done: 'label lo', next: 'label mid' }

function dotState(row: Placed): DotState {
  if (row.isCurrent) return 'current'

  return row.step.status === 'completed' ? 'done' : 'next'
}

// Live work breathes: one small clay dot before the step's running time.
const liveDot = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="${LIVE_DOT}" class="f-edit breathe"/>`

function rowSvg(model: PlanSvgModel, row: Placed): string {
  const state = dotState(row)
  const right = rightText(model, row.step, row.isCurrent)
  const titleCls = TITLE_CLASS[state]
  const size = row.isCurrent ? '' : ` font-size="${TITLE_SIZE}"`
  const cy = row.top + DOT_CY
  const isLive = row.isCurrent && model.note === ''
  const parts = [
    stepDot({ cx: DOT_X, cy, n: row.index + 1, state, isLive }),
    ...row.title.map((line, n) => `<text x="${TITLE_X}" y="${row.top + TITLE_BASE + n * LINE}" class="${titleCls}"${size}>${escape(line)}</text>`),
    right.text === '' ? '' : `<text x="${model.width - RIGHT_GAP}" y="${row.top + TITLE_BASE}" text-anchor="end" class="mono micro ${right.cls}">${right.text}</text>`,
    isLive ? liveDot(model.width - RIGHT_GAP - measure(right.text, 10.5, true) - LIVE_GAP, row.top + TITLE_BASE - 3.5) : '',
    row.detail?.svg ?? '',
  ]

  return parts.join('')
}

function titleLines(model: PlanSvgModel, step: Step, isCurrent: boolean): string[] {
  const right = rightText(model, step, isCurrent)
  const rightWidth = right.text === '' ? 0 : measure(right.text, 10.5, true) + RIGHT_GAP + 8
  const size = isCurrent ? CURRENT_SIZE * BOLD_WIDEN : TITLE_SIZE

  return wrap(step.title, { width: model.width - TITLE_X - RIGHT_GAP - rightWidth, size, maxLines: TITLE_LINES_MAX })
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
    const frame = { x: TITLE_X, top: y + titleHeight - 4, width: model.width - TITLE_X - RIGHT_GAP }
    const detail = isCurrent && hasDetails(details) ? detailBlock(details, frame) : null
    const height = titleHeight + (detail === null ? 0 : detail.height + DETAIL_PAD)
    const placed = { step, index, top: y, height, isCurrent, title, detail }
    y += height

    return placed
  })
}

// The plan as one drawing: progress, an honest ETA, then every step on a rail of numbered circles.
export function planSvg(model: PlanSvgModel, details: DeskDetails): { source: string; height: number } {
  const { steps } = model.plan
  const head = header(model)
  const placed = windowOf(steps.length, anchorIndex(steps, model.tracks), ROOM_STEPS)
  const rows = place(model, details, { top: head.height + (placed.start > 0 ? MORE_H : 0), shown: placed })
  const centers = rows.map(row => row.top + DOT_CY)
  const rails = centers.slice(1).map((cy, n) => stepRail(DOT_X, centers[n] as number, cy))
  const last = rows[rows.length - 1]
  const bottom = last === undefined ? head.height : last.top + last.height
  const above = placed.start > 0 ? `<text x="${TITLE_X}" y="${head.height + 13}" class="micro lo">✓ ${words().moreSteps(placed.start)}</text>` : ''
  const below = placed.end < steps.length ? `<text x="${TITLE_X}" y="${bottom + 14}" class="micro lo">+${words().moreSteps(steps.length - placed.end)}</text>` : ''
  const height = bottom + (below === '' ? 4 : MORE_H)
  const body = [head.svg, above, ...rails, ...rows.map(row => rowSvg(model, row)), below].join('')

  return { source: svgDoc({ width: model.width, height, theme: model.theme }, body, CSS), height }
}
