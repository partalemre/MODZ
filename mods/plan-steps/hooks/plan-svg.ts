import type { Plan, Step } from './match'
import { anchorIndex, currentIndex, durationOf, etaOf, formatDuration, percentText, progressOf, windowOf } from './progress'
import type { Tracks, Window } from './progress'
import { DETAIL_CSS, detailBlock, hasDetails } from './plan-detail'
import type { Block, DeskDetails } from './plan-detail'
import { escape, eyebrow, measure, wrap } from './ui/svg'
import { DOT_CSS, stepDot, stepRail } from './ui/steps'
import { svgDoc } from './ui/theme'
import type { Theme } from './ui/theme'

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
const METER_Y = 54
const METER_H = 6
const SOURCE_Y = 80
const SOURCE_LINE = 15
const SOURCE_SIZE = 11
const LIST_GAP = 14
const TITLE_SIZE = 13
const CURRENT_SIZE = 13.5
// Semibold runs wider than the regular advance `measure` assumes.
const BOLD_WIDEN = 1.06
const TITLE_LINES_MAX = 5
const DETAIL_PAD = 8
const CSS = `${DOT_CSS}${DETAIL_CSS}.row-on{fill:var(--plan-t)}.breathe{animation:br 1.8s ease-in-out infinite}@keyframes br{50%{opacity:.25}}`

type Placed = { step: Step; index: number; top: number; height: number; isCurrent: boolean; title: string[]; detail: Block | null }

// The eyebrow's right side: a quiet plan's note, else the honest ETA, else nothing.
function rightOfEyebrow(model: PlanSvgModel): string {
  if (model.note !== '') return model.note
  const eta = etaOf(model.plan, model.tracks)

  return eta === null ? '' : `kalan ~${formatDuration(eta)}`
}

// Eyebrow with the ETA or the plan's state on its right, the count as the headline, a full-width meter, then the plan's source.
function header(model: PlanSvgModel): Block {
  const progress = progressOf(model.plan)
  const right = rightOfEyebrow(model)
  const fill = Math.round((model.width * progress.percent) / 100)
  const source = wrap(model.plan.source, { width: model.width, size: SOURCE_SIZE, maxLines: 2 })
  const parts = [
    `<text x="0" y="14" class="eyebrow f-plan">${eyebrow('Plan')}</text>`,
    right === '' ? '' : `<text x="${model.width}" y="14" text-anchor="end" class="label lo">${escape(right)}</text>`,
    `<text x="0" y="42"><tspan class="headline hi">${progress.done} / ${progress.total} adım</tspan><tspan class="headline mid"> · ${percentText(progress)}</tspan></text>`,
    `<rect x="0" y="${METER_Y}" width="${model.width}" height="${METER_H}" rx="3" fill="var(--track)"/>`,
    fill > 0 ? `<rect x="0" y="${METER_Y}" width="${Math.max(METER_H, fill)}" height="${METER_H}" rx="3" fill="var(--plan)"/>` : '',
    ...source.map((line, n) => `<text x="0" y="${SOURCE_Y + n * SOURCE_LINE}" class="micro lo" font-size="${SOURCE_SIZE}">${escape(line)}</text>`),
  ]

  return { svg: parts.join(''), height: SOURCE_Y + (source.length - 1) * SOURCE_LINE + LIST_GAP }
}

function rightText(model: PlanSvgModel, step: Step, isCurrent: boolean): { text: string; cls: string } {
  const elapsed = durationOf(model.tracks[step.key], model.now)
  const time = elapsed === null ? '' : formatDuration(elapsed)
  if (step.status === 'completed') return { text: time, cls: 'lo' }
  if (isCurrent) return { text: time, cls: model.note === '' ? 'f-plan' : 'lo' }
  const checks = step.checksTotal > 0 ? `${step.checksDone}/${step.checksTotal}` : ''

  return { text: [checks, step.status === 'in_progress' ? time : ''].filter(Boolean).join(' · '), cls: 'lo' }
}

function rowSvg(model: PlanSvgModel, row: Placed): string {
  const state = row.isCurrent ? 'current' : row.step.status === 'completed' ? 'done' : 'next'
  const right = rightText(model, row.step, row.isCurrent)
  const titleCls = row.isCurrent ? 'title hi' : state === 'done' ? 'label lo' : 'label mid'
  const size = row.isCurrent ? '' : ` font-size="${TITLE_SIZE}"`
  const cy = row.top + DOT_CY
  const parts = [
    row.isCurrent ? `<circle cx="${DOT_X}" cy="${cy}" r="13.5" fill="none" stroke="var(--plan-l)" stroke-width="1.5"${model.note === '' ? ' class="breathe"' : ''}/>` : '',
    stepDot({ cx: DOT_X, cy, n: row.index + 1, state, tone: 'moss' }),
    ...row.title.map((line, n) => `<text x="${TITLE_X}" y="${row.top + TITLE_BASE + n * LINE}" class="${titleCls}"${size}>${escape(line)}</text>`),
    right.text === '' ? '' : `<text x="${model.width - RIGHT_GAP}" y="${row.top + TITLE_BASE}" text-anchor="end" class="mono micro ${right.cls}">${right.text}</text>`,
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
  const above = placed.start > 0 ? `<text x="${TITLE_X}" y="${head.height + 13}" class="micro lo">✓ ${placed.start} adım daha</text>` : ''
  const below = placed.end < steps.length ? `<text x="${TITLE_X}" y="${bottom + 14}" class="micro lo">+${steps.length - placed.end} adım daha</text>` : ''
  const height = bottom + (below === '' ? 4 : MORE_H)
  const tints = rows.filter(row => row.isCurrent).map(row => `<rect x="0" y="${row.top + 1}" width="${model.width}" height="${row.height - 2}" rx="9" class="row-on"/>`)
  const body = [head.svg, above, ...tints, ...rails, ...rows.map(row => rowSvg(model, row)), below].join('')

  return { source: svgDoc({ width: model.width, height, theme: model.theme }, body, CSS), height }
}
