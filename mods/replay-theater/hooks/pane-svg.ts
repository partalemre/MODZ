import { countChanges } from './diff'
import type { ReplayExplain, ReplayStep } from '../types'
import { escape, eyebrow, fit, measure, wrap } from './ui/svg'
import { DOT_CSS, stepDot, stepRail } from './ui/steps'
import { svgDoc } from './ui/theme'
import type { Theme } from './ui/theme'

// `ask` is the prompt that started the turn and `age` how long ago it ended ("3 dk önce"); '' when unknown.
export type PaneModel = { steps: ReplayStep[]; index: number; explain: ReplayExplain; theme: Theme; width: number; ask?: string; age?: string }

const ROW = 32
const ROWS_MAX = 8
const HEAD_TOP = 118
const ASK_LINE = 24
const DOT_X = 16
const NAME_X = 38
const COUNT_SIZE = 11.5
const NOTE_SIZE = 13
const NOTE_LINE = 18
const NOTE_LINES_MAX = 3
const META_LINE = 17
const PILL_H = 24
const CSS = `${DOT_CSS}.row-on{fill:var(--plan-t)}.shimmer{animation:sh 1.4s ease-in-out infinite}@keyframes sh{50%{opacity:.45}}`

export const baseName = (file: string): string => file.split('/').pop() ?? file
export const folderOf = (file: string): string => (file.includes('/') ? file.slice(0, file.lastIndexOf('/')) : '')

export function totals(steps: ReplayStep[]): { add: number; del: number; files: number } {
  const counts = steps.map(step => countChanges(step.diff))

  return {
    add: counts.reduce((sum, c) => sum + c.add, 0),
    del: counts.reduce((sum, c) => sum + c.del, 0),
    files: new Set(steps.map(step => step.file)).size,
  }
}

export function windowOf(total: number, current: number): { start: number; end: number } {
  if (total <= ROWS_MAX) return { start: 0, end: total }
  const start = Math.max(0, Math.min(current - 2, total - ROWS_MAX))

  return { start, end: start + ROWS_MAX }
}

function counts(step: ReplayStep, right: number, cy: number): { svg: string; width: number } {
  const { add, del } = countChanges(step.diff)
  const minus = `−${del}`
  const plus = `+${add}`
  const plusEnd = right - measure(minus, COUNT_SIZE, true) - 8
  const svg = `<text x="${plusEnd}" y="${cy + 4}" text-anchor="end" class="mono micro f-ok">${plus}</text><text x="${right}" y="${cy + 4}" text-anchor="end" class="mono micro f-danger">${minus}</text>`

  return { svg, width: right - plusEnd + measure(plus, COUNT_SIZE, true) }
}

function row(model: PaneModel, k: number, cy: number): string {
  const step = model.steps[k] as ReplayStep
  const state = k === model.index ? 'current' : k < model.index ? 'done' : 'next'
  const right = counts(step, model.width - 10, cy)
  const room = model.width - NAME_X - right.width - 14
  const name = fit(baseName(step.file), room, 13)
  const nameCls = state === 'current' ? 'title hi' : 'label mid'
  const folder = folderOf(step.file)
  const folderRoom = room - measure(name, 13) - 10
  const dim = folder === '' || folderRoom < 24 ? '' : `<tspan dx="8" class="label lo">${escape(fit(folder, folderRoom, 12))}</tspan>`
  const label = `<text x="${NAME_X}" y="${cy + 4.5}"><tspan class="${nameCls}">${escape(name)}</tspan>${dim}</text>`

  return `${stepDot({ cx: DOT_X, cy, n: k + 1, state })}${label}${right.svg}`
}

function headOf(model: PaneModel): { svg: string[]; listTop: number } {
  const sum = totals(model.steps)
  const age = model.age ?? ''
  const ask = model.ask ?? ''
  const askLine = ask === '' ? '' : `<text x="0" y="82" class="mid" font-size="12.5" font-style="italic">${escape(fit(`“${ask}”`, model.width, 12.5))}</text>`
  const listTop = HEAD_TOP - (ask === '' ? ASK_LINE : 0)

  return {
    svg: [
      `<rect x="0" y="5" width="6" height="6" rx="1.5" fill="var(--plan)"/><text x="13" y="12" class="eyebrow f-plan">${eyebrow('Tekrar')}</text>`,
      age === '' ? '' : `<text x="${model.width}" y="12" text-anchor="end" class="label lo">${escape(age)}</text>`,
      `<text x="0" y="40" class="headline hi">${sum.files} dosyada ${model.steps.length} düzenleme</text>`,
      `<text x="0" y="60" class="label"><tspan class="f-ok">${sum.add} satır eklendi</tspan><tspan class="lo">, </tspan><tspan class="f-danger">${sum.del} silindi</tspan></text>`,
      askLine,
      `<text x="0" y="${listTop - 12}" class="eyebrow lo">${eyebrow('Sırayla düzenlemeler')}</text>`,
    ],
    listTop,
  }
}

