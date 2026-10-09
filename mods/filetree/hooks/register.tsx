import { type BuiltinToolResults, type ElementTable, type EngineInterface, type Register, type RenderChildren, type Timer, update } from 'claude-code'
import { openCommand } from './open'
import { commitOutcome, gitDirOf, type Outcome, placeOf } from './commit'
import { HUB_PANE, hubOf, isOpenFor, isSameCard } from './hub'
import { drawToolbar, TOOL_KEYS, type ToolKey } from './toolbar'

import type { Activity, FileNode, FileTree, Look, Theme, TouchRole, TurnLog } from '../types'
import { BRANCH_ICON, chainOf, type GitAction, gitActions, readOnly, readTargets, resolve, TONES } from './git'
import type { RowSpec, RowsProps } from './rows'
import { countSegs, desktopRow, type RowCtx, terminalRow } from './rowspec'
import { heroCard, type GitRow, type LegendItem, sectionLine, touchedCard } from './cards'
import { heroOf, heroText, subText, touchedRows } from './now'
import { lightByName, paletteOf, type Role, roleOfTone, shimmerTones } from './theme'
import {
  ancestorsOf,
  type Change,
  DEFAULT_THEME,
  dirname,
  emptyTree,
  inside,
  isAbsolute,
  join,
  mapper,
  parseGit,
  parseNumstat,
  parseTheme,
  posix,
  relative,
  dropBelow,
  useDrives,
  rollCounts,
  replaceChildren,
  rollUp,
  type Row,
  toNodes,
  underAny,
  visibleRows,
} from './tree'

const TREE = { plugin: 'filetree', key: 'tree' } as const
const THEME = { plugin: 'filetree', key: 'theme' } as const
const ACTIVITY = { plugin: 'filetree', key: 'activity' } as const
const TURN = { plugin: 'filetree', key: 'turn' } as const
const LOOK = { plugin: 'filetree', key: 'look' } as const
const HUB = { plugin: 'filetree', key: 'hub' } as const
const PANE = 'filetree'
const PANE_TITLE = 'Dosyalar'
// The terminal keeps upstream's hues, keyed so a read is blue (Tide) and an edit orange (Kiln).
const TERMINAL_TONE: Record<string, string> = { purple: 'blue', iris: 'purple' }
const SHIMMER = Object.fromEntries(
  Object.keys(TONES).map(k => {
    const v = TONES[TERMINAL_TONE[k] ?? k] ?? TONES[k]
    return [k, { bright: v?.bright ?? [], dim: v?.dim ?? [] }]
  }),
)
const NO_TURN: TurnLog = { isRunning: false, hasRun: false, touches: [], sha: '', committed: 0 }
const TOUCH_RANK: Record<TouchRole, number> = { read: 0, edit: 1, commit: 2 }
const TOUCH_LIMIT = 200
const PX_PER_COL = 8
const ROW_PX = 18
const LIVE_SPREAD_MS = 1_500
const MIN_SVG_W = 240
const MAX_SVG_W = 900
// Rows the desktop toolbar takes: its one line, and with "Daha fazla" open the extra buttons and hint.
const TOOLBAR_ROWS = 3
const TOOLBAR_OPEN_ROWS = 9
const FOOTER_ROWS = 2
const BRANCH_ROW = '#branch'
const FLASH_MS = 2700
const RUNNING_MAX_MS = 600_000
const NO_REPO_DEPTH = 4
const DOUBLE_MS = 450
const FIND_LIMIT = 200
const READ_REVEAL_LIMIT = 12
const SEARCH_REVEAL_LIMIT = 60
const ACTIVITY_TTL_MS = 45_000
const ADD_COLOR = '#98c379'
const DEL_COLOR = '#e06c75'
const THEME_FILE = '.local/state/omarchy/current/theme/colors.toml'
const THEME_POLL_MS = 2000
const FONT_SCRIPT =
  'if command -v fc-list >/dev/null 2>&1; then f=$(fc-list ":charset=$1" file | head -n1 | cut -d: -f1); ' +
  'else f=$(ls "$HOME"/Library/Fonts/*Nerd* /Library/Fonts/*Nerd* 2>/dev/null | head -n1); fi; ' +
  '[ -n "$f" ] || { echo missing; exit 0; }; m=$(stat -c %Z "$f" 2>/dev/null || stat -f %c "$f"); p=$PPID; ' +
  'while [ -n "$p" ] && [ "$p" -gt 1 ]; do c=$(ps -o comm= -p "$p" 2>/dev/null); c=$(basename "$c" 2>/dev/null | tr -d " "); case "$c" in ' +
  'ghostty|kitty|alacritty|Alacritty|foot|footclient|wezterm-gui|konsole|gnome-terminal-|xterm|urxvt|st|Terminal|iTerm2) ' +
  'e=$(ps -o etime= -p "$p" 2>/dev/null | awk -F\'[-:]\' \'{n=NF; s=$n+60*$(n-1); if (n>2) s+=3600*$(n-2); if (n>3) s+=86400*$(n-3); print s}\'); [ -n "$e" ] && [ $(( $(date +%s) - e )) -lt "$m" ] && echo stale || echo ok; exit 0;; esac; ' +
  'p=$(ps -o ppid= -p "$p" 2>/dev/null | tr -d " "); done; echo ok'
const PRUNE = ['.git', 'node_modules', 'target', '.venv', '__pycache__', 'dist', '.next']
const HOME_PRUNE = ['Library', 'AppData', '.Trash']
const SIZE_TIMEOUT_MS = 15_000
const SIZE_JOBS = 2
const SIZE_WALK_LIMIT = 50_000

let blink: Timer | null = null
let themePoll: Timer | null = null
let themeMtime: number | null = null
let generation = 0
let lastPress = { key: '', at: 0 }
let noNerd = false
let glyphSetting = 'auto'
let follow = true
let followClaude = true
let scanning: Promise<void> | null = null
let scanJobs: Job[] = []
let gitRun: Promise<void> | null = null
let gitNext: Promise<void> | null = null
let queuedReads: string[] = []
let showReads = true
let showWrites = true
let searchIndex: { root: string; paths: Promise<string[]> } | null = null
let activityId = 0
let pointer = true
let view = { from: 0, max: 0 }
let lastSync = 0
let noDock = false
let home = ''
let platform: Promise<'linux' | 'darwin' | 'win32'> | null = null
let dirty: { root: string; files: Record<string, Change> } = { root: '', files: {} }
let markId = 0
let listSeq = 0
let lastRoot = ''
let sizeDefault = false
let sizeEpoch = 0
let sizeActive = 0
let sizeQueue: string[] = []
const sizing = new Set<string>()
const listLatest = new Map<string, number>()
const unreadable = new Set<string>()
const background = new Map<string, Background>()

function osName($: EngineInterface): Promise<'linux' | 'darwin' | 'win32'> {
  platform ??= (async () => {
    if ((await $.env.get('OS')) === 'Windows_NT') return 'win32'
    try {
      return (await $.process.run(['uname', '-s'], { timeoutMs: 3_000 })).stdout.trim() === 'Darwin' ? 'darwin' : 'linux'
    } catch {
      return 'linux'
    }
  })()
  return platform
}

async function cwdOf($: EngineInterface): Promise<string> {
  return posix(await $.session.cwd())
}

function faint(hex: string): string {
  const v = parseInt(hex.slice(1), 16)
  const ch = (shift: number) => Math.round(0x26 + (((v >> shift) & 255) - 0x26) * 0.3)
  return `#${[16, 8, 0].map(x => ch(x).toString(16).padStart(2, '0')).join('')}`
}

async function get($: EngineInterface): Promise<FileTree> {
  return { ...emptyTree(''), ...(await $.state.get(TREE)).value }
}

async function put($: EngineInterface, fn: (t: FileTree) => FileTree): Promise<void> {
  await update($, TREE, cur => fn({ ...emptyTree(''), ...cur }))
}

function patch($: EngineInterface, fn: (t: FileTree) => Partial<FileTree>) {
  return put($, t => ({ ...t, ...fn(t) }))
}

async function activities($: EngineInterface): Promise<Activity[]> {
  return (await $.state.get(ACTIVITY)).value ?? []
}

async function setActivities($: EngineInterface, fn: (list: Activity[]) => Activity[]): Promise<void> {
  await update($, ACTIVITY, cur => fn(cur ?? []).slice(-6))
}

async function list($: EngineInterface, dir: string): Promise<FileNode[] | null> {
  try {
    const entries = await $.fs.list(dir)
    const resolved = await Promise.all(
      entries.map(async e => {
        if (!e.isLink) return { name: e.name, kind: e.kind, mtimeMs: e.mtimeMs, size: e.size, isLink: false }
        try {
          const target = await $.fs.stat(join(dir, e.name))
          return target.kind === 'dir'
            ? { name: e.name, kind: 'dir' as const, mtimeMs: target.mtimeMs, size: 0, isLink: false }
            : { name: e.name, kind: 'file' as const, mtimeMs: target.mtimeMs, size: target.size, isLink: true }
        } catch {
          return { name: e.name, kind: 'other' as const, mtimeMs: 0, size: 0, isLink: true }
        }
      }),
    )
    unreadable.delete(dir)
    return toNodes(dir, resolved)
  } catch (err) {
    if (!(await exists($, dir))) return []
    if (!unreadable.has(dir)) {
      unreadable.add(dir)
      $.ui.toast(`${shortPath(dir)} listelenemedi: ${err instanceof Error ? err.message : String(err)}`)
    }
    return null
  }
}

