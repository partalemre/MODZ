// One tree row as the rows Client draws it: upstream's terminal row, and the desktop row with indent guides, the
// activity's colour while Claude touches the file and a word for what it is doing.

import type { FileNode, FileTree, Theme } from '../types'
import { TONES } from './git'
import { CHEVRON_CLOSED, CHEVRON_OPEN, fileIcon, GIT_COLOR } from './icons'
import type { RowSpec, Seg } from './rows'
import { fitMiddle, measure } from './svg'
import { type Palette, type Role, roleOfTone } from './theme'
import { dirname, formatSize, type Row, stamp, underAny } from './tree'

export type RowCtx = {
  t: FileTree
  bright: ReadonlySet<string>
  dimmed: ReadonlySet<string>
  ignored: ReadonlySet<string>
  untracked: ReadonlySet<string>
  width: number
  now: number
  unicode: boolean
  theme: Theme
  pal: Palette
  // The word a live row shows in place of its meta: "reading", "editing", ...
  pillOf: (id: string, role: Role) => string
  // What the file's reads put into context this turn ("≈1.2k tok"), or "".
  costOf: (id: string) => string
}

const ADD_COLOR = '#98c379'
const DEL_COLOR = '#e06c75'
// A desktop pane reports about 9 px a column; its text is 14 px.
export const PX_PER_COL = 9
const NAME_PX = 14
const LEVEL_CELLS = 2
const RIGHT_GAP_PX = 10
// A row keeps at least this much for its name: what sits beside it goes first.
const MIN_NAME_PX = 72

export function clean(segs: Seg[]): Seg[] {
  for (const seg of segs) for (const k of Object.keys(seg) as (keyof Seg)[]) if (seg[k] === undefined) delete seg[k]
  return segs
}

export function countSegs(c: [number, number, number] | undefined, theme: Theme): Seg[] {
  if (!c) return []
  const out: Seg[] = []
  if (c[0] > 0) out.push({ t: ` ?:${c[0]}`, c: GIT_COLOR['?'] ?? ADD_COLOR })
  if (c[1] > 0) out.push({ t: ` M:${c[1]}`, c: GIT_COLOR.M ?? '#e5c07b' })
  if (c[2] > 0) out.push({ t: ` D:${c[2]}`, c: theme.urgent })
  return out
}

function statusOf(ctx: RowCtx, id: string): string | undefined {
  return ctx.t.git[id] ?? (underAny(dirname(id), ctx.untracked, ctx.t.root) ? '?' : undefined)
}

function metaOf(ctx: RowCtx, r: Row): string {
  const { t } = ctx
  const n = r.node
  if (t.showSize) {
    if (n.kind === 'dir') return n.id in t.dirSizes ? formatSize(t.dirSizes[n.id] ?? -1) : '…'
    return n.kind === 'file' || (n.kind === 'link' && n.size > 0) ? formatSize(n.size) : ''
  }
  return t.diff[n.id] || n.kind !== 'file' ? '' : stamp(n.mtime, ctx.now)
}

const fit = (name: string, cols: number): string => (name.length > cols ? name.slice(0, Math.max(1, cols - 1)) + '…' : name)

function gitColorOf(status: string | undefined, theme: Theme): string | undefined {
  if (status === 'D' || status === 'U') return theme.urgent
  return status ? (GIT_COLOR[status] ?? theme.muted) : undefined
}

function terminalColors(theme: Theme, n: FileNode, git: { color: string | undefined; isIgnored: boolean }) {
  if (git.isIgnored) return { icon: theme.muted, name: theme.muted }
  if (git.color !== undefined) return { icon: git.color, name: git.color }
  if (n.hidden) return { icon: theme.muted, name: theme.muted }
  return { icon: n.kind === 'dir' ? theme.accent : theme.muted, name: theme.fg || undefined }
}

