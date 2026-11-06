import { fileLabel, projectLabels } from './card'
import { agentCrab, box, C, circle, ease, fitBody, fitSize, H, INNER, PAD, rise, sheet, txt, W } from './film-parts'
import type { SlideCtx } from './film-parts'
import { counted, quote } from './story-a'
import { storyWords } from './story-words'
import { compact, monthName, shortMonth } from './words'
import type { Named } from '../types'
import { NOVEL_TOKENS } from './stats'

// The story's second half: what the year went to. A ranked page reads like a chart, biggest on top.

const MID = W / 2
const CRAB_W = 30

/** The short name a tool goes by: an MCP tool's own last word. */
export const toolName = (name: string): string => name.split('__').at(-1) ?? name

type Ranked = { title: string; meta: string }
type RankOpts = { y: number; rowH: number; title: string; meta: string; rank: string; start: number }

function rankedRows(rows: readonly Ranked[], t: number, o: RankOpts): string {
  return rows
    .map((row, index) => {
      const y = o.y + index * o.rowH
      const body = [
        txt(String(index + 1), { x: PAD, y: y + 40, size: 56, fill: o.rank, isDisplay: true }),
        txt(fitBody(row.title, 31, INNER - 76), { x: PAD + 76, y: y + 18, size: 31, fill: o.title, isBold: true }),
        txt(row.meta, { x: PAD + 76, y: y + 52, size: 23, fill: o.meta }),
      ].join('')

      return rise(body, ease(t, o.start + index * 0.3))
    })
    .join('')
}

export function projectsSlide({ w, t, isNamed }: SlideCtx): string {
  const s = storyWords()
  const labels = projectLabels(w, isNamed)
  const rows = w.projects.map((row: Named) => ({ title: labels.get(row.name) ?? row.name, meta: s.promptsCount(row.count) }))

  return [
    sheet(C.cream),
    circle(W, 90, 170 + Math.sin(t) * 10, C.clay),
    rise(txt(s.projects, { x: PAD, y: 200, size: fitSize(s.projects, 46, INNER), fill: C.ink, isDisplay: true }), ease(t, 0)),
    rankedRows(rows, t, { y: 275, rowH: 122, title: C.ink, meta: C.ink, rank: C.clay, start: 0.4 }),
  ].join('')
}

export function monthsSlide({ w, t, isNamed }: SlideCtx): string {
  const s = storyWords()
  const labels = projectLabels(w, isNamed)
  const most = Math.max(1, ...w.months.map(month => month.prompts))
  const peak = w.months.find(month => month.prompts === most)
  const each = INNER / Math.max(1, w.months.length)
  const bars = w.months.map((month, index) => {
    const height = 370 * (month.prompts / most) * ease(t, 0.4 + index * 0.1, 0.7)
    const x = PAD + index * each

    return box({ x, y: 810 - height, w: each - 8, h: height, r: 8, fill: month === peak ? C.amber : C.cream }) + txt(shortMonth(month.month), { x: x + (each - 8) / 2, y: 846, size: 20, fill: C.cream, anchor: 'middle' })
  })
  const name = peak === undefined ? '' : monthName(peak.month)
  const project = peak?.project === null || peak === undefined ? '—' : (labels.get(peak.project) ?? '—')

  return [
    sheet(C.sky),
    rise(txt(s.months, { x: PAD, y: 130, size: 34, fill: C.cream, isBold: true }), ease(t, 0)),
    rise(txt(name, { x: PAD, y: 245, size: fitSize(name, 92, INNER), fill: C.amber, isDisplay: true }), ease(t, 0.25)),
    rise(txt(fitBody(s.monthPeak(project, peak?.prompts ?? 0), 27, INNER), { x: PAD, y: 300, size: 27, fill: C.cream }), ease(t, 0.5)),
    bars.join(''),
  ].join('')
}

export function toolsSlide({ w, t }: SlideCtx): string {
  const s = storyWords()
  const top = w.tools[0]
  // The rest against each other: beside the favorite they would all read as nothing.
  const most = Math.max(1, w.tools[1]?.count ?? 1)
  const rows = w.tools.slice(1).map((row, index) => {
    const y = 470 + index * 92
    const width = INNER * (row.count / most) * ease(t, 0.7 + index * 0.2, 0.7)

    return rise(txt(fitBody(toolName(row.name), 28, INNER - 110), { x: PAD, y, size: 28, fill: C.ink, isBold: true }) + txt(compact(row.count), { x: W - PAD, y, size: 25, fill: C.ink, anchor: 'end' }), ease(t, 0.6 + index * 0.2)) + box({ x: PAD, y: y + 16, w: INNER, h: 16, r: 8, fill: C.ink, opacity: 0.15 }) + box({ x: PAD, y: y + 16, w: width, h: 16, r: 8, fill: C.ink })
  })
  const name = toolName(top?.name ?? '—')

  return [
    sheet(C.amber),
    rise(txt(s.tools, { x: PAD, y: 150, size: 34, fill: C.ink, isBold: true }), ease(t, 0)),
    rise(txt(name, { x: PAD, y: 280, size: fitSize(name, 112, INNER), fill: C.ink, isDisplay: true }), ease(t, 0.25)),
    rise(txt(s.times(top?.count ?? 0), { x: PAD, y: 345, size: 36, fill: C.ink }), ease(t, 0.5)),
    rows.join(''),
  ].join('')
}

