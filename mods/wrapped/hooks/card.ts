import { paintVars, FONT } from './kit/tokens'
import type { SvgPic } from './kit/svg'
import { NOVEL_TOKENS } from './stats'
import { compact, monthName, personaLine, personaName, words } from './words'
import type { Wrapped } from '../types'

// What the story pages share with the plain text: the rows, the masked names and the file that stands alone.

const PERCENT = 100
const CARD_AGENTS = 4

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

// A project's name when names are on; else a letter, kept for that project all year.
export function projectLabels(w: Wrapped, isNamed: boolean): Map<string, string> {
  const labels = new Map<string, string>()
  for (const name of [...w.projects.map(row => row.name), ...w.months.map(month => month.project)]) {
    if (name === null || labels.has(name)) continue
    labels.set(name, isNamed ? name : words().hiddenProject(String.fromCharCode(65 + labels.size)))
  }

  return labels
}

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