function badgeText(ctx: RowCtx, s: { status: string | undefined; isIgnored: boolean; hasCounts: boolean }): string {
  if (s.hasCounts) return ''
  if (s.status) return ` ${s.status}`
  if (!s.isIgnored) return '  '
  return ctx.unicode ? ' ⊘' : ' \u{f05e}'
}

function caretOf(r: Row, unicode: boolean): string {
  if (r.node.kind !== 'dir') return '  '
  if (unicode) return (r.open ? '▾' : '▸') + ' '
  return (r.open ? CHEVRON_OPEN : CHEVRON_CLOSED) + ' '
}

function glyphOf(ctx: RowCtx, r: Row): string {
  const n = r.node
  if (!ctx.unicode) return fileIcon(n, r.open, n.kind === 'dir' && n.id === ctx.t.top)
  return n.kind === 'dir' ? '■' : '·'
}

export function terminalRow(ctx: RowCtx, r: Row): RowSpec {
  const { t, theme, unicode } = ctx
  const n = r.node
  const status = statusOf(ctx, n.id)
  const isIgnored = !status && underAny(n.id, ctx.ignored, t.root)
  const gitColor = gitColorOf(status, theme)
  const isBright = ctx.bright.has(n.id)
  const isDim = !isBright && ctx.dimmed.has(n.id)
  const tone = t.flashTones[n.id] ?? 'orange'
  const colors = terminalColors(theme, n, { color: gitColor, isIgnored })
  const loc = t.diff[n.id]
  const meta = metaOf(ctx, r)
  const cost = ctx.costOf(n.id)
  const locText = loc ? `${loc[0] ? ` +${loc[0]}` : ''}${loc[1] ? ` -${loc[1]}` : ''}` : ''
  const dirCounts = n.kind === 'dir' ? countSegs(t.counts[n.id], theme) : []
  const badge = badgeText(ctx, { status, isIgnored, hasCounts: dirCounts.length > 0 })
  const countsText = dirCounts.map(c => c.t).join('')
  const cols = Math.max(4, ctx.width - r.depth * 2 - 6 - (meta ? meta.length + 1 : 0) - (cost ? cost.length + 1 : 0) - locText.length - badge.length - countsText.length)
  const caret = caretOf(r, unicode)
  const glyph = glyphOf(ctx, r)
  const lit = isBright || isDim
  const left: Seg[] = [
    { t: '  '.repeat(r.depth) },
    { t: caret, c: theme.muted },
    lit ? { t: glyph + ' ', sh: tone, dim: isDim, one: true } : { t: glyph + ' ', c: colors.icon },
    lit ? { t: fit(n.name, cols), sh: tone, dim: isDim, b: isBright } : { t: fit(n.name, cols), c: colors.name, b: n.id === t.selected, s: status === 'D' && n.kind !== 'dir' },
  ]
  const right: Seg[] = []
  if (cost) right.push({ t: ` ${cost}`, c: TONES.blue?.solid ?? theme.accent })
  if (meta) right.push({ t: ` ${meta}`, c: theme.muted })
  if (loc && loc[0] > 0) right.push({ t: ` +${loc[0]}`, c: ADD_COLOR })
  if (loc && loc[1] > 0) right.push({ t: ` -${loc[1]}`, c: DEL_COLOR })
  right.push(...dirCounts)
  if (badge) right.push({ t: badge, c: status ? gitColor : theme.muted, b: true })
  return { id: n.id, left: clean(left), right: clean(right) }
}

const changesIn = (ctx: RowCtx, n: FileNode): number => (n.kind === 'dir' ? (ctx.t.counts[n.id] ?? [0, 0, 0]).reduce((a, b) => a + b, 0) : 0)

// Indent guides and the folder's chevron in boxes of fixed cells, so every name at one depth starts on one line in
// the desktop's proportional face. A file keeps the chevron's cell empty. No file or folder glyph: the chevron and the name say which is which.
function desktopPrefix(ctx: RowCtx, r: Row, role: Role | null): Seg[] {
  const { pal } = ctx
  const chevron = r.node.kind === 'dir' ? (r.open ? '⌄' : '›') : ''
  const guides = Array.from({ length: r.depth }, (): Seg => ({ t: '│', c: pal.lineStrong, cells: LEVEL_CELLS }))
  return [...guides, { t: chevron, c: role ? pal.roles[role].fg : pal.lo, cells: LEVEL_CELLS }]
}

