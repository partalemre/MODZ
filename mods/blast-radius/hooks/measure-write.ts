// Measuring a write over existing files (`> file`, mv/cp onto a file, truncate, dd, shred, tee):
// which of them hold something that would be lost. A missing or empty file loses nothing, nor does
// one git has unchanged, a temp file, or a log or build output git ignores.

import { REBUILDABLE, isUnresolved } from './measure-files'
import { emptyReport, lines, nothingReport, plural, LIST_MAX } from './report'
import type { Item, Report, Run } from './report'
import type { Risk } from './classify'
import { TEMP_PATH } from './shell'
import { words } from './words'

const TIMEOUT_MS = 15000

// Paths are arguments, never source. Per existing non-empty file: `P\tbytes\tstate\tpath`, where
// state is clean (git has it unchanged), ignored (git ignores it) or other.
const WRITE_SCRIPT = `
for p in "$@"; do
  case "$p" in "~"|"~/"*) p="$HOME\${p#\\~}";; esac
  [[ -f "$p" && -s "$p" ]] || continue
  state=other
  if git ls-files --error-unmatch -- "$p" >/dev/null 2>&1; then
    git diff --quiet HEAD -- "$p" 2>/dev/null && state=clean
  elif git check-ignore -q -- "$p" 2>/dev/null; then
    state=ignored
  fi
  printf 'P\\t%s\\t%s\\t%s\\n' "$(wc -c < "$p" | tr -d ' ')" "$state" "$p"
done
`

// A device that keeps nothing; any other /dev path is a disk, and writing it can wipe one.
const HARMLESS_DEVICE = /^\/dev\/(?:null|zero|stdout|stderr|tty|fd\/\d+)$/

/** A file whose loss costs nothing: git-ignored output (a log, a build folder); `.env` and the like still count. */
const isThrowaway = (path: string, state: string): boolean =>
  state === 'ignored' && (path.endsWith('.log') || path.split('/').some(part => REBUILDABLE.has(part)))

export async function measureWrite(run: Run, risk: Extract<Risk, { kind: 'overwrite' }>, cwd: string): Promise<Report> {
  // shortcut: a write to a path only known at run time (`cp "$a" "$b"`, a loop variable) passes unmeasured;
  // holding each one stopped agents' ordinary work. Upgrade by expanding loop and assignment variables.
  const paths = risk.paths.filter(path => !TEMP_PATH.test(path) && !isUnresolved(path))
  const device = paths.find(path => path.startsWith('/dev/') && !HARMLESS_DEVICE.test(path))
  if (device !== undefined) return emptyReport('overwrites', `${risk.label} (writes the device ${device})`, words().notes.device(device))
  if (paths.length === 0) return nothingReport('overwrites', `${risk.label}: writes only temp files or paths named at run time`)
  const ran = await run(['bash', '-c', WRITE_SCRIPT, 'blast-radius', ...paths], { cwd, timeoutMs: TIMEOUT_MS })
  if (ran.exitCode !== 0) throw new Error(`the overwrite scan exited ${ran.exitCode}`)
  const lost: Item[] = []
  for (const line of lines(ran.stdout)) {
    const [tag, bytes = '0', state = 'other', ...rest] = line.split('\t')
    const path = rest.join('\t')
    if (tag !== 'P' || state === 'clean' || isThrowaway(path, state)) continue
    lost.push({ name: path, tag: state === 'ignored' ? 'ignored' : '', meta: words().size(Number(bytes) || 0), weight: Number(bytes) || 0 })
  }
  if (lost.length === 0) return nothingReport('overwrites', `${risk.label}: overwrites nothing git can't bring back`)
  const bytes = lost.reduce((sum, item) => sum + item.weight, 0)
  const summary = `overwrite ${plural(lost.length, 'file', 'files')} git can't bring back: ${lost.map(item => item.name).slice(0, LIST_MAX).join(', ')}`

  return { ...emptyReport('overwrites', summary, null), count: lost.length, bytes, items: lost.slice(0, LIST_MAX), more: Math.max(0, lost.length - LIST_MAX) }
}
