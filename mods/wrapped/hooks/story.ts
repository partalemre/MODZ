import { agentCrab, box, C, circle, ease, fitBody, fitSize, H, INNER, PAD, pixelText, rise, SETTLED, sheet, txt, W } from './film-parts'
import type { SlideCtx } from './film-parts'
import { projectLabels } from './card'
import { daySlide, hourSlide, introSlide, promptsSlide, weekdaySlide, quote } from './story-a'
import { codeSlide, crewSlide, hardestSlide, modelSlide, monthsSlide, projectsSlide, toolName, toolsSlide } from './story-b'
import { storyWords } from './story-words'
import { compact, personaLine, personaName, words } from './words'
import { toPic } from './kit/svg'
import type { SvgPic } from './kit/svg'
import type { Wrapped } from '../types'

// The story: the pages in order, the same in the pane and the film. A page the year has nothing for is left out.

const MID = W / 2
const CRAB_W = 30
const SEGMENT = { y: 24, h: 5, gap: 4 } as const

export type Slide = { key: string; draw: (c: SlideCtx) => string; dur: number; isFor?: (w: Wrapped) => boolean; isLight?: boolean }

function funSlide({ w, t }: SlideCtx): string {
  const s = storyWords()
  const rows = [
    { value: compact(w.rightCount), label: s.funRight, on: w.rightCount > 0 },
    { value: compact(w.stops), label: s.funStops, on: w.stops > 0 },
    { value: compact(w.longestChat), label: s.funChat, on: true },
    { value: `~$${compact(w.costUsd)}`, label: s.funCost, on: w.costUsd > 0 },
  ].filter(row => row.on)
  const body = rows.map((row, index) => {
    const y = 120 + index * 200

    return rise(txt(row.value, { x: PAD, y: y + 100, size: fitSize(row.value, 96, INNER), fill: index % 2 === 0 ? C.amber : C.cream, isDisplay: true }) + txt(fitBody(row.label, 27, INNER), { x: PAD, y: y + 145, size: 27, fill: C.cream }), ease(t, 0.15 + index * 0.55))
  })

  return [sheet(C.violet), circle(W, H, 130 + Math.sin(t) * 10, C.rose), body.join('')].join('')
}

function personaSlide({ w, t, step }: SlideCtx): string {
  const s = storyWords()
  const scale = 8
  const name = personaName(w.persona)

  return [
    sheet(C.ink),
    circle(MID, 540, 480 * ease(t, 0.5, 1) + Math.sin(t) * 8, C.clay),
    rise(txt(s.persona, { x: MID, y: 90, size: 32, fill: C.cream, isBold: true, anchor: 'middle' }), ease(t, 0)),
    rise(txt(name, { x: MID, y: 270, size: fitSize(name, 90, INNER), fill: C.ink, isDisplay: true, anchor: 'middle' }), ease(t, 1.1)),
    rise(agentCrab(w.agents[0]?.type ?? 'agent', 1, { x: MID - (CRAB_W * scale) / 2, y: 345, scale, step }), ease(t, 1.3)),
    rise(quote(personaLine(w.persona), { y: 690, fill: C.ink, size: 30, lines: 3, anchor: 'middle' }), ease(t, 1.7)),
  ].join('')
}

function statGrid(w: Wrapped, y: number): string {
  const s = storyWords().stats
  const stats = [
    { value: compact(w.prompts), label: s.prompts },
    { value: compact(w.sessions), label: s.chats },
    { value: String(w.activeDays), label: s.days },
    { value: String(w.streak), label: s.streak },
    { value: compact(w.linesAdded), label: s.lines },
    { value: compact(w.agentRuns), label: s.agents },
  ]

  return stats.map((stat, index) => {
    const x = PAD + (index % 3) * (INNER / 3)
    const top = y + Math.floor(index / 3) * 104

    return txt(stat.value, { x, y: top + 44, size: fitSize(stat.value, 44, INNER / 3 - 12), fill: C.amber, isDisplay: true }) + txt(stat.label, { x, y: top + 76, size: 21, fill: C.cream })
  }).join('')
}

function topList(o: { x: number; y: number; title: string; rows: readonly string[] }): string {
  const room = INNER / 2 - 14
  const rows = o.rows.map((row, index) => txt(fitBody(`${index + 1}  ${row}`, 24, room), { x: o.x, y: o.y + 40 + index * 36, size: 24, fill: C.cream, isBold: index === 0 }))

  return txt(o.title, { x: o.x, y: o.y, size: 21, fill: C.cream, opacity: 0.65 }) + rows.join('')
}

