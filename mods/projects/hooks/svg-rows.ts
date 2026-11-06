import { spent } from './build'
import { agoShortText, percentText, tokensText } from './format'
import { escapeXml, num, rectEl, sans, textEl, toPic } from './kit/svg-core'
import type { SvgPic } from './kit/svg-core'
import { fitText } from './kit/svg-metrics'
import { words } from './words'
import type { Project } from '../types'

// The list's drawings. Colour only says state (DESIGN.md §0): live is the accent, a finished project Moss, every other
// fill neutral; a project with no number has an empty, dashed track.

// One control tall, so the row is one button and lights as one block (kit/press.tsx). Where it stopped is in the map's
// caption and the project's own page.
const ROW_H = 28
const NAME_Y = 18
// Name, then the facts right-aligned in columns of their own, so rows read straight down.
const DOT_R = 3
const NAME_X = 14
const PERCENT_W = 40
const METER_W = 40
const METER_H = 4
const METER_MID = 14
const COLUMN_GAP = 12
// The least room kept between two texts of one line.
const TEXT_GAP = 12
// From here a row has room for the tokens as well.
const WIDE_ROW = 480
const FULL = 100

export const paintOf = (project: Project): string => {
  if (project.isLive) return 'edit'
  if (project.percent.value === FULL) return 'ok'

  return 'mid'
}

export const stoppedAt = (project: Project): string => {
  const left = project.leftOff

  return left?.recap || project.estimate?.next || left?.title || left?.prompt || project.git?.subject || ''
}

export function barOf(project: Project, spec: { y: number; width: number; height: number }): string {
  const { value } = project.percent
  if (value === null) return `<line x1="0" x2="${num(spec.width)}" y1="${spec.y + 1}" y2="${spec.y + 1}" class="s-line" stroke-width="1" stroke-dasharray="3 4"/>`
  const track = rectEl({ x: 0, y: spec.y, width: spec.width, height: spec.height, radius: 1, paint: 'track' })

  return track + rectEl({ x: 0, y: spec.y, width: Math.max(spec.height, (spec.width * value) / FULL), height: spec.height, radius: 1, paint: paintOf(project) })
}

// A small meter: a track and its fill, the fill never less than a dot while anything is done.
export function meterOf(ratio: number, spec: { x: number; y: number; width: number; height: number; paint: string }): string {
  const { x, y, width, height, paint } = spec
  const radius = height / 2
  const track = rectEl({ x, y, width, height, radius, paint: 'track' })

  return ratio <= 0 ? track : track + rectEl({ x, y, width: Math.max(height, width * ratio), height, radius, paint })
}

function rowMeter(project: Project, x: number): string {
  const { value } = project.percent
  const y = METER_MID - METER_H / 2
  if (value === null) return `<line x1="${x}" x2="${x + METER_W}" y1="${METER_MID}" y2="${METER_MID}" class="s-line" stroke-width="1" stroke-dasharray="3 4"/>`

  return meterOf(value / FULL, { x, y, width: METER_W, height: METER_H, paint: paintOf(project) })
}

// One row, pressed as a whole by the caller: status dot, name, then tokens when there is room, age, meter and percent.
export function rowPic(project: Project, spec: { width: number; nowMs: number }): SvgPic {
  const { width, nowMs } = spec
  const say = words()
  const age = project.isLive ? say.live : agoShortText(Date.parse(project.lastAt) || 0, nowMs)
  const meta = width >= WIDE_ROW ? `${tokensText(spent(project.tokens))} · ${age}` : age
  const shown = percentText(project.percent)
  const meterX = width - PERCENT_W - METER_W
  const metaX = meterX - COLUMN_GAP
  const name = fitText(project.name, metaX - sans(12)(meta) - NAME_X - TEXT_GAP, sans(13, 560))
  const body = [
    `<circle cx="${DOT_R}" cy="${METER_MID}" r="${DOT_R}" class="f-${project.isLive ? 'edit' : project.percent.value === FULL ? 'ok' : 'track'}"/>`,
    textEl({ x: NAME_X, y: NAME_Y, text: name, size: 13, weight: 560, paint: 'hi' }),
    textEl({ x: metaX, y: NAME_Y, text: meta, size: 12, paint: 'lo', anchor: 'end' }),
    rowMeter(project, meterX),
    textEl({ x: width, y: NAME_Y, text: shown, size: 12, weight: 500, paint: project.percent.value === null || project.percent.isStale ? 'lo' : 'hi', anchor: 'end', isMono: true }),
  ].join('')

  return toPic({ body, width, height: ROW_H, alt: `${project.name}, ${shown}, ${stoppedAt(project)}` })
}