async function loadDirs($: EngineInterface, dirs: string[]): Promise<Map<string, FileNode[]>> {
  const root = (await get($)).root
  const seq = ++listSeq
  for (const dir of dirs) listLatest.set(dir, seq)
  const results = await Promise.all(dirs.map(async dir => [dir, await list($, dir)] as const))
  const listed = new Map<string, FileNode[]>()
  for (const [dir, kids] of results) {
    if (listLatest.get(dir) !== seq) continue
    listLatest.delete(dir)
    if (kids) listed.set(dir, kids)
  }
  await patch($, t => (t.root === root ? { nodes: replaceChildren(t.nodes, listed) } : {}))
  return listed
}

async function git($: EngineInterface, cwd: string, args: string[], timeoutMs = 20_000) {
  return $.process.run(['git', '--no-optional-locks', '-C', cwd, ...args], { timeoutMs, env: { GIT_OPTIONAL_LOCKS: '0' } })
}

async function detectRepo($: EngineInterface): Promise<void> {
  const t = await get($)
  if (!t.root) return
  let top = ''
  let prefix = ''
  try {
    const run = await git($, t.root, ['rev-parse', '--show-prefix', '--show-toplevel'], 5_000)
    const [p = '', tl = ''] = run.exitCode === 0 ? run.stdout.split('\n') : []
    prefix = p.trim()
    top = tl.trim()
  } catch {
    top = ''
  }
  await patch($, cur => (cur.root === t.root ? { top, prefix } : {}))
}

async function readGit($: EngineInterface): Promise<void> {
  const t = await get($)
  if (!t.root || !t.top) return
  const root = t.root
  try {
    const status = await git($, root, ['status', '--porcelain=v1', '-b', '-z', '--ignored=traditional', '--untracked-files=normal', '--', '.'])
    if (status.exitCode !== 0) return
    const parsed = parseGit(status.stdout, root, t.prefix)
    const diff: Record<string, [number, number]> = {}
    const head = await git($, root, ['diff', 'HEAD', '--numstat', '-z', '--', '.'])
    if (head.exitCode === 0) parseNumstat(head.stdout, root, t.prefix, diff)
    const files = { ...parsed.files }
    if (parsed.untrackedDirs.length) {
      const others = await git($, root, ['ls-files', '-o', '--exclude-standard', '-z', '--', ...parsed.untrackedDirs.map(d => d.slice(root.length + 1) || '.')])
      if (others.exitCode === 0) for (const rel of others.stdout.split('\0').filter(Boolean)) files[join(root, rel)] = 'new'
    }
    for (const path of Object.keys(diff)) if (files[path] === 'new') delete diff[path]
    dirty = { root, files }
    await patch($, cur =>
      cur.root === root
        ? {
            git: parsed.git,
            ignored: parsed.ignored,
            untrackedDirs: parsed.untrackedDirs,
            branch: parsed.branch,
            counts: rollCounts(files, root),
            diff: rollUp(diff, root),
          }
        : {},
    )
    await syncHub($)
  } catch {
    return
  }
}

function refreshGit($: EngineInterface): Promise<void> {
  if (!gitRun) {
    gitRun = readGit($).finally(() => {
      gitRun = null
    })
    return gitRun
  }
  const rerun = () => {
    gitNext = null
    return refreshGit($)
  }
  gitNext ??= gitRun.then(rerun, rerun)
  return gitNext
}

async function reset($: EngineInterface, root: string, focus = false): Promise<void> {
  const prev = await get($)
  generation += 1
  blink?.cancel()
  blink = null
  lastRoot = root
  searchIndex = null
  sizeEpoch += 1
  sizeQueue = []
  await put($, () => ({ ...emptyTree(root), showHidden: prev.showHidden, showTools: prev.showTools, showSize: prev.root ? prev.showSize : sizeDefault }))
  await showPane($, PANE_TITLE, focus)
  await loadDirs($, [root])
  await detectRepo($)
  await refreshGit($)
}


async function paneIsOpen($: EngineInterface): Promise<boolean> {
  try {
    return (await $.ui.panes()).some(p => p.id === PANE)
  } catch {
    return false
  }
}

// Calm: the pane opens when the person asks; on its own the mod only retitles an open pane.
async function showPane($: EngineInterface, title: string, isAsked: boolean): Promise<void> {
  if (isAsked) await $.ui.open({ id: PANE, title, focus: true })
  else if (!noDock && (await paneIsOpen($))) await $.ui.open({ id: PANE, title })
}

async function inApp($: EngineInterface): Promise<boolean> {
  try {
    return (await $.session.surfaces()).some(s => s !== 'terminal')
  } catch {
    return false
  }
}

async function turnLog($: EngineInterface): Promise<TurnLog> {
  return { ...NO_TURN, ...(await $.state.get(TURN)).value }
}

// Claude's files this turn, in the order first touched; a later touch can only raise the role.
async function noteTouches($: EngineInterface, ids: string[], role: TouchRole): Promise<void> {
  if (ids.length === 0) return
  const at = await $.clock.now()
  await update($, TURN, cur => {
    const log = { ...NO_TURN, ...cur, hasRun: true }
    const touches = [...log.touches]
    for (const id of ids) {
      const i = touches.findIndex(x => x.id === id)
      const old = touches[i]
      if (!old) touches.push({ id, role, at })
      else touches[i] = { id, role: TOUCH_RANK[role] > TOUCH_RANK[old.role] ? role : old.role, at }
    }
    return { ...log, touches: touches.slice(-TOUCH_LIMIT) }
  })
  await syncHub($)
}

async function noteCommit($: EngineInterface, fields: { sha?: string; committed?: number }): Promise<void> {
  await update($, TURN, cur => ({ ...NO_TURN, ...cur, hasRun: true, ...fields }))
  await syncHub($)
}

// The MODZ main panel's card, from what the pane itself shows: this turn's files, then git.
async function syncHub($: EngineInterface): Promise<void> {
  const t = await get($)
  const turn = await turnLog($)
  const changed = (t.counts[t.root] ?? [0, 0, 0]).reduce((a, b) => a + b, 0)
  const edited = turn.touches.filter(x => x.role !== 'read').length
  const shown = hubOf({ isRunning: turn.isRunning, touched: turn.touches.length, hasRepo: Boolean(t.top), changed, edited, sha: turn.sha })
  if (isSameCard((await $.state.get(HUB)).value, shown)) return
  await $.state.set(HUB, { pane: HUB_PANE, ...shown, at: await $.clock.now() })
}

// A request from the MODZ main panel: opens (or brings forward) the pane, never closes it.
async function openFromHub($: EngineInterface): Promise<void> {
  noDock = false
  const t = await get($)
  if (!t.root || t.nodes.length === 0) await reset($, await cwdOf($), true)
  else await showPane($, PANE_TITLE, true)
}

async function systemDark($: EngineInterface): Promise<boolean | undefined> {
  const os = await osName($)
  try {
    if (os === 'darwin') {
      const mac = await $.process.run(['defaults', 'read', '-g', 'AppleInterfaceStyle'], { timeoutMs: 2_000 })
      return mac.exitCode === 0 ? mac.stdout.trim() === 'Dark' : /does not exist/.test(mac.stderr) ? false : undefined
    }
    if (os !== 'linux') return undefined
    const gnome = await $.process.run(['gsettings', 'get', 'org.gnome.desktop.interface', 'color-scheme'], { timeoutMs: 2_000 })
    return gnome.exitCode === 0 ? gnome.stdout.includes('dark') : undefined
  } catch {
    return undefined
  }
}

// Claude's theme setting first; for `auto` the system's appearance (DESIGN.md §2).
async function refreshLook($: EngineInterface): Promise<void> {
  let theme: unknown
  try {
    theme = (await $.config.list()).find(row => row.key === 'theme')?.value
  } catch {
    theme = undefined
  }
  const named = lightByName(theme)
  const dark = named === undefined ? await systemDark($) : undefined
  const look: Look = named === undefined ? { isLight: dark === false, isAuto: true } : { isLight: named, isAuto: false }
  const cur = (await $.state.get(LOOK)).value
  if (cur?.isLight !== look.isLight || cur?.isAuto !== look.isAuto) await update($, LOOK, () => look)
}

async function revealPaths($: EngineInterface, paths: string[]): Promise<void> {
  const tried = new Set<string>()
  for (let pass = 0; pass < 32; pass++) {
    const t = await get($)
    const loaded = new Set(t.nodes.filter(n => n.loaded).map(n => n.id))
    if (t.nodes.some(n => n.parent === t.root)) loaded.add(t.root)
    const need = new Set<string>()
    for (const p of paths) {
      for (const dir of [t.root, ...ancestorsOf(p, t.root).reverse()]) {
        if (!loaded.has(dir)) {
          if (!tried.has(dir)) need.add(dir)
          break
        }
      }
    }
    if (need.size === 0) return
    for (const dir of need) tried.add(dir)
    await loadDirs($, [...need])
  }
}

function pruneArgs(root: string, ignored: string[] = []): string[] {
  const names = broad(root) ? [...PRUNE, ...HOME_PRUNE] : PRUNE
  return ['(', ...names.flatMap((name, i) => (i === 0 ? ['-name', name] : ['-o', '-name', name])), ...ignored.flatMap(p => ['-o', '-path', p]), ')', '-prune', '-o']
}

async function newer($: EngineInterface, paths: string[], sinceMs: number): Promise<string[]> {
  const stats = await Promise.all(
    paths.map(async p => {
      try {
        return (await $.fs.stat(p)).mtimeMs > sinceMs ? p : ''
      } catch {
        return ''
      }
    }),
  )
  return stats.filter(Boolean)
}

