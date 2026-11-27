// Measuring git's risky commands and migrations: the changes `reset --hard` and
// `checkout -- .` drop, the commits a force push drops; migrations are held unlisted.

import { emptyReport, nothingReport, lines, plural, LIST_MAX } from './report'
import type { Item, Report, Run } from './report'
import type { GitRisk, Risk } from './classify'
import { words } from './words'

type MigrateRisk = Extract<Risk, { kind: 'migrate' }>

const TIMEOUT_MS = 15000
const SHORT_TIMEOUT_MS = 10000

/** `12\t4\tpath` per file; a rename's `a => b` is keyed by its new name. */
export function parseNumstat(stdout: string): Map<string, { added: number; removed: number }> {
  const stats = new Map<string, { added: number; removed: number }>()
  for (const line of lines(stdout)) {
    const [added = '', removed = '', ...rest] = line.split('\t')
    const path = rest.join('\t').replace(/^(.*)\{.* => (.*)\}(.*)$/, '$1$2$3').replace(/^.* => /, '')
    stats.set(path, { added: Number(added) || 0, removed: Number(removed) || 0 })
  }

  return stats
}

/** A `git status --porcelain` row as a list item: the path, the two-letter status, the line counts. */
function changeItem(row: string, stats: Map<string, { added: number; removed: number }>): Item {
  const path = row.slice(3).replace(/^.* -> /, '')
  const stat = stats.get(path)
  const meta = stat === undefined ? '' : `+${stat.added} −${stat.removed}`

  return { name: path, tag: row.slice(0, 2).trim(), meta, weight: stat === undefined ? 0 : stat.added + stat.removed }
}

export async function measureChanges(run: Run, risk: GitRisk, cwd: string): Promise<Report> {
  const paths = risk.paths ?? []
  const spec = paths.length > 0 ? ['--', ...paths] : []
  const status = await run(['git', 'status', '--porcelain', ...spec], { cwd, timeoutMs: TIMEOUT_MS })
  if (status.exitCode !== 0) {
    return emptyReport('changes', `${risk.label} (not a git repo here?)`, words().notes.statusFailed(status.stderr.trim().slice(0, 160)))
  }
  const rows = lines(status.stdout).filter(l => l.length > 3 && !l.startsWith('??'))
  // reset --hard, checkout -f and checkout <ref> -- paths drop staged and unstaged changes; checkout -- paths drops unstaged ones.
  const dropsStaged = risk.kind === 'git-reset' || risk.dropsStaged === true
  const lost = dropsStaged ? rows : rows.filter(l => l[1] !== ' ')
  const numstat = await run(['git', 'diff', '--numstat', ...(dropsStaged ? ['HEAD'] : []), ...(spec.length > 0 ? spec : dropsStaged ? [] : ['--'])], { cwd, timeoutMs: TIMEOUT_MS })
  const stats = parseNumstat(numstat.stdout)
  const items = lost.map(row => changeItem(row, stats)).sort((a, b) => b.weight - a.weight)
  if (lost.length === 0) return nothingReport('changes', 'discard nothing: no uncommitted changes')
  const summary = `discard uncommitted changes in ${plural(lost.length, 'file', 'files')}`
  const added = items.reduce((sum, item) => sum + (stats.get(item.name)?.added ?? 0), 0)
  const removed = items.reduce((sum, item) => sum + (stats.get(item.name)?.removed ?? 0), 0)

  return { ...emptyReport('changes', summary, null), count: lost.length, items: items.slice(0, LIST_MAX), more: Math.max(0, lost.length - LIST_MAX), added, removed }
}

/** The commits `range` lists, one oneline each: the ones a move of the branch or a deleted ref would drop. */
export async function droppedCommits(run: Run, range: string[], cwd: string): Promise<Item[]> {
  const log = await run(['git', 'log', '--oneline', '--no-decorate', ...range], { cwd, timeoutMs: TIMEOUT_MS })
  if (log.exitCode !== 0) throw new Error(`git log exited ${log.exitCode}: ${log.stderr.trim().slice(0, 120)}`)

  return lines(log.stdout).map(line => ({ name: line.replace(/^\S+\s*/, ''), tag: line.split(' ')[0] ?? '', meta: '', weight: 0 }))
}

