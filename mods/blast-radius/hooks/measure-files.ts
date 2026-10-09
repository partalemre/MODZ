// Measuring what `rm` and `git clean` would delete: every file under the paths,
// its size in bytes, grouped by folder, and how many of them git tracks.

import { emptyReport, nothingReport, plural, lines, LIST_MAX } from './report'
import type { FileRow, Group, Report, Run } from './report'
import type { GitRisk, Risk } from './classify'

// Folders and files per folder the script sends back; the rest is only counted.
const GROUPS_MAX = 8
const FILES_PER_GROUP = 30
const CLEAN_PATHS_MAX = 2000
const TIMEOUT_MS = 15000

// The paths are passed to bash as arguments, never as source, so nothing in
// them runs. compgen -G expands a glob without command substitution.
// Prints `H files found tracked`, then `T bytes`, then the biggest folders (G)
// and files (F), biggest first; a folder's line comes before its files'.
const FILES_SCRIPT = `
shopt -s nullglob dotglob
paths=()
for p in "$@"; do
  case "$p" in "~"|"~/"*) p="$HOME\${p#\\~}";; esac
  if [[ "$p" == *[*?[]* ]]; then
    while IFS= read -r m; do paths+=("$m"); done < <(compgen -G "$p")
  elif [[ -e "$p" || -L "$p" ]]; then
    paths+=("$p")
  fi
done
if (( \${#paths[@]} == 0 )); then echo "H 0 0 0"; exit 0; fi
# A relative path gets ./ in front, so find never reads a name like -delete as an action.
for i in "\${!paths[@]}"; do case "\${paths[$i]}" in /*) ;; *) paths[$i]="./\${paths[$i]}";; esac; done
files=$(find "\${paths[@]}" \\( -type f -o -type l \\) 2>/dev/null | wc -l | tr -d ' ')
tracked=0
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  tracked=$(git ls-files -- "\${paths[@]}" 2>/dev/null | wc -l | tr -d ' ')
fi
echo "H $files \${#paths[@]} $tracked"
find "\${paths[@]}" -type f -exec wc -c {} + 2>/dev/null | awk '
  { path = $0; sub(/^ *[0-9]+ /, "", path); if (path == "total") next
    dir = path; sub(/\\/[^\\/]*$/, "", dir); name = path; sub(/^.*\\//, "", name)
    count[dir]++; size[dir] += $1; total += $1
    printf "F\\t%d\\t%s\\t%s\\n", $1, dir, name }
  END { for (d in count) printf "G\\t%d\\t%s\\t%d\\n", size[d], d, count[d]; printf "T\\t%d\\n", total }' |
  LC_ALL=C sort -t "$(printf '\\t')" -k2,2nr -k1,1r |
  awk -F '\\t' -v groups=${GROUPS_MAX} -v per=${FILES_PER_GROUP} '
    $1 == "T" { print; next }
    $1 == "G" { if (shown < groups) { keep[$3] = 1; shown++; print }; next }
    $1 == "F" && ($3 in keep) && taken[$3] < per { taken[$3]++; print }'
`

type Scan = { files: number; found: number; tracked: number; bytes: number; groups: Group[] }

/** `./build/assets` → `build/assets/`; the session folder itself is `./`. */
export function folderName(dir: string): string {
  const bare = dir.replace(/^\.\/?/, '')

  return bare === '' ? './' : `${bare}/`
}

// A path the shell fills in only when it runs: `$D`, `${D}`, `$(…)` or backticks.
export const isUnresolved = (path: string): boolean => /[$`]/.test(path)

export function parseScan(stdout: string): Scan {
  const scan: Scan = { files: 0, found: 0, tracked: 0, bytes: 0, groups: [] }
  const byDir = new Map<string, Group>()
  for (const line of lines(stdout)) {
    if (line.startsWith('H ')) {
      const [files, found, tracked] = line.slice(2).split(' ').map(Number)
      Object.assign(scan, { files: files || 0, found: found || 0, tracked: tracked || 0 })
      continue
    }
    const [tag, size, dir = '', rest = ''] = line.split('\t')
    if (tag === 'T') scan.bytes = Number(size) || 0
    if (tag === 'G') {
      const group: Group = { dir: folderName(dir), count: Number(rest) || 0, bytes: Number(size) || 0, files: [] }
      byDir.set(dir, group)
      scan.groups.push(group)
    }
    if (tag === 'F') byDir.get(dir)?.files.push({ name: rest, bytes: Number(size) || 0 } satisfies FileRow)
  }

  return scan
}

export function size(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 1024) return `${bytes || 0} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let n = bytes
  let i = -1
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i += 1
  }

  return `${n.toFixed(n < 10 ? 1 : 0)} ${units[i]}`
}