function broad(root: string): boolean {
  return root === home || root === '/' || /^[A-Za-z]:\/$/.test(root)
}

function rootOfDisk(root: string): boolean {
  return root === '/' || /^[A-Za-z]:\/$/.test(root)
}

async function changedSince($: EngineInterface, root: string, since: Since, depth: number, ignored: string[] = []): Promise<string[]> {
  if (rootOfDisk(root)) return []
  const test = since.mark ? ['-newer', since.mark] : ['-newermt', `@${(since.ms / 1000).toFixed(3)}`]
  try {
    const run = await $.process.run(['find', '-H', root, '-xdev', ...(depth ? ['-maxdepth', String(depth)] : []), ...pruneArgs(root, ignored.filter(p => inside(root, p)).slice(0, 40)), ...test, '-print0'], { timeoutMs: 8_000 })
    return run.stdout.split('\0').filter(p => p && p !== root)
  } catch {
    return []
  }
}

async function changedInRepo($: EngineInterface, root: string, since: Since, before: Record<string, Change>, ignored: string[]): Promise<{ hits: string[]; gone: string[] }> {
  if (since.os !== 'win32') return { hits: await changedSince($, root, since, 0, ignored), gone: [] }
  if (dirty.root !== root) return { hits: [], gone: [] }
  const entries = Object.entries(dirty.files)
  const gone = entries.filter(([p, c]) => c === 'del' && before[p] !== 'del').map(([p]) => p)
  const live = entries.filter(([, c]) => c !== 'del').map(([p]) => p)
  return { hits: await newer($, live.slice(0, 4_000), since.ms), gone }
}

type Since = { ms: number; mark: string; os: 'linux' | 'darwin' | 'win32' }

async function sinceNow($: EngineInterface, writes: boolean): Promise<Since> {
  const ms = await $.clock.now()
  const os = await osName($)
  if (os !== 'darwin' || !writes) return { ms, mark: '', os }
  const mark = `${((await $.env.get('TMPDIR')) || '/tmp').replace(/\/+$/, '')}/filetree-${await $.session.id()}-${++markId}.mark`
  try {
    await $.process.run(['touch', mark], { timeoutMs: 3_000 })
    return { ms, mark, os }
  } catch {
    return { ms, mark: '', os }
  }
}

async function walkSize($: EngineInterface, dir: string): Promise<number> {
  let total = 0
  let seen = 0
  let level = [dir]
  while (level.length) {
    const next: string[] = []
    for (const d of level) {
      let entries
      try {
        entries = await $.fs.list(d)
      } catch {
        continue
      }
      for (const e of entries) {
        if (++seen > SIZE_WALK_LIMIT) return -1
        if (e.kind === 'dir' && !e.isLink) next.push(join(d, e.name))
        else if (e.kind === 'file') total += e.size
      }
    }
    level = next
  }
  return total
}

async function dirSize($: EngineInterface, dir: string): Promise<number> {
  if (rootOfDisk(dir)) return -1
  if ((await osName($)) === 'win32') return walkSize($, dir)
  try {
    const run = await $.process.run(['du', '-skxH', dir], { timeoutMs: SIZE_TIMEOUT_MS })
    const kb = Number(run.stdout.trim().split(/\s/)[0] || NaN)
    return Number.isFinite(kb) ? kb * 1024 : -1
  } catch {
    return -1
  }
}

function pumpSizes($: EngineInterface): void {
  while (sizeActive < SIZE_JOBS && sizeQueue.length) {
    const dir = sizeQueue.shift() ?? ''
    const epoch = sizeEpoch
    sizing.add(dir)
    sizeActive += 1
    void dirSize($, dir)
      .then(async bytes => {
        if (epoch === sizeEpoch) return patch($, cur => (inside(cur.root, dir) ? { dirSizes: { ...cur.dirSizes, [dir]: bytes } } : {}))
        const cur = await get($)
        if (cur.showSize && inside(cur.root, dir) && !(dir in cur.dirSizes) && !sizeQueue.includes(dir)) sizeQueue.push(dir)
      })
      .catch(() => undefined)
      .finally(() => {
        sizing.delete(dir)
        sizeActive -= 1
        pumpSizes($)
      })
  }
}

function wantSizes($: EngineInterface, dirs: string[]): void {
  for (const dir of dirs) if (!sizing.has(dir) && !sizeQueue.includes(dir)) sizeQueue.push(dir)
  pumpSizes($)
}

async function staleSizes($: EngineInterface, paths?: string[]): Promise<void> {
  sizeEpoch += 1
  sizeQueue = []
  await patch($, cur => {
    if (!paths) return { dirSizes: {} }
    const keep: Record<string, number> = {}
    for (const [dir, bytes] of Object.entries(cur.dirSizes)) if (!paths.some(p => inside(dir, p))) keep[dir] = bytes
    return { dirSizes: keep }
  })
}

function openDirs(t: FileTree): string[] {
  const open = new Set(t.expanded)
  return t.nodes.filter(n => n.kind === 'dir' && n.loaded && open.has(n.id)).map(n => n.id)
}

function keepTop(cur: FileTree, expanded: string[]): Partial<FileTree> {
  if (followClaude) return { scroll: null }
  const top = visibleRows(cur)[cur.scroll ?? view.from]?.node.id
  const at = top ? visibleRows({ ...cur, expanded }).findIndex(r => r.node.id === top) : -1
  return at < 0 ? {} : { scroll: at }
}

async function flash($: EngineInterface, tones: Record<string, string>): Promise<void> {
  const unique = Object.keys(tones)
  if (unique.length === 0) return
  const mine = ++generation
  const root = (await get($)).root
  blink?.cancel()
  blink = null
  await patch($, cur => {
    if (cur.root !== root) return {}
    const open = new Set(cur.expanded)
    const bright = new Set([...(cur.flashOn ? cur.flash.filter(id => !unique.includes(id)) : []), ...unique])
    const dim = new Set<string>()
    const all: Record<string, string> = cur.flashOn ? { ...cur.flashTones } : {}
    if (cur.flashOn) {
      for (const id of cur.flashDim) dim.add(id)
    }
    for (const id of unique) {
      const tone = tones[id] ?? 'orange'
      all[id] = tone
      if (id === BRANCH_ROW) continue
      const chain = ancestorsOf(id, cur.root)
      if (!chain.some(a => !open.has(a))) continue
      for (const a of chain) {
        if (!open.has(a)) {
          dim.add(a)
          all[a] = all[a] ?? tone
        }
        open.add(a)
      }
    }
    for (const id of bright) dim.delete(id)
    return {
      flash: [...bright],
      flashDim: [...dim],
      flashOn: true,
      flashTones: all,
      expanded: [...open],
      ...keepTop(cur, [...open]),
    }
  })
  if (generation !== mine) return
  blink = $.clock.after(FLASH_MS, () => {
    if (generation !== mine) return
    blink = null
    void patch($, cur => (generation === mine ? { flash: [], flashDim: [], flashOn: false, flashTones: {} } : {}))
  })
}

async function followCwd($: EngineInterface): Promise<boolean> {
  if (!follow) return false
  const cwd = await cwdOf($)
  const t = await get($)
  if (t.root === cwd) return false
  await reset($, cwd)
  return true
}

// `dir` is where git ran (null when that is a guess), `head` its HEAD before the command.
type Pending = { actions: GitAction[]; ids: number[]; command: string; dir: string | null; head: string; place: { isHere: boolean; name: string } }
type Job = { actions: GitAction[]; since: Since; initRepo: boolean; readOnly: boolean }
type Background = { p: Pending | null; job: Job; reads: string[] }
type GitOperation = NonNullable<BuiltinToolResults['Bash']['gitOperation']>
type Run = { ok: boolean; op: GitOperation | undefined; text: string }

const PROOF: Record<string, (op: GitOperation) => boolean> = {
  push: op => Boolean(op.push),
  merge: op => op.branch?.action === 'merged',
  rebase: op => op.branch?.action === 'rebased',
  'pr create': op => op.pr?.action === 'created',
  'pr merge': op => op.pr?.action === 'merged',
  'pr comment': op => op.pr?.action === 'commented',
}

async function startGit($: EngineInterface, actions: GitAction[]): Promise<number[]> {
  const now = await $.clock.now()
  const ids = actions.map(() => ++activityId)
  await setActivities($, cur => [
    ...cur.filter(a => a.state === 'running' || now - a.at < ACTIVITY_TTL_MS),
    ...actions.map((a, i) => ({
      id: ids[i] ?? 0,
      kind: a.kind,
      label: a.running,
      state: 'running' as const,
      detail: '',
      at: now,
      tone: a.tone,
      nerd: a.icon.nerd,
      plain: a.icon.plain,
    })),
  ])
  return ids
}

async function headOf($: EngineInterface, cwd: string): Promise<string> {
  try {
    const run = await git($, cwd, ['rev-parse', 'HEAD'], 5_000)
    return run.exitCode === 0 ? run.stdout.trim() : ''
  } catch {
    return ''
  }
}

async function outcomes($: EngineInterface, p: Pending, run: Run): Promise<Outcome[]> {
  const chain = chainOf(p.command)
  const isCommit = p.actions.some(a => a.verb === 'commit')
  const after = isCommit && !run.op?.commit && p.dir !== null ? await headOf($, p.dir) : ''
  return p.actions.map(a => {
    if (a.verb === 'commit') {
      const sha = run.op?.commit?.sha || (after && after !== p.head ? after : '')
      return commitOutcome({ sha, place: p.place.name, isDirKnown: p.dir !== null, hasFailed: !run.ok && chain.and && chain.size === 1, text: run.text })
    }
    if ((run.op && PROOF[a.verb]?.(run.op)) || (run.ok && chain.and)) return { state: 'done', label: a.done, detail: '' }
    if (!run.ok && chain.and && chain.size === 1) return { state: 'failed', label: `${a.verb} başarısız`, detail: '' }
    return { state: 'done', label: `${a.kind} çalıştı`, detail: '' }
  })
}