/** The last page and the image people share: the whole year at a glance. */
export function summarySlide({ w, t, isNamed, step }: SlideCtx): string {
  const s = storyWords()
  const labels = projectLabels(w, isNamed)
  const name = personaName(w.persona)
  const crabX = W - PAD - CRAB_W * 3.4

  return [
    sheet(C.ink),
    box({ x: 0, y: 0, w: W, h: 330, fill: C.clay }),
    rise(txt(s.shareTitle(w.year), { x: PAD, y: 110, size: 27, fill: C.ink, isBold: true }), ease(t, 0)),
    rise(txt(name, { x: PAD, y: 205, size: fitSize(name, 72, INNER - 60), fill: C.ink, isDisplay: true }), ease(t, 0.2)),
    rise(quote(personaLine(w.persona), { y: 256, fill: C.ink, size: 23 }), ease(t, 0.4)),
    agentCrab(w.agents[0]?.type ?? 'agent', 1, { x: crabX, y: 50, scale: 3.4, step }),
    rise(statGrid(w, 365), ease(t, 0.6)),
    rise(topList({ x: PAD, y: 625, title: s.shareProjects, rows: w.projects.slice(0, 3).map(row => labels.get(row.name) ?? row.name) }) + topList({ x: PAD + INNER / 2 + 14, y: 625, title: s.shareTools, rows: w.tools.slice(0, 3).map(row => toolName(row.name)) }), ease(t, 0.9)),
    rise(pixelText('MODZ', { x: PAD, y: 860, cell: 4, paint: 'edit' }) + txt('/wrapped', { x: W - PAD, y: 885, size: 25, fill: C.cream, anchor: 'end' }) , ease(t, 1.2)),
  ].join('')
}

const hasAgents = (w: Wrapped): boolean => w.agentRuns > 0

const SLIDES: Slide[] = [
  { key: 'intro', draw: introSlide, dur: 3.4 },
  { key: 'prompts', draw: promptsSlide, dur: 3.6 },
  { key: 'day', draw: daySlide, dur: 3.8, isFor: w => w.busiestDay !== null },
  { key: 'weekday', draw: weekdaySlide, dur: 3.6 },
  { key: 'hour', draw: hourSlide, dur: 3.6 },
  { key: 'projects', isLight: true, draw: projectsSlide, dur: 3.8, isFor: w => w.projects.length > 0 },
  { key: 'months', draw: monthsSlide, dur: 3.8, isFor: w => w.months.length > 1 },
  { key: 'tools', isLight: true, draw: toolsSlide, dur: 3.6, isFor: w => w.tools.length > 0 },
  { key: 'code', draw: codeSlide, dur: 3.6, isFor: w => w.linesAdded > 0 },
  { key: 'crew', draw: crewSlide, dur: 4.2, isFor: hasAgents },
  { key: 'hardest', draw: hardestSlide, dur: 3.4, isFor: w => w.hardest !== null },
  { key: 'model', isLight: true, draw: modelSlide, dur: 3.4, isFor: w => w.models.length > 0 },
  { key: 'fun', draw: funSlide, dur: 3.6 },
  { key: 'persona', draw: personaSlide, dur: 3.8 },
  { key: 'summary', draw: summarySlide, dur: 4.6 },
]

export const slidesFor = (w: Wrapped): Slide[] => SLIDES.filter(slide => slide.isFor === undefined || slide.isFor(w))

/** The story's bars at the top, as a phone shows them, in the ink the page's colour can carry. */
export function segments(slides: readonly Slide[], at: number, share: number): string {
  const count = slides.length
  const width = (W - 2 * 16 - (count - 1) * SEGMENT.gap) / count
  const fill = slides[at]?.isLight === true ? C.ink : C.white
  let body = ''
  for (let index = 0; index < count; index += 1) {
    const x = 16 + index * (width + SEGMENT.gap)
    const done = index < at ? 1 : index === at ? share : 0
    body += box({ x, y: SEGMENT.y, w: width, h: SEGMENT.h, r: 2.5, fill, opacity: 0.3 })
    if (done > 0) body += box({ x, y: SEGMENT.y, w: width * done, h: SEGMENT.h, r: 2.5, fill })
  }

  return body
}

export type PageSpec = { wrapped: Wrapped; isNamed: boolean }

/** One page at rest, for the pane: its `width` px across, its height the story's 9:16. */
export function pagePic(spec: PageSpec, index: number, width: number): SvgPic {
  const slides = slidesFor(spec.wrapped)
  const at = Math.max(0, Math.min(slides.length - 1, index))
  const slide = slides[at] as Slide
  const body = slide.draw({ w: spec.wrapped, isNamed: spec.isNamed, t: SETTLED, step: 0 }) + segments(slides, at, 1)
  const pic = toPic({ body, width: W, height: H, alt: words().title(spec.wrapped.year) })

  return { ...pic, width, height: Math.round((width * H) / W) }
}

/** The image people share. */
export const summaryPic = (spec: PageSpec): SvgPic =>
  toPic({ body: summarySlide({ w: spec.wrapped, isNamed: spec.isNamed, t: SETTLED, step: 0 }), width: W, height: H, alt: words().title(spec.wrapped.year) })
