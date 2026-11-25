// Measuring the tools that drop data outside the working tree, each by asking the tool itself
// read-only: docker (volumes, prune), terraform (state list), kubectl (get), rsync (a dry run).
// A database statement can't be measured from here: it is held with the statement named.
// Measuring happens before anyone answers, so a listing that would start a program the command
// names, or reach another machine, is not tried: the command is held unmeasured.

import { emptyReport, lines, nothingReport, plural, LIST_MAX } from './report'
import type { Item, Report, Run } from './report'
import type { Risk, ToolKind } from './classify'
import { words } from './words'

type ToolRisk = Extract<Risk, { kind: 'tool' }>
type Lister = (risk: ToolRisk) => { argv: string[]; pick: (stdout: string) => string[] }

const TIMEOUT_MS = 20000

// Values kubectl get takes from a delete; every other delete flag is dropped from the get.
const KUBE_KEPT = new Set(['-n', '--namespace', '-l', '--selector', '-f', '--filename', '--context', '--field-selector'])
const KUBE_KEPT_BARE = new Set(['-A', '--all-namespaces', '-R', '--recursive'])

function kubeGet(args: string[]): string[] {
  const kept: string[] = []
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i] ?? ''
    const flag = a.split('=')[0] ?? a
    if (KUBE_KEPT.has(a)) kept.push(a, args[(i += 1)] ?? '')
    else if (KUBE_KEPT.has(flag) || KUBE_KEPT_BARE.has(a) || !a.startsWith('-')) kept.push(a)
  }

  return ['kubectl', 'get', ...kept, '-o', 'name']
}

// A kubeconfig can name a program kubectl runs to get credentials.
const namesKubeconfig = (args: string[]): boolean => args.some(a => a.split('=')[0] === '--kubeconfig')

// rsync options a dry run can take without starting a program (-e, --rsh) or writing a file (--log-file):
// anything else, and any operand on another machine (host:path, rsync://), is not tried.
const RSYNC_SHORT = /^-[avrzhPuclptgoDHAXSxqimOJWkKLd]+$/
const RSYNC_BARE = new Set(['--archive', '--recursive', '--verbose', '--compress', '--checksum', '--update', '--human-readable', '--progress', '--partial', '--stats', '--force', '--links', '--perms', '--times', '--existing', '--ignore-existing', '--delete', '--delete-before', '--delete-during', '--delete-after', '--delete-delay', '--delete-excluded'])
const RSYNC_VALUED = new Set(['--exclude', '--include', '--exclude-from', '--include-from', '--max-delete', '--max-size', '--min-size'])
const REMOTE_OPERAND = /^[^/]*:/

function isSafeRsyncWord(word: string): boolean {
  if (word.startsWith('--')) return RSYNC_BARE.has(word)
  if (word.startsWith('-')) return RSYNC_SHORT.test(word)

  return !REMOTE_OPERAND.test(word)
}

function isLocalRsync(args: string[]): boolean {
  for (let i = 0; i < args.length; i += 1) {
    const word = args[i] ?? ''
    const isValued = RSYNC_VALUED.has(word.split('=')[0] ?? word)
    if (isValued && !word.includes('=')) i += 1
    if (!isValued && !isSafeRsyncWord(word)) return false
  }

  return true
}

function isTriedFirst(risk: ToolRisk): boolean {
  if (risk.tool === 'rsync') return isLocalRsync(risk.args)

  return risk.tool !== 'kubectl' || !namesKubeconfig(risk.args)
}

/** Reclaimable space per kind from `docker system df`; volumes only when the prune takes them. */
function dockerPrune(risk: ToolRisk): ReturnType<Lister> {
  const isVolumes = risk.args[0] === 'volume'
  const hasVolumes = isVolumes || risk.args.includes('--volumes')
  if (isVolumes) return { argv: ['docker', 'volume', 'ls', '-q', '--filter', 'dangling=true'], pick: lines }
  const pick = (stdout: string) => lines(stdout).filter(line => !/\t0B\b/.test(line) && (hasVolumes || !line.startsWith('Local Volumes')))

  return { argv: ['docker', 'system', 'df', '--format', '{{.Type}}\t{{.Reclaimable}}'], pick }
}

const LISTERS: Record<Exclude<ToolKind, 'database'>, Lister> = {
  'docker-volume': risk => ({ argv: ['docker', 'volume', 'ls', '-q'], pick: stdout => lines(stdout).filter(name => risk.args.includes(name)) }),
  'docker-prune': dockerPrune,
  'docker-compose': risk => ({ argv: ['docker', 'compose', ...risk.args, 'config', '--volumes'], pick: lines }),
  terraform: () => ({ argv: ['terraform', 'state', 'list'], pick: lines }),
  kubectl: risk => ({ argv: kubeGet(risk.args), pick: lines }),
  rsync: risk => ({
    argv: ['rsync', '--dry-run', '--itemize-changes', ...risk.args],
    pick: stdout => lines(stdout).filter(line => line.startsWith('*deleting')).map(line => line.replace(/^\*deleting\s+/, '')),
  }),
}

export async function measureTool(run: Run, risk: ToolRisk, cwd: string): Promise<Report> {
  if (risk.tool === 'database') return emptyReport('unknown', `run ${risk.label} on the database`, words().notes.database(risk.label))
  if (!isTriedFirst(risk)) return emptyReport('removals', `${risk.label} (not tried first)`, words().notes.toolNotTried)
  const { argv, pick } = LISTERS[risk.tool](risk)
  let ran
  try {
    ran = await run(argv, { cwd, timeoutMs: TIMEOUT_MS })
  } catch (error) {
    ran = { exitCode: -1, stdout: '', stderr: String(error) }
  }
  if (ran.exitCode !== 0) return emptyReport('removals', `${risk.label} (could not list what it removes)`, words().notes.toolFailed(argv.slice(0, 3).join(' ')))
  const names = pick(ran.stdout)
  if (names.length === 0) return nothingReport('removals', `${risk.label}: removes nothing`)
  const items: Item[] = names.slice(0, LIST_MAX).map(name => ({ name: name.replace('\t', ' · '), tag: '', meta: '', weight: 0 }))
  const summary = `${risk.label}: removes ${plural(names.length, 'item', 'items')} (${names.slice(0, LIST_MAX).join(', ').replace(/\t/g, ' ')})`

  return { ...emptyReport('removals', summary, null), count: names.length, items, more: Math.max(0, names.length - LIST_MAX), where: risk.tool }
}