type GitCall = { command: string; actions: GitAction[]; cwd: string }

// Where the command's git work runs and its HEAD there before it runs; '' cwd for a subagent's loop.
async function pendingOf($: EngineInterface, call: GitCall): Promise<Pending> {
  const t = await get($)
  const dir = gitDirOf(call.command, { cwd: call.cwd, home })
  const isCommit = call.actions.some(a => a.verb === 'commit')
  const head = isCommit && dir !== null ? await headOf($, dir) : ''
  const place = placeOf(dir, { top: t.top || t.root, isAgent: !call.cwd })
  return { actions: call.actions, ids: await startGit($, call.actions), command: call.command, dir, head, place }
}

async function finishGit($: EngineInterface, p: Pending, results: Outcome[]): Promise<void> {
  const now = await $.clock.now()
  await setActivities($, cur =>
    cur.map(a => {
      const i = p.ids.indexOf(a.id)
      const result = i < 0 ? undefined : results[i]
      return result ? { ...a, ...result, at: now } : a
    }),
  )
  $.clock.after(ACTIVITY_TTL_MS + 500, () => void setActivities($, cur => cur.filter(a => a.state === 'running' || a.at > now)))
}

function failAll(p: Pending): Outcome[] {
  return p.actions.map(a => ({ state: 'failed', label: `${a.verb} başarısız`, detail: '' }))
}

// Only git work in the tree's own repository lights its files; another repo's commit is not this one's.
function proven(p: Pending | null, results: Outcome[]): GitAction[] {
  return p && p.place.isHere ? p.actions.filter((_, i) => results[i]?.state !== 'failed') : []
}

function taskEnds(text: string): [string, string][] {
  return [...text.matchAll(/<task-notification>([\s\S]*?)<\/task-notification>/g)].flatMap(m => {
    const id = /<task-id>([^<]*)<\/task-id>/.exec(m[1] ?? '')?.[1]?.trim()
    const status = /<status>([^<]*)<\/status>/.exec(m[1] ?? '')?.[1]?.trim()
    return id && status ? [[id, status] as [string, string]] : []
  })
}

async function settleBackground($: EngineInterface, text: string): Promise<void> {
  if (background.size === 0 || !text.includes('<task-notification>')) return
  for (const [id, status] of taskEnds(text)) {
    const task = background.get(id)
    if (!task) continue
    background.delete(id)
    const ok = status === 'completed'
    const results = task.p ? await outcomes($, task.p, { ok, op: undefined, text: '' }) : []
    if (task.p) await finishGit($, task.p, results)
    if (showReads) queuedReads.push(...task.reads)
    scheduleScan($, { ...task.job, actions: proven(task.p, results) })
  }
}

