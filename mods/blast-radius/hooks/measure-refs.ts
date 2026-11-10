// Measuring git commands that drop a ref or a store of work: stash drop/clear (the stashes),
// branch -D and push --delete (the commits no other branch, remote or tag has), and
// worktree remove --force (the uncommitted and untracked files in that worktree).

import { commitsReport, droppedCommits } from './measure-git'
import { emptyReport, lines, nothingReport, plural, LIST_MAX } from './report'
import type { Item, Report, Run } from './report'
import type { GitRisk } from './classify'
import { words } from './words'

const TIMEOUT_MS = 15000

const listReport = (kind: Report['kind'], items: Item[], summary: string): Report => ({
  ...emptyReport(kind, summary, null), count: items.length, items: items.slice(0, LIST_MAX), more: Math.max(0, items.length - LIST_MAX),
})

/** `stash@{0}: WIP on main: 1a2b fix` as a row: the message, tagged with its name. */
function stashItem(line: string): Item {
  const at = line.indexOf(': ')

  return { name: at === -1 ? line : line.slice(at + 2), tag: at === -1 ? '' : line.slice(0, at), meta: '', weight: 0 }
}

export async function measureStash(run: Run, risk: GitRisk, cwd: string): Promise<Report> {
  const list = await run(['git', 'stash', 'list'], { cwd, timeoutMs: TIMEOUT_MS })
  if (list.exitCode !== 0) return emptyReport('stashes', risk.label, words().notes.statusFailed(list.stderr.trim().slice(0, 160)))
  const all = lines(list.stdout).map(stashItem)
  const named = risk.args[1] ?? 'stash@{0}'
  const wanted = /^\d+$/.test(named) ? `stash@{${named}}` : named
  const gone = risk.args[0] === 'clear' ? all : all.filter(item => item.tag === wanted)
  if (gone.length === 0) return nothingReport('stashes', 'drop nothing: no such stash')

  return listReport('stashes', gone, `delete ${plural(gone.length, 'stash', 'stashes')}`)
}

/** The commits on `ref` that no other branch, remote branch or tag (or HEAD) has. */
const onlyOn = (ref: string, exclude: string, kind: '--branches' | '--remotes'): string[] =>
  [ref, '--not', 'HEAD', `--exclude=${exclude}`, kind, ...(kind === '--branches' ? ['--remotes'] : ['--branches']), '--tags']

export async function measureBranchDelete(run: Run, risk: GitRisk, cwd: string): Promise<Report> {
  const dropped: Item[] = []
  for (const branch of risk.args) {
    const known = await run(['git', 'rev-parse', '--verify', '--quiet', `refs/heads/${branch}`], { cwd, timeoutMs: TIMEOUT_MS })
    if (known.exitCode === 0) dropped.push(...(await droppedCommits(run, onlyOn(`refs/heads/${branch}`, branch, '--branches'), cwd)))
  }
  const where = risk.args.join(', ')
  if (dropped.length === 0) return nothingReport('commits', `delete ${where}: every commit on it is on another branch`)

  return commitsReport(dropped, `delete ${where}, dropping ${plural(dropped.length, 'commit', 'commits')} no other branch has`, where)
}

/** A remote branch others may use: held even when no commit would be lost, as a force push is. */
export async function measurePushDelete(run: Run, risk: GitRisk, cwd: string): Promise<Report> {
  const [remote = 'origin', ...branches] = risk.args
  const dropped: Item[] = []
  const refs = branches.map(branch => `${remote}/${branch.replace(/^refs\/heads\//, '')}`)
  for (const ref of refs) {
    const known = await run(['git', 'rev-parse', '--verify', '--quiet', `refs/remotes/${ref}`], { cwd, timeoutMs: TIMEOUT_MS })
    if (known.exitCode !== 0) return { ...emptyReport('commits', `delete ${ref}`, words().notes.refMissing(ref)), where: ref }
    dropped.push(...(await droppedCommits(run, onlyOn(`refs/remotes/${ref}`, ref, '--remotes'), cwd)))
  }
  const where = refs.join(', ')
  const note = dropped.length === 0 ? words().notes.noDroppedCommits(where) : null

  return { ...commitsReport(dropped, `delete the remote branch ${where}: drops ${plural(dropped.length, 'commit', 'commits')}`, where), note }
}

export async function measureWorktree(run: Run, risk: GitRisk, cwd: string): Promise<Report> {
  const path = risk.args[0]
  if (path === undefined) return nothingReport('changes', 'remove no worktree')
  const status = await run(['git', '-C', path, 'status', '--porcelain', '--untracked-files=all'], { cwd, timeoutMs: TIMEOUT_MS })
  if (status.exitCode !== 0) return emptyReport('changes', `${risk.label} ${path}`, words().notes.statusFailed(status.stderr.trim().slice(0, 160)))
  const rows = lines(status.stdout).map(row => ({ name: row.slice(3), tag: row.slice(0, 2).trim(), meta: '', weight: 0 }))
  if (rows.length === 0) return nothingReport('changes', `remove the worktree ${path}: nothing uncommitted in it`)

  return listReport('changes', rows, `remove the worktree ${path} with ${plural(rows.length, 'uncommitted file', 'uncommitted files')}`)
}
