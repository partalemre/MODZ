import type { BuiltinToolResults } from 'claude-code'

import type { Since } from './changes'
import { commitOutcome, gitDirOf, type Outcome, placeOf } from './commit'
import { chainOf, type GitAction } from './git'
import { headOf } from './gitread'
import { gitWords } from './gitwords'
import type { Host } from './host'
import { mem } from './session'

// `dir` is where git ran (null when that is a guess), `head` its HEAD before the command.
export type Pending = { actions: GitAction[]; ids: number[]; command: string; dir: string | null; head: string; place: { isHere: boolean; name: string } }
export type Job = { actions: GitAction[]; since: Since; initRepo: boolean; readOnly: boolean }
export type Background = { p: Pending | null; job: Job; reads: string[] }
type GitOperation = NonNullable<BuiltinToolResults['Bash']['gitOperation']>
export type Run = { ok: boolean; op: GitOperation | undefined; text: string }
type GitCall = { command: string; actions: GitAction[]; cwd: string }

export const ACTIVITY_TTL_MS = 45_000
// The sweep runs a moment after the last chip expires, so it finds it expired.
const SWEEP_SLACK_MS = 500

const PROOF: Record<string, (op: GitOperation) => boolean> = {
  push: op => Boolean(op.push),
  merge: op => op.branch?.action === 'merged',
  rebase: op => op.branch?.action === 'rebased',
  'pr create': op => op.pr?.action === 'created',
  'pr merge': op => op.pr?.action === 'merged',
  'pr comment': op => op.pr?.action === 'commented',
}

async function startGit(h: Host, actions: GitAction[]): Promise<number[]> {
  const now = await h.now()
  const ids = actions.map(() => ++mem.activityId)
  const started = actions.map((a, i) => ({
    id: ids[i] ?? 0,
    kind: a.kind,
    label: a.running,
    state: 'running' as const,
    detail: '',
    at: now,
    tone: a.tone,
    nerd: a.icon.nerd,
    plain: a.icon.plain,
  }))
  await h.setActivities(cur => [...cur.filter(a => a.state === 'running' || now - a.at < ACTIVITY_TTL_MS), ...started])
  return ids
}

export async function outcomes(h: Host, p: Pending, run: Run): Promise<Outcome[]> {
  const chain = chainOf(p.command)
  const isCommit = p.actions.some(a => a.verb === 'commit')
  const after = isCommit && !run.op?.commit && p.dir !== null ? await headOf(h, p.dir) : ''
  return p.actions.map(a => {
    if (a.verb === 'commit') {
      const sha = run.op?.commit?.sha || (after && after !== p.head ? after : '')
      return commitOutcome({ sha, place: p.place.name, isDirKnown: p.dir !== null, hasFailed: !run.ok && chain.and && chain.size === 1, text: run.text })
    }
    if ((run.op && PROOF[a.verb]?.(run.op)) || (run.ok && chain.and)) return { state: 'done', label: a.done, detail: '' }
    if (!run.ok && chain.and && chain.size === 1) return { state: 'failed', label: gitWords().failed(a.verb), detail: '' }
    return { state: 'done', label: gitWords().ran(a.kind), detail: '' }
  })
}

// Where the command's git work runs and its HEAD there before it runs; '' cwd for a subagent's loop.
export async function pendingOf(h: Host, call: GitCall): Promise<Pending> {
  const t = await h.tree()
  const dir = gitDirOf(call.command, { cwd: call.cwd, home: mem.home })
  const isCommit = call.actions.some(a => a.verb === 'commit')
  const head = isCommit && dir !== null ? await headOf(h, dir) : ''
  const place = placeOf(dir, { top: t.top || t.root, isAgent: !call.cwd })
  return { actions: call.actions, ids: await startGit(h, call.actions), command: call.command, dir, head, place }
}

export async function finishGit(h: Host, p: Pending, results: Outcome[]): Promise<void> {
  const now = await h.now()
  await h.setActivities(cur =>
    cur.map(a => {
      const i = p.ids.indexOf(a.id)
      const result = i < 0 ? undefined : results[i]
      return result ? { ...a, ...result, at: now } : a
    }),
  )
  h.after(ACTIVITY_TTL_MS + SWEEP_SLACK_MS, () => void h.setActivities(cur => cur.filter(a => a.state === 'running' || a.at > now)))
}

export function failAll(p: Pending): Outcome[] {
  return p.actions.map(a => ({ state: 'failed', label: gitWords().failed(a.verb), detail: '' }))
}

// Only git work in the tree's own repository lights its files; another repo's commit is not this one's.
export function proven(p: Pending | null, results: Outcome[]): GitAction[] {
  return p && p.place.isHere ? p.actions.filter((_, i) => results[i]?.state !== 'failed') : []
}

export function taskEnds(text: string): [string, string][] {
  return [...text.matchAll(/<task-notification>([\s\S]*?)<\/task-notification>/g)].flatMap(m => {
    const id = /<task-id>([^<]*)<\/task-id>/.exec(m[1] ?? '')?.[1]?.trim()
    const status = /<status>([^<]*)<\/status>/.exec(m[1] ?? '')?.[1]?.trim()
    return id && status ? [[id, status] as [string, string]] : []
  })
}