// The eyebrow and age, "4 dosyada 4 düzenleme", the totals, the prompt that started the turn, then every
// edit as a numbered circle on a rail.
export function overviewSvg(model: PaneModel): { source: string; height: number } {
  const head = headOf(model)
  const shown = windowOf(model.steps.length, model.index)
  const centers = Array.from({ length: shown.end - shown.start }, (_, n) => head.listTop + n * ROW + ROW / 2)
  const rails = centers.slice(1).map((cy, n) => stepRail(DOT_X, centers[n] as number, cy))
  const rows = centers.map((cy, n) => row(model, shown.start + n, cy))
  const at = model.index - shown.start
  const tint = at >= 0 && at < centers.length ? `<rect x="0" y="${(centers[at] as number) - 15}" width="${model.width}" height="30" rx="8" class="row-on"/>` : ''
  const more = moreLines(model.steps.length, shown, head.listTop + centers.length * ROW)
  const height = head.listTop + centers.length * ROW + more.height + 4

  return { source: svgDoc({ width: model.width, height, theme: model.theme }, [...head.svg, tint, ...rails, ...rows, more.svg].join(''), CSS), height }
}

function moreLines(total: number, shown: { start: number; end: number }, top: number): { svg: string; height: number } {
  const parts = [shown.start > 0 ? `↑ ${shown.start} önceki` : '', shown.end < total ? `↓ ${total - shown.end} düzenleme daha` : ''].filter(Boolean)
  if (parts.length === 0) return { svg: '', height: 0 }

  return { svg: `<text x="${NAME_X}" y="${top + 14}" class="micro lo">${parts.join(' · ')}</text>`, height: 20 }
}

function noteBlock(model: PaneModel, step: ReplayStep, top: number): { svg: string; height: number } {
  if (step.said === undefined && model.explain !== 'pending') return { svg: '', height: 0 }
  if (step.said === undefined) {
    const bar = `<rect x="12" y="${top + 4}" width="${Math.round(model.width * 0.55)}" height="10" rx="5" fill="var(--track)" class="shimmer"/>`

    return { svg: `<rect x="0" y="${top}" width="2.5" height="18" rx="1.25" fill="var(--line2)"/>${bar}`, height: 18 + 12 }
  }
  const lines = wrap(step.said, { width: model.width - 14, size: NOTE_SIZE, maxLines: NOTE_LINES_MAX })
  const text = lines.map((line, n) => `<text x="12" y="${top + 13 + n * NOTE_LINE}" class="mid" font-size="${NOTE_SIZE}">${escape(line)}</text>`)
  const height = lines.length * NOTE_LINE

  return { svg: `<rect x="0" y="${top}" width="2.5" height="${height}" rx="1.25" fill="var(--plan-l)"/>${text.join('')}`, height: height + 12 }
}

function planPill(model: PaneModel, step: ReplayStep, top: number): { svg: string; height: number } {
  if (step.plan === undefined) return { svg: '', height: 0 }
  const lead = `Plan adımı ${step.plan.index}/${step.plan.total}`
  const leadWidth = measure(lead, 11.5) + 4
  const title = fit(step.plan.title, model.width - leadWidth - 54, 11.5)
  const width = Math.min(model.width, 30 + leadWidth + (title === '' ? 0 : measure(` · ${title}`, 11.5) + 6) + 12)
  const flag = `<path d="M13 ${top + 7}v11M13 ${top + 7.5}h7l-1.6 2.6 1.6 2.6h-7" fill="none" stroke="var(--plan)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>`
  const label = `<text x="28" y="${top + 16}" font-size="11.5"><tspan class="f-plan" font-weight="650">${escape(lead)}</tspan>${title === '' ? '' : `<tspan class="mid"> · ${escape(title)}</tspan>`}</text>`

  return { svg: `<rect x="0.5" y="${top + 0.5}" width="${width - 1}" height="${PILL_H - 1}" rx="${PILL_H / 2}" fill="var(--plan-t)" stroke="var(--plan-l)"/>${flag}${label}`, height: PILL_H + 12 }
}

// "DÜZENLEME 2 / 4", the file, where it lives and the tool, what the change does and the plan step it served.
export function detailSvg(model: PaneModel): { source: string; height: number } {
  const step = model.steps[model.index] as ReplayStep
  const { add, del } = countChanges(step.diff)
  const meta = [step.file, step.tool, step.note].filter(Boolean).join(' · ')
  // A deep path wraps under the name rather than losing its middle.
  const metaLines = wrap(meta, { width: model.width, size: 12, maxLines: 2 })
  const head = [
    `<line x1="0" y1="0.5" x2="${model.width}" y2="0.5" stroke="var(--line)"/>`,
    `<text x="0" y="30" class="eyebrow f-plan">${eyebrow(`Düzenleme ${model.index + 1} / ${model.steps.length}`)}</text>`,
    `<text x="${model.width}" y="30" text-anchor="end" class="mono micro"><tspan class="f-ok">+${add}</tspan><tspan dx="6" class="f-danger">−${del}</tspan></text>`,
    `<text x="0" y="54" class="headline hi">${escape(fit(baseName(step.file), model.width, 17))}</text>`,
    ...metaLines.map((part, n) => `<text x="0" y="${74 + n * META_LINE}" class="label lo">${escape(part)}</text>`),
  ]
  const top = 88 + Math.max(0, metaLines.length - 1) * META_LINE
  const note = noteBlock(model, step, top)
  const pill = planPill(model, step, top + note.height)
  const height = top + note.height + pill.height

  return { source: svgDoc({ width: model.width, height, theme: model.theme }, [...head, note.svg, pill.svg].join(''), CSS), height }
}
