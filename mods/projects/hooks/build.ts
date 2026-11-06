import { isAgentFile, sessionOf } from './scan'
import { baseOf, isMachinery } from './roots'
import type { RootInfo } from './roots'
import type { AgentKind, AgentRun, FileSum, LeftOff, PlanRow, Project, Snapshot, Tokens } from '../types'

// The transcripts' summaries grouped into projects. Pure: git, plans and the percent are filled in by the caller for
// the projects this returns.

export const LIVE_MS = 180_000
const WEEK_MS = 7 * 86_400_000
const MAX_RUNS = 30
// Below this a folder is a stray session rather than a project; it still counts under "other".
export const MIN_TOKENS = 100_000
// A session that did work, so a routine's one-call run or a "reply with ok" test never stands as where a project stopped.
const WORK_TOOLS = 3
const WORK_OUTPUT = 2000

export const NO_TOKENS: Tokens = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 }

// What was spent: fresh input, what the cache took in and the replies. Reads from the cache are shown apart, since
// they run hundreds of times larger and would drown the rest.
export const spent = (t: Tokens): number => t.input + t.cacheWrite + t.output

const add = (a: Tokens, b: Tokens): Tokens => ({
  input: a.input + b.input, cacheWrite: a.cacheWrite + b.cacheWrite, cacheRead: a.cacheRead + b.cacheRead, output: a.output + b.output,
})

const sumOf = (file: FileSum): Tokens => Object.values(file.models).reduce<Tokens>((all, model) => add(all, model), NO_TOKENS)

const msOf = (iso: string): number => {
  const ms = Date.parse(iso)

  return Number.isNaN(ms) ? 0 : ms
}

const isWork = (file: FileSum): boolean => file.tools >= WORK_TOOLS || sumOf(file).output >= WORK_OUTPUT

const later = (a: string, b: string): string => (msOf(a) >= msOf(b) ? a : b)

export type Grown = Omit<Project, 'git' | 'plans' | 'percent' | 'estimate' | 'leftOff'> & { newest: FileSum | null }

// One project per piece of work: a clone or a plain copy of a project is another folder of it, never a second row.
export type Found = { grown: Grown; plans: PlanRow[]; firstCommit: string }

const samePlan = (a: PlanRow, b: PlanRow): boolean => a.path === b.path && a.title === b.title

// A folder with no repo is a copy when exactly one repo has its name and they share a plan.
function copyOf(one: Found, all: readonly Found[]): Found | undefined {
  if (one.grown.isGit || one.plans.length === 0) return undefined
  const repos = all.filter(other => other.grown.isGit && baseOf(other.grown.root) === baseOf(one.grown.root))
  const [repo] = repos

  return repos.length === 1 && repo?.plans.some(plan => one.plans.some(mine => samePlan(plan, mine))) ? repo : undefined
}

function joinKinds(a: readonly AgentKind[], b: readonly AgentKind[]): AgentKind[] {
  const kinds = new Map(a.map(kind => [kind.type, kind]))
  for (const kind of b) {
    const held = kinds.get(kind.type)
    kinds.set(kind.type, held === undefined ? kind : { type: kind.type, runs: held.runs + kind.runs, tokens: held.tokens + kind.tokens, tools: held.tools + kind.tools, ms: held.ms + kind.ms })
  }

  return [...kinds.values()].sort((x, y) => y.tokens - x.tokens)
}

function joinTwo(lead: Found, other: Found): Found {
  const a = lead.grown
  const b = other.grown
  const byModel = { ...a.byModel }
  for (const [model, sum] of Object.entries(b.byModel)) byModel[model] = add(byModel[model] ?? NO_TOKENS, sum)
  const runs = [...a.runs, ...b.runs].sort((x, y) => msOf(y.last) - msOf(x.last))
  const isNewer = b.newest !== null && (a.newest === null || msOf(b.newest.last) > msOf(a.newest.last))
  const grown: Grown = {
    ...a,
    isLive: a.isLive || b.isLive,
    lastAt: later(a.lastAt, b.lastAt),
    sessions: a.sessions + b.sessions,
    tokens: add(a.tokens, b.tokens),
    byModel,
    week: a.week + b.week,
    kinds: joinKinds(a.kinds, b.kinds),
    runs: runs.slice(0, MAX_RUNS),
    newest: isNewer ? b.newest : a.newest,
    also: [...(a.also ?? []), b.root, ...(b.also ?? [])],
  }

  return { grown, plans: lead.plans.length > 0 ? lead.plans : other.plans, firstCommit: lead.firstCommit }
}

// The lead folder of two: a repo over a plain copy, then the one worked in last.
const leadsOver = (a: Found, b: Found): boolean => (a.grown.isGit === b.grown.isGit ? msOf(a.grown.lastAt) >= msOf(b.grown.lastAt) : a.grown.isGit)

export function joinCopies(found: readonly Found[]): Found[] {
  const groups = new Map<string, Found>()
  for (const one of found) {
    const key = one.firstCommit === '' ? one.grown.root : `commit:${one.firstCommit}`
    const held = groups.get(key)
    groups.set(key, held === undefined ? one : leadsOver(held, one) ? joinTwo(held, one) : joinTwo(one, held))
  }
  const repos = [...groups.values()]
  const out = new Map(repos.map(one => [one.grown.root, one]))
  for (const one of repos) {
    const repo = copyOf(one, repos)
    if (repo === undefined) continue
    out.delete(one.grown.root)
    const held = out.get(repo.grown.root) ?? repo
    out.set(repo.grown.root, joinTwo(held, one))
  }

  return [...out.values()]
}

