import { byRecent, growProjects, joinCopies, withClearNames, isLeftOffEmpty, isShown, leftOffStamp, spent } from './build'
import type { Found, Grown } from './build'
import { lang } from './kit/lang'
import { leftOffOf } from './leftoff'
import { ESTIMATE_SYSTEM, estimatePrompt, parseEstimate, percentOf } from './percent'
import { readPlans } from './plans'
import { resolveRoots } from './roots'
import { isAgentFile, scanFiles } from './scan'
import type { ScanIo } from './scan'
import type { Estimate, FileSum, Git, LeftOff, PlanRow, Project, Snapshot } from '../types'

// Everything that touches the disk or a process to make the snapshot. Read only, but for this mod's own folder.

const ESTIMATES_KEY = 'projects.estimates'
const HIDDEN_KEY = 'projects.hidden'
// The end of a session's transcript: enough for its last turns and, nearly always, its task list.
const TAIL_BYTES = 2_000_000
const README_CHARS = 1800
const NOTES_CHARS = 2400
const NOTE_FILES = ['PROGRESS.md', 'ROADMAP.md', 'STATUS.md', 'CHANGELOG.md']
const COMMITS_SHOWN = 15
const ESTIMATE_TOKENS = 400
const ESTIMATE_TIMEOUT_MS = 45_000
const RUN_MS = 8000

export type Paths = { config: string; home: string; own: string }

export const pathsOf = (transcript: string, home: string): Paths | null => {
  if (!transcript.endsWith('.jsonl')) return null
  const config = transcript.split('/').slice(0, -3).join('/')

  return { config, home, own: `${config}/modz-projects` }
}

// The engine's calls, as closures register.tsx makes: `$` never crosses a module.
export type Io = ScanIo & {
  now: () => Promise<number>
  write: (path: string, text: string) => Promise<void>
  exists: (path: string) => Promise<boolean>
  isDir: (path: string) => Promise<boolean>
  run: (argv: readonly string[], timeoutMs: number) => Promise<{ exitCode: number; stdout: string }>
  storeGet: (key: string) => Promise<unknown>
  storeSet: (key: string, value: unknown) => Promise<void>
  complete: (request: { system: string; prompt: string; maxTokens: number; timeoutMs: number }) => Promise<string | null>
}

type Cache = { files: Record<string, FileSum>; leftOff: Record<string, { stamp: string; left: LeftOff }> }

async function readJson<T>(io: Io, path: string, empty: T): Promise<T> {
  try {
    return JSON.parse(await io.read(path)) as T
  } catch {
    return empty
  }
}

async function run(io: Io, argv: readonly string[]): Promise<string> {
  const done = await io.run(argv, RUN_MS).catch(() => ({ exitCode: 1, stdout: '' }))

  return done.exitCode === 0 ? done.stdout : ''
}

export async function readGit(io: Io, root: string): Promise<Git | null> {
  const git = (...args: string[]) => run(io, ['git', '-C', root, ...args])
  const log = (await git('log', '-1', '--format=%h%x09%ct%x09%s')).trim()
  if (log === '') return null
  const [head = '', at = '0', ...subject] = log.split('\t')

  return {
    branch: (await git('branch', '--show-current')).trim(),
    head,
    subject: subject.join('\t'),
    commitAt: Number(at) * 1000,
    dirty: (await git('--no-optional-locks', 'status', '--porcelain')).split('\n').filter(line => line !== '').length,
    commits: Number((await git('rev-list', '--count', 'HEAD')).trim()) || 0,
  }
}

async function readLeftOff(io: Io, grown: Grown, cache: Cache): Promise<LeftOff | null> {
  const file = grown.newest
  if (file === null) return null
  const stamp = leftOffStamp(file)
  const known = cache.leftOff[grown.root]
  if (known?.stamp === stamp) return known.left
  const tail = await run(io, ['tail', '-c', String(TAIL_BYTES), file.path])
  const left = leftOffOf(tail, file.title)
  if (isLeftOffEmpty(left)) return known?.left ?? null
  cache.leftOff[grown.root] = { stamp, left }

  return left
}

// A folder's own estimate first; a joined project falls back on the newest of its other folders'.
function bestEstimate(grown: Grown, estimates: Record<string, Estimate>): Estimate | null {
  const others = (grown.also ?? []).flatMap(root => estimates[root] ?? []).sort((a, b) => b.at - a.at)

  return estimates[grown.root] ?? others[0] ?? null
}

// The commit a repository began with: every clone of it shares this, whatever its folder is called. With several, the
// oldest listed, so one clone's extra history root does not split it.
async function firstCommitOf(io: Io, grown: Grown): Promise<string> {
  if (!grown.isGit) return ''
  const roots = (await run(io, ['git', '-C', grown.root, 'rev-list', '--max-parents=0', 'HEAD'])).trim().split('\n')

  return roots.at(-1) ?? ''
}

