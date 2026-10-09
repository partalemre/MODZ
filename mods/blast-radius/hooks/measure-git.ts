// Measuring git's risky commands and migrations: the changes `reset --hard` and
// `checkout -- .` drop, the commits a force push drops, the migrations to apply.

import { emptyReport, nothingReport, lines, plural, LIST_MAX } from './report'
import type { Item, Report, Run } from './report'
import type { GitRisk, Risk } from './classify'

type MigrateRisk = Extract<Risk, { kind: 'migrate' }>

const TIMEOUT_MS = 15000
const SHORT_TIMEOUT_MS = 10000
const MIGRATE_TIMEOUT_MS = 20000

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
  const status = await run(['git', 'status', '--porcelain'], { cwd, timeoutMs: TIMEOUT_MS })
  if (status.exitCode !== 0) {
    return emptyReport('changes', `${risk.label} (not a git repo here?)`, `git status çalışmadı: ${status.stderr.trim().slice(0, 160)}`)
  }
  const rows = lines(status.stdout).filter(l => l.length > 3 && !l.startsWith('??'))
  const isReset = risk.kind === 'git-reset'
  // reset --hard drops staged and unstaged changes; checkout -- . drops unstaged ones.
  const lost = isReset ? rows : rows.filter(l => l[1] !== ' ')
  const numstat = await run(['git', 'diff', '--numstat', isReset ? 'HEAD' : '--'], { cwd, timeoutMs: TIMEOUT_MS })
  const stats = parseNumstat(numstat.stdout)
  const items = lost.map(row => changeItem(row, stats)).sort((a, b) => b.weight - a.weight)
  if (lost.length === 0) return nothingReport('changes', 'discard nothing: no uncommitted changes')
  const summary = `discard uncommitted changes in ${plural(lost.length, 'file', 'files')}`
  const added = items.reduce((sum, item) => sum + (stats.get(item.name)?.added ?? 0), 0)
  const removed = items.reduce((sum, item) => sum + (stats.get(item.name)?.removed ?? 0), 0)

  return { ...emptyReport('changes', summary, null), count: lost.length, items: items.slice(0, LIST_MAX), more: Math.max(0, lost.length - LIST_MAX), added, removed }
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
    return { ...emptyReport('commits', `force-push to ${ref}`, `${ref} yerelde yok; hangi commit'lerin düşeceği bilinemiyor. Önce git fetch çalıştır.`), where: ref }
  }
  const log = await run(['git', 'log', '--oneline', '--no-decorate', `${source}..${ref}`], { cwd, timeoutMs: TIMEOUT_MS })
  const dropped = lines(log.stdout)
  const items = dropped.slice(0, LIST_MAX).map(line => ({ name: line.replace(/^\S+\s*/, ''), tag: line.split(' ')[0] ?? '', meta: '', weight: 0 }))
  const summary = dropped.length === 0 ? `force-push to ${ref}: drops no commits` : `force-push to ${ref}: drops ${plural(dropped.length, 'commit', 'commits')}`
  const note = dropped.length === 0 ? `${ref} üzerinde düşecek commit yok (son fetch'e göre).` : null

  return { ...emptyReport('commits', summary, note), count: dropped.length, items, more: Math.max(0, dropped.length - LIST_MAX), where: ref }
}

type Lister = { argv: string[]; isPending: (line: string) => boolean; strip: (line: string) => string }

const MIGRATION_LISTERS: Record<string, Lister> = {
  django: { argv: ['python3', 'manage.py', 'showmigrations', '--plan'], isPending: l => l.startsWith('[ ]'), strip: l => l.slice(4) },
  alembic: { argv: ['alembic', 'history', '-r', 'current:head'], isPending: l => l.includes('->'), strip: l => l },
  rails: { argv: ['bin/rails', 'db:migrate:status'], isPending: l => /^\s*down\b/.test(l), strip: l => l.trim() },
  prisma: { argv: ['npx', '--no-install', 'prisma', 'migrate', 'status'], isPending: l => /^\s{2}\S/.test(l), strip: l => l.trim() },
}

export async function measureMigrations(run: Run, risk: MigrateRisk, cwd: string): Promise<Report> {
  const lister = MIGRATION_LISTERS[risk.tool]
  if (lister === undefined) {
    return emptyReport('migrations', 'run migrations', 'Bu araç için bekleyen migration\'lar listelenemiyor.')
  }
  let ran
  try {
    ran = await run(lister.argv, { cwd, timeoutMs: MIGRATE_TIMEOUT_MS })
  } catch (error) {
    ran = { exitCode: -1, stdout: '', stderr: String(error) }
  }
  if (ran.exitCode !== 0) {
    return emptyReport('migrations', `run ${risk.label}`, `Bekleyen migration'lar listelenemedi (${lister.argv.join(' ')} başarısız).`)
  }
  const pending = ran.stdout.split('\n').filter(lister.isPending).map(lister.strip)
  const items = pending.slice(0, LIST_MAX).map(name => ({ name, tag: '', meta: '', weight: 0 }))
  if (pending.length === 0) return nothingReport('migrations', `run ${risk.label}: nothing pending`)
  const summary = `apply ${plural(pending.length, 'pending migration', 'pending migrations')}`

  return { ...emptyReport('migrations', summary, null), count: pending.length, items, more: Math.max(0, pending.length - LIST_MAX) }
}
