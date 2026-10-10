import type { Activity, FileTree, Look, Theme, TurnLog } from '../types'
import { BRANCH_ROW } from './flash'
import { ACTIVITY_TTL_MS } from './gitjobs'
import type { Host } from './host'
import { refreshLook } from './look'
import type { RowSpec, RowsProps } from './rows'
import type { RowCtx } from './rowspec'
import { mem } from './session'
import { paletteOf, type Role } from './theme'
import { DEFAULT_THEME, type Row, visibleRows } from './tree'

export type Scene = {
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
export type Room = { width: number; bodyRows: number }
export type TreeWindow = { rows: Row[]; specs: RowSpec[]; bar?: RowsProps['bar'] }
export type Draw = { toSpec: (r: Row) => RowSpec; colors: { thumb: string; track: string; note: string } }

const RUNNING_MAX_MS = 600_000
const LIVE_SPREAD_MS = 1_500
// The window keeps a third of its rows for pinned lit rows, and at least this many for the rest.
const PIN_SHARE = 3
const MIN_REST = 3

export async function sceneOf(h: Host, isDesktop: boolean): Promise<Scene> {
  const t = await h.tree()
  const now = await h.now()
  const live = (await h.activities()).filter(a => now - a.at < (a.state === 'running' ? RUNNING_MAX_MS : ACTIVITY_TTL_MS))
  const stored = isDesktop ? await h.look() : undefined
  if (isDesktop && !stored) void refreshLook(h)
  return {
    t,
    theme: (await h.theme()) ?? DEFAULT_THEME,
    now,
    latest: [...live].reverse().find(a => a.state === 'running') ?? live[live.length - 1],
    bright: new Set(t.flashOn ? t.flash : []),
    dimmed: new Set(t.flashOn ? t.flashDim : []),
    turn: await h.turn(),
    look: stored ?? { isLight: false, isAuto: true },
    isCommitting: live.some(a => a.kind === 'git commit' && a.state === 'running'),
  }
}

// Live: shimmering now and part of Claude's latest step (a read is over once it edits).
export function liveOf(s: Scene): Set<string> {
  const lit = s.turn.touches.filter(x => s.bright.has(x.id))
  const latest = [...lit].sort((a, b) => a.at - b.at).pop()
  if (!latest || !s.turn.isRunning) return new Set()
  return new Set(lit.filter(x => x.role === latest.role && latest.at - x.at <= LIVE_SPREAD_MS).map(x => x.id))
}

export function heroInput(s: Scene) {
  return { turn: s.turn, live: liveOf(s), root: s.t.root, isCommitting: s.isCommitting, branch: s.t.branch?.head ?? '', diff: s.t.diff }
}

export function rowCtx(s: Scene, width: number, unicode: boolean): RowCtx {
  const commits = new Set(s.turn.touches.filter(x => x.role === 'commit').map(x => x.id))
  const live = liveOf(s)
  const pills: Partial<Record<Role, string>> = { read: 'okunuyor', edit: 'düzenleniyor' }
  const pillOf = (id: string, role: Role): string => {
    if (role === 'ok') return commits.has(id) ? 'commit edildi' : 'stage edildi'
    return live.has(id) ? (pills[role] ?? '') : ''
  }
  const { t } = s
  return { t, bright: s.bright, dimmed: s.dimmed, ignored: new Set(t.ignored), untracked: new Set(t.untrackedDirs), width, now: s.now, unicode, theme: s.theme, pal: paletteOf(s.look.isLight), pillOf }
}

// Follows Claude's latest file and pins lit rows above it; a scroll the person made wins.
function spanOf(s: Scene, rows: Row[], room: number): { from: number; pinned: Row[] } {
  const { t } = s
  if (t.scroll !== null) return { from: Math.max(0, Math.min(t.scroll, Math.max(0, rows.length - room))), pinned: [] }
  const isFollowing = mem.followClaude && t.flashOn
  const isLit = (id: string) => s.bright.has(id) || s.dimmed.has(id)
  const focus = isFollowing ? ([...t.flash].reverse().find(id => id !== BRANCH_ROW) ?? t.cursor) : t.cursor
  const at = Math.max(0, rows.findIndex(r => r.node.id === focus))
  const lit = isFollowing ? rows.findIndex(r => isLit(r.node.id)) : -1
  const cap = Math.max(1, Math.floor(room / PIN_SHARE))
  const centered = lit >= 0 && at - lit < room - 2 ? Math.max(0, lit - 1) : at - Math.floor(room / 2)
  let from = Math.max(0, Math.min(centered, rows.length - room))
  let pinned = isFollowing ? rows.slice(0, from).filter(r => isLit(r.node.id)).slice(-cap) : []
  if (pinned.length) {
    const rest = Math.max(MIN_REST, room - pinned.length)
    from = Math.max(0, Math.min(at - Math.floor(rest / 2), rows.length - rest))
    pinned = rows.slice(0, from).filter(r => isLit(r.node.id)).slice(-cap)
  }
  return { from, pinned }
}

// Which rows fit under the header: follows Claude's latest file, pins lit rows above it.
export function treeWindow(s: Scene, room: number, draw: Draw): TreeWindow {
  const rows = visibleRows(s.t)
  const { from, pinned } = spanOf(s, rows, room)
  const max = Math.max(0, rows.length - room)
  mem.view = { from, max }
  const shown = rows.slice(from, from + room - pinned.length)
  const { toSpec, colors } = draw
  const note = (text: string): RowSpec => ({ id: '', left: [{ t: text, c: colors.note }], right: [] })
  const specs = [...(rows.length === 0 ? [note('boş klasör')] : []), ...pinned.map(toSpec), ...(pinned.length > 0 ? [note('  ⋮')] : []), ...shown.map(toSpec)]
  const barSize = Math.max(1, Math.round((specs.length * shown.length) / Math.max(1, rows.length)))
  const bar = { pos: max ? Math.round((from / max) * (specs.length - barSize)) : 0, size: barSize, thumb: colors.thumb, track: colors.track }
  return { rows: [...pinned, ...shown], specs, ...(rows.length > shown.length + pinned.length ? { bar } : {}) }
}
