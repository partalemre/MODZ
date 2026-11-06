import { barOf, meterOf } from './svg-rows'
import { baseline, outlineEl, rectEl, sans, TYPE, textEl, toPic } from './kit/svg-core'
import type { SvgPic } from './kit/svg-core'
import { fitText, wrapText } from './kit/svg-metrics'
import { fitPath, percentText } from './format'
import { words } from './words'
import type { PlanRow, Project } from '../types'

// The project page's drawings: its head, the next step, a plan's row, the quiet stats. Colour only says state, as in
// the list. The words that must wrap and be selectable stay plain Text in detail.tsx.

const NAME_Y = 16
const PATH_Y = 35
const NUMBER_Y = 72
const HEAD_H = 80
const BAR_H = 6
const BAR_MID_Y = 64
const NUMBER_GAP = 12
const LIVE_R = 3
const LIVE_GAP = 12

export function headerPic(project: Project, spec: { width: number; path: string }): SvgPic {
  const { width, path } = spec
  const { value, isStale } = project.percent
  const shown = percentText(project.percent)
  const left = project.isLive ? LIVE_GAP : 0
  const numberW = sans(TYPE.display.size, TYPE.display.weight)(shown) + NUMBER_GAP
  const body = [
    project.isLive ? `<circle cx="${LIVE_R}" cy="${NAME_Y - 5}" r="${LIVE_R}" class="f-edit breathe"/>` : '',
    textEl({ x: left, y: NAME_Y, text: fitText(project.name, width - left, sans(16, 600)), size: 16, weight: 600, paint: 'hi' }),
    textEl({ x: 0, y: PATH_Y, text: fitPath(path, width, sans(12)), size: 12, paint: 'lo' }),
    textEl({ x: 0, y: NUMBER_Y, text: shown, size: TYPE.display.size, weight: TYPE.display.weight, paint: value === null ? 'lo' : isStale ? 'mid' : 'hi' }),
    `<g transform="translate(${numberW} 0)">${barOf(project, { y: BAR_MID_Y - BAR_H / 2, width: width - numberW, height: BAR_H })}</g>`,
  ].join('')

  return toPic({ body, width, height: HEAD_H, alt: `${project.name}${project.isLive ? `, ${words().live}` : ''}, ${path}, ${value === null ? words().none : shown}` })
}

const CARD_PAD = 12
const CARD_RADIUS = 10
const NEXT_LABEL_Y = 22
const NEXT_TOP = 32
const NEXT_LINE = 18
const NEXT_LINES = 4
const NEXT_SIZE = 13
const NEXT_WEIGHT = 500

// The next step, the one thing on the page raised on a card (DESIGN.md §0.7).
export function nextPic(text: string, width: number): SvgPic {
  const lines = wrapText(text, { max: width - CARD_PAD * 2, maxLines: NEXT_LINES, measure: sans(NEXT_SIZE, NEXT_WEIGHT) })
  const height = NEXT_TOP + lines.length * NEXT_LINE + CARD_PAD
  const box = { x: 0, y: 0, width, height, radius: CARD_RADIUS }
  const body = [
    rectEl({ ...box, paint: 'card' }),
    outlineEl({ ...box, paint: 'line' }),
    textEl({ x: CARD_PAD, y: NEXT_LABEL_Y, text: words().next, ...TYPE.eyebrow, paint: 'lo' }),
    ...lines.map((line, index) => textEl({ x: CARD_PAD, y: baseline(NEXT_TOP + index * NEXT_LINE, NEXT_LINE, NEXT_SIZE), text: line, size: NEXT_SIZE, weight: NEXT_WEIGHT, paint: 'hi' })),
  ].join('')

  return toPic({ body, width, height, alt: `${words().next}: ${text}` })
}

const PLAN_H = 28
const PLAN_Y = 18
const CHEVRON_W = 14
const PLAN_GAP = 12
const PLAN_SIZE = 13
const PLAN_WEIGHT = 500
const PLAN_METER_W = 36
const PLAN_METER_H = 4
const METER_GAP = 8
// Room a ticked plan's count is given, so the meters of a list line up.
const COUNT_W = 40
const CHEVRON = { closed: 'M2 9.5 L6 13.5 L2 17.5', open: 'M0 11.5 L4 15.5 L8 11.5' }

const planCount = (plan: PlanRow): string => (plan.done > 0 ? `${plan.done}/${plan.total}` : `${plan.total} · ${words().unmarked}`)
const planCountW = (plan: PlanRow): number => Math.max(plan.done > 0 ? COUNT_W : 0, sans(12)(planCount(plan)))
const planTitleRoom = (plan: PlanRow, width: number): number => {
  const meter = plan.done > 0 ? PLAN_METER_W + METER_GAP : 0

  return width - CHEVRON_W - PLAN_GAP - meter - planCountW(plan)
}

export const isPlanTitleCut = (plan: PlanRow, width: number): boolean => fitText(plan.title, planTitleRoom(plan, width), sans(PLAN_SIZE, PLAN_WEIGHT)) !== plan.title

// One plan: one control tall, so its one button lights all of it. An unticked plan says so and draws no meter: agents
// rarely tick boxes, so its empty ones say nothing about how far it is.
export function planPic(plan: PlanRow, spec: { width: number; isOpen: boolean }): SvgPic {
  const { width, isOpen } = spec
  const count = planCount(plan)
  const meter = plan.done > 0 ? meterOf(plan.done / plan.total, { x: width - planCountW(plan) - METER_GAP - PLAN_METER_W, y: PLAN_Y - 8, width: PLAN_METER_W, height: PLAN_METER_H, paint: plan.done === plan.total ? 'ok' : 'mid' }) : ''
  const body = [
    `<path d="${isOpen ? CHEVRON.open : CHEVRON.closed}" fill="none" class="s-lo" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    textEl({ x: CHEVRON_W, y: PLAN_Y, text: fitText(plan.title, planTitleRoom(plan, width), sans(PLAN_SIZE, PLAN_WEIGHT)), size: PLAN_SIZE, weight: PLAN_WEIGHT, paint: 'hi' }),
    meter,
    textEl({ x: width, y: PLAN_Y, text: count, size: 12, paint: 'lo', anchor: 'end' }),
  ].join('')

  return toPic({ body, width, height: PLAN_H, alt: `${plan.title}, ${count}` })
}

const STAT_H = 40
const STAT_LABEL_Y = 12
const STAT_VALUE_Y = 33
const STAT_SIZE = 15

// A small quiet row of figures in even columns, nothing around them.
export function statsPic(stats: readonly { label: string; value: string }[], width: number): SvgPic {
  const cell = width / Math.max(1, stats.length)
  const body = stats.map((stat, index) => [
    textEl({ x: index * cell, y: STAT_LABEL_Y, text: fitText(stat.label, cell - 8, sans(12)), size: 12, paint: 'lo' }),
    textEl({ x: index * cell, y: STAT_VALUE_Y, text: stat.value, size: STAT_SIZE, weight: 600, paint: 'hi', isMono: true }),
  ].join('')).join('')

  return toPic({ body, width, height: STAT_H, alt: stats.map(stat => `${stat.label} ${stat.value}`).join(', ') })
}
