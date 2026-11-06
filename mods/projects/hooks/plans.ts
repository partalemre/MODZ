import type { PlanRow, PlanStep } from '../types'

// A project's plans, from where people and tools keep them: markdown with checkboxes or task headings, and the JSON
// plans CEO Mode writes. A plan nobody ticked says "0 of 37" in the file even when the work is long done, so it counts
// as unmarked, never as 0 %.

export type PlanEntry = { name: string; kind: string; mtimeMs: number }
export type PlanIo = { list: (dir: string) => Promise<PlanEntry[]>; read: (path: string) => Promise<string> }

const PLAN_DIRS = ['docs/plans', 'docs/superpowers/plans', 'plans', 'Plans', '.planning', 'docs/plan', '.ceo/plans']
const PLAN_FILES = new Set(['PLAN.md', 'ROADMAP.md', 'TODO.md', 'TASKS.md'])
const CEO_FILE = { dir: '.ceo', name: 'plan.json' }
const SPEC_DIR = 'specs'
const MAX_PLANS = 40
const MAX_STEPS = 60
const MAX_TITLE = 120
const DONE_STATES = new Set(['done', 'completed', 'complete'])

const CHECK = /^\s*[-*] \[([ xX])\]\s+(.+)$/
const TASK_HEADING = /^#{2,3}\s+(?:Task|Step|Adım|Görev|Milestone)\s*\d*[:.\s-]+(.*)$/iu
const TITLE = /^#\s+(.+)$/

const clip = (text: string): string => (text.length > MAX_TITLE ? `${text.slice(0, MAX_TITLE - 1)}…` : text)
const clean = (text: string): string => clip(text.replace(/\*\*|`/g, '').trim())

export function parseMarkdown(text: string, fallback: string): { title: string; steps: PlanStep[]; done: number; total: number } {
  const checks: PlanStep[] = []
  const headings: PlanStep[] = []
  let title = ''
  for (const line of text.split('\n')) {
    if (title === '') title = TITLE.exec(line)?.[1] ?? ''
    const check = CHECK.exec(line)
    if (check !== null) checks.push({ title: clean(check[2] ?? ''), isDone: check[1] !== ' ' })
    const heading = TASK_HEADING.exec(line)
    if (heading !== null) headings.push({ title: clean(heading[1] ?? ''), isDone: false })
  }
  const steps = checks.length > 0 ? checks : headings
  const done = checks.filter(step => step.isDone).length

  return { title: clean(title) || fallback, steps: steps.slice(0, MAX_STEPS), done, total: steps.length }
}

type CeoTask = { title?: unknown; status?: unknown }
type CeoPlan = { title?: unknown; milestones?: { tasks?: CeoTask[] }[] }

export function parseCeo(text: string, fallback: string): { title: string; steps: PlanStep[]; done: number; total: number } | null {
  const plan = JSON.parse(text) as CeoPlan
  if (!Array.isArray(plan.milestones)) return null
  const steps = plan.milestones.flatMap(stone => stone.tasks ?? []).map(task => ({
    title: clean(typeof task.title === 'string' ? task.title : ''),
    isDone: typeof task.status === 'string' && DONE_STATES.has(task.status),
  }))

  return {
    title: typeof plan.title === 'string' ? clean(plan.title) : fallback,
    steps: steps.slice(0, MAX_STEPS),
    done: steps.filter(step => step.isDone).length,
    total: steps.length,
  }
}

async function candidates(root: string, io: PlanIo): Promise<{ path: string; mtimeMs: number }[]> {
  const found: { path: string; mtimeMs: number }[] = []
  const listed = (dir: string) => io.list(`${root}/${dir}`).catch((): PlanEntry[] => [])
  const isPlan = (entry: PlanEntry) => entry.kind === 'file' && (entry.name.endsWith('.md') || entry.name.endsWith('.json'))
  for (const dir of PLAN_DIRS) {
    for (const entry of await listed(dir)) if (isPlan(entry)) found.push({ path: `${dir}/${entry.name}`, mtimeMs: entry.mtimeMs })
  }
  for (const entry of await io.list(root).catch((): PlanEntry[] => [])) if (PLAN_FILES.has(entry.name)) found.push({ path: entry.name, mtimeMs: entry.mtimeMs })
  for (const entry of await listed(CEO_FILE.dir)) if (entry.name === CEO_FILE.name) found.push({ path: `${CEO_FILE.dir}/${entry.name}`, mtimeMs: entry.mtimeMs })
  for (const spec of await listed(SPEC_DIR)) {
    if (spec.kind !== 'dir') continue
    for (const entry of await listed(`${SPEC_DIR}/${spec.name}`)) if (entry.name === 'tasks.md') found.push({ path: `${SPEC_DIR}/${spec.name}/tasks.md`, mtimeMs: entry.mtimeMs })
  }

  return found.sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, MAX_PLANS)
}

// Newest first; a file that cannot be read or parsed is left out.
export async function readPlans(root: string, io: PlanIo): Promise<PlanRow[]> {
  const rows: PlanRow[] = []
  for (const file of await candidates(root, io)) {
    try {
      const text = await io.read(`${root}/${file.path}`)
      const name = file.path.slice(file.path.lastIndexOf('/') + 1)
      const parsed = file.path.endsWith('.json') ? parseCeo(text, name) : parseMarkdown(text, name)
      if (parsed !== null && parsed.total > 0) rows.push({ path: file.path, mtimeMs: file.mtimeMs, ...parsed })
    } catch {
      // A half-written or foreign file is not a plan.
    }
  }

  return rows
}