function filesReport(scan: Scan, summary: string, note: string | null): Report {
  const listed = scan.groups.reduce((sum, group) => sum + group.files.length, 0)

  return { ...emptyReport('files', summary, note), count: scan.files, bytes: scan.bytes, groups: scan.groups, more: Math.max(0, scan.files - listed), tracked: scan.tracked }
}

export async function measureRm(run: Run, risk: Extract<Risk, { kind: 'rm' }>, cwd: string): Promise<Report> {
  const targets = risk.targets.join(' ')
  if (risk.targets.length === 0) return emptyReport('files', 'rm with no paths', 'Silinecek bir yol verilmemiş.')
  const unknown = risk.targets.filter(isUnresolved)
  if (unknown.length > 0) return emptyReport('files', `${risk.label} ${targets} (paths decided at run time)`, `${unknown.join(' ')} komut çalışırken belirleniyor; neyin silineceği önceden ölçülemiyor.`)
  const ran = await run(['bash', '-c', FILES_SCRIPT, 'blast-radius', ...risk.targets], { cwd, timeoutMs: TIMEOUT_MS })
  const scan = parseScan(ran.stdout)
  if (!scan.found) return nothingReport('files', `delete nothing: no file matches ${targets}`)
  if (!scan.files) return nothingReport('files', `delete ${plural(scan.found, 'empty path', 'empty paths')}`)

  return filesReport(scan, `delete ${plural(scan.files, 'file', 'files')} (about ${size(scan.bytes)})`, null)
}

/** The flags `git clean -n` can take from the real command: -f, -i and -q would change the dry run. */
export function cleanArgs(args: string[]): { flags: string[]; paths: string[] } {
  const flags: string[] = []
  const paths: string[] = []
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i] ?? ''
    if (a === '--') {
      paths.push(...args.slice(i + 1))
      break
    }
    if (a === '-e' || a === '--exclude') {
      flags.push(a, args[i + 1] ?? '')
      i += 1
    } else if (a.startsWith('--exclude=') || /^-e./.test(a)) {
      flags.push(a)
    } else if (/^-[a-zA-Z]+$/.test(a)) {
      const kept = a.replace(/[finq]/g, '')
      if (kept !== '-') flags.push(kept)
    } else if (!a.startsWith('-')) {
      paths.push(a)
    }
  }

  return { flags, paths }
}

export async function measureClean(run: Run, risk: GitRisk, cwd: string): Promise<Report> {
  const { flags, paths } = cleanArgs(risk.args)
  const dry = await run(['git', 'clean', '-n', ...flags, '--', ...paths], { cwd, timeoutMs: TIMEOUT_MS })
  if (dry.exitCode !== 0) return emptyReport('files', 'git clean (could not dry-run it)', `git clean -n çalışmadı: ${dry.stderr.trim().slice(0, 160)}`)
  const gone = lines(dry.stdout).filter(l => l.startsWith('Would remove ')).map(l => l.slice('Would remove '.length))
  const summary = gone.length === 0 ? 'remove nothing: no untracked files match' : `remove ${plural(gone.length, 'untracked path', 'untracked paths')}`
  if (gone.length === 0) return nothingReport('files', summary)
  const ran = await run(['bash', '-c', FILES_SCRIPT, 'blast-radius', ...gone.slice(0, CLEAN_PATHS_MAX)], { cwd, timeoutMs: TIMEOUT_MS })
  const scan = parseScan(ran.stdout)
  if (!scan.files) {
    const items = gone.slice(0, LIST_MAX).map(name => ({ name, tag: '', meta: '', weight: 0 }))

    return { ...emptyReport('files', summary, null), count: gone.length, items, more: Math.max(0, gone.length - LIST_MAX), tracked: 0 }
  }

  return { ...filesReport(scan, summary, null), tracked: 0 }
}
