import { costumeFor, crab, lookAt } from './crabs'
import { fitText, textWidth, toPic } from './kit/svg'
import type { SvgPic } from './kit/svg'
import { rectEl, textEl } from './kit/svg-core'
import { FONT, paintVars } from './kit/tokens'
import { NOVEL_TOKENS } from './stats'
import { compact, monthName, personaLine, personaName, words } from './words'
import type { Wrapped } from '../types'

// The card: the same drawing in the pane and in the saved image, its height set by what it holds. Colour follows
// the design's quiet rule, one accent for the persona; the calendar is shaded in plain ink like the Usage heatmap.

export const CARD_WIDTH = 480
const PAD = 28
const INNER = CARD_WIDTH - 2 * PAD
const STAT = { columns: 3, h: 58, value: 22, label: 11.5 } as const
const ROW_H = 25
const SHADES = [0.3, 0.5, 0.75, 1] as const
const DAYS_PER_WEEK = 7
const WEEKS = 53
const CELL_GAP = 1.5
const PERCENT = 100
const DAY_MS = 86_400_000

type Row = { label: string; value: string }
export type CardSpec = { wrapped: Wrapped; isNamed: boolean }

function namedRows(spec: CardSpec): Row[] {
  const { wrapped: w, isNamed } = spec
  const t = words()
  const file = w.topFile
  const project = w.topProject
  const rows: Row[] = []
  if (file !== null) rows.push({ label: t.fileRow, value: isNamed ? t.fileValue(file.name, file.count) : t.hiddenCount(file.count, 'edits') })
  if (project !== null) rows.push({ label: t.projectRow, value: isNamed ? t.projectValue(project.name, project.count) : t.hiddenCount(project.count, 'prompts') })

  return rows
}

// The funny ones come first; a figure the transcripts do not hold is left out, never shown as zero.
export function rowsOf(spec: CardSpec): Row[] {
  const { wrapped: w } = spec
  const t = words()
  const rows: Row[] = [
    { label: t.rightRow, value: t.rightValue(w.rightCount) },
    { label: t.stopsRow, value: t.stopsValue(w.stops) },
  ]
  if (w.topHour !== null) rows.push({ label: t.hourRow, value: t.hourValue(w.topHour) })
  rows.push({ label: t.nightRow, value: t.percent(Math.round(w.nightShare * PERCENT)) })
  if (w.topTool !== null) rows.push({ label: t.toolRow, value: t.toolValue(w.topTool.name, w.topTool.count) })
  if (w.outputTokens > 0) rows.push({ label: t.novelsRow, value: `~${t.novelsValue(Math.max(1, Math.round(w.outputTokens / NOVEL_TOKENS)))}` })
  rows.push({ label: t.chatRow, value: t.chatValue(w.longestChat) }, ...namedRows(spec))

  return rows
}

export function statsOf(w: Wrapped): Row[] {
  const t = words()
  const stats = [
    { value: compact(w.prompts), label: t.prompts },
    { value: compact(w.sessions), label: t.sessions },
    { value: String(w.activeDays), label: t.activeDays },
    { value: String(w.streak), label: t.streak },
  ]
  if (w.linesAdded > 0) stats.push({ value: compact(w.linesAdded), label: t.linesAdded })
  if (w.costUsd > 0) stats.push({ value: `~$${compact(w.costUsd)}`, label: t.apiValue })

  return stats
}

function statsBody(w: Wrapped, top: number): { body: string; height: number } {
  const stats = statsOf(w)
  const columnW = INNER / STAT.columns
  const body = stats
    .map((stat, index) => {
      const x = PAD + (index % STAT.columns) * columnW
      const y = top + Math.floor(index / STAT.columns) * STAT.h
      const value = textEl({ x, y: y + STAT.value, text: stat.value, size: STAT.value, weight: 650, paint: 'hi', isMono: true })

      return value + textEl({ x, y: y + STAT.value + 18, text: stat.label, size: STAT.label, paint: 'lo' })
    })
    .join('')

  return { body, height: Math.ceil(stats.length / STAT.columns) * STAT.h }
}

function rowsBody(spec: CardSpec, top: number): { body: string; height: number } {
  const rows = rowsOf(spec)
  const body = rows
    .map((row, index) => {
      const y = top + index * ROW_H + 14
      const label = textEl({ x: PAD, y, text: row.label, size: 13, paint: 'mid' })
      const room = INNER - textWidth(row.label, 13) - 16
      const fitted = fitText(row.value, room, text => textWidth(text, 13, 560))

      return label + textEl({ x: CARD_WIDTH - PAD, y, text: fitted, size: 13, weight: 560, paint: 'hi', anchor: 'end' })
    })
    .join('')

  return { body, height: rows.length * ROW_H }
}

