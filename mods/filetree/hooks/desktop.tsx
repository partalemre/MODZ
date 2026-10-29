import type { ElementTable } from 'claude-code'

import type { FileTree } from '../types'
import { actionsOf } from './actions'
import { type CostRow, type Drawn, type GitRow, heroCard, type LegendItem, sectionLine, touchedCard } from './cards'
import { activityChip, footer } from './chrome'
import { costText, turnCost } from './costtext'
import type { Host } from './host'
import { paneMotion } from './kit/moving'
import { heroOf, touchedRows } from './now'
import type { RowsProps } from './rows'
import { desktopRow } from './rowspec'
import { heroInput, type Room, rowCtx, type Scene, treeWindow } from './scene'
import { jump, search } from './search'
import { mem } from './session'
import { unsized, wantSizes } from './sizes'
import { paletteOf, roleOfTone, shimmerTones } from './theme'
import { drawToolbar } from './toolbar'
import { words } from './words'

type Ui = ElementTable<'desktop'>

// A desktop pane reports about 9 px a column (a 365 px body reads 40), wider than the reply column.
const PX_PER_COL = 9
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

// Shown once the session has read: this turn's count, and the session's when earlier turns read too.
function costRowOf(s: Scene): CostRow | null {
  const total = s.readTotal
  if (!total || total.reads === 0) return null
  const turn = turnCost(s.turn)
  return { turn: turn ? costText(turn) : null, session: total.reads > (turn?.reads ?? 0) ? costText(total) : null }
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

// The pane's drawings on the desktop (kit/moving.ts): reset as the pane opens, so they cascade in each time.
export const motion = paneMotion()

// Opens the pane anew: its drawings cascade in again.
export function opening<T>(open: () => T): T {
  motion.reset()

  return open()
}

// The drawings above the tree, drawn at the pane's width. Each one's `shows` leaves out what reads put into
// context: that count climbs with every read, so it redraws the card without the sweep a real change gets.
function cardsOf(s: Scene, w: number) {
  const { t, look } = s
  const input = heroInput(s)
  const git = gitRowOf(t)
  const cost = costRowOf(s)
  const hero = heroOf(input)
  const legend = legendOf(s, git)
  const touchedList = touchedRows(input)
  const section = sectionLine({ left: words().allFiles, right: (t.top ? t.top : t.root).split('/').pop() ?? '' }, { look, w })
  return {
    hero: { drawn: heroCard(hero, { git, cost, legend }, { look, w }), shows: { hero, git, legend, isCounted: Boolean(cost?.turn), isSummed: Boolean(cost?.session), look, w } },
    touched: touchedList.length ? { drawn: touchedCard(touchedList, look, w), shows: { rows: touchedList.map(({ cost: c, ...row }) => ({ ...row, isCounted: c !== undefined })), look, w } } : null,
    section: { drawn: section },
  }
}

export function drawDesktop(host: Host, ui: Ui, frame: { s: Scene; room: Room; home: JSX.Element | null }) {
  const { Box, Client, Svg } = ui
  const { s, room, home } = frame
  const { t, look } = s
  const pal = paletteOf(look.isLight)
  const { hero, touched, section } = cardsOf(s, Math.max(MIN_SVG_W, Math.min(MAX_SVG_W, room.width * PX_PER_COL)))
  const lines = (px: number) => Math.ceil(px / ROW_PX) + 1
  const toolRows = t.showTools ? TOOLBAR_OPEN_ROWS : TOOLBAR_ROWS
  const fixed = lines(hero.drawn.height) + (touched ? lines(touched.drawn.height) : 0) + lines(section.drawn.height) + toolRows + FOOTER_ROWS
  const ctx = rowCtx(s, room.width - 1, true)
  const win = treeWindow(s, Math.max(MIN_BODY, room.bodyRows - fixed), { toSpec: r => desktopRow(ctx, r), colors: { thumb: pal.lineStrong, track: pal.line, note: pal.lo } })
  if (t.showSize) wantSizes(host, unsized(t, win.rows))
  const chip = s.latest ? activityChip(ui, s.latest, { unicode: true, colorOf: tone => pal.roles[roleOfTone(tone)].fg }) : null
  // The full body width, so the cards end where the tree's right column does. A frame needs its box, so the
  // drawing's size goes with it; a narrower slot than the columns promise caps the frame's width, and the
  // drawing's viewBox scales it down inside instead of cutting it.
  const svg = (key: string, card: { drawn: Drawn; shows?: unknown }) => <Svg key={key} {...motion.pic(key, card.drawn, { shows: card.shows })} />
  const find = { onInput: (v: string) => void search(host, v), onSubmit: (v: string) => void jump(host, v) }
  const rows = { rows: win.specs, active: t.cursor, activeBg: pal.line, hoverBg: pal.inset, tones: shimmerTones(pal, look.isLight), pointer: mem.pointer, ...(win.bar ? { bar: win.bar } : {}) } satisfies RowsProps
  return (
    <Box flexDirection="column" gap={1} minHeight={Math.max(1, room.bodyRows)}>
      {home}
      {svg('ft-hero', hero)}
      {drawToolbar(ui, { t, act: actionsOf(host, t), search: find })}
      {touched ? svg('ft-touched', touched) : null}
      <Box flexDirection="column">
        {svg('ft-section', section)}
        <Client key="rows" module="./rows.tsx" props={rows} />
      </Box>
      <Box flexGrow={1} />
      {footer(ui, s, chip) ?? <Box height={1} />}
    </Box>
  )
}
