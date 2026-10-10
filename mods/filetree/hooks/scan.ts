import type { FileTree } from '../types'
import { changedInRepo, changedSince, type Since } from './changes'
import type { Change } from './gitstatus'
import { BRANCH_ROW, flash } from './flash'
import type { GitAction } from './git'
import { finishGit, type Job, outcomes, proven, taskEnds } from './gitjobs'
import { detectRepo, gitPaths, refreshGit } from './gitread'
import { type Host, patch } from './host'
import { exists, loadDirs, openDirs, revealPaths } from './listing'
import { followCwd } from './pane'
import { dropIndex } from './search'
import { mem } from './session'
import { staleSizes } from './sizes'
import { dirname, inside, join, posix, underAny } from './tree'
import { noteCommit, noteTouches } from './turn'

const NO_REPO_DEPTH = 4
const FIND_LIMIT = 200
const READ_REVEAL_LIMIT = 12
const RM_MS = 3_000
// Work that moves the branch rather than files: its row lights in the action's tone.
const BRANCH_VERBS = ['push', 'pull', 'fetch', 'checkout', 'switch', 'branch', 'merge', 'rebase', 'tag']
// Git verbs that touch no working file, so they lend no tone to the files a command changed.
const QUIET_VERBS = ['commit', 'push', 'add']

// One scan's view: the tree before it, after git was read again, and the tones it lights.
type Pass = { t: FileTree; fresh: FileTree; ignored: Set<string>; tones: Record<string, string> }
type Writes = { since: Since; before: Record<string, Change>; actions: GitAction[] }

let scanning: Promise<void> | null = null
let scanJobs: Job[] = []

// The earliest start among the jobs that wrote, or among all of them when none did.
function sinceOf(jobs: Job[]): Since {
  const writers = jobs.filter(j => !j.readOnly)
  const first = (writers[0] ?? jobs[0])?.since ?? { ms: 0, mark: '', os: 'linux' as const }
  return (writers.length ? writers : jobs).reduce((a, j) => (j.since.ms < a.ms ? j.since : a), first)
}

async function probeRepo(h: Host, t: FileTree, at: { jobs: Job[]; writes: boolean }): Promise<void> {
  if (at.jobs.some(j => j.initRepo)) await detectRepo(h)
  else if (!t.top && (await exists(h, join(t.root, '.git')))) await detectRepo(h)
  const probed = await h.tree()
  if (probed.top && (at.writes || probed.top !== t.top)) await refreshGit(h)
  if (!at.writes) return
  dropIndex()
  await staleSizes(h)
}

async function changed(h: Host, pass: Pass, w: Writes): Promise<{ hits: string[]; gone: string[] }> {
  const { t, fresh } = pass
  if (fresh.top) return changedInRepo(h, { root: t.root, since: w.since, ignored: fresh.ignored }, w.before)
  return { hits: w.since.os === 'win32' ? [] : await changedSince(h, { root: t.root, since: w.since, depth: NO_REPO_DEPTH }), gone: [] }
}

async function lightWrites(h: Host, pass: Pass, w: Writes): Promise<void> {
  const { t, fresh, ignored, tones } = pass
  const found = await changed(h, pass, w)
  const hits = found.hits.filter(x => inside(t.root, x) && !underAny(x, ignored, t.root)).slice(0, FIND_LIMIT)
  await revealPaths(h, hits)
  const loaded = await h.tree()
  const dirs = [...new Set([loaded.root, ...openDirs(loaded), ...hits.map(dirname), ...found.gone.map(dirname)])].filter(d => inside(loaded.root, d))
  const listed = await loadDirs(h, dirs)
  if (!fresh.top && w.since.os === 'win32')
    for (const kids of listed.values()) for (const n of kids) if (n.mtime > w.since.ms && hits.length < FIND_LIMIT) hits.push(n.id)
  await patch(h, cur => {
    const ids = new Set(cur.nodes.map(n => n.id))
    return { expanded: cur.expanded.filter(id => ids.has(id)) }
  })
  const present = new Set((await h.tree()).nodes.map(n => n.id))
  const touchTone = w.actions.find(a => !QUIET_VERBS.includes(a.verb))?.tone ?? 'orange'
  if (mem.showWrites) for (const id of hits) if (present.has(id)) tones[id] = touchTone
  await noteTouches(h, hits.filter(id => present.has(id)), 'edit')
}