export const commitsReport = (items: Item[], summary: string, where: string): Report => ({
  ...emptyReport('commits', summary, null), count: items.length, items: items.slice(0, LIST_MAX), more: Math.max(0, items.length - LIST_MAX), where,
})

/** reset --hard <ref> drops the uncommitted changes and, when the ref is behind, the commits only HEAD has. */
export async function measureReset(run: Run, risk: GitRisk, cwd: string): Promise<Report> {
  const changes = await measureChanges(run, risk, cwd)
  const ref = risk.args.find(arg => !arg.startsWith('-'))
  if (ref === undefined || ref === 'HEAD') return changes
  const dropped = await droppedCommits(run, [`${ref}..HEAD`], cwd)
  if (dropped.length === 0) return changes
  const head = await run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], { cwd, timeoutMs: SHORT_TIMEOUT_MS })
  const branch = head.stdout.trim() || 'HEAD'
  const commits = `move ${branch} back to ${ref}, dropping ${plural(dropped.length, 'commit', 'commits')}`
  if (changes.isEmpty || changes.count === 0) return commitsReport(dropped, changes.isEmpty ? commits : `${commits}; ${changes.summary}`, branch)

  return { ...changes, summary: `${changes.summary} and ${commits}`, note: words().notes.alsoDrops(dropped.length, branch) }
}

/** The remote branch a force push lands on, and the local ref it pushes from. */
async function pushTarget(run: Run, args: string[], cwd: string): Promise<{ ref: string; source: string }> {
  const positional = args.filter(a => !a.startsWith('-'))
  const remote = positional[0] ?? 'origin'
  // A refspec is src:dst. With no colon, the local branch of the same name is pushed.
  const spec = (positional[1] ?? '').replace(/^\+/, '')
  const [from = '', to = ''] = spec.includes(':') ? spec.split(':') : [spec, spec]
  let source = from
  let branch = to.replace(/^refs\/heads\//, '')
  // `git push origin HEAD`, or no refspec at all, pushes the current branch to its namesake.
  if (!branch || branch === 'HEAD') {
    const head = await run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], { cwd, timeoutMs: SHORT_TIMEOUT_MS })
    branch = head.stdout.trim()
    source = 'HEAD'
  }

  return { ref: `${remote}/${branch}`, source: source || 'HEAD' }
}

export async function measurePush(run: Run, risk: GitRisk, cwd: string): Promise<Report> {
  const { ref, source } = await pushTarget(run, risk.args, cwd)
  const known = await run(['git', 'rev-parse', '--verify', '--quiet', ref], { cwd, timeoutMs: SHORT_TIMEOUT_MS })
  if (known.exitCode !== 0) {
    return { ...emptyReport('commits', `force-push to ${ref}`, words().notes.refMissing(ref)), where: ref }
  }
  const log = await run(['git', 'log', '--oneline', '--no-decorate', `${source}..${ref}`], { cwd, timeoutMs: TIMEOUT_MS })
  const dropped = lines(log.stdout)
  const items = dropped.slice(0, LIST_MAX).map(line => ({ name: line.replace(/^\S+\s*/, ''), tag: line.split(' ')[0] ?? '', meta: '', weight: 0 }))
  const summary = dropped.length === 0 ? `force-push to ${ref}: drops no commits` : `force-push to ${ref}: drops ${plural(dropped.length, 'commit', 'commits')}`
  const note = dropped.length === 0 ? words().notes.noDroppedCommits(ref) : null

  return { ...emptyReport('commits', summary, note), count: dropped.length, items, more: Math.max(0, dropped.length - LIST_MAX), where: ref }
}

// Every tool's own status command (showmigrations, alembic history, db:migrate:status, prisma migrate status)
// loads the project's code, and measuring happens before anyone answers: pending migrations are not listed.
export async function measureMigrations(risk: MigrateRisk): Promise<Report> {
  const summary = risk.tool === 'unknown' ? 'run migrations' : `run ${risk.label}`

  return emptyReport('migrations', summary, words().notes.cannotListMigrations)
}
