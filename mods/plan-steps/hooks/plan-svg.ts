import type { Plan, Step } from './match'
import { anchorIndex, currentIndex, durationOf, etaOf, formatDuration, percentText, progressOf, windowOf } from './progress'
import type { Tracks } from './progress'
import { escape, eyebrow, fit, measure } from './ui/svg'
import { DOT_CSS, stepDot, stepRail } from './ui/steps'
import { svgDoc } from './ui/theme'
import type { Theme } from './ui/theme'

export type PlanSvgModel = { plan: Plan; tracks: Tracks; now: number; theme: Theme; width: number }
export type Details = { summary: string; agents: string[] }

const ROW = 32
const DETAIL = 19
const LIST_TOP = 84
const DOT_X = 16
const TITLE_X = 38
const MORE_H = 20
const ROOM_STEPS = 12
const METER_Y = 56
const CSS = `${DOT_CSS}.row-on{fill:var(--plan-t)}.breathe{animation:br 1.8s ease-in-out infinite}@keyframes br{50%{opacity:.25}}`

type Placed = { step: Step; index: number; top: number; height: number; isCurrent: boolean }

function header(model: PlanSvgModel): string {
  const progress = progressOf(model.plan)
  const eta = etaOf(model.plan, model.tracks)
  const etaText = eta === null ? '' : `kalan ~${formatDuration(eta)}`
  const etaWidth = etaText === '' ? 0 : measure(etaText, 12) + 12
  const track = model.width - etaWidth
  const fill = Math.round((track * progress.percent) / 100)

  return [
    `<text x="0" y="14" class="eyebrow f-plan">${eyebrow('Plan')}</text>`,
    `<text x="${model.width}" y="14" text-anchor="end" class="micro lo">${escape(fit(model.plan.source, model.width - 60, 10.5))}</text>`,
    `<text x="0" y="42"><tspan class="headline hi">${progress.done} / ${progress.total} adım</tspan><tspan class="headline mid"> · ${percentText(progress)}</tspan></text>`,
    `<rect x="0" y="${METER_Y}" width="${track}" height="6" rx="3" fill="var(--track)"/>`,
    fill > 0 ? `<rect x="0" y="${METER_Y}" width="${Math.max(6, fill)}" height="6" rx="3" fill="var(--plan)"/>` : '',
    etaText === '' ? '' : `<text x="${model.width}" y="${METER_Y + 6}" text-anchor="end" class="label lo">${etaText}</text>`,
  ].join('')
}

function rightText(model: PlanSvgModel, row: Placed): { text: string; cls: string } {
  const elapsed = durationOf(model.tracks[row.step.key], model.now)
  const time = elapsed === null ? '' : formatDuration(elapsed)
  if (row.step.status === 'completed') return { text: time, cls: 'lo' }
  if (row.isCurrent) return { text: time, cls: 'f-plan' }
  const checks = row.step.checksTotal > 0 ? `${row.step.checksDone}/${row.step.checksTotal}` : ''

  return { text: [checks, row.step.status === 'in_progress' ? time : ''].filter(Boolean).join(' · '), cls: 'lo' }
}

function detailSvg(model: PlanSvgModel, details: Details, top: number): string {
  const room = model.width - TITLE_X - 10
  const lines: string[] = []
  if (details.summary !== '') lines.push(`<text x="${TITLE_X}" y="${top + 13}" class="label lo">${escape(fit(details.summary, room, 12))}</text>`)
  details.agents.forEach((agent, n) => {
    const y = top + ((details.summary === '' ? 0 : 1) + n) * DETAIL + 13
    lines.push(`<circle cx="${TITLE_X + 4}" cy="${y - 4}" r="3.5" class="f-run breathe"/><text x="${TITLE_X + 14}" y="${y}" class="label"><tspan class="mid">${escape(fit(agent, room - 80, 12))}</tspan><tspan class="lo"> · çalışıyor</tspan></text>`)
  })

  return lines.join('')
}

