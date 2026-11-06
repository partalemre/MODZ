import { agentCrab, box, C, circle, ease, fitSize, H, INNER, PAD, rise, sheet, txt, W, wrapBody } from './film-parts'
import type { SlideCtx } from './film-parts'
import { storyWords, weekdayName, weekdayShort } from './story-words'
import { shortDay } from './words'

// The story's first half: when the year happened. One big thought a page.

const MID = W / 2
const COUNT_S = 1.3
const DAY_MS = 86_400_000
const CELL_MAX = 30
const DAYS = 7
// Inside the page's edges, with room for its breathing.
const INTRO_RADIUS = 250

/** A figure that counts up to its real value and stops there, written in full so it reads as the number it is. */
export function counted(value: number, t: number, span = COUNT_S): string {
  return Math.round(value * ease(t, 0.2, span)).toLocaleString('en-US').replaceAll(',', '.')
}

export function quote(text: string, o: { y: number; fill: string; size?: number; lines?: number; anchor?: 'start' | 'middle' }): string {
  const size = o.size ?? 25
  const x = o.anchor === 'middle' ? MID : PAD

  return wrapBody(text, { size, room: INNER, lines: o.lines ?? 2 }).map((line, index) => txt(line, { x, y: o.y + index * size * 1.28, size, fill: o.fill, anchor: o.anchor })).join('')
}

export function introSlide({ w, t, step }: SlideCtx): string {
  const s = storyWords()
  const walkers = w.agents.slice(0, 4).map((agent, index) => {
    const x = PAD + 6 + index * 118 - (1 - ease(t, 0.5 + 0.14 * index, 1)) * W

    return agentCrab(agent.type, index, { x, y: 760, scale: 3.3, step: step + index })
  })

  return [
    sheet(C.ink),
    circle(MID, 370, INTRO_RADIUS * ease(t, 0, 0.9) + Math.sin(t * 1.1) * 8, C.clay),
    rise(txt(String(w.year), { x: MID, y: 420, size: fitSize(String(w.year), 190, INNER), fill: C.ink, isDisplay: true, anchor: 'middle' }), ease(t, 0.25)),
    rise(txt(s.intro, { x: MID, y: 480, size: 38, fill: C.ink, isBold: true, anchor: 'middle' }), ease(t, 0.5)),
    rise(quote(s.introSub(w.sessions), { y: 720, fill: C.cream, anchor: 'middle' }), ease(t, 0.8)),
    walkers.join(''),
  ].join('')
}

function rings(cx: number, cy: number, t: number, fill: string): string {
  return [0, 1, 2, 3].map(index => `<circle cx="${cx}" cy="${cy}" r="${(120 + index * 110 + Math.sin(t * 0.9 + index) * 12).toFixed(1)}" fill="none" stroke="${fill}" stroke-opacity="0.22" stroke-width="30"/>`).join('')
}

export function promptsSlide({ w, t }: SlideCtx): string {
  const s = storyWords()
  const total = counted(w.prompts, t)

  return [
    sheet(C.clay),
    rings(W, H, t, C.ink),
    txt(total, { x: PAD, y: 400, size: fitSize(w.prompts.toLocaleString('en-US'), 170, INNER), fill: C.ink, isDisplay: true }),
    rise(txt(s.prompts, { x: PAD, y: 462, size: 34, fill: C.ink, isBold: true }), ease(t, 0.5)),
    rise(quote(s.promptsSub(Math.round(w.prompts / Math.max(1, w.activeDays))), { y: 590, fill: C.ink }), ease(t, 1.2)),
    rise(quote(s.replies(w.replies), { y: 680, fill: C.ink }), ease(t, 1.6)),
  ].join('')
}

// The weeks the transcripts hold, as columns of days; the busiest day stands out, the rest come in from the left.
function calendar(c: SlideCtx, o: { y: number; on: string; peak: string }): string {
  const { w, t } = c
  const firstMs = Date.parse(`${w.firstDay}T12:00:00Z`)
  const lastMs = Date.parse(`${w.lastDay}T12:00:00Z`)
  const lead = (new Date(firstMs).getUTCDay() + 6) % DAYS
  const weeks = Math.ceil(((lastMs - firstMs) / DAY_MS + lead + 1) / DAYS)
  const stride = Math.min(INNER / weeks, CELL_MAX)
  const most = w.busiestDay?.count ?? 1
  let body = ''
  for (let place = lead; place < weeks * DAYS; place += 1) {
    const at = firstMs + (place - lead) * DAY_MS
    if (at > lastMs) break
    const key = new Date(at).toISOString().slice(0, 10)
    const count = w.days[key] ?? 0
    const week = Math.floor(place / DAYS)
    const isPeak = key === w.busiestDay?.name
    const shade = isPeak ? 1 : count === 0 ? 0.14 : 0.4 + 0.6 * Math.min(1, count / most)
    body += box({ x: PAD + week * stride, y: o.y + (place % DAYS) * stride, w: stride - 2, h: stride - 2, r: 2.5, fill: isPeak ? o.peak : o.on, opacity: shade * ease(t, 0.3 + week * 0.03, 0.3) })
  }

  return body
}

