// The other commands that can lose what exists: find deletes, writes over a file (mv, cp,
// truncate, dd, shred, tee), and the tools that drop data elsewhere (docker volumes, a database,
// terraform, kubernetes, rsync --delete). Measuring decides whether anything would be lost.

import type { Risk, ToolKind } from './classify'
import { commandName } from './shell'

type Found = Risk | null

const EXEC_ACTIONS = new Set(['-exec', '-execdir', '-ok', '-okdir'])
const EXEC_END = new Set([';', '\\;', '+'])
// A flag cluster with n or i (cp -n, mv -i) never writes over a file without asking.
const NO_CLOBBER = /^-[a-zA-Z]*[ni][a-zA-Z]*$|^--(?:no-clobber|interactive|update=none)$/
const COPY_VALUED = new Set(['-S', '--suffix'])
const SQL_CLIENTS = new Set(['psql', 'mysql', 'mariadb', 'sqlite3', 'sqlcmd', 'clickhouse-client'])
const LOSSY_SQL = /\b(?:DROP\s+(?:TABLE|DATABASE|SCHEMA|VIEW|INDEX|TYPE|FUNCTION|COLLECTION)(?:\s+IF\s+EXISTS)?\s+[\w."`]+|TRUNCATE(?:\s+TABLE)?\s+[\w."`]+|DELETE\s+FROM\s+[\w."`]+(?![^;]*\bWHERE\b))/i
// A reset or drop of a whole database, through whatever runner starts the tool.
const DATABASE_RESETS = /\bsupabase\s+db\s+reset\b|\bprisma\s+migrate\s+reset\b|\bprisma\s+db\s+push\b.*--force-reset|\bdb:(?:drop|reset)\b|\bmanage\.py\s+flush\b/
const KUBE_VALUED = new Set(['-n', '--namespace', '--context', '--kubeconfig', '--cluster', '--user', '-l', '--selector', '-f', '--filename'])
const RSYNC_DELETE =/^--del(?:ete(?:-[a-z]+)?)?$/

const tool = (kind: ToolKind, label: string, args: string[], dir: string | null): Risk => ({ kind: 'tool', tool: kind, label, args, dir })
const baseName = (path: string): string => path.replace(/\/+$/, '').split('/').pop() ?? path

/** The words that aren't options, skipping the values of `valued` options; all of them after `--`. */
function operands(args: string[], valued: Set<string>): string[] {
  const found: string[] = []
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i] ?? ''
    if (a === '--') return [...found, ...args.slice(i + 1)]
    if (valued.has(a)) i += 1
    else if (!a.startsWith('-') || a === '-') found.push(a)
  }

  return found
}

/** `find … -delete` or `-exec rm … ;`, with that action swapped for -print so it can be dry-run. */
function classifyFind(args: string[], dir: string | null): Found {
  const dry: string[] = []
  let isDeleting = false
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i] ?? ''
    if (!EXEC_ACTIONS.has(a)) {
      dry.push(a === '-delete' ? '-print' : a)
      isDeleting ||= a === '-delete'
      continue
    }
    const end = args.findIndex((word, j) => j > i && EXEC_END.has(word))
    const stop = end === -1 ? args.length - 1 : end
    const isRm = commandName(args[i + 1] ?? '') === 'rm'
    dry.push(...(isRm ? ['-print'] : args.slice(i, stop + 1)))
    isDeleting ||= isRm
    i = stop
  }

  return isDeleting ? { kind: 'find', label: args.includes('-delete') ? 'find -delete' : 'find -exec rm', args: dry, dir } : null
}

/** `mv a b`, `cp -r a dir/`: the file it lands on, or the one of the same name inside the folder. */
function classifyCopy(cmd: string, args: string[], dir: string | null): Found {
  if (args.some(a => NO_CLOBBER.test(a))) return null
  const flagged = args.findIndex(a => a === '-t' || a.startsWith('--target-directory'))
  const glued = flagged === -1 ? undefined : args[flagged]?.split('=')[1]
  const valueAt = glued === undefined ? flagged + 1 : -1
  const named = operands(args.filter((_, i) => flagged === -1 || (i !== flagged && i !== valueAt)), COPY_VALUED)
  const target = flagged === -1 ? named.pop() : (glued ?? args[valueAt])
  if (target === undefined || named.length === 0) return null
  const inside = named.map(source => `${target.replace(/\/+$/, '')}/${baseName(source)}`)

  return { kind: 'overwrite', label: `${cmd} ${[...named, target].join(' ')}`, paths: flagged === -1 ? [target, ...inside] : inside, dir }
}