async function lightReads(h: Host, pass: Pass, reads: string[]): Promise<void> {
  const { t, ignored, tones } = pass
  const found: string[] = []
  for (const r of reads) {
    if (found.length >= READ_REVEAL_LIMIT) break
    if (r !== t.root && inside(t.root, r) && !underAny(r, ignored, t.root) && (await exists(h, r))) found.push(r)
  }
  if (!found.length) return
  await revealPaths(h, found)
  const shown = new Set((await h.tree()).nodes.map(n => n.id))
  for (const r of found) if (shown.has(r) && !tones[r]) tones[r] = 'purple'
  await noteTouches(h, found.filter(r => shown.has(r)), 'read')
}

async function lightGit(h: Host, pass: Pass, actions: GitAction[]): Promise<void> {
  const { ignored, tones } = pass
  const final = await h.tree()
  const committed = actions.some(a => a.verb === 'commit')
  if ((committed || actions.some(a => a.verb === 'add')) && final.top) {
    const all = (await gitPaths(h, { root: final.root, prefix: final.prefix }, committed)).filter(x => !underAny(x, ignored, final.root))
    const paths = all.slice(0, READ_REVEAL_LIMIT)
    await revealPaths(h, paths)
    const shown = new Set((await h.tree()).nodes.map(n => n.id))
    for (const x of paths) if (shown.has(x)) tones[x] = 'green'
    if (committed) {
      await noteTouches(h, all, 'commit')
      await noteCommit(h, { committed: all.length })
    }
  }
  const pushLike = actions.find(a => BRANCH_VERBS.includes(a.verb) || a.kind.startsWith('gh '))
  if (pushLike) tones[BRANCH_ROW] = pushLike.tone
  else if (committed) tones[BRANCH_ROW] = 'green'
}

async function afterBash(h: Host, jobs: Job[]): Promise<void> {
  const reads = mem.queuedReads
  mem.queuedReads = []
  if (await followCwd(h)) return
  const t = await h.tree()
  if (!t.root) return
  const actions = jobs.flatMap(j => j.actions)
  const since = sinceOf(jobs)
  const writes = !jobs.every(j => j.readOnly)
  const before = mem.dirty.root === t.root ? mem.dirty.files : {}
  await probeRepo(h, t, { jobs, writes })
  const fresh = await h.tree()
  const pass: Pass = { t, fresh, ignored: new Set(fresh.ignored), tones: {} }
  if (writes) await lightWrites(h, pass, { since, before, actions })
  if (mem.showReads) await lightReads(h, pass, reads)
  if (mem.showWrites && actions.length) await lightGit(h, pass, actions)
  await flash(h, pass.tones)
}

export function dropMarks(h: Host, marks: string[]): Promise<unknown> {
  return h.run(['rm', '-f', ...marks], { timeoutMs: RM_MS }).catch(() => undefined)
}

export function scheduleScan(h: Host, job: Job): void {
  scanJobs.push(job)
  if (scanning) return
  scanning = (async () => {
    while (scanJobs.length) {
      const jobs = scanJobs
      scanJobs = []
      try {
        await afterBash(h, jobs)
      } finally {
        const marks = jobs.map(j => j.since.mark).filter(Boolean)
        if (marks.length) await dropMarks(h, marks)
      }
    }
  })().finally(() => {
    scanning = null
  })
}

export async function touched(h: Host, paths: string[], how: { tone: string; isShown: boolean }): Promise<void> {
  if (await followCwd(h)) return
  const t = await h.tree()
  if (!t.root) return
  const within = paths.map(posix).filter(p => inside(t.root, p))
  if (within.length === 0) return
  if (how.tone !== 'purple') {
    dropIndex()
    await staleSizes(h, within)
    await revealPaths(h, within.map(dirname))
    await loadDirs(h, [...new Set(within.map(dirname))].filter(d => inside(t.root, d)))
    await refreshGit(h)
  } else await revealPaths(h, within)
  await noteTouches(h, within, how.tone === 'purple' ? 'read' : 'edit')
  if (!how.isShown) return
  const tones: Record<string, string> = {}
  for (const p of within) tones[p] = how.tone
  await flash(h, tones)
}

// Background commands Claude started end in a task notification: their git work and files settle then.
export async function settleBackground(h: Host, text: string): Promise<void> {
  if (mem.background.size === 0 || !text.includes('<task-notification>')) return
  for (const [id, status] of taskEnds(text)) {
    const task = mem.background.get(id)
    if (!task) continue
    mem.background.delete(id)
    const ok = status === 'completed'
    const results = task.p ? await outcomes(h, task.p, { ok, op: undefined, text: '' }) : []
    if (task.p) await finishGit(h, task.p, results)
    if (mem.showReads) mem.queuedReads.push(...task.reads)
    scheduleScan(h, { ...task.job, actions: proven(task.p, results) })
  }
}
