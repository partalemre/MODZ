// Which project a working folder belongs to. A session runs in the repo, a folder inside it, or one of its worktrees:
// all of those are one project. A folder that was moved leaves its old path behind, so a path gone from disk joins
// the existing project of the same folder name.

export type RootIo = {
  exists: (path: string) => Promise<boolean>
  read: (path: string) => Promise<string>
  isDir: (path: string) => Promise<boolean>
}

export type RootInfo = { root: string; isGit: boolean; isOnDisk: boolean }

// Either kind of slash: on Windows a working folder is named with backslashes.
const WORKTREE_CUT = /[\\/](?:\.claude[\\/]worktrees|\.worktrees)[\\/]/
const GITDIR = /^gitdir:\s*(.+?)\/\.git\/worktrees\//m

const lastSlash = (path: string): number => Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
const parentOf = (path: string): string => path.slice(0, Math.max(0, lastSlash(path)))
export const baseOf = (path: string): string => path.slice(lastSlash(path) + 1)

export function cutWorktree(cwd: string): string {
  const at = cwd.search(WORKTREE_CUT)

  return at > 0 ? cwd.slice(0, at) : cwd
}

// Folders that are machinery rather than work: the home folder itself, app data and temp space.
export function isMachinery(raw: string, rawHome: string): boolean {
  const path = raw.replaceAll('\\', '/')
  const home = rawHome.replaceAll('\\', '/')
  if (path === '' || path === '/' || path === home) return true
  if (path.startsWith('/tmp/') || path.startsWith('/private/') || path.startsWith('/var/')) return true

  return path.startsWith(`${home}/Library/`) || path.startsWith(`${home}/AppData/`) || path.startsWith(`${home}/.claude`) || path.startsWith(`${home}/.`)
}

// The nearest folder at or above `path` that holds `.git`; '' when there is none.
async function gitTop(path: string, io: RootIo, home: string): Promise<string> {
  for (let at = path; at.length > 1 && at !== home; at = parentOf(at)) {
    if (await io.exists(`${at}/.git`)) return at
  }

  return ''
}

// A linked worktree's `.git` is a file naming the main repository.
async function mainRepo(top: string, io: RootIo): Promise<string> {
  if (await io.isDir(`${top}/.git`)) return top
  const named = GITDIR.exec(await io.read(`${top}/.git`).catch(() => ''))

  return named?.[1] ?? top
}

// Resolves each folder once; `started` holds the folders a main session began in, so a folder only a subagent walked
// into joins the nearest such folder above it rather than becoming a project of its own.
export async function resolveRoots(cwds: readonly string[], started: ReadonlySet<string>, ctx: { io: RootIo; home: string }): Promise<Map<string, RootInfo>> {
  const { io, home } = ctx
  const out = new Map<string, RootInfo>()
  const nearestStarted = (path: string): string => {
    for (let at = path; at.length > 1; at = parentOf(at)) if (started.has(at)) return at

    return path
  }
  for (const cwd of cwds) {
    const cut = cutWorktree(cwd)
    const top = await gitTop(cut, io, home)
    if (top !== '') {
      out.set(cwd, { root: await mainRepo(top, io), isGit: true, isOnDisk: true })
      continue
    }
    const root = nearestStarted(cut)
    out.set(cwd, { root, isGit: false, isOnDisk: await io.exists(root) })
  }

  return mergeMoved(out)
}

// A path no longer on disk takes the project of the same folder name that is, when exactly one exists.
export function mergeMoved(found: Map<string, RootInfo>): Map<string, RootInfo> {
  const living = new Map<string, Set<string>>()
  for (const info of found.values()) {
    if (!info.isOnDisk) continue
    const roots = living.get(baseOf(info.root)) ?? new Set<string>()
    living.set(baseOf(info.root), roots.add(info.root))
  }
  const isGitRoot = new Map([...found.values()].map(info => [info.root, info.isGit]))
  for (const [cwd, info] of found) {
    if (info.isOnDisk) continue
    const roots = living.get(baseOf(info.root))
    if (roots?.size !== 1) continue
    const [root = ''] = roots
    found.set(cwd, { root, isGit: isGitRoot.get(root) === true, isOnDisk: true })
  }

  return found
}