function shadeOf(count: number, busiest: number): number {
  const ratio = count / Math.max(1, busiest)
  const step = Math.min(SHADES.length - 1, Math.floor(ratio * SHADES.length))

  return SHADES[step] as number
}

// The year as weeks of days, Sunday on top; a day without a prompt is the empty track.
function calendarBody(w: Wrapped, top: number): { body: string; height: number } {
  const size = (INNER - (WEEKS - 1) * CELL_GAP) / WEEKS
  const stride = size + CELL_GAP
  const firstMs = Date.UTC(w.year, 0, 1)
  const firstWeekday = new Date(firstMs).getUTCDay()
  const busiest = w.busiestDay?.count ?? 1
  let body = ''
  for (let place = 0; place < WEEKS * DAYS_PER_WEEK; place += 1) {
    const ms = firstMs + (place - firstWeekday) * DAY_MS
    const at = new Date(ms)
    if (at.getUTCFullYear() !== w.year) continue
    const key = at.toISOString().slice(0, 10)
    const count = w.days[key] ?? 0
    const x = PAD + Math.floor(place / DAYS_PER_WEEK) * stride
    const y = top + (place % DAYS_PER_WEEK) * stride
    const extra = count === 0 ? '' : ` fill-opacity="${shadeOf(count, busiest)}"`
    body += rectEl({ x, y, width: size, height: size, radius: 1.5, paint: count === 0 ? 'track' : 'edit' }, extra)
  }

  return { body, height: DAYS_PER_WEEK * stride }
}

function headBody(w: Wrapped, top: number): string {
  const t = words()

  return [
    textEl({ x: PAD, y: top + 13, text: t.title(w.year), size: 13, weight: 600, paint: 'mid' }),
    textEl({ x: PAD, y: top + 50, text: personaName(w.persona), size: 30, weight: 680, paint: 'edit' }),
    textEl({ x: PAD, y: top + 74, text: fitText(personaLine(w.persona), INNER, text => textWidth(text, 13.5)), size: 13.5, paint: 'mid' }),
  ].join('')
}

const AGENT_ROW_H = 32
const MONTH_ROW_H = 22
const GROUP_H = 24
const CARD_AGENTS = 4
const CRAB_SCALE = 0.85
const BAR = { h: 3, y: 20 } as const

// A project's name when names are on; else a letter, kept for that project all year.
export function projectLabels(w: Wrapped, isNamed: boolean): Map<string, string> {
  const labels = new Map<string, string>()
  for (const { project } of w.months) {
    if (project === null || labels.has(project)) continue
    labels.set(project, isNamed ? project : words().hiddenProject(String.fromCharCode(65 + labels.size)))
  }

  return labels
}

function groupLabel(text: string, top: number): string {
  return textEl({ x: PAD, y: top + 14, text, size: 12, weight: 600, paint: 'lo' })
}

// The agent types that did the most, each with its crab and a bar of its share of the tool calls.
function agentsBody(w: Wrapped, top: number): { body: string; height: number } {
  if (w.agentRuns === 0) return { body: '', height: 0 }
  const t = words()
  const rows = w.agents.slice(0, CARD_AGENTS)
  const most = Math.max(1, ...rows.map(row => row.tools))
  const textX = PAD + 34
  const body = rows
    .map((row, index) => {
      const y = top + GROUP_H + index * AGENT_ROW_H
      const room = INNER - 34 - textWidth(t.agentMeta(row.tools, row.tokens), 11.5) - 12
      const name = fitText(`${row.type} · ${t.agentRun(row.runs)}`, room, text => textWidth(text, 13, 560))

      return [
        crab(PAD, y - 2, { costume: costumeFor(row.type, index), look: lookAt(index), scale: CRAB_SCALE }),
        textEl({ x: textX, y: y + 12, text: name, size: 13, weight: 560, paint: 'hi' }),
        textEl({ x: CARD_WIDTH - PAD, y: y + 12, text: t.agentMeta(row.tools, row.tokens), size: 11.5, paint: 'lo', anchor: 'end' }),
        rectEl({ x: textX, y: y + BAR.y, width: INNER - 34, height: BAR.h, radius: 1.5, paint: 'track' }),
        rectEl({ x: textX, y: y + BAR.y, width: ((INNER - 34) * row.tools) / most, height: BAR.h, radius: 1.5, paint: 'run' }),
      ].join('')
    })
    .join('')

  return { body: groupLabel(`${t.agentsTitle}: ${t.agentsLine(w.agentRuns, w.agentTools)}`, top) + body, height: GROUP_H + rows.length * AGENT_ROW_H }
}

