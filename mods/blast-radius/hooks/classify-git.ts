// The git commands that can throw work away: reset --hard, clean, checkout/restore of paths,
// a forced checkout or switch, stash drop/clear, branch -D, a force or deleting push, and
// worktree remove --force. Dry runs and commands git refuses on a dirty tree pass.

import type { GitKind, GitRisk } from './classify'
import { joinDir } from './shell'

type Rule = (rest: string[], dir: string | null) => GitRisk | null

/** `-f`, or a cluster like `-fd` that holds the letter. */
const hasShort = (args: string[], letter: string): boolean => args.some(a => /^-[a-zA-Z]+$/.test(a) && a.includes(letter))
const hasFlag = (args: string[], long: string[], letter: string): boolean => args.some(a => long.includes(a)) || hasShort(args, letter)
const positionals = (args: string[]): string[] => args.filter(a => !a.startsWith('-'))

const make = (kind: GitKind, label: string, fields: { args: string[]; dir: string | null; paths?: string[]; dropsStaged?: boolean }): GitRisk => ({ kind, label, ...fields })

/** Git's own options come before the subcommand; -C moves where it runs. */
function gitSubcommand(args: string[], dir: string | null): { at: number; dir: string | null } {
  let gitDir = dir
  let at = 0
  while (at < args.length && (args[at] ?? '').startsWith('-')) {
    if (args[at] === '-C' && at + 1 < args.length) {
      gitDir = joinDir(gitDir, args[at + 1])
      at += 2
    } else if (args[at] === '-c' && at + 1 < args.length) {
      at += 2
    } else {
      at += 1
    }
  }

  return { at, dir: gitDir }
}

/** `checkout -- paths` drops unstaged changes there; `checkout ref -- paths` and `checkout -f` drop staged ones too. */
const checkout: Rule = (rest, dir) => {
  if (rest.some(a => ['-b', '-B', '--orphan', '-p', '--patch'].includes(a))) return null
  const isForce = rest.includes('--force') || hasShort(rest, 'f')
  if (isForce) return make('git-checkout', 'git checkout -f', { args: rest, dir, paths: [], dropsStaged: true })
  const dashes = rest.indexOf('--')
  const before = positionals(dashes === -1 ? rest : rest.slice(0, dashes))
  // Without `--`, the first of several words is the ref; a lone word is a branch or a path, and
  // measuring tells which: a branch name matches no changed file, so a plain switch runs with no card.
  const ref = dashes === -1 ? before.slice(0, before.length > 1 ? 1 : 0) : before
  const paths = dashes === -1 ? before.slice(ref.length) : positionals(rest.slice(dashes + 1))
  if (paths.length === 0) return null

  return make('git-checkout', ['git checkout', ...ref, '--', ...paths].join(' '), { args: rest, dir, paths, dropsStaged: ref.length > 0 })
}

const restore: Rule = (rest, dir) => {
  const isStaged = hasFlag(rest, ['--staged'], 'S')
  const isWorktree = hasFlag(rest, ['--worktree'], 'W')
  if ((isStaged && !isWorktree) || hasFlag(rest, ['--patch'], 'p')) return null
  const paths: string[] = []
  for (let i = 0; i < rest.length; i += 1) {
    const a = rest[i] ?? ''
    if (a === '-s' || a === '--source') i += 1
    else if (!a.startsWith('-')) paths.push(a)
  }
  if (paths.length === 0) return null

  return make('git-checkout', `git restore ${paths.join(' ')}`, { args: rest, dir, paths, dropsStaged: isStaged && isWorktree })
}

const push: Rule = (rest, dir) => {
  if (hasFlag(rest, ['--dry-run'], 'n')) return null
  const named = positionals(rest)
  const colonRefs = named.slice(1).filter(ref => ref.startsWith(':')).map(ref => ref.slice(1))
  if (hasFlag(rest, ['--delete'], 'd') || colonRefs.length > 0) {
    const branches = colonRefs.length > 0 ? colonRefs : named.slice(1)

    return make('git-push-delete', `git push --delete ${named[0] ?? 'origin'} ${branches.join(' ')}`.trim(), { args: [named[0] ?? 'origin', ...branches], dir })
  }
  const isForce = rest.some(a => a === '--force' || a === '-f' || a.startsWith('--force-with-lease') || /^\+/.test(a))

  return isForce ? make('git-push-force', 'git push --force', { args: rest, dir }) : null
}

const RULES: Record<string, Rule> = {
  reset: (rest, dir) => (rest.includes('--hard') ? make('git-reset', 'git reset --hard', { args: rest, dir }) : null),
  clean: (rest, dir) => (hasFlag(rest, ['--dry-run'], 'n') ? null : make('git-clean', 'git clean', { args: rest, dir })),
  checkout,
  restore,
  switch: (rest, dir) => (hasFlag(rest, ['--force', '--discard-changes'], 'f') ? make('git-checkout', 'git switch -f', { args: rest, dir, paths: [], dropsStaged: true }) : null),
  stash: (rest, dir) => (rest[0] === 'drop' || rest[0] === 'clear' ? make('git-stash', `git stash ${rest.join(' ')}`, { args: rest, dir }) : null),
  branch: (rest, dir) => {
    const isDelete = rest.includes('-D') || hasShort(rest, 'D') || (hasFlag(rest, ['--delete'], 'd') && hasFlag(rest, ['--force'], 'f'))
    const names = positionals(rest)

    return isDelete ? make('git-branch-delete', `git branch -D ${names.join(' ')}`.trim(), { args: names, dir }) : null
  },
  push,
  worktree: (rest, dir) => {
    const isForce = hasFlag(rest, ['--force'], 'f')

    return rest[0] === 'remove' && isForce ? make('git-worktree', 'git worktree remove --force', { args: positionals(rest.slice(1)), dir }) : null
  },
}

export function classifyGit(args: string[], dir: string | null): GitRisk | null {
  const found = gitSubcommand(args, dir)
  const sub = args[found.at] ?? ''

  return Object.hasOwn(RULES, sub) ? (RULES[sub]?.(args.slice(found.at + 1), found.dir) ?? null) : null
}