export function codeSlide({ w, t, isNamed }: SlideCtx): string {
  const s = storyWords()
  const file = w.files[0]
  const fileName = file === undefined ? '' : fileLabel(file.name, isNamed)

  return [
    sheet(C.rose),
    circle(0, H, 170 + Math.sin(t) * 12, C.violet),
    txt(counted(w.linesAdded, t), { x: PAD, y: 300, size: fitSize(w.linesAdded.toLocaleString('en-US'), 120, INNER), fill: C.ink, isDisplay: true }),
    rise(txt(s.lines, { x: PAD, y: 360, size: 36, fill: C.ink, isBold: true }), ease(t, 0.6)),
    file === undefined ? '' : rise(txt(s.file, { x: PAD, y: 490, size: 28, fill: C.ink }) + txt(fitBody(fileName, 40, INNER), { x: PAD, y: 545, size: 40, fill: C.cream, isBold: true }) + txt(s.fileCount(file.count), { x: PAD, y: 590, size: 28, fill: C.ink }), ease(t, 1)),
    rise(quote(s.novels(Math.max(1, Math.round(w.outputTokens / NOVEL_TOKENS))), { y: 700, fill: C.ink, size: 27 }), ease(t, 1.5)),
  ].join('')
}

const CREW = { max: 40, columns: 8 } as const

export function crewSlide({ w, t, step }: SlideCtx): string {
  const s = storyWords()
  const each = Math.max(1, Math.ceil(w.agentRuns / CREW.max))
  const shown = Math.ceil(w.agentRuns / each)
  const size = INNER / CREW.columns
  const crabs = Array.from({ length: Math.ceil(shown * ease(t, 0.7, 1.8)) }, (_, index) => {
    const agent = w.agents[index % Math.max(1, w.agents.length)]

    return agentCrab(agent?.type ?? 'agent', index, { x: PAD + (index % CREW.columns) * size, y: 350 + Math.floor(index / CREW.columns) * size, scale: (size - 6) / CRAB_W, step: step + index })
  })
  const top = w.agents.slice(0, 3).map((agent, index) => txt(fitBody(`${agent.type}: ${s.runs(agent.runs)}`, 25, INNER), { x: PAD, y: 700 + index * 38, size: 25, fill: index === 0 ? C.amber : C.cream }))

  return [
    sheet(C.ink),
    txt(counted(w.agentRuns, t), { x: PAD, y: 220, size: fitSize(w.agentRuns.toLocaleString('en-US'), 120, INNER), fill: C.amber, isDisplay: true }),
    rise(txt(s.crew, { x: PAD, y: 280, size: 36, fill: C.cream, isBold: true }), ease(t, 0.5)),
    crabs.join(''),
    rise(top.join(''), ease(t, 2)),
    rise(txt(each > 1 ? `${s.crewEach(each)} · ${s.crewMeta(w.agentTools)}` : s.crewMeta(w.agentTools), { x: PAD, y: 860, size: 21, fill: C.cream, opacity: 0.7 }), ease(t, 2.2)),
  ].join('')
}

export function hardestSlide({ w, t, step, isNamed }: SlideCtx): string {
  const s = storyWords()
  const hardest = w.hardest
  if (hardest === null) return sheet(C.clay)
  const rank = Math.max(0, w.agents.findIndex(agent => agent.type === hardest.type))
  const scale = 8
  const title = isNamed && hardest.description !== '' ? hardest.description : hardest.type

  return [
    sheet(C.clay),
    circle(MID, 370, 190 + Math.sin(t * 1.4) * 10, C.amber),
    rise(txt(s.hardest, { x: MID, y: 130, size: 34, fill: C.ink, isBold: true, anchor: 'middle' }), ease(t, 0)),
    rise(agentCrab(hardest.type, rank, { x: MID - (CRAB_W * scale) / 2, y: 262, scale, step }), ease(t, 0.2)),
    txt(counted(hardest.tools, t), { x: MID, y: 700, size: 110, fill: C.ink, isDisplay: true, anchor: 'middle' }),
    rise(txt(s.hardestMeta(hardest.tokens), { x: MID, y: 755, size: 25, fill: C.ink, anchor: 'middle' }), ease(t, 1.2)),
    rise(quote(title, { y: 815, fill: C.ink, size: 25, anchor: 'middle' }), ease(t, 1.5)),
  ].join('')
}

export function modelSlide({ w, t }: SlideCtx): string {
  const s = storyWords()
  const total = Math.max(1, w.models.reduce((sum, row) => sum + row.count, 0))
  const top = w.models[0]
  const share = Math.round(((top?.count ?? 0) / total) * 100)
  const paints = [C.ink, C.clay, C.violet, C.moss, C.sky]
  let x = PAD
  const stack = w.models.map((row, index) => {
    const width = (INNER * row.count) / total
    const part = box({ x, y: 500, w: Math.max(0, width * ease(t, 0.7, 0.8) - 3), h: 54, fill: paints[index % paints.length] as string, r: 6 })
    x += width

    return part
  })
  const rows = w.models.slice(0, 4).map((row, index) => txt(`${row.name} · %${Math.round((row.count / total) * 100)}`, { x: PAD, y: 625 + index * 44, size: 26, fill: C.ink }))

  return [
    sheet(C.cream),
    rise(txt(s.model, { x: PAD, y: 160, size: 34, fill: C.ink, isBold: true }), ease(t, 0)),
    rise(txt(top?.name ?? '—', { x: PAD, y: 300, size: fitSize(top?.name ?? '—', 92, INNER), fill: C.violet, isDisplay: true }), ease(t, 0.25)),
    rise(txt(s.modelShare(share), { x: PAD, y: 365, size: 30, fill: C.ink }), ease(t, 0.5)),
    stack.join(''),
    rise(rows.join(''), ease(t, 1.3)),
  ].join('')
}