export function daySlide(c: SlideCtx): string {
  const { w, t } = c
  const s = storyWords()
  const best = w.busiestDay
  if (best === null) return sheet(C.violet)
  const day = shortDay(best.name)

  return [
    sheet(C.violet),
    circle(W - 40, 170, 150 + Math.sin(t) * 10, C.rose, 0.9),
    rise(txt(s.day, { x: PAD, y: 250, size: 34, fill: C.cream, isBold: true }), ease(t, 0)),
    rise(txt(day, { x: PAD, y: 400, size: fitSize(day, 128, INNER), fill: C.cream, isDisplay: true }), ease(t, 0.3)),
    rise(txt(s.dayCount(best.count), { x: PAD, y: 480, size: 54, fill: C.amber, isDisplay: true }), ease(t, 0.7)),
    rise(quote(s.daySub(best.count), { y: 545, fill: C.cream }), ease(t, 1.1)),
    calendar(c, { y: 620, on: C.cream, peak: C.amber }),
  ].join('')
}

export function weekdaySlide({ w, t }: SlideCtx): string {
  const s = storyWords()
  const peak = Math.max(1, ...w.weekdays)
  const best = w.weekdays.indexOf(Math.max(...w.weekdays))
  const name = weekdayName(best)
  const barW = INNER / DAYS
  const bars = w.weekdays.map((count, index) => {
    const height = 230 * (count / peak) * ease(t, 0.5 + index * 0.08, 0.7)
    const fill = index === best ? C.amber : C.cream

    return box({ x: PAD + index * barW, y: 640 - height, w: barW - 8, h: height, r: 6, fill }) + txt(weekdayShort(index), { x: PAD + index * barW + (barW - 8) / 2, y: 672, size: 21, fill: C.cream, anchor: 'middle' })
  })

  return [
    sheet(C.moss),
    rise(txt(s.weekday, { x: PAD, y: 160, size: 32, fill: C.cream, isBold: true }), ease(t, 0)),
    rise(txt(name, { x: PAD, y: 280, size: fitSize(name, 96, INNER), fill: C.amber, isDisplay: true }), ease(t, 0.25)),
    bars.join(''),
    rise(txt(s.streak(w.streak), { x: PAD, y: 790, size: fitSize(s.streak(w.streak), 50, INNER), fill: C.cream, isDisplay: true }), ease(t, 1.3)),
    rise(txt(s.active(w.activeDays), { x: PAD, y: 840, size: 26, fill: C.cream }), ease(t, 1.5)),
  ].join('')
}

const pad2 = (value: number): string => String(value).padStart(2, '0')
const CLOCK = { x: MID, y: 450, inner: 112, reach: 128, width: 17 } as const

export function hourSlide({ w, t }: SlideCtx): string {
  const s = storyWords()
  const peak = Math.max(1, ...w.hours)
  const best = w.hours.indexOf(Math.max(...w.hours))
  const spokes = w.hours.map((count, hour) => {
    const turn = (hour / 24) * 2 * Math.PI - Math.PI / 2
    const length = (10 + CLOCK.reach * (count / peak)) * ease(t, 0.3 + hour * 0.03, 0.6)
    const cos = Math.cos(turn)
    const sin = Math.sin(turn)
    const from = CLOCK.inner
    const to = from + length

    return `<line x1="${(CLOCK.x + cos * from).toFixed(1)}" y1="${(CLOCK.y + sin * from).toFixed(1)}" x2="${(CLOCK.x + cos * to).toFixed(1)}" y2="${(CLOCK.y + sin * to).toFixed(1)}" stroke="${hour === best ? C.amber : C.cream}" stroke-opacity="${hour === best ? 1 : 0.55}" stroke-width="${CLOCK.width}" stroke-linecap="round"/>`
  })

  return [
    sheet(C.ink),
    rise(txt(s.hour, { x: PAD, y: 130, size: 34, fill: C.cream, isBold: true }), ease(t, 0)),
    spokes.join(''),
    rise(txt(`${pad2(best)}:00`, { x: CLOCK.x, y: CLOCK.y + 20, size: 58, fill: C.amber, isDisplay: true, anchor: 'middle' }), ease(t, 0.9)),
    rise(quote(s.night(Math.round(w.nightShare * 100)), { y: 800, fill: C.cream, size: 27 }), ease(t, 1.5)),
  ].join('')
}
