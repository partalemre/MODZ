// The session's own scratchpad (`scratchpad_dir`): a delete or overwrite whose every path resolves inside it
// touches only this session's working files, so it runs with no card. A subagent can't answer a card, and its
// scratch files were refused. Strict: only this session's folder, never the rest of /tmp; a `..`, a variable,
// `~`, a brace, a glob before the last part, or a symlink that leads out keeps the usual check. `find` is not
// covered: its actions (`-exec rm …`) reach past its roots.

import type { EngineInterface } from 'claude-code'

import type { Risk } from './classify'

const TIMEOUT_MS = 5000
// A variable, a substitution, home, an escape or a brace (`{..,x}` expands to a parent).
const UNSAFE = /[$`~\\{}]/
const GLOB = /[*?[\]]/

// Arguments only, never source: the scratchpad's real path, then per path the real path of its nearest existing
// folder and whether the path itself is a symlink.
const SCRIPT = `# blast-radius scratch
unset CDPATH
s=$(cd -P -- "$1" 2>/dev/null && pwd -P) || exit 3
printf 'S\\t%s\\n' "$s"; shift
for p in "$@"; do
  d=$(dirname -- "$p"); while [ ! -d "$d" ]; do d=$(dirname -- "$d"); done
  r=$(cd -P -- "$d" 2>/dev/null && pwd -P) || r=
  l=0; [ -L "$p" ] && l=1
  printf 'P\\t%s\\t%s\\n' "$l" "$r"
done`

/** The paths a risk deletes or overwrites; null for a kind this exemption does not cover. */
export function writtenPaths(risk: Risk): string[] | null {
  if (risk.isFromInput === true) return null
  if (risk.kind === 'rm') return risk.targets.length === 0 ? null : risk.targets
  if (risk.kind === 'overwrite') return risk.paths.length === 0 || risk.paths.some(path => GLOB.test(path)) ? null : risk.paths

  return null
}

/** The absolute path a word names, from `base`; null when it is not read plainly (`..`, `$X`, `~`, a glob before the last part). */
export function plainPath(word: string, base: string): string | null {
  if (word === '' || UNSAFE.test(word) || !base.startsWith('/') || UNSAFE.test(base)) return null
  const parts = `${word.startsWith('/') ? '' : `${base}/`}${word}`.split('/').filter(part => part !== '' && part !== '.')
  if (parts.length === 0 || parts.includes('..') || word.endsWith('/')) return null
  const last = parts[parts.length - 1] ?? ''
  if (parts.slice(0, -1).some(part => GLOB.test(part)) || (GLOB.test(last) && last.startsWith('.'))) return null

  return `/${parts.join('/')}`
}

const isUnder = (path: string, root: string): boolean => path === root || path.startsWith(`${root}/`)

/** Reads the script's output: true only when every path is no symlink and sits inside the real scratchpad. */
export function isAllInside(stdout: string, count: number): boolean {
  const rows = stdout.split('\n').filter(line => line !== '').map(line => line.split('\t'))
  const root = rows[0]?.[0] === 'S' ? rows[0][1] ?? '' : ''
  const paths = rows.slice(1)
  if (root === '' || paths.length !== count) return false

  return paths.every(([tag, link, real]) => tag === 'P' && link === '0' && real !== undefined && real !== '' && isUnder(real, root))
}

async function isInScratch($: EngineInterface, risk: Risk, place: { cwd: string; scratch: string }): Promise<boolean> {
  const words = writtenPaths(risk)
  if (words === null) return false
  const base = risk.dir === null ? place.cwd : (plainPath(risk.dir, place.cwd) ?? '')
  const paths = words.map(word => plainPath(word, base))
  if (paths.some(path => path === null)) return false
  const ran = await $.process.run(['bash', '-c', SCRIPT, 'blast-radius', place.scratch, ...(paths as string[])], { timeoutMs: TIMEOUT_MS })

  return ran.exitCode === 0 && isAllInside(ran.stdout, paths.length)
}

/** The risks left once those wholly inside this session's scratchpad are dropped; all of them on any doubt. */
export async function outsideScratch($: EngineInterface, risks: Risk[]): Promise<Risk[]> {
  if (risks.length === 0) return risks
  try {
    // `info` arrived after 2.1.296, whose types some checkouts still hold; an engine without it throws here.
    const scratch = (await ($.session as typeof $.session & { info: () => Promise<{ scratchpadDir?: string }> }).info()).scratchpadDir
    if (scratch === undefined || scratch === '') return risks
    const place = { cwd: await $.session.cwd(), scratch }
    const kept: Risk[] = []
    for (const risk of risks) if (!(await isInScratch($, risk, place))) kept.push(risk)

    return kept
  } catch {
    $.ui.log('blast-radius: could not check the scratchpad, so the usual check applies', { to: 'debug' })

    return risks
  }
}
