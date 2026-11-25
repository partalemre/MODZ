import type { Panel } from '../types'
import { listedChats } from './chats'
import { crewTree, quietTree, waitingTree } from './chats-tree'
import { draftTree } from './dispatch'
import { t } from './i18n'
import type { PaneData } from './pane-data'
import { FRAME_COLS, FRAME_PX, agentRow, plannedRow } from './rows'
import type { RowContext, Ui } from './rows'
import { attentionTree, compactTree, emptyTree, headTree, sectionHead, timelineTree, toolbarTree } from './sections'
import type { Layout, PaneView } from './sections'

// The Agents page as a pure drawing: the header card, the toolbar ("Yeni görev", Daralt), the attention line, the
// form while it is open, the timeline, then the running, finished and planned agents as rows, with the other chats.
// This mod's own pane draws it (pane.tsx), and so does the MODZ hub in its one pane (modz/hooks/pages/agents.tsx):
// no `$` and no state ref here.

const MIN_W = 240
const MAX_W = 900
// A desktop pane reports about 9 px a column (kit `PANE_PX_PER_CELL`).
const PX_PER_COL = 9

// The rows drawn at most: a long crew costs a line saying how many more, never a pane too heavy to draw.
const ROWS_MAX = 12

/** Finished agents fold away while others run and open once all are done; the person's own press wins either way. */
export const isDoneOpenIn = (shown: Panel, d: PaneData): boolean => shown.isDoneOpen ?? d.running.length === 0

function listTree(ui: Ui, view: PaneView) {
  const { Box, Text } = ui
  const { d, layout, on } = view
  const s = t()
  // The desktop's rows have no frame: they take the pane's whole width.
  const ctx: RowContext = { ...on, at: d.at, isDesktop: layout.isDesktop, inner: layout.isDesktop ? layout.W : layout.inner, limit: d.limit, selected: d.panel.selected, briefOpen: d.panel.briefOpen, logOpen: d.panel.logOpen }
  const isDoneOpen = isDoneOpenIn(d.panel, d)
  const running = d.running.slice(0, ROWS_MAX)
  const finished = isDoneOpen ? d.finished.slice(0, ROWS_MAX - running.length) : []
  const planned = d.planned.slice(0, ROWS_MAX - running.length - finished.length)
  const more = d.running.length + (isDoneOpen ? d.finished.length : 0) + d.planned.length - running.length - finished.length - planned.length
  return (
    <Box key="list" flexDirection="column" rowGap={1}>
      {d.running.length > 0 && sectionHead(ui, layout, { id: 'running', label: `${s.running} · ${d.running.length}` })}
      {running.map(a => agentRow(ui, a, ctx))}
      {d.finished.length > 0 && sectionHead(ui, layout, { id: 'finished', label: `${s.finished} · ${d.finished.length}`, toggle: { key: 'done', isOpen: isDoneOpen, onPress: on.onDone } })}
      {finished.map(a => agentRow(ui, a, ctx))}
      {d.planned.length > 0 && sectionHead(ui, layout, { id: 'planned', label: `${s.planned} · ${d.planned.length}` })}
      {planned.map(p => plannedRow(ui, p, ctx))}
      {more > 0 && <Text key="more" dimColor>{s.moreAgents(more)}</Text>}
    </Box>
  )
}

function paneTree(ui: Ui, view: PaneView) {
  const { Box } = ui
  const { d, layout, on } = view
  const isDrafting = d.panel.draft?.isOpen === true
  const form = isDrafting && draftTree(ui, { draft: d.panel.draft, types: d.types, layout }, on)
  if (d.list.length === 0 && d.planned.length === 0) {
    return <Box flexDirection="column" rowGap={2}>{isDrafting ? form : emptyTree(ui, view)}</Box>
  }
  return (
    <Box flexDirection="column" rowGap={1}>
      {headTree(ui, d, layout)}
      {toolbarTree(ui, d, on)}
      {attentionTree(ui, view)}
      {form}
      {d.panel.isCompact ? compactTree(ui, d, layout) : timelineTree(ui, view)}
      {!d.panel.isCompact && listTree(ui, view)}
    </Box>
  )
}

/** The whole page, below any way home. Who else on this machine waits on the person comes first; the quiet rest folds at the foot. */
export function agentsTree(ui: Ui, view: PaneView) {
  const { Box, Text } = ui
  const { d, layout, on } = view
  const listed = listedChats(d.chats)
  const quiet = quietTree(ui, { chats: listed.chats, layout, isOpen: d.panel.isChatsOpen === true, onToggle: on.onChats })
  return (
    <Box flexDirection="column" rowGap={1}>
      {waitingTree(ui, d.chats, layout)}
      {paneTree(ui, view)}
      {crewTree(ui, listed.chats, layout)}
      {quiet}
      {listed.more > 0 && <Text key="chats-more" dimColor>{t().chats.more(listed.more)}</Text>}
    </Box>
  )
}

/** The pane's room: the desktop in px (a card's inside less its frame), the terminal in cells. */
export const layoutOf = (isDesktop: boolean, columns: number): Layout => {
  if (!isDesktop) return { isDesktop, W: 0, inner: columns, cols: columns }
  const W = Math.max(MIN_W, Math.min(MAX_W, columns * PX_PER_COL))
  return { isDesktop, W, inner: W - FRAME_PX, cols: columns - FRAME_COLS }
}