function classifyWrite(cmd: string, args: string[], dir: string | null): Found {
  if (cmd === 'mv' || cmd === 'cp') return classifyCopy(cmd, args, dir)
  let paths: string[] = []
  if (cmd === 'dd') paths = args.filter(a => a.startsWith('of=')).map(a => a.slice('of='.length))
  if (cmd === 'shred') paths = operands(args, new Set(['-n', '-s', '--iterations', '--size', '--random-source']))
  if (cmd === 'tee' && !args.some(a => a === '-a' || a === '--append')) paths = operands(args, new Set())
  if (cmd === 'truncate') {
    const size = args[args.findIndex(a => a === '-s' || a === '--size') + 1] ?? ''
    // Growing a file loses nothing.
    if (!size.startsWith('+')) paths = operands(args, new Set(['-s', '--size', '-r', '--reference']))
  }

  return paths.length > 0 ? { kind: 'overwrite', label: `${cmd} ${paths.join(' ')}`, paths, dir } : null
}

function classifyDocker(cmd: string, args: string[], dir: string | null): Found {
  const words = cmd === 'docker-compose' ? ['compose', ...args] : args
  const [group = '', action = '', ...rest] = words
  if (group === 'volume' && (action === 'rm' || action === 'remove')) return tool('docker-volume', `docker volume rm ${operands(rest, new Set()).join(' ')}`, operands(rest, new Set()), dir)
  if ((group === 'volume' || group === 'system') && action === 'prune') return tool('docker-prune', `docker ${group} prune`, words, dir)
  const down = words.indexOf('down')
  const isCompose = group === 'compose' && down !== -1
  if (isCompose && words.slice(down).some(a => a === '-v' || a === '--volumes')) return tool('docker-compose', 'docker compose down -v', words.slice(1, down), dir)

  return null
}

function classifyService(words: string[], cmd: string, dir: string | null): Found {
  const args = words.slice(1)
  const reset = DATABASE_RESETS.exec(words.join(' '))
  if (reset !== null) return tool('database', reset[0], [], dir)
  if (SQL_CLIENTS.has(cmd)) {
    const statement = LOSSY_SQL.exec(args.join(' '))

    return statement === null ? null : tool('database', statement[0], [], dir)
  }
  if (cmd === 'dropdb') return tool('database', ['dropdb', ...operands(args, new Set())].join(' '), [], dir)
  const first = operands(args, new Set(['-chdir']))[0]
  if ((cmd === 'terraform' || cmd === 'tofu') && (first === 'destroy' || (first === 'apply' && args.includes('-destroy')))) return tool('terraform', `${cmd} destroy`, [], dir)
  if (cmd === 'kubectl' && operands(args, KUBE_VALUED)[0] === 'delete') {
    const at = args.indexOf('delete')
    const rest = [...args.slice(0, at), ...args.slice(at + 1)]

    return tool('kubectl', `kubectl delete ${operands(rest, KUBE_VALUED).join(' ')}`.trim(), rest, dir)
  }
  const isDryRun = args.some(a => a === '--dry-run' || /^-[a-zA-Z]*n[a-zA-Z]*$/.test(a))
  if (cmd === 'rsync' && args.some(a => RSYNC_DELETE.test(a)) && !isDryRun) return tool('rsync', 'rsync --delete', args, dir)

  return null
}

export function classifyTool(words: string[], cmd: string, dir: string | null): Found {
  const args = words.slice(1)
  if (cmd === 'find') return classifyFind(args, dir)
  if (cmd === 'docker' || cmd === 'docker-compose') return classifyDocker(cmd, args, dir)

  return classifyWrite(cmd, args, dir) ?? classifyService(words, cmd, dir)
}