async function complete(io: Io, grown: Grown, spec: { plans: PlanRow[]; estimates: Record<string, Estimate>; cache: Cache }): Promise<Project> {
  const git = grown.isGit ? await readGit(io, grown.root).catch(() => null) : null
  const estimate = bestEstimate(grown, spec.estimates)
  const { newest: _newest, ...rest } = grown

  return {
    ...rest,
    git,
    plans: spec.plans,
    estimate,
    percent: percentOf(spec.plans, estimate ?? undefined, git?.head ?? ''),
    leftOff: await readLeftOff(io, grown, spec.cache).catch(() => null),
  }
}

// One pass: changed transcripts, projects, then each shown project's plans, git and last words.
export async function collect(io: Io, paths: Paths, onStep: (label: 'scan' | 'build') => void): Promise<Snapshot> {
  const cachePath = `${paths.own}/cache.json`
  const cache = await readJson<Cache>(io, cachePath, { files: {}, leftOff: {} })
  onStep('scan')
  const files = await scanFiles(io, `${paths.config}/projects`, cache.files)
  cache.files = files
  onStep('build')
  const list = Object.values(files)
  const cwds = [...new Set(list.map(file => file.cwd).filter(cwd => cwd !== ''))]
  const started = new Set(list.filter(file => !isAgentFile(file.path)).map(file => file.cwd))
  const roots = await resolveRoots(cwds, started, { io, home: paths.home })
  const nowMs = await io.now()
  const grown = growProjects(list, { roots, nowMs })
  const hidden = new Set(await hiddenOf(io))
  const estimates = await estimatesOf(io)
  const projects: Project[] = []
  let otherFolders = 0
  let otherTokens = 0
  const found: Found[] = []
  for (const one of grown.values()) found.push({ grown: one, plans: await readPlans(one.root, io), firstCommit: await firstCommitOf(io, one) })
  for (const { grown: one, plans } of joinCopies(found)) {
    if (isShown(one, { home: paths.home, hidden, hasPlans: plans.length > 0 })) {
      projects.push(await complete(io, one, { plans, estimates, cache }))
    } else {
      otherFolders += 1
      otherTokens += spent(one.tokens)
    }
  }
  await io.write(cachePath, JSON.stringify(cache))

  return { at: nowMs, projects: withClearNames(projects).sort(byRecent), other: { folders: otherFolders, tokens: otherTokens }, hidden: hidden.size }
}

export const estimatesOf = async (io: Io): Promise<Record<string, Estimate>> => ((await io.storeGet(ESTIMATES_KEY).catch(() => undefined)) ?? {}) as Record<string, Estimate>
export const hiddenOf = async (io: Io): Promise<string[]> => ((await io.storeGet(HIDDEN_KEY).catch(() => undefined)) ?? []) as string[]
export const setHidden = (io: Io, roots: readonly string[]) => io.storeSet(HIDDEN_KEY, [...roots])

const headOf = async (io: Io, path: string, chars: number): Promise<string> => (await io.read(path).catch(() => '')).slice(0, chars)
const tailOf = async (io: Io, path: string, chars: number): Promise<string> => (await io.read(path).catch(() => '')).slice(-chars)

// One small model call on the person's own account, only when they press for it. Null when the model gave no whole answer.
export async function estimateOne(io: Io, project: Project): Promise<Estimate | null> {
  const notes = await Promise.all(NOTE_FILES.map(name => tailOf(io, `${project.root}/${name}`, NOTES_CHARS / NOTE_FILES.length)))
  const prompt = estimatePrompt({
    name: project.name,
    readme: await headOf(io, `${project.root}/README.md`, README_CHARS),
    notes: notes.filter(note => note !== '').join('\n---\n'),
    plans: project.plans,
    commits: project.isGit ? await run(io, ['git', '-C', project.root, 'log', `-${COMMITS_SHOWN}`, '--format=%cs %s']) : '',
    lastPrompt: project.leftOff?.prompt ?? '',
    recap: project.leftOff?.recap ?? '',
    language: lang(),
  })
  const reply = await io.complete({ system: ESTIMATE_SYSTEM, prompt, maxTokens: ESTIMATE_TOKENS, timeoutMs: ESTIMATE_TIMEOUT_MS })
  if (reply === null) return null

  return parseEstimate(reply, { at: await io.now(), head: project.git?.head ?? '' })
}

export async function saveEstimate(io: Io, root: string, estimate: Estimate): Promise<void> {
  await io.storeSet(ESTIMATES_KEY, { ...(await estimatesOf(io)), [root]: estimate })
}

// Worth asking again: never estimated, or commits landed since.
export const needsEstimate = (project: Project): boolean => project.percent.kind !== 'estimate' || project.percent.isStale
