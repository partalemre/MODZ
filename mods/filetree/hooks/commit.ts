// Where a Bash command's git work ran, and what its commit came to.
// A commit is judged in the repository it ran in: a `cd other && git commit` that lands in
// another repo is a success there, never a failure of the tree's own HEAD.

import { gitWords, type Reason } from './gitwords'
import { resolve, segments, stripGlobals } from './shell'
import { inside, isAbsolute } from './tree'

export type Outcome = { state: 'done' | 'failed'; label: string; detail: string }

const SHA_SHOWN = 7
const ASSIGN = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/s
// Left after expansion, these make a path a guess: an unknown variable, a substitution, a glob.
const UNSURE = /[$`*?]|^~[^/]|^-$/
const SUBSHELL_HEADS = new Set(['pushd', 'popd', 'source', '.', 'eval', 'sh', 'bash', 'zsh'])

// git's own words for why a commit did not happen, said plainly.
const REASONS: [RegExp, Reason][] = [
  [/nothing to commit|nothing added to commit|no changes added to commit/i, 'nothing'],
  [/please tell me who you are|author identity unknown|empty ident name/i, 'identity'],
  [/not a git repository/i, 'notRepo'],
  [/unmerged files|fix conflicts|not concluded your merge/i, 'conflicts'],
  [/gpg failed|failed to sign/i, 'sign'],
  [/empty commit message/i, 'emptyMessage'],
  [/index\.lock/i, 'locked'],
  [/hook (failed|exited|declined)|pre-commit|commit-msg/i, 'hook'],
]

export function commitReason(text: string): string {
  const reason = REASONS.find(([pattern]) => pattern.test(text))?.[1]

  return reason === undefined ? '' : gitWords().reasons[reason]
}

function expand(token: string, vars: Record<string, string>): string {
  return token.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g, (whole, braced, bare) => vars[braced ?? bare] ?? whole)
}

// `cwd` empty means the loop's folder is not known (a subagent may work in its own worktree).
function step(dir: string, to: string | undefined, home: string): string | null {
  if (!to || UNSURE.test(to)) return null
  const isRooted = isAbsolute(to) || to === '~' || to.startsWith('~/')
  if (!dir && !isRooted) return null
  return resolve(dir || '/', to, home)
}

// The folder git ran in at its first commit (else its first git call): cd, `git -C` and
// plain `NAME=value` assignments followed; null when any of it is a guess.
export function gitDirOf(command: string, at: { cwd: string; home: string }): string | null {
  const vars: Record<string, string> = at.home ? { HOME: at.home } : {}
  let dir: string | null = at.cwd
  let first: string | null | undefined
  for (const raw of segments(command)) {
    const tokens = raw.map(t => expand(t, vars))
    const assigns = tokens.map(t => ASSIGN.exec(t))
    if (assigns.every(Boolean)) {
      for (const m of assigns) if (m) vars[m[1] ?? ''] = m[2] ?? ''
      continue
    }
    const words = stripGlobals(tokens)
    const head = words[0]?.split('/').pop() ?? ''
    if (SUBSHELL_HEADS.has(head) || head.startsWith('(')) return null
    if (head === 'cd') dir = dir === null ? null : step(dir, words[1], at.home)
    if (head !== 'git') continue
    const run = gitCall(words, dir, at.home)
    if (run.verb === 'commit') return run.dir
    if (first === undefined) first = run.dir
  }
  return first ?? null
}

function gitCall(words: string[], dir: string | null, home: string): { verb: string; dir: string | null } {
  let at = dir
  let i = 1
  while (i < words.length && (words[i] ?? '').startsWith('-')) {
    if (words[i] === '-C') at = at === null ? null : step(at, words[i + 1], home)
    if (words[i] === '-C' || words[i] === '-c') i++
    i++
  }
  return { verb: words[i] ?? '', dir: at === '' ? null : at }
}

// Whether git's work belongs to the tree's repository, and the name to show when it does not.
export function placeOf(dir: string | null, home: { top: string; isAgent: boolean }): { isHere: boolean; name: string } {
  if (dir === null) return { isHere: !home.isAgent, name: '' }
  if (home.top && inside(home.top, dir)) return { isHere: true, name: '' }
  return { isHere: false, name: dir.slice(dir.lastIndexOf('/') + 1) || dir }
}

export type CommitFacts = {
  // The new commit, from the tool's own report or from HEAD moving where git ran.
  sha: string
  place: string
  // Where git ran is known, so an unmoved HEAD there is proof nothing was committed.
  isDirKnown: boolean
  // The command alone failed (exit code), with nothing after it to blame.
  hasFailed: boolean
  text: string
}

export function commitOutcome(f: CommitFacts): Outcome {
  const w = gitWords()
  if (f.sha) return { state: 'done', label: f.place ? w.committedIn(f.place) : w.committed, detail: f.sha.slice(0, SHA_SHOWN) }
  const reason = commitReason(f.text)
  if (reason) return { state: 'failed', label: w.noCommit(reason), detail: '' }
  if (f.isDirKnown || f.hasFailed) return { state: 'failed', label: w.noCommitMade, detail: '' }
  return { state: 'done', label: w.commitRan, detail: '' }
}