// What the row must say beside the name, and what it says only with room to spare.
function desktopRight(ctx: RowCtx, r: Row, role: Role | null): { must: Seg[]; may: Seg[] } {
  const { t, pal } = ctx
  const n = r.node
  const live = role ? ctx.pillOf(n.id, role) : ''
  if (role && live) return { must: [{ t: ` ${live}`, c: pal.roles[role].fg }], may: [] }
  const changes = changesIn(ctx, n)
  if (changes && !t.showSize) return { must: [{ t: ` ${changes}`, c: pal.roles.warn.fg }], may: [] }
  const loc = t.diff[n.id]
  const must: Seg[] = []
  if (loc && !t.showSize) {
    if (loc[0] > 0) must.push({ t: ` +${loc[0]}`, c: pal.roles.ok.fg })
    if (loc[1] > 0) must.push({ t: ` −${loc[1]}`, c: pal.roles.danger.fg })
  }
  const cost = ctx.costOf(n.id)
  const meta = metaOf(ctx, r)
  return { must, may: [...(cost ? [{ t: ` ${cost}`, c: pal.mid }] : []), ...(meta ? [{ t: ` ${meta}`, c: pal.lo }] : [])] }
}

const widthOf = (segs: Seg[]): number => measure(segs.map(x => x.t).join(''), NAME_PX)

// Names get the room: dates and sizes stay only beside a whole name, and the middle of a name goes last.
function fitRow(ctx: RowCtx, r: Row, right: { must: Seg[]; may: Seg[] }, isBold: boolean): { name: string; right: Seg[] } {
  const room = (ctx.width - (r.depth + 1) * LEVEL_CELLS) * PX_PER_COL
  const whole = measure(r.node.name, NAME_PX, isBold)
  const must = room - widthOf(right.must) < MIN_NAME_PX ? [] : right.must
  const kept = [...must]
  for (const seg of right.may) if (whole + widthOf([...kept, seg]) + RIGHT_GAP_PX <= room) kept.push(seg)
  return { name: fitMiddle(r.node.name, Math.max(MIN_NAME_PX, room - widthOf(kept) - RIGHT_GAP_PX), { size: NAME_PX, isBold }), right: kept }
}

function nameColor(ctx: RowCtx, id: string, isHidden: boolean): string {
  const { pal } = ctx
  const status = statusOf(ctx, id)
  if (status === 'D' || status === 'U') return pal.roles.danger.fg
  if (status) return pal.roles.warn.fg
  return isHidden || underAny(id, ctx.ignored, ctx.t.root) ? pal.lo : pal.hi
}

export function desktopRow(ctx: RowCtx, r: Row): RowSpec {
  const { t } = ctx
  const n = r.node
  const isBright = ctx.bright.has(n.id)
  const isDim = !isBright && ctx.dimmed.has(n.id)
  const tone = t.flashTones[n.id] ?? 'orange'
  const role = isBright ? roleOfTone(tone) : null
  const isBold = isBright || isDim || n.id === t.selected
  const { name, right } = fitRow(ctx, r, desktopRight(ctx, r, role), isBold)
  const status = statusOf(ctx, n.id)
  const label: Seg = isBright || isDim
    ? { t: name, sh: tone, dim: isDim, b: true }
    : { t: name, c: nameColor(ctx, n.id, n.hidden), b: n.id === t.selected, s: status === 'D' && n.kind !== 'dir' }
  return { id: n.id, left: clean([...desktopPrefix(ctx, r, role), label]), right: clean(right), ...(role ? { bg: ctx.pal.roles[role].tint } : {}) }
}