function monthsBody(spec: CardSpec, top: number): { body: string; height: number } {
  const { wrapped: w, isNamed } = spec
  const t = words()
  const labels = projectLabels(w, isNamed)
  const body = w.months
    .map((month, index) => {
      const y = top + GROUP_H + index * MONTH_ROW_H + 13
      const meta = t.monthMeta(month.prompts, month.runs)
      const room = INNER - 84 - textWidth(meta, 11.5) - 12
      const project = fitText(month.project === null ? '—' : (labels.get(month.project) ?? '—'), room, text => textWidth(text, 12.5))

      return [
        textEl({ x: PAD, y, text: monthName(month.month), size: 12.5, paint: 'lo' }),
        textEl({ x: PAD + 84, y, text: project, size: 12.5, weight: 560, paint: 'hi' }),
        textEl({ x: CARD_WIDTH - PAD, y, text: meta, size: 11.5, paint: 'lo', anchor: 'end' }),
      ].join('')
    })
    .join('')

  return { body: groupLabel(t.monthsTitle, top) + body, height: GROUP_H + w.months.length * MONTH_ROW_H }
}

const GAPS = { top: PAD, head: 96, section: 12, footer: 24 } as const

export function cardPart(spec: CardSpec) {
  const { wrapped: w } = spec
  const t = words()
  const statsTop = GAPS.top + GAPS.head
  const stats = statsBody(w, statsTop)
  const calendarTop = statsTop + stats.height + GAPS.section
  const calendar = calendarBody(w, calendarTop)
  const rowsTop = calendarTop + calendar.height + GAPS.section
  const rows = rowsBody(spec, rowsTop)
  const agents = agentsBody(w, rowsTop + rows.height + GAPS.section)
  const months = monthsBody(spec, rowsTop + rows.height + GAPS.section + agents.height + GAPS.section)
  const footerY = rowsTop + rows.height + 2 * GAPS.section + agents.height + months.height + GAPS.footer
  const height = Math.ceil(footerY + PAD - 8)
  const sheet = rectEl({ x: 0, y: 0, width: CARD_WIDTH, height, radius: 14, paint: 'card' })
  const footer = [
    textEl({ x: PAD, y: footerY, text: t.range(w), size: 10.5, paint: 'lo' }),
    textEl({ x: CARD_WIDTH - PAD, y: footerY, text: t.made, size: 10.5, paint: 'lo', anchor: 'end' }),
  ].join('')
  const alt = `${t.title(w.year)}: ${personaName(w.persona)}. ${statsOf(w).map(stat => `${stat.value} ${stat.label}`).join(', ')}.`

  return { body: sheet + headBody(w, GAPS.top) + stats.body + calendar.body + rows.body + agents.body + months.body + footer, width: CARD_WIDTH, height, alt }
}

export const cardPic = (spec: CardSpec): SvgPic => toPic(cardPart(spec))

// The saved file stands alone: dark whatever the viewer's scheme, and with every colour on its own element, since
// macOS's `sips` ignores CSS and would paint all the text black.
export function standalone(pic: SvgPic): string {
  const vars = paintVars(false)
  const noStyle = pic.source.replace(/<style>[\s\S]*?<\/style>/, '').replace('<svg ', `<svg font-family="${FONT.replaceAll("'", '')}" `)

  return noStyle.replace(/class="f-([a-z-]+)( mono)?"/g, (whole, name: string) => (vars[name] === undefined ? whole : `fill="${vars[name]}"`))
}

// The same, for pasting into a post.
export function cardText(spec: CardSpec): string {
  const { wrapped: w } = spec
  const t = words()
  const stats = statsOf(w).map(stat => `${stat.value} ${stat.label}`).join(' · ')
  const rows = rowsOf(spec).map(row => `${row.label}: ${row.value}`)
  const agents = w.agents.slice(0, CARD_AGENTS).map(row => `${row.type}: ${t.agentRun(row.runs)}, ${t.agentMeta(row.tools, row.tokens)}`)
  const labels = projectLabels(w, spec.isNamed)
  const months = w.months.map(month => `${monthName(month.month)}: ${month.project === null ? '—' : (labels.get(month.project) ?? '—')}, ${t.monthMeta(month.prompts, month.runs)}`)
  const crew = w.agentRuns === 0 ? [] : [`${t.agentsTitle}: ${t.agentsLine(w.agentRuns, w.agentTools)}`, ...agents, '']

  return [t.title(w.year), `${personaName(w.persona)}: ${personaLine(w.persona)}`, '', stats, '', ...rows, '', ...crew, t.monthsTitle, ...months, '', t.range(w)].join('\n')
}
