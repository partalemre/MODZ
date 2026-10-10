import type { Args, BuiltinToolResults } from 'claude-code'

import { type Since, sinceNow } from './changes'
import { type GitAction, gitActions, readOnly, readTargets } from './git'
import { failAll, finishGit, type Job, outcomes, type Pending, pendingOf, proven } from './gitjobs'
import type { Host } from './host'
import { cwdOf, followCwd } from './pane'
import { dropMarks, scheduleScan, touched } from './scan'
import { mem } from './session'
import { noteCommit } from './turn'

// What a tool call resolves to, as far as this mod reads it.
type CallResult = { deny?: unknown; isError?: boolean; isReadOnly?: boolean; result?: unknown; text?: unknown }
type BashOut = Partial<BuiltinToolResults['Bash']>

// One Edit, Write, NotebookEdit or Bash call as the mod saw it before it ran.
export type Call = { tool: string; command: string; cwd: string; file: string; actions: GitAction[]; quiet: boolean; since: Since; pending: Pending | null }

const WATCHED = ['Edit', 'Write', 'NotebookEdit', 'Bash']
// A `cd` changes the session's folder once the command is through; the tree follows a moment later.
const CD_FOLLOW_MS = 400

export const isWatched = (tool: string): boolean => WATCHED.includes(tool)

function fileOf(e: Args<'tool.call'>): string {
  if ('file_path' in e && typeof e.file_path === 'string') return e.file_path
  return 'notebook_path' in e && typeof e.notebook_path === 'string' ? e.notebook_path : ''
}

export async function beforeCall(h: Host, e: Args<'tool.call'>): Promise<Call> {
  const command = e.tool === 'Bash' ? e.command : ''
  const cwd = e.tool === 'Bash' ? await cwdOf(h) : ''
  const actions = gitActions(command)
  const quiet = !actions.length && readOnly(command)
  const since = await sinceNow(h, e.tool === 'Bash' && !quiet)
  const pending = actions.length ? await pendingOf(h, { command, actions, cwd: e.agentId ? '' : cwd }) : null
  return { tool: e.tool, command, cwd, file: fileOf(e), actions, quiet, since, pending }
}

export async function callFailed(h: Host, call: Call): Promise<void> {
  if (call.pending) await finishGit(h, call.pending, failAll(call.pending))
  if (call.since.mark) void dropMarks(h, [call.since.mark])
}

async function settle(h: Host, call: Call, done: { result: CallResult; out: BashOut; job: Job; reads: string[] }): Promise<void> {
  const { pending } = call
  const run = { ok: !done.result.isError, op: done.out.gitOperation, text: typeof done.result.text === 'string' ? done.result.text : '' }
  const results = pending ? await outcomes(h, pending, run) : []
  if (pending) await finishGit(h, pending, results)
  const sha = results.find((r, i) => r.state === 'done' && pending?.actions[i]?.verb === 'commit')?.detail
  if (sha && pending?.place.isHere) await noteCommit(h, { sha })
  mem.queuedReads.push(...done.reads)
  scheduleScan(h, { ...done.job, actions: proven(pending, results) })
}

// A background command settles when its task notification arrives (settleBackground), any other one now.
function afterBash(h: Host, call: Call, result: CallResult): void {
  const { command, cwd, pending } = call
  const out = (!result.isError && result.result && typeof result.result === 'object' ? result.result : {}) as BashOut
  const reads = mem.showReads ? readTargets(command, { cwd, stdout: typeof out.stdout === 'string' ? out.stdout : '', home: mem.home }) : []
  const job: Job = { actions: [], since: call.since, initRepo: call.actions.some(a => a.init), readOnly: call.quiet || result.isReadOnly === true }
  if (out.backgroundTaskId) mem.background.set(out.backgroundTaskId, { p: pending, job, reads })
  else void settle(h, call, { result, out, job, reads })
  if (mem.follow && /(^|[;&|\s])(cd|pushd|popd)(\s|$)/.test(command)) h.after(CD_FOLLOW_MS, () => void followCwd(h))
}

export function afterCall<R extends CallResult>(h: Host, call: Call, result: R): R {
  const { pending, since } = call
  if (pending && result.deny) {
    const ids = pending.ids
    void h.setActivities(cur => cur.filter(a => !ids.includes(a.id)))
  }
  if (result.deny || (result.isError && call.tool !== 'Bash')) {
    if (since.mark) void dropMarks(h, [since.mark])
    return result
  }
  if (call.tool === 'Bash') afterBash(h, call, result)
  else if (call.file) void touched(h, [call.file], { tone: 'orange', isShown: mem.showWrites })
  return result
}