function rowSvg(model: PlanSvgModel, row: Placed, details: Details): string {
  const cy = row.top + ROW / 2
  const state = row.isCurrent ? 'current' : row.step.status === 'completed' ? 'done' : 'next'
  const right = rightText(model, row)
  const rightWidth = right.text === '' ? 0 : measure(right.text, 11.5, true) + 12
  const titleCls = row.isCurrent ? 'title hi' : state === 'done' ? 'label lo' : 'label mid'
  const title = escape(fit(row.step.title, model.width - TITLE_X - rightWidth - 10, row.isCurrent ? 13.5 : 13))
  const parts = [
    row.isCurrent ? `<circle cx="${DOT_X}" cy="${cy}" r="13.5" fill="none" stroke="var(--plan-l)" stroke-width="1.5" class="breathe"/>` : '',
    stepDot({ cx: DOT_X, cy, n: row.index + 1, state, tone: 'moss' }),
    `<text x="${TITLE_X}" y="${cy + 4.5}" class="${titleCls}" ${row.isCurrent ? '' : 'font-size="13"'}>${title}</text>`,
    right.text === '' ? '' : `<text x="${model.width - 10}" y="${cy + 4}" text-anchor="end" class="mono micro ${right.cls}">${right.text}</text>`,
    row.isCurrent ? detailSvg(model, details, row.top + ROW - 6) : '',
  ]

  return parts.join('')
}

function place(model: PlanSvgModel, details: Details, top: number): { rows: Placed[]; start: number; end: number } {
  const { steps } = model.plan
  const current = currentIndex(steps, model.tracks)
  const shown = windowOf(steps.length, anchorIndex(steps, model.tracks), ROOM_STEPS)
  const extra = (details.summary === '' ? 0 : 1) + details.agents.length
  let y = top
  const rows = steps.slice(shown.start, shown.end).map((step, offset) => {
    const index = shown.start + offset
    const isCurrent = index === current
    const height = ROW + (isCurrent && extra > 0 ? extra * DETAIL + 2 : 0)
    const placed = { step, index, top: y, height, isCurrent }
    y += height

    return placed
  })

  return { rows, ...shown }
}

// The plan as one drawing: progress, an honest ETA, then every step on a rail of numbered circles.
export function planSvg(model: PlanSvgModel, details: Details): { source: string; height: number } {
  const { steps } = model.plan
  const placed = place(model, details, LIST_TOP + MORE_H)
  const hasAbove = placed.start > 0
  const shift = hasAbove ? 0 : MORE_H
  const rows = placed.rows.map(row => ({ ...row, top: row.top - shift }))
  const centers = rows.map(row => row.top + ROW / 2)
  const rails = centers.slice(1).map((cy, n) => stepRail(DOT_X, centers[n] as number, cy))
  const last = rows[rows.length - 1]
  const bottom = last === undefined ? LIST_TOP : last.top + last.height
  const above = hasAbove ? `<text x="${TITLE_X}" y="${LIST_TOP + 13}" class="micro lo">✓ ${placed.start} adım daha</text>` : ''
  const below = placed.end < steps.length ? `<text x="${TITLE_X}" y="${bottom + 14}" class="micro lo">+${steps.length - placed.end} adım daha</text>` : ''
  const height = bottom + (below === '' ? 4 : MORE_H + 2)
  const tints = rows.filter(row => row.isCurrent).map(row => `<rect x="0" y="${row.top + 1}" width="${model.width}" height="${row.height - 2}" rx="9" class="row-on"/>`)
  const body = [header(model), above, ...tints, ...rails, ...rows.map(row => rowSvg(model, row, details)), below].join('')

  return { source: svgDoc({ width: model.width, height, theme: model.theme }, body, CSS), height }
}

export function emptySvg(theme: Theme, width: number): { source: string; height: number } {
  const body = `<text x="0" y="14" class="eyebrow f-plan">${eyebrow('Plan')}</text><text x="0" y="42" class="headline hi">Henüz plan yok</text>`

  return { source: svgDoc({ width, height: 50, theme }, body), height: 50 }
}