const HEAD_H = 28
const HEAD_Y = 18
// Room the way back takes at the left of the head line.
const HEAD_RESERVE = 88

// The count at the head of the list, its right edge on the rows' own.
export function headPic(text: string, width: number): SvgPic {
  const body = textEl({ x: width, y: HEAD_Y, text: fitText(text, width - HEAD_RESERVE, sans(12)), size: 12, paint: 'lo', anchor: 'end' })

  return toPic({ body, width, height: HEAD_H, alt: text })
}

const MAP_H = 84
const COL_TOP = 40
const COL_H = 40
const MAX_COLS = 24
const COL_GAP = 4
const MAX_COL_W = 44

// The overview: one column per project, filled to its percent. Hover swaps the caption for that project's facts, the
// frame's CSS doing it all since a pane drawing runs no script. A hidden caption takes no pointer: spanning the top of
// the drawing, it would answer for a column the cursor is not over.
export function mapPic(projects: readonly Project[], width: number): SvgPic {
  const say = words()
  const shown = projects.slice(0, MAX_COLS)
  const colW = Math.min(MAX_COL_W, Math.max(6, (width - COL_GAP * (shown.length - 1)) / Math.max(1, shown.length)))
  const columns = shown.map((project, index) => {
    const x = index * (colW + COL_GAP)
    const value = project.percent.value
    const fillH = value === null ? 0 : Math.max(2, (COL_H * value) / FULL)
    const caption = fitText(`${project.name} · ${percentText(project.percent)} · ${tokensText(spent(project.tokens))}`, width, sans(13, 560))
    const detail = fitText(stoppedAt(project), width, sans(12))
    const ghost = value === null
      ? `<rect x="${num(x + 0.5)}" y="${COL_TOP + 0.5}" width="${num(colW - 1)}" height="${COL_H - 1}" rx="2" fill="none" class="s-line" stroke-dasharray="2 3"/>`
      : rectEl({ x, y: COL_TOP, width: colW, height: COL_H, radius: 2, paint: 'track' })
    const fill = value === null ? '' : rectEl({ x, y: COL_TOP + COL_H - fillH, width: colW, height: fillH, radius: 2, paint: paintOf(project) })

    return [
      '<g class="c">',
      `<rect x="${num(x - COL_GAP / 2)}" y="0" width="${num(colW + COL_GAP)}" height="${MAP_H}" fill="transparent"/>`,
      ghost, fill,
      `<g class="t"><text x="0" y="14" class="a">${escapeXml(caption)}</text><text x="0" y="30" class="b">${escapeXml(detail)}</text></g>`,
      '</g>',
    ].join('')
  })
  const style = `<style>.t{opacity:0;pointer-events:none}.c:hover .t{opacity:1}.c:hover>rect:nth-child(3){opacity:.75}svg:has(.c:hover) .d{opacity:0}.a{font:560 13px -apple-system,system-ui;fill:var(--hi)}.b{font:12px -apple-system,system-ui;fill:var(--mid)}</style>`
  const hint = textEl({ x: 0, y: 14, text: say.mapHint, size: 12, paint: 'lo', className: 'd' })
  // These paints are named only inside the CSS above; the zero-size marks make svgStyle declare them.
  const marks = `<g opacity="0">${textEl({ x: 0, y: 0, text: ' ', size: 1, paint: 'hi' })}${textEl({ x: 0, y: 0, text: ' ', size: 1, paint: 'mid' })}</g>`

  return toPic({ body: `${style}${marks}${hint}${columns.join('')}`, width, height: MAP_H, alt: say.mapAlt })
}
