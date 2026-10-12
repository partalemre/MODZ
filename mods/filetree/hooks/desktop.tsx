import type { ElementTable } from 'claude-code'

import type { FileTree } from '../types'
import { actionsOf } from './actions'
import { type GitRow, heroCard, type LegendItem, sectionLine, touchedCard } from './cards'
import { activityChip, footer } from './chrome'
import type { Host } from './host'
import { heroOf, touchedRows } from './now'
import type { RowsProps } from './rows'
import { desktopRow } from './rowspec'
import { heroInput, type Room, rowCtx, type Scene, treeWindow } from './scene'
import { jump, search } from './search'
import { mem } from './session'
import { unsized, wantSizes } from './sizes'
import { paletteOf, roleOfTone, shimmerTones } from './theme'
import { drawToolbar } from './toolbar'
import { upper } from './lang'
import { words } from './words'

type Ui = ElementTable<'desktop'>

const PX_PER_COL = 8
const ROW_PX = 18
const MIN_SVG_W = 240
const MAX_SVG_W = 900
// Rows the desktop toolbar takes: its one line, and with "More" open the extra buttons and hint.
const TOOLBAR_ROWS = 3
const TOOLBAR_OPEN_ROWS = 9
const FOOTER_ROWS = 2
const MIN_BODY = 5

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
  const { legend } = words()
  return [
    ...(has('read') ? [{ role: 'read' as const, label: legend.read }] : []),
    ...(has('edit') ? [{ role: 'edit' as const, label: legend.edit }] : []),
    ...(git?.changed ? [{ role: 'warn' as const, label: legend.warn }] : []),
  ]
}

// The three cards above the tree, drawn at the pane's width.
function cardsOf(s: Scene, w: number) {
  const { t, look } = s
  const input = heroInput(s)
  const git = gitRowOf(t)
  const hero = heroCard(heroOf(input), { git, legend: legendOf(s, git) }, { look, w })
  const touchedList = touchedRows(input)
  const touched = touchedList.length ? touchedCard(touchedList, look, w) : null
  const section = sectionLine({ left: words().allFiles, right: upper((t.top ? t.top : t.root).split('/').pop() ?? '') }, { look, w })
  return { hero, touched, section }
}

export function drawDesktop(host: Host, ui: Ui, frame: { s: Scene; room: Room }) {
  const { Box, Client, Svg } = ui
  const { s, room } = frame
  const { t, look } = s
  const pal = paletteOf(look.isLight)
  const { hero, touched, section } = cardsOf(s, Math.max(MIN_SVG_W, Math.min(MAX_SVG_W, room.width * PX_PER_COL)))
  const lines = (px: number) => Math.ceil(px / ROW_PX) + 1
  const toolRows = t.showTools ? TOOLBAR_OPEN_ROWS : TOOLBAR_ROWS
  const fixed = lines(hero.height) + (touched ? lines(touched.height) : 0) + lines(section.height) + toolRows + FOOTER_ROWS
  const ctx = rowCtx(s, room.width - 1, true)
  const win = treeWindow(s, Math.max(MIN_BODY, room.bodyRows - fixed), { toSpec: r => desktopRow(ctx, r), colors: { thumb: pal.lineStrong, track: pal.line, note: pal.lo } })
  if (t.showSize) wantSizes(host, unsized(t, win.rows))
  const chip = s.latest ? activityChip(ui, s.latest, { unicode: true, colorOf: tone => pal.roles[roleOfTone(tone)].fg }) : null
  // The full body width, so the cards end where the tree's right column does; with no width set,
  // a narrower slot than the columns promise shrinks the drawing instead of cutting it.
  const svg = (d: { source: string; alt: string }) => <Svg source={d.source} alt={d.alt} />
  const find = { onInput: (v: string) => void search(host, v), onSubmit: (v: string) => void jump(host, v) }
  const rows = { rows: win.specs, active: t.cursor, activeBg: pal.line, hoverBg: pal.inset, tones: shimmerTones(pal, look.isLight), pointer: mem.pointer, ...(win.bar ? { bar: win.bar } : {}) } satisfies RowsProps
  return (
    <Box flexDirection="column" gap={1} minHeight={Math.max(1, room.bodyRows)}>
      {svg(hero)}
      {drawToolbar(ui, { t, act: actionsOf(host, t), search: find })}
      {touched ? svg(touched) : null}
      <Box flexDirection="column">
        {svg(section)}
        <Client key="rows" module="./rows.tsx" props={rows} />
      </Box>
      <Box flexGrow={1} />
      {footer(ui, s, chip) ?? <Box height={1} />}
    </Box>
  )
}