const fresh = (root: string, isGit: boolean): Grown => ({
  root, name: baseOf(root), isGit, isLive: false, lastAt: '', sessions: 0, tokens: NO_TOKENS, byModel: {}, week: 0, kinds: [], runs: [], newest: null,
})

function runOf(file: FileSum, nowMs: number): AgentRun {
  return {
    type: file.agent?.type || 'agent',
    description: file.agent?.description ?? '',
    tokens: spent(sumOf(file)),
    tools: file.tools,
    first: file.first,
    last: file.last,
    isLive: nowMs - file.mtimeMs < LIVE_MS,
  }
}

function kindsOf(runs: readonly AgentRun[]): AgentKind[] {
  const kinds = new Map<string, AgentKind>()
  for (const run of runs) {
    const kind = kinds.get(run.type) ?? { type: run.type, runs: 0, tokens: 0, tools: 0, ms: 0 }
    kinds.set(run.type, { ...kind, runs: kind.runs + 1, tokens: kind.tokens + run.tokens, tools: kind.tools + run.tools, ms: kind.ms + Math.max(0, msOf(run.last) - msOf(run.first)) })
  }

  return [...kinds.values()].sort((a, b) => b.tokens - a.tokens)
}

// The folder a transcript belongs to: a subagent counts for the folder its session started in, even when it worked in
// a worktree of its own.
function folderOf(file: FileSum, sessions: ReadonlyMap<string, string>): string {
  return (isAgentFile(file.path) ? sessions.get(sessionOf(file.path)) : undefined) ?? file.cwd
}

export function growProjects(files: readonly FileSum[], ctx: { roots: ReadonlyMap<string, RootInfo>; nowMs: number }): Map<string, Grown> {
  const { roots, nowMs } = ctx
  const sessions = new Map<string, string>()
  for (const file of files) if (!isAgentFile(file.path) && file.cwd !== '') sessions.set(sessionOf(file.path), file.cwd)
  const grown = new Map<string, Grown>()
  const allRuns = new Map<string, AgentRun[]>()
  for (const file of files) {
    const info = roots.get(folderOf(file, sessions))
    if (info === undefined) continue
    const project = grown.get(info.root) ?? fresh(info.root, info.isGit)
    grown.set(info.root, project)
    const tokens = sumOf(file)
    project.tokens = add(project.tokens, tokens)
    for (const [model, sum] of Object.entries(file.models)) project.byModel[model] = add(project.byModel[model] ?? NO_TOKENS, sum)
    if (nowMs - msOf(file.last) < WEEK_MS) project.week += spent(tokens)
    project.lastAt = later(project.lastAt, file.last)
    if (nowMs - file.mtimeMs < LIVE_MS) project.isLive = true
    if (isAgentFile(file.path)) {
      allRuns.set(info.root, [...(allRuns.get(info.root) ?? []), runOf(file, nowMs)])
    } else {
      project.sessions += 1
      if (isWork(file) && (project.newest === null || msOf(file.last) > msOf(project.newest.last))) project.newest = file
    }
  }
  for (const [root, runs] of allRuns) {
    const project = grown.get(root)
    if (project === undefined) continue
    project.kinds = kindsOf(runs)
    project.runs = [...runs].sort((a, b) => msOf(b.last) - msOf(a.last)).slice(0, MAX_RUNS)
  }

  return grown
}

// A project worth a row: real work on disk in the person's own folders, and not hidden by them.
export function isShown(project: Grown, ctx: { home: string; hidden: ReadonlySet<string>; hasPlans: boolean }): boolean {
  if (ctx.hidden.has(project.root) || isMachinery(project.root, ctx.home)) return false
  if (spent(project.tokens) < MIN_TOKENS) return false

  return project.isGit || ctx.hasPlans
}

// A snapshot says who was live when it was read: an older one, restored from disk or left by a closed pane, no longer knows.
export const withLiveNow = (snapshot: Snapshot, nowMs: number): Snapshot => (nowMs - snapshot.at < LIVE_MS ? snapshot : { ...snapshot, projects: snapshot.projects.map(project => ({ ...project, isLive: false })) })

export const byRecent = <T extends { lastAt: string }>(a: T, b: T): number => msOf(b.lastAt) - msOf(a.lastAt)

// `v2:` retires entries read before leftoff.ts cleaned its text.
export const leftOffStamp = (file: FileSum): string => `v2:${file.path}:${file.size}:${file.mtimeMs}`

export const isLeftOffEmpty = (left: LeftOff): boolean => left.prompt === '' && left.reply === '' && left.recap === ''

// Two folders of one name read as `parent/name`, so a row always says which is which.
export function withClearNames<T extends { root: string; name: string }>(projects: readonly T[]): T[] {
  const counts = new Map<string, number>()
  for (const project of projects) counts.set(project.name, (counts.get(project.name) ?? 0) + 1)

  return projects.map(project => (counts.get(project.name) === 1 ? project : { ...project, name: project.root.split('/').slice(-2).join('/') }))
}