async function gitPaths($: EngineInterface, root: string, prefix: string, committed: boolean): Promise<string[]> {
  const map = mapper(root, prefix)
  try {
    const run = committed
      ? await git($, root, ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', '-z', 'HEAD'], 5_000)
      : await git($, root, ['diff', '--cached', '--name-only', '-z'], 5_000)
    return run.exitCode === 0 ? run.stdout.split('\0').filter(Boolean).flatMap(rel => map(rel) ?? []) : []
  } catch {
    return []
  }
}

async function gitDir($: EngineInterface, cwd: string): Promise<string> {
  for (let dir = cwd, i = 0; i < 64; i++) {
    try {
      const dot = join(dir, '.git')
      const st = await $.fs.stat(dot)
      if (st.kind === 'dir') return dot
      const ref = /^gitdir:\s*(.+)$/m.exec(String(await $.fs.read(dot)))?.[1]?.trim()
      if (ref) return resolve(dir, ref, home)
    } catch {
      const up = dirname(dir)
      if (up === dir) return ''
      dir = up
      continue
    }
    return ''
  }
  return ''
}

async function sync($: EngineInterface, force = false): Promise<void> {
  const now = await $.clock.now()
  if (!force && now - lastSync < 2_000) return
  lastSync = now
  searchIndex = null
  const t = await get($)
  if (!t.root) return
  await loadDirs($, [t.root, ...openDirs(t)])
  if (t.top) await refreshGit($)
}

async function copyPath($: EngineInterface, id: string, absolute: boolean, surface?: string): Promise<void> {
  const t = await get($)
  const text = !absolute && id !== t.root && inside(t.root, id) ? id.slice(t.root.endsWith('/') ? t.root.length : t.root.length + 1) : id
  const done = await $.ui.copy({ text, ...(surface ? { surface: surface as 'terminal' } : {}) })
  $.ui.toast(done.isCopied ? `Kopyalandı: ${text}` : 'Yol kopyalanamadı')
}

async function exists($: EngineInterface, path: string): Promise<boolean> {
  try {
    await $.fs.stat(path)
    return true
  } catch {
    return false
  }
}

async function afterBash($: EngineInterface, jobs: Job[]): Promise<void> {
  const reads = queuedReads
  queuedReads = []
  if (await followCwd($)) return
  const t = await get($)
  if (!t.root) return
  const actions = jobs.flatMap(j => j.actions)
  const writers = jobs.filter(j => !j.readOnly)
  const since = (writers.length ? writers : jobs).reduce((a, j) => (j.since.ms < a.ms ? j.since : a), (writers[0] ?? jobs[0])?.since ?? { ms: 0, mark: '', os: 'linux' as const })
  const writes = !jobs.every(j => j.readOnly)
  const before = dirty.root === t.root ? dirty.files : {}
  if (jobs.some(j => j.initRepo)) await detectRepo($)
  else if (!t.top && (await exists($, join(t.root, '.git')))) await detectRepo($)
  const probed = await get($)
  if (probed.top && (writes || probed.top !== t.top)) await refreshGit($)
  if (writes) {
    searchIndex = null
    await staleSizes($)
  }
  const fresh = await get($)
  const ignored = new Set(fresh.ignored)
  const tones: Record<string, string> = {}
  if (writes) {
    const found = fresh.top
      ? await changedInRepo($, t.root, since, before, fresh.ignored)
      : { hits: since.os === 'win32' ? [] : await changedSince($, t.root, since, NO_REPO_DEPTH), gone: [] }
    const hits = found.hits.filter(x => inside(t.root, x) && !underAny(x, ignored, t.root)).slice(0, FIND_LIMIT)
    await revealPaths($, hits)
    const loaded = await get($)
    const dirs = [...new Set([loaded.root, ...openDirs(loaded), ...hits.map(dirname), ...found.gone.map(dirname)])].filter(d => inside(loaded.root, d))
    const listed = await loadDirs($, dirs)
    if (!fresh.top && since.os === 'win32')
      for (const kids of listed.values()) for (const n of kids) if (n.mtime > since.ms && hits.length < FIND_LIMIT) hits.push(n.id)
    await patch($, cur => {
      const ids = new Set(cur.nodes.map(n => n.id))
      return { expanded: cur.expanded.filter(id => ids.has(id)) }
    })
    const present = new Set((await get($)).nodes.map(n => n.id))
    const touchTone = actions.find(a => !['commit', 'push', 'add'].includes(a.verb))?.tone ?? 'orange'
    if (showWrites) for (const id of hits) if (present.has(id)) tones[id] = touchTone
    await noteTouches($, hits.filter(id => present.has(id)), 'edit')
  }
  if (showReads) {
    const found: string[] = []
    for (const r of reads) {
      if (found.length >= READ_REVEAL_LIMIT) break
      if (r !== t.root && inside(t.root, r) && !underAny(r, ignored, t.root) && (await exists($, r))) found.push(r)
    }
    if (found.length) {
      await revealPaths($, found)
      const shown = new Set((await get($)).nodes.map(n => n.id))
      for (const r of found) if (shown.has(r) && !tones[r]) tones[r] = 'purple'
      await noteTouches($, found.filter(r => shown.has(r)), 'read')
    }
  }
  if (showWrites && actions.length) {
    const final = await get($)
    const committed = actions.some(a => a.verb === 'commit')
    if ((committed || actions.some(a => a.verb === 'add')) && final.top) {
      const all = (await gitPaths($, final.root, final.prefix, committed)).filter(x => !underAny(x, ignored, final.root))
      const paths = all.slice(0, READ_REVEAL_LIMIT)
      await revealPaths($, paths)
      const shown = new Set((await get($)).nodes.map(n => n.id))
      for (const x of paths) if (shown.has(x)) tones[x] = 'green'
      if (committed) {
        await noteTouches($, all, 'commit')
        await noteCommit($, { committed: all.length })
      }
    }
    const pushLike = actions.find(a => ['push', 'pull', 'fetch', 'checkout', 'switch', 'branch', 'merge', 'rebase', 'tag'].includes(a.verb) || a.kind.startsWith('gh '))
    if (pushLike) tones[BRANCH_ROW] = pushLike.tone
    else if (committed) tones[BRANCH_ROW] = 'green'
  }
  await flash($, tones)
}

function scheduleScan($: EngineInterface, job: Job): void {
  scanJobs.push(job)
  if (scanning) return
  scanning = (async () => {
    while (scanJobs.length) {
      const jobs = scanJobs
      scanJobs = []
      try {
        await afterBash($, jobs)
      } finally {
        const marks = jobs.map(j => j.since.mark).filter(Boolean)
        if (marks.length) await $.process.run(['rm', '-f', ...marks], { timeoutMs: 3_000 }).catch(() => undefined)
      }
    }
  })().finally(() => {
    scanning = null
  })
}

async function touched($: EngineInterface, paths: string[], tone: string, show: boolean): Promise<void> {
  if (await followCwd($)) return
  const t = await get($)
  if (!t.root) return
  const within = paths.map(posix).filter(p => inside(t.root, p))
  if (within.length === 0) return
  if (tone !== 'purple') {
    searchIndex = null
    await staleSizes($, within)
    await revealPaths($, within.map(dirname))
    await loadDirs($, [...new Set(within.map(dirname))].filter(d => inside(t.root, d)))
    await refreshGit($)
  } else await revealPaths($, within)
  await noteTouches($, within, tone === 'purple' ? 'read' : 'edit')
  if (!show) return
  const tones: Record<string, string> = {}
  for (const p of within) tones[p] = tone
  await flash($, tones)
}

async function reveal($: EngineInterface, paths: string[]): Promise<void> {
  if (await followCwd($)) return
  await revealPaths($, paths)
  await patch($, cur => {
    const open = new Set(cur.expanded)
    for (const p of paths) for (const a of ancestorsOf(p, cur.root)) open.add(a)
    return { expanded: [...open], cursor: paths[paths.length - 1] ?? cur.cursor, scroll: null }
  })
}

async function walk($: EngineInterface, root: string, depth: number, limit: number): Promise<string[]> {
  const out: string[] = []
  let level = [root]
  for (let d = 0; d < depth && level.length && out.length < limit; d++) {
    const next: string[] = []
    for (const dir of level) {
      for (const n of (await list($, dir)) ?? []) {
        if (n.kind === 'dir') {
          if (!PRUNE.includes(n.name)) next.push(n.id)
        } else out.push(n.id)
      }
      if (out.length >= limit) break
    }
    level = next
  }
  return out
}

async function listAll($: EngineInterface, t: FileTree): Promise<string[] | null> {
  try {
    if (!t.top && (await osName($)) === 'win32') return await walk($, t.root, rootOfDisk(t.root) ? 3 : 6, 20_000)
    const run = t.top
      ? await git($, t.root, ['ls-files', '-co', '--exclude-standard', '-z'], 10_000)
      : await $.process.run(['find', '-H', t.root, '-xdev', '-maxdepth', rootOfDisk(t.root) ? '3' : '6', ...pruneArgs(t.root), '-type', 'f', '-print0'], { timeoutMs: 10_000 })
    if (t.top && run.exitCode !== 0) return null
    const paths = run.stdout.split('\0').filter(Boolean)
    if (run.isStdoutTruncated) paths.pop()
    return paths.map(p => (isAbsolute(p) ? p : join(t.root, p)))
  } catch {
    return null
  }
}

function indexPaths($: EngineInterface, t: FileTree): Promise<string[]> {
  if (searchIndex?.root !== t.root) {
    const index: { root: string; paths: Promise<string[]> } = {
      root: t.root,
      paths: listAll($, t).then(paths => {
        if (paths === null && searchIndex === index) searchIndex = null
        return paths ?? []
      }),
    }
    searchIndex = index
  }
  return searchIndex.paths
}

async function search($: EngineInterface, query: string): Promise<string[]> {
  if (!(await get($)).query.trim()) searchIndex = null
  await patch($, () => ({ query }))
  const q = query.trim().toLowerCase()
  if (!q) return []
  const t = await get($)
  const hits = (await indexPaths($, t)).filter(p => relative(t.root, p).toLowerCase().includes(q)).slice(0, SEARCH_REVEAL_LIMIT)
  if ((await get($)).query !== query) return []
  await revealPaths($, hits)
  const shown = await get($)
  const ids = new Set(shown.nodes.map(n => n.id))
  const stale = [...new Set(hits.filter(p => !ids.has(p)).map(dirname))].filter(d => inside(shown.root, d))
  if (stale.length) await loadDirs($, stale)
  return hits
}

async function jump($: EngineInterface, query: string): Promise<void> {
  const hits = (await search($, query)).slice(0, 10)
  await patch($, cur => {
    const open = new Set(cur.expanded)
    for (const p of hits) for (const a of ancestorsOf(p, cur.root)) open.add(a)
    return { query: '', expanded: [...open], cursor: hits[0] ?? cur.cursor, scroll: null }
  })
}

async function fontState($: EngineInterface, charset: string): Promise<'ok' | 'stale' | 'missing'> {
  try {
    const out = (await $.process.run(['sh', '-c', FONT_SCRIPT, 'sh', charset], { timeoutMs: 5_000 })).stdout.trim()
    return out === 'stale' || out === 'missing' ? out : 'ok'
  } catch {
    return 'missing'
  }
}

async function finePointerOk($: EngineInterface): Promise<boolean> {
  if (!(await $.env.get('HERDR_ENV'))) return true
  try {
    const out = (await $.process.run([(await $.env.get('HERDR_BIN_PATH')) || 'herdr', '--version'], { timeoutMs: 3_000 })).stdout
    const [major = 0, minor = 0, fix = 0] = (/(\d+)\.(\d+)\.(\d+)/.exec(out) ?? []).slice(1).map(Number)
    return major * 1e6 + minor * 1e3 + fix >= 9_001
  } catch {
    return false
  }
}

async function openFile($: EngineInterface, path: string): Promise<void> {
  const { argv, init } = openCommand(await osName($), path)
  try {
    const run = await $.process.run(argv, init)
    if (run.exitCode !== 0) $.ui.toast(`${path} açılamadı (${argv[0]}): ${run.stderr.trim().split('\n')[0] || `çıkış kodu ${run.exitCode}`}`)
  } catch {
    $.ui.toast(`${path} açılamadı (${argv[0]})`)
  }
}

async function toggle($: EngineInterface, n: FileNode): Promise<void> {
  if (n.kind === 'dir' && !(await get($)).expanded.includes(n.id)) await loadDirs($, [n.id])
  await patch($, t => {
    const open = new Set(t.expanded)
    if (n.kind === 'dir') open.has(n.id) ? open.delete(n.id) : open.add(n.id)
    return { expanded: [...open], cursor: n.id, selected: n.kind === 'dir' ? t.selected : n.id }
  })
}

async function press($: EngineInterface, n: FileNode): Promise<void> {
  const now = await $.clock.now()
  const isDouble = lastPress.key === n.id && now - lastPress.at < DOUBLE_MS
  lastPress = { key: isDouble ? '' : n.id, at: now }
  if (!isDouble) {
    await toggle($, n)
    return
  }
  await openNode($, n)
}

async function openNode($: EngineInterface, n: FileNode): Promise<void> {
  if (n.kind === 'dir') {
    follow = false
    await reset($, n.id)
  } else await openFile($, n.id)
}

async function loadTheme($: EngineInterface): Promise<void> {
  const path = `${(await $.env.get('HOME')) ?? ''}/${THEME_FILE}`
  try {
    const stat = await $.fs.stat(path)
    if (stat.kind !== 'file') throw new Error('no theme file')
    if (stat.mtimeMs === themeMtime) return
    await $.state.set(THEME, parseTheme(String(await $.fs.read(path))))
    themeMtime = stat.mtimeMs
  } catch {
    if (themeMtime === 0) return
    await $.state.set(THEME, DEFAULT_THEME)
    themeMtime = 0
  }
}

function shortPath(path: string): string {
  return home && inside(home, path) ? `~${path.slice(home.length)}` : path
}

type Scene = {
  t: FileTree
  theme: Theme
  now: number
  latest: Activity | undefined
  bright: Set<string>
  dimmed: Set<string>
  turn: TurnLog
  look: Look
  isCommitting: boolean
}
type Room = { width: number; bodyRows: number }

async function sceneOf($: EngineInterface, isDesktop: boolean): Promise<Scene> {
  const t = await get($)
  const now = await $.clock.now()
  const live = (await activities($)).filter(a => now - a.at < (a.state === 'running' ? RUNNING_MAX_MS : ACTIVITY_TTL_MS))
  const stored = isDesktop ? (await $.state.get(LOOK)).value : undefined
  if (isDesktop && !stored) void refreshLook($)
  return {
    t,
    theme: (await $.state.get(THEME)).value ?? DEFAULT_THEME,
    now,
    latest: [...live].reverse().find(a => a.state === 'running') ?? live[live.length - 1],
    bright: new Set(t.flashOn ? t.flash : []),
    dimmed: new Set(t.flashOn ? t.flashDim : []),
    turn: await turnLog($),
    look: stored ?? { isLight: false, isAuto: true },
    isCommitting: live.some(a => a.kind === 'git commit' && a.state === 'running'),
  }
}

type TreeWindow = { rows: Row[]; specs: RowSpec[]; bar?: RowsProps['bar'] }

// Which rows fit under the header: follows Claude's latest file, pins lit rows above it.
function treeWindow(s: Scene, room: number, toSpec: (r: Row) => RowSpec, colors: { thumb: string; track: string; note: string }): TreeWindow {
  const { t } = s
  const rows = visibleRows(t)
  const isLit = (id: string) => s.bright.has(id) || s.dimmed.has(id)
  const focus = followClaude && t.flashOn ? ([...t.flash].reverse().find(id => id !== BRANCH_ROW) ?? t.cursor) : t.cursor
  const at = Math.max(0, rows.findIndex(r => r.node.id === focus))
  const lit = followClaude && t.flashOn ? rows.findIndex(r => isLit(r.node.id)) : -1
  const cap = Math.max(1, Math.floor(room / 3))
  let from = Math.max(0, Math.min(lit >= 0 && at - lit < room - 2 ? Math.max(0, lit - 1) : at - Math.floor(room / 2), rows.length - room))
  let pinned = followClaude && t.flashOn ? rows.slice(0, from).filter(r => isLit(r.node.id)).slice(-cap) : []
  if (pinned.length) {
    const rest = Math.max(3, room - pinned.length)
    from = Math.max(0, Math.min(at - Math.floor(rest / 2), rows.length - rest))
    pinned = rows.slice(0, from).filter(r => isLit(r.node.id)).slice(-cap)
  }
  const max = Math.max(0, rows.length - room)
  if (t.scroll !== null) {
    from = Math.max(0, Math.min(t.scroll, max))
    pinned = []
  }
  view = { from, max }
  const shown = rows.slice(from, from + room - pinned.length)
  const note = (text: string): RowSpec => ({ id: '', left: [{ t: text, c: colors.note }], right: [] })
  const specs = [...(rows.length === 0 ? [note('boş klasör')] : []), ...pinned.map(toSpec), ...(pinned.length > 0 ? [note('  ⋮')] : []), ...shown.map(toSpec)]
  const barSize = Math.max(1, Math.round((specs.length * shown.length) / Math.max(1, rows.length)))
  const bar = rows.length > shown.length + pinned.length ? { pos: max ? Math.round((from / max) * (specs.length - barSize)) : 0, size: barSize, ...colors } : undefined
  return { rows: [...pinned, ...shown], specs, ...(bar ? { bar: { pos: bar.pos, size: bar.size, thumb: bar.thumb, track: bar.track } } : {}) }
}

function rowCtx(s: Scene, width: number, unicode: boolean): RowCtx {
  const commits = new Set(s.turn.touches.filter(x => x.role === 'commit').map(x => x.id))
  const live = liveOf(s)
  const pills: Partial<Record<Role, string>> = { read: 'okunuyor', edit: 'düzenleniyor' }
  return {
    t: s.t,
    bright: s.bright,
    dimmed: s.dimmed,
    ignored: new Set(s.t.ignored),
    untracked: new Set(s.t.untrackedDirs),
    width,
    now: s.now,
    unicode,
    theme: s.theme,
    pal: paletteOf(s.look.isLight),
    pillOf: (id, role) => (role === 'ok' ? (commits.has(id) ? 'commit edildi' : 'stage edildi') : live.has(id) ? (pills[role] ?? '') : ''),
  }
}

// The toolbar's actions, shared by both surfaces and the tree's single-key shortcuts.
function actionsOf($: EngineInterface, t: FileTree) {
  return {
    refresh: () =>
      void (async () => {
        const cur = await get($)
        searchIndex = null
        await staleSizes($)
        await loadDirs($, [cur.root, ...cur.expanded])
        await detectRepo($)
        await refreshGit($)
        if (cur.query.trim()) await search($, cur.query)
      })(),
    collapse: () => void patch($, cur => ({ expanded: [], nodes: dropBelow(cur.nodes, cur.nodes.filter(x => x.parent === cur.root && x.kind === 'dir').map(x => x.id)) })),
    size: () => void patch($, cur => ({ showSize: !cur.showSize })),
    up: () =>
      void (async () => {
        follow = false
        await reset($, dirname(t.root))
      })(),
    cwd: () =>
      void (async () => {
        follow = true
        await reset($, await cwdOf($))
      })(),
    hidden: () => void patch($, cur => ({ showHidden: !cur.showHidden })),
    unselect: () => void patch($, () => ({ selected: '' })),
    more: () => void patch($, cur => ({ showTools: !cur.showTools })),
  } satisfies Record<ToolKey, () => void>
}

const relOrShort = (t: FileTree, id: string): string => (id !== t.root && inside(t.root, id) ? id.slice(t.root.endsWith('/') ? t.root.length : t.root.length + 1) : shortPath(id))

// Live: shimmering now and part of Claude's latest step (a read is over once it edits).
function liveOf(s: Scene): Set<string> {
  const lit = s.turn.touches.filter(x => s.bright.has(x.id))
  const latest = [...lit].sort((a, b) => a.at - b.at).pop()
  if (!latest || !s.turn.isRunning) return new Set()
  return new Set(lit.filter(x => x.role === latest.role && latest.at - x.at <= LIVE_SPREAD_MS).map(x => x.id))
}

function heroInput(s: Scene) {
  return { turn: s.turn, live: liveOf(s), root: s.t.root, isCommitting: s.isCommitting, branch: s.t.branch?.head ?? '', diff: s.t.diff }
}

const TERMINAL_ROLE: Record<Role, string> = { read: 'suggestion', edit: 'claude', ok: 'success', run: 'permission', warn: 'warning', danger: 'error', plan: 'merged', note: 'subtle', neutral: 'subtle' }

function terminalBranch(ui: ElementTable<'terminal'>, s: Scene, unicode: boolean) {
  const { Box, Text } = ui
  const { t, theme } = s
  if (!t.top || !t.branch) return null
  const b = t.branch
  const isFlash = s.bright.has(BRANCH_ROW)
  const tone = TONES[t.flashTones[BRANCH_ROW] ?? 'teal']?.solid
  const totals: [number, number] = t.diff[t.root] ?? [0, 0]
  const rootCounts = countSegs(t.counts[t.root], theme)
  return (
    <Box flexDirection="row" height={1} overflow="hidden">
      <Box flexDirection="row" flexShrink={0}>
        <Text color={isFlash ? (tone ?? theme.accent) : theme.accent}>{(unicode ? BRANCH_ICON.plain : BRANCH_ICON.nerd) + ' '}</Text>
        <Text bold color={isFlash ? (tone ?? (theme.fg || undefined)) : theme.fg || undefined}>
          {b.head}
        </Text>
        {b.ahead > 0 && <Text color="success">{` ↑${b.ahead}`}</Text>}
        {b.behind > 0 && <Text color="warning">{` ↓${b.behind}`}</Text>}
      </Box>
      {b.upstream && (
        <Box flexShrink={1} overflow="hidden">
          <Text color={theme.muted} wrap="truncate-end">{` ${b.upstream}`}</Text>
        </Box>
      )}
      <Box flexGrow={1} />
      <Box flexDirection="row" flexShrink={0}>
        {totals[0] > 0 && <Text color={ADD_COLOR}>{` +${totals[0]}`}</Text>}
        {totals[1] > 0 && <Text color={DEL_COLOR}>{` -${totals[1]}`}</Text>}
        {rootCounts.map(c => (
          <Text color={c.c}>{c.t}</Text>
        ))}
        {rootCounts.length === 0 && totals[0] === 0 && totals[1] === 0 && <Text color={theme.muted}> temiz</Text>}
      </Box>
    </Box>
  )
}

function activityChip(ui: ElementTable<'terminal' | 'desktop'>, a: Activity, unicode: boolean, colorOf: (tone: string) => string) {
  const { Box, Text } = ui
  const color = colorOf(a.state === 'failed' ? 'red' : a.tone)
  const hash = a.state === 'done' && a.kind === 'git commit' ? (a.detail.split(' ')[0] ?? '') : ''
  return (
    <Box flexDirection="row" marginLeft={2}>
      <Text color={color}>{(unicode ? a.plain : a.nerd) + ' '}</Text>
      <Text bold={a.state === 'running'} color={color}>
        {a.state === 'running' ? `${a.label}…` : a.label}
      </Text>
      {hash && <Text dimColor>{` ${hash}`}</Text>}
    </Box>
  )
}

function footer(ui: ElementTable<'terminal' | 'desktop'>, s: Scene, chip: RenderChildren) {
  const { Box, Text } = ui
  if (!s.t.selected && !s.latest) return null
  return (
    <Box flexDirection="row">
      {s.t.selected ? (
        <Box flexShrink={1}>
          <Text dimColor wrap="truncate-start">
            seçili: {relOrShort(s.t, s.t.selected)}
          </Text>
        </Box>
      ) : null}
      <Box flexGrow={1} />
      {chip}
    </Box>
  )
}

function searchRow($: EngineInterface, ui: ElementTable<'terminal'>, t: FileTree, labels: { label?: string; clear: string }) {
  const { Box, Button, Input } = ui
  return (
    <Box flexDirection="row" gap={1}>
      <Box flexGrow={1}>
        <Input key="q" {...(labels.label ? { label: labels.label } : {})} placeholder="Dosya bul" submitLabel="git" autoFocus value={t.query} onInput={(v: string) => void search($, v)} onSubmit={(v: string) => void jump($, v)} />
      </Box>
      {t.query ? <Button key="clear" plain dimColor label={labels.clear} onPress={() => void search($, '')} /> : null}
    </Box>
  )
}

function drawTerminal($: EngineInterface, ui: ElementTable<'terminal'>, s: Scene, room: Room) {
  const { Box, Text, Button, Client } = ui
  const { t, theme } = s
  const unicode = glyphSetting === 'plain' || (glyphSetting === 'auto' && noNerd)
  const hero = heroOf(heroInput(s))
  const hasNow = s.turn.hasRun
  const fixed = 2 + (t.top ? (t.branch ? 1 : 0) : 1) + (t.selected || s.latest ? 1 : 0) + (hasNow ? 1 : 0)
  const ctx = rowCtx(s, room.width, unicode)
  const win = treeWindow(s, Math.max(5, room.bodyRows - fixed), r => terminalRow(ctx, r), { thumb: theme.accent, track: theme.muted, note: theme.muted })
  if (t.showSize) wantSizes($, win.rows.filter(r => r.node.kind === 'dir' && !(r.node.id in t.dirSizes)).map(r => r.node.id))
  const act = actionsOf($, t)
  const header = t.top ? [t.top.split('/').pop() ?? t.top, t.prefix.replace(/\/$/, '')].filter(Boolean).join('/') : t.root.split('/').pop() || t.root
  const icon = (key: keyof typeof act, plain: string, nerd: string, isDim = true) => <Button key={key} plain dimColor={isDim} label={unicode ? plain : nerd} onPress={act[key]} />
  const chip = s.latest ? activityChip(ui, s.latest, unicode, tone => TONES[tone]?.solid ?? theme.accent) : null
  return (
    <Box flexDirection="column" minHeight={Math.max(1, room.bodyRows)} backgroundColor={theme.bg || undefined}>
      <Box flexDirection="row">
        <Text bold color={theme.accent} wrap="truncate-start">{header}</Text>
        <Box flexGrow={1} />
        <Box flexDirection="row" gap={2}>
          {icon('up', '↑', '\u{f005d}')}
          {icon('cwd', '⌂', '\u{f02dc}', !follow)}
          {icon('refresh', '↻', '\u{f0450}')}
          {icon('hidden', t.showHidden ? '◉' : '○', t.showHidden ? '\u{f0208}' : '\u{f0209}', !t.showHidden)}
          {icon('size', 'Σ', '\u{f02ca}', !t.showSize)}
          {icon('collapse', '⊟', '\u{eac5}')}
          {t.selected ? icon('unselect', '⊘', '\u{f0777}', false) : null}
          <Text> </Text>
        </Box>
      </Box>
      {terminalBranch(ui, s, unicode)}
      {!t.top && <Text color={theme.muted}>{unicode ? '± ' : '\u{e702} '}git deposu yok · git durumu git init sonrası görünür</Text>}
      {hasNow && (
        <Box flexDirection="row" height={1} overflow="hidden">
          <Text bold color={TERMINAL_ROLE[hero.role]}>{`● ${hero.eyebrow}  `}</Text>
          <Text wrap="truncate-end">{heroText(hero)}</Text>
          <Text dimColor wrap="truncate-end">{` · ${subText(hero)}`}</Text>
        </Box>
      )}
      {searchRow($, ui, t, { label: '/ ', clear: unicode ? '×' : '\u{f0156}' })}
      <Client key="rows" module="./rows.tsx" props={{ rows: win.specs, active: t.cursor, activeBg: theme.selection, hoverBg: faint(theme.selection), tones: SHIMMER, pointer, ...(win.bar ? { bar: win.bar } : {}) } satisfies RowsProps} />
      <Box flexGrow={1} />
      {footer(ui, s, chip)}
    </Box>
  )
}

function gitRowOf(t: FileTree): GitRow | null {
  if (!t.top || !t.branch) return null
  const [add, del] = t.diff[t.root] ?? [0, 0]
  const changed = (t.counts[t.root] ?? [0, 0, 0]).reduce((a, b) => a + b, 0)
  return { branch: t.branch.head, upstream: t.branch.upstream, ahead: t.branch.ahead, behind: t.branch.behind, changed, add, del }
}

// Only the colors the view shows right now get a legend entry.
function legendOf(s: Scene, git: GitRow | null): LegendItem[] {
  const tones = s.t.flashOn ? Object.values(s.t.flashTones).map(roleOfTone) : []
  const has = (role: 'read' | 'edit') => s.turn.touches.some(x => x.role === role) || tones.includes(role)
  return [
    ...(has('read') ? [{ role: 'read' as const, label: 'okudu' }] : []),
    ...(has('edit') ? [{ role: 'edit' as const, label: 'düzenledi' }] : []),
    ...(git?.changed ? [{ role: 'warn' as const, label: 'commit edilmedi' }] : []),
  ]
}

function drawDesktop($: EngineInterface, ui: ElementTable<'desktop'>, s: Scene, room: Room) {
  const { Box, Client, Svg } = ui
  const { t, look } = s
  const pal = paletteOf(look.isLight)
  const w = Math.max(MIN_SVG_W, Math.min(MAX_SVG_W, room.width * PX_PER_COL))
  const input = heroInput(s)
  const git = gitRowOf(t)
  const hero = heroCard(heroOf(input), git, legendOf(s, git), look, w)
  const touchedList = touchedRows(input)
  const touched = touchedList.length ? touchedCard(touchedList, look, w) : null
  const section = sectionLine('TÜM DOSYALAR', (t.top ? t.top : t.root).split('/').pop()?.toLocaleUpperCase('tr') ?? '', look, w)
  const lines = (px: number) => Math.ceil(px / ROW_PX) + 1
  const toolRows = t.showTools ? TOOLBAR_OPEN_ROWS : TOOLBAR_ROWS
  const fixed = lines(hero.height) + (touched ? lines(touched.height) : 0) + lines(section.height) + toolRows + FOOTER_ROWS
  const ctx = rowCtx(s, room.width - 1, true)
  const win = treeWindow(s, Math.max(5, room.bodyRows - fixed), r => desktopRow(ctx, r), { thumb: pal.lineStrong, track: pal.line, note: pal.lo })
  if (t.showSize) wantSizes($, win.rows.filter(r => r.node.kind === 'dir' && !(r.node.id in t.dirSizes)).map(r => r.node.id))
  const chipColor = (tone: string) => pal.roles[roleOfTone(tone)].fg
  const chip = s.latest ? activityChip(ui, s.latest, true, chipColor) : null
  // The full body width, so the cards end where the tree's right column does; with no width set,
  // a narrower slot than the columns promise shrinks the drawing instead of cutting it.
  const svg = (d: { source: string; alt: string }) => <Svg source={d.source} alt={d.alt} />
  const find = { onInput: (v: string) => void search($, v), onSubmit: (v: string) => void jump($, v) }
  return (
    <Box flexDirection="column" gap={1} minHeight={Math.max(1, room.bodyRows)}>
      {svg(hero)}
      {drawToolbar(ui, { t, act: actionsOf($, t), search: find })}
      {touched ? svg(touched) : null}
      <Box flexDirection="column">
        {svg(section)}
        <Client key="rows" module="./rows.tsx" props={{ rows: win.specs, active: t.cursor, activeBg: pal.line, hoverBg: pal.inset, tones: shimmerTones(pal, look.isLight), pointer, ...(win.bar ? { bar: win.bar } : {}) } satisfies RowsProps} />
      </Box>
      <Box flexGrow={1} />
      {footer(ui, s, chip) ?? <Box height={1} />}
    </Box>
  )
}

export const register: Register = (on, options) => {
  glyphSetting = typeof options?.glyphs === 'string' ? options.glyphs : 'auto'
  const activity = typeof options?.activity === 'string' ? options.activity : 'reads and writes'
  showReads = activity.includes('reads')
  showWrites = activity.includes('writes')
  followClaude = options?.follow !== 'off'
  sizeDefault = options?.column === 'size'
  // DESIGN.md §9: the MODZ main panel asks for a pane by key; this only opens, never closes.
  // modz's contract is not this mod's to import, so its address stays untyped here.
  on('state.set', { plugin: 'modz', key: 'open' } as any, async ($: EngineInterface, e: any, next: any) => {
    const done = await next(e)
    if (isOpenFor(e.value, HUB_PANE)) await openFromHub($)

    return done
  }).catch(($, e, next) => next(e))
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'filetree', description: 'Dosya ağacını açar; argüman: [yol] (boşsa çalışma klasörü)' })
    const windows = (await $.env.get('OS')) === 'Windows_NT'
    useDrives(windows)
    home = posix(((await $.env.get('HOME')) || (await $.env.get('USERPROFILE')) || '').replace(/[\\/]+$/, ''))
    activityId = Math.max(activityId, ...(await activities($)).map(a => a.id))
    void (async () => {
      pointer = await finePointerOk($)
      try {
        const remote = Boolean((await $.env.get('SSH_CONNECTION')) || (await $.env.get('SSH_TTY')))
        noNerd = !remote && (windows || (await fontState($, 'f04eb')) !== 'ok')
      } catch {
        noNerd = true
      }
      await loadTheme($)
      themePoll?.cancel()
      themePoll = themeMtime ? $.clock.every(THEME_POLL_MS, () => void loadTheme($)) : null
      const t = await get($)
      if (t.flashOn) await patch($, () => ({ flash: [], flashDim: [], flashOn: false, flashTones: {} }))
      await setActivities($, cur => cur.map(a => (a.state === 'running' ? { ...a, state: 'failed', label: `${a.kind} yarıda kaldı` } : a)))
      const cwd = await cwdOf($)
      if (!t.root || t.nodes.length === 0 || (follow && t.root !== cwd)) await reset($, cwd)
      else await showPane($, PANE_TITLE, false)
      await syncHub($)
    })()
    return next(e)
  })

  on('command.run', { command: 'filetree' }, async ($, e) => {
    const isApp = await inApp($)
    if (!isApp && !e.presentation.isFullscreen) return { text: 'Dosya ağacı yan panelde açılır; bunun için tam ekran düzen gerekir. Önce /tui fullscreen, sonra /filetree çalıştır.' }
    if (!isApp && e.presentation.columns < 110) return { text: 'Dosya ağacı yan panelde açılır; terminal en az 110 sütun genişliğinde olmalı. Pencereyi genişletip /filetree çalıştır.' }
    noDock = false
    const arg = (e.args ?? '').trim()
    const cwd = await cwdOf($)
    follow = !arg
    const root = arg ? resolve(cwd, arg, home) : cwd
    await reset($, root, true)
    return { text: `Dosya ağacı: ${shortPath(root)}${follow ? ' (çalışma klasörünü izliyor)' : ''}.` }
  })

  on('tool.call', async ($, e, next) => {
    if (e.tool !== 'Edit' && e.tool !== 'Write' && e.tool !== 'NotebookEdit' && e.tool !== 'Bash') return next(e)
    const command = e.tool === 'Bash' ? e.command : ''
    const cwd = e.tool === 'Bash' ? await cwdOf($) : ''
    const actions = gitActions(command)
    const quiet = !actions.length && readOnly(command)
    const since = await sinceNow($, e.tool === 'Bash' && !quiet)
    const pending = actions.length ? await pendingOf($, { command, actions, cwd: e.agentId ? '' : cwd }) : null
    let result: Awaited<ReturnType<typeof next>>
    try {
      result = await next(e)
    } catch (err) {
      if (pending) await finishGit($, pending, failAll(pending))
      if (since.mark) void $.process.run(['rm', '-f', since.mark], { timeoutMs: 3_000 }).catch(() => undefined)
      throw err
    }
    if (pending && result.deny) {
      const ids = pending.ids
      void setActivities($, cur => cur.filter(a => !ids.includes(a.id)))
    }
    if (result.deny || (result.isError && e.tool !== 'Bash')) {
      if (since.mark) void $.process.run(['rm', '-f', since.mark], { timeoutMs: 3_000 }).catch(() => undefined)
      return result
    }
    if (e.tool === 'Bash') {
      const out: Partial<BuiltinToolResults['Bash']> = !result.isError && result.result && typeof result.result === 'object' ? result.result : {}
      const reads = showReads ? readTargets(command, cwd, typeof out.stdout === 'string' ? out.stdout : '', home) : []
      const job: Job = { actions: [], since, initRepo: actions.some(a => a.init), readOnly: quiet || result.isReadOnly === true }
      if (out.backgroundTaskId) background.set(out.backgroundTaskId, { p: pending, job, reads })
      else void (async () => {
        const run = { ok: !result.isError, op: out.gitOperation, text: typeof result.text === 'string' ? result.text : '' }
        const results = pending ? await outcomes($, pending, run) : []
        if (pending) await finishGit($, pending, results)
        const sha = results.find((r, i) => r.state === 'done' && pending?.actions[i]?.verb === 'commit')?.detail
        if (sha && pending?.place.isHere) await noteCommit($, { sha })
        queuedReads.push(...reads)
        scheduleScan($, { ...job, actions: proven(pending, results) })
      })()
      if (follow && /(^|[;&|\s])(cd|pushd|popd)(\s|$)/.test(command)) $.clock.after(400, () => void followCwd($))
    } else {
      const file =
        'file_path' in e && typeof e.file_path === 'string'
          ? e.file_path
          : 'notebook_path' in e && typeof e.notebook_path === 'string'
            ? e.notebook_path
            : ''
      if (file) void touched($, [file], 'orange', showWrites)
    }
    return result
  })

  on('tool.call', { tool: 'Read' }, async ($, e, next) => {
    const result = await next(e)
    if (result.deny || result.isError || e.tool !== 'Read' || !showReads) return result
    void touched($, [posix(e.file_path)], 'purple', true)
    return result
  })

  on('turn.start', async ($, e, next) => {
    await update($, TURN, () => ({ ...NO_TURN, isRunning: true, hasRun: true }))
    await syncHub($)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (!e.agentId) await update($, TURN, cur => ({ ...NO_TURN, ...cur, isRunning: false }))
    if (!e.agentId) await syncHub($)
    return result
  })

  on('ui.message', async ($, e, next) => {
    if (e.requestId !== PANE || e.element !== 'rows' || !e.data || typeof e.data !== 'object') return next(e)
    const data = e.data as { press?: unknown; key?: unknown; ctrl?: unknown; shift?: unknown; scrollTo?: unknown; copy?: unknown }
    void sync($)
    const t = await get($)
    if (typeof data.copy === 'string') {
      await copyPath($, data.copy, Boolean(data.shift), e.surface)
      return {}
    }
    if (typeof data.scrollTo === 'number') {
      const to = Math.round(Math.max(0, Math.min(1, data.scrollTo)) * view.max)
      if (to !== t.scroll) await patch($, () => ({ scroll: to }))
      return {}
    }
    if (typeof data.press === 'string') {
      const n = t.nodes.find(x => x.id === data.press)
      if (!n) return {}
      if (t.scroll === null) await patch($, () => ({ scroll: view.from }))
      if (data.ctrl || data.shift) await openNode($, n)
      else await press($, n)
      return {}
    }
    if (typeof data.key !== 'string') return {}
    const rows = visibleRows(t)
    const at = rows.findIndex(r => r.node.id === t.cursor)
    const cur = rows[at]?.node
    const move = (d: number) => {
      const target = rows[Math.max(0, Math.min(rows.length - 1, (at < 0 ? 0 : at) + d))]
      return target ? patch($, () => ({ cursor: target.node.id, scroll: null })) : Promise.resolve()
    }
    if (data.key === 'up' || data.key === 'k') await move(-1)
    else if (data.key === 'down' || data.key === 'j') await move(1)
    else if (data.key === 'pageup') await move(-10)
    else if (data.key === 'pagedown') await move(10)
    else if (data.key === 'home') await move(-rows.length)
    else if (data.key === 'end') await move(rows.length)
    else if (cur && (data.key === 'y' || data.key === 'Y')) await copyPath($, cur.id, data.key === 'Y' || Boolean(data.shift), e.surface)
    else if (cur && (data.key === 'right' || data.key === 'l') && cur.kind === 'dir' && !t.expanded.includes(cur.id)) await toggle($, cur)
    else if (cur && (data.key === 'left' || data.key === 'h')) {
      if (cur.kind === 'dir' && t.expanded.includes(cur.id)) await toggle($, cur)
      else if (cur.parent !== t.root) await patch($, () => ({ cursor: cur.parent }))
    } else if (cur && data.key === 'return') await (cur.kind !== 'dir' ? openNode($, cur) : toggle($, cur))
    else if (cur && data.key === ' ') await toggle($, cur)
    else if (TOOL_KEYS[data.key] && !data.ctrl) actionsOf($, t)[TOOL_KEYS[data.key] as ToolKey]()
    return {}
  })

  on('classic.SessionStart', async ($, e, next) => {
    const result = await next(e)
    if (e.source === 'clear' || e.source === 'resume' || e.source === 'fork') {
      void (async () => {
        await loadTheme($)
        const root = follow || !lastRoot ? await cwdOf($) : lastRoot
        const t = await get($)
        if (t.root !== root || t.nodes.length === 0) await reset($, root)
      })()
    }
    const gd = await gitDir($, posix(e.cwd))
    return gd ? { ...result, watchPaths: [...(result.watchPaths ?? []), join(gd, 'index'), join(gd, 'HEAD')] } : result
  })

  on('classic.CwdChanged', async ($, e, next) => {
    const result = await next(e)
    void followCwd($)
    return result
  })

  on('classic.FileChanged', async ($, e, next) => {
    const result = await next(e)
    if (/[\\/]\.git[\\/]|[\\/](index|HEAD)$/.test(e.file_path)) $.clock.after(300, () => void sync($, true))
    return result
  })

  on('ui.focus', { component: 'Pane', requestId: PANE }, async ($, e, next) => {
    const result = await next(e)
    void sync($)
    if ((await $.state.get(LOOK)).value) void refreshLook($)
    return result
  })

  on('ui.scroll', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const t = await get($)
    const to = Math.max(0, Math.min(view.max, (t.scroll ?? view.from) + Math.sign(e.by) * Math.max(3, Math.abs(e.by))))
    if (to !== t.scroll) await patch($, () => ({ scroll: to }))
    return {}
  })

  on('prompt.submit', async ($, e, next) => {
    void settleBackground($, e.text)
    if (!(await followCwd($))) void sync($)
    const t = await get($)
    const context = [...(e.context ?? [])]
    if (t.selected && (await exists($, t.selected))) context.push(`The user has this file selected in the file tree; "this" or "it" in the prompt likely refers to it: ${t.selected}`)
    const mentions = [...e.text.matchAll(/@([^\s"'`]+)/g)]
      .map(m => (m[1] ?? '').replace(/[.,;:!?)]+$/, ''))
      .filter(Boolean)
      .map(p => resolve(t.root, p, home))
      .filter(p => inside(t.root, p))
    if (mentions.length) {
      void (async () => {
        const found: string[] = []
        for (const p of mentions) {
          try {
            await $.fs.stat(p)
            found.push(p.replace(/\/$/, ''))
          } catch {
            continue
          }
        }
        if (found.length) await reveal($, found)
      })()
    }
    return next(context.length ? { ...e, context } : e)
  })

  on('prompt.attachment', async ($, e, next) => {
    void settleBackground($, e.text)
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e, next) => {
    if (e.surface !== 'terminal' && e.surface !== 'desktop') return next(e)
    if (e.surface === 'terminal' && e.props.placement === 'inline') {
      noDock = true
      void $.ui.close({ id: PANE }).catch(() => undefined)
      const { Box: Empty } = $.ui.resolve(e)
      return <Empty />
    }
    const scene = await sceneOf($, e.surface === 'desktop')
    const width = Math.max(24, e.props.bodyColumns)
    const bodyRows = e.props.scroll?.bodyRows ?? 40
    if (e.surface === 'desktop') return drawDesktop($, $.ui.resolve(e), scene, { width, bodyRows })
    return drawTerminal($, $.ui.resolve(e), scene, { width, bodyRows })
  })
}
