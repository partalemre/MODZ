import type { Raw } from './scan'
import type { AgentRow, MonthStat, Named, Persona, Wrapped } from '../types'

// The transcripts' totals turned into the card's figures: each hour moved to the person's own time zone, then the
// days, the streak, the night share and the persona. Pure, but for the machine's time zone.

const NIGHT_END_HOUR = 5
const DAY_MS = 86_400_000
const PAD = 2
// A novel of about 100,000 words, at about 1.3 tokens a word.
export const NOVEL_TOKENS = 130_000

// A file under these is scratch work, not a file the person cares about.
const SCRATCH = /^(\/private)?\/tmp\/|\/scratchpad\//
const AGENT_TOOLS = new Set(['Agent', 'Task'])

const LIMITS = { commander: 0.25, owl: 0.3, marathoner: 25, director: 0.1, sprinter: 3 } as const

const pad = (value: number): string => String(value).padStart(PAD, '0')

export function dayKey(ms: number): string {
  const at = new Date(ms)

  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`
}

// `2026-10-09T07` is a UTC hour; a time zone off the hour lands a few minutes out, which no figure here shows.
function hourMs(key: string): number {
  return Date.parse(`${key}:00:00Z`)
}

function topOf(table: Record<string, number>): Named | null {
  let top: Named | null = null
  for (const [name, count] of Object.entries(table)) if (top === null || count > top.count) top = { name, count }

  return top
}

const baseName = (path: string): string => path.split(/[\\/]+/).filter(Boolean).pop() ?? path

const foldName = (name: string): string => name.normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase()

// One project under two spellings (`Satranç 2`, `Satranc2`) is one project, called what it was called most.
function projectNamer(places: Record<string, number>): (path: string) => string {
  const best = new Map<string, Named>()
  for (const [path, count] of Object.entries(places)) {
    const name = baseName(path)
    const held = best.get(foldName(name))
    if (held === undefined || count > held.count) best.set(foldName(name), { name, count })
  }

  return path => best.get(foldName(baseName(path)))?.name ?? baseName(path)
}

function namedFrom(table: Record<string, number>, isKept: (path: string) => boolean): Named | null {
  const top = topOf(Object.fromEntries(Object.entries(table).filter(([path]) => isKept(path))))

  return top === null ? null : { ...top, name: baseName(top.name) }
}

// The longest run of days in a row, each with a prompt.
export function longestStreak(days: readonly string[]): number {
  const sorted = days.map(day => Date.parse(`${day}T12:00:00Z`)).sort((a, b) => a - b)
  let best = 0
  let run = 0
  let last = Number.NaN
  for (const ms of sorted) {
    run = Math.round((ms - last) / DAY_MS) === 1 ? run + 1 : 1
    best = Math.max(best, run)
    last = ms
  }

  return best
}

type PersonaFacts = { prompts: number; agentCalls: number; nightShare: number; average: number; stops: number }

export function personaOf(facts: PersonaFacts): Persona {
  if (facts.nightShare >= LIMITS.owl) return 'owl'
  if (facts.agentCalls / Math.max(1, facts.prompts) >= LIMITS.commander) return 'commander'
  if (facts.stops / Math.max(1, facts.prompts) >= LIMITS.director) return 'director'
  if (facts.average >= LIMITS.marathoner) return 'marathoner'
  if (facts.average <= LIMITS.sprinter) return 'sprinter'

  return 'builder'
}

type Clocked = { days: Record<string, number>; hours: number[]; night: number }

function clocked(promptsByHour: Record<string, number>): Clocked {
  const days: Record<string, number> = {}
  const hours = Array.from({ length: 24 }, () => 0)
  let night = 0
  for (const [key, count] of Object.entries(promptsByHour)) {
    const ms = hourMs(key)
    if (Number.isNaN(ms)) continue
    const day = dayKey(ms)
    const hour = new Date(ms).getHours()
    days[day] = (days[day] ?? 0) + count
    hours[hour] = (hours[hour] ?? 0) + count
    if (hour < NIGHT_END_HOUR) night += count
  }

  return { days, hours, night }
}

const AGENT_ROWS = 6
const TOP_ROWS = 5
// Monday first, as the story draws the week.
const MONDAY_FIRST = 6

const topRows = (table: Record<string, number>, name: (key: string) => string = key => key): Named[] => {
  const merged: Record<string, number> = {}
  for (const [key, count] of Object.entries(table)) merged[name(key)] = (merged[name(key)] ?? 0) + count

  return Object.entries(merged).map(([key, count]) => ({ name: key, count })).sort((a, b) => b.count - a.count).slice(0, TOP_ROWS)
}

export function weekdaysOf(days: Record<string, number>): number[] {
  const week = Array.from({ length: 7 }, () => 0)
  for (const [day, count] of Object.entries(days)) {
    const place = (new Date(`${day}T12:00:00Z`).getUTCDay() + MONDAY_FIRST) % 7
    week[place] = (week[place] ?? 0) + count
  }

  return week
}

// `claude-opus-5-5-20261001` reads Opus 5.5; a name it does not know stays as it came.
export function modelLabel(id: string): string {
  const parts = /^claude-([a-z]+)-(\d+)(?:-(\d{1,2}))?(?:-\d{8})?/.exec(id)
  if (parts === null) return id
  const family = parts[1] ?? ''

  return `${family.charAt(0).toUpperCase()}${family.slice(1)} ${parts[2]}${parts[3] === undefined ? '' : `.${parts[3]}`}`
}

function agentRows(raw: Raw): AgentRow[] {
  return [...raw.agents].sort((a, b) => b.tools - a.tools || b.runs - a.runs).slice(0, AGENT_ROWS)
}

function topIn(rows: Raw['monthProjects'], month: string): string | null {
  let top: { name: string; count: number } | null = null
  for (const row of rows) if (row.month === month && (top === null || row.count > top.count)) top = row

  return top?.name ?? null
}

// Each month's prompts and agent runs, with its top project and its busiest agent type.
export function monthsOf(raw: Raw): MonthStat[] {
  const months = [...new Set([...raw.monthProjects, ...raw.monthAgents].map(row => row.month))].sort()
  const nameOf = projectNamer(raw.places)

  return months.map(month => {
    const project = topIn(raw.monthProjects, month)
    const inMonth = (rows: Raw['monthProjects']) => sumOf(rows.filter(row => row.month === month).map(row => row.count))

    return { month, prompts: inMonth(raw.monthProjects), runs: inMonth(raw.monthAgents), project: project === null ? null : nameOf(project), agent: topIn(raw.monthAgents, month) }
  })
}

const sumOf = (values: readonly number[]): number => values.reduce((sum, value) => sum + value, 0)

// null when the year holds no prompt at all.
export function wrappedOf(raw: Raw, spec: { year: number; readAt: number }): Wrapped | null {
  const { days, hours, night } = clocked(raw.promptsByHour)
  const prompts = sumOf(Object.values(days))
  if (prompts === 0) return null
  const dayNames = Object.keys(days).sort()
  const sessions = raw.chats.length
  const agentCalls = sumOf(Object.entries(raw.tools).filter(([name]) => AGENT_TOOLS.has(name)).map(([, count]) => count))
  const nightShare = night / prompts
  const peak = Math.max(...hours)

  return {
    ...spec,
    firstDay: dayNames[0] as string,
    lastDay: dayNames[dayNames.length - 1] as string,
    prompts,
    sessions,
    replies: sumOf(Object.values(raw.repliesByHour)),
    outputTokens: raw.outputTokens,
    activeDays: dayNames.length,
    streak: longestStreak(dayNames),
    busiestDay: topOf(days),
    topHour: hours.indexOf(peak),
    nightShare,
    stops: raw.stops,
    rightCount: raw.rightCount,
    toolCalls: sumOf(Object.values(raw.tools)),
    agentCalls,
    topTool: topOf(raw.tools),
    topFile: namedFrom(raw.files, path => !SCRATCH.test(path)),
    topProject: topRows(raw.places, projectNamer(raw.places))[0] ?? null,
    longestChat: Math.max(0, ...raw.chats),
    linesAdded: raw.linesAdded,
    costUsd: raw.costUsd,
    days,
    hours,
    weekdays: weekdaysOf(days),
    projects: topRows(raw.places, projectNamer(raw.places)),
    tools: topRows(raw.tools),
    files: topRows(Object.fromEntries(Object.entries(raw.files).filter(([path]) => !SCRATCH.test(path))), baseName),
    models: topRows(raw.models, modelLabel),
    agentRuns: sumOf(raw.agents.map(agent => agent.runs)),
    agentTools: sumOf(raw.agents.map(agent => agent.tools)),
    agentTokens: sumOf(raw.agents.map(agent => agent.tokens)),
    agents: agentRows(raw),
    hardest: raw.hardest,
    months: monthsOf(raw),
    projectKinds: {},
    persona: personaOf({ prompts, agentCalls, nightShare, average: prompts / Math.max(1, sessions), stops: raw.stops }),
  }
}

// What a saved reading must hold to be drawn; an older or damaged one is read again.
export function isWrapped(value: unknown): value is Wrapped {
  const w = value as Wrapped | null

  return typeof w === 'object' && w !== null && typeof w.year === 'number' && typeof w.prompts === 'number' && typeof w.persona === 'string' && typeof w.days === 'object' && w.days !== null && Array.isArray(w.agents) && Array.isArray(w.months) && Array.isArray(w.projects) && Array.isArray(w.hours) && Array.isArray(w.models) && typeof w.projectKinds === 'object' && w.projectKinds !== null
}
