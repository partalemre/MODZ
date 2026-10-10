import type { ThemeKey } from 'claude-code'

import type { AgentRun } from '../types'
import { NOTICE_H, SECTION_SVG_H, noticeSvg, sectionSvg } from './card-svg'
import type { SectionHead } from './card-svg'
import { headerSvg } from './header-svg'
import { KIND_KEY } from './history'
import { t } from './i18n'
import { lookAt, lookOf } from './identity'
import { stuckOf } from './insight'
import { COMPACT_H, HERO_CRAB, compactSvg, heroCrabSvg } from './pane-svg'
import { headerOf, summaryOf, totalsLineOf } from './pane-data'
import type { PaneData } from './pane-data'
import type { Ui } from './rows'
import { laneCells, runsOf, timelineOf } from './timeline'
import type { Run, Timeline } from './timeline'
import { timelineSvg } from './timeline-svg'
import { colorOf, costumeOf, keyOf, plannedTierOf, tierOf } from './tiers'

// The panel's parts around the cards: the header card, the toolbar under it, the attention line,
// the section heads, the timeline, the compact strip and the empty state. Each draws on both
// surfaces: a drawing on the desktop, native text on the terminal.

/** The pane's room: px across on the desktop (`W`, and `inner` inside a card), cells on the terminal. */
export type Layout = { isDesktop: boolean; W: number; inner: number; cols: number }

export type PaneHandlers = {
  onToggle: (id: string) => void
  /** Opens one agent's card (never closes it). */
  onLook: (id: string) => void
  /** Shows one agent's task text whole, or cut short again. */
  onBrief: (id: string) => void
  onSend: (id: string, text: string) => void
  onStop: (id: string) => void
  onCompact: () => void
  onDone: () => void
  onTimeline: () => void
  onNewTask: () => void
  onCancelTask: () => void
  onPickType: (name: string) => void
  onStartTask: (text: string) => void
}

/** What a part of the panel draws from: the data, the room and the handlers, in one. */
export type PaneView = { d: PaneData; layout: Layout; on: PaneHandlers }

// The button beside a drawn section head: its room in px, so the drawing leaves it.
const BUTTON_PX = 76
// The terminal timeline's name column and the clock after the lane.
const TERM_NAME = 6
const TERM_CLOCK = 2
const TIMELINE_MIN_AGENTS = 2

export function headTree(ui: Ui, d: PaneData, layout: Layout) {
  const { Box, Text, Svg } = ui
  const data = headerOf(d)
  const line = totalsLineOf(data)
  if (layout.isDesktop) {
    const head = headerSvg(layout.W, data)
    return <Svg key="head" source={head.source} alt={[data.headline, data.percent, data.counts, line].filter(Boolean).join(', ')} width={layout.W} height={head.height} />
  }
  return (
    <Box flexDirection="column">
      <Text wrap="truncate-end"><Text bold>{data.headline}</Text><Text bold dimColor={data.tone === 'idle'}>{`  ${data.percent}`}</Text></Text>
      {data.counts !== '' && <Text dimColor>{data.counts}</Text>}
      <Text dimColor>{line}</Text>
    </Box>
  )
}

/** "＋ Yeni görev" on the left, the compact toggle on the right. */
export function toolbarTree(ui: Ui, d: PaneData, on: PaneHandlers) {
  const { Box, Button } = ui
  const s = t()
  const isDrafting = d.panel.draft?.isOpen === true
  return (
    <Box key="toolbar" flexDirection="row" justifyContent="space-between" alignItems="center">
      <Button key="new-task" variant={isDrafting ? undefined : 'secondary'} label={`＋ ${s.newTask}`} onPress={on.onNewTask} />
      <Button key="compact" label={d.panel.isCompact ? s.expand : s.collapse} plain dimColor onPress={on.onCompact} />
    </Box>
  )
}

/** One agent that needs a look, under the header; "Bak" opens its card. */
export function attentionTree(ui: Ui, view: PaneView) {
  const { Box, Button, Svg, Text } = ui
  const { layout, on } = view
  const att = view.d.attention
  if (!att) return null
  const look = <Button key="look" plain label={t().look} onPress={() => on.onLook(att.agentId)} />
  if (!layout.isDesktop) {
    return (
      <Box key="attention" flexDirection="row" columnGap={1}>
        <Text color={att.role === 'warn' ? 'warning' : 'error'} wrap="truncate-end">{`! ${att.name} ${att.reason}`}<Text dimColor>{` · ${att.title}`}</Text></Text>
        {look}
      </Box>
    )
  }
  const width = layout.W - BUTTON_PX
  return (
    <Box key="attention" flexDirection="row" alignItems="center" columnGap={1}>
      <Svg key="notice" source={noticeSvg(width, att)} alt={`${att.name} ${att.reason}: ${att.title}`} width={width} height={NOTICE_H} />
      {look}
    </Box>
  )
}

export type Toggle = { key: string; isOpen: boolean; onPress: () => void }

/** A section's head: a drawn eyebrow on the desktop (its toggle at the right), a bold line or a ▸/▾ button on the terminal. */
export function sectionHead(ui: Ui, layout: Layout, head: SectionHead & { toggle?: Toggle }) {
  const { Box, Button, Svg, Text } = ui
  const s = t()
  const toggle = head.toggle
  if (!layout.isDesktop) {
    if (!toggle) return <Text key={`h-${head.label}`} bold>{head.label}</Text>
    return <Box key={`h-${toggle.key}`} flexDirection="row"><Button key={toggle.key} plain label={`${toggle.isOpen ? '▾' : '▸'} ${head.label}`} onPress={toggle.onPress} /></Box>
  }
  const width = toggle ? layout.W - BUTTON_PX : layout.W
  const svg = <Svg key="eyebrow" source={sectionSvg(width, head)} alt={head.label} width={width} height={SECTION_SVG_H} />
  if (!toggle) return <Box key={`h-${head.label}`} flexDirection="row">{svg}</Box>
  return (
    <Box key={`h-${toggle.key}`} flexDirection="row" alignItems="center" columnGap={1}>
      {svg}
      <Button key={toggle.key} plain dimColor label={toggle.isOpen ? s.hide : s.show} onPress={toggle.onPress} />
    </Box>
  )
}

const RUN_KEY: Record<string, ThemeKey | undefined> = { ...KIND_KEY, idle: undefined }
const RUN_GLYPH: Record<string, string> = { none: ' ', idle: '─' }

function termLane(ui: Ui, runs: Run[], label: { name: string; end: string; key: ThemeKey }) {
  const { Text } = ui
  return (
    <Text key={`lane-${label.name}`} wrap="truncate-end">
      <Text bold>{label.name.padEnd(TERM_NAME)}</Text>
      {runs.map((run, i) => (
        <Text key={`r${i}`} color={RUN_KEY[run.kind]} dimColor={run.kind === 'idle'}>{(RUN_GLYPH[run.kind] ?? '━').repeat(run.length)}</Text>
      ))}
      <Text color={label.key}>{` ${label.end}`}</Text>
    </Text>
  )
}

// How each lane ends: still running, done, failed, or gone quiet.
const END_GLYPH: Record<string, string> = { running: '●', done: '✓', failed: '✗', stuck: '!' }
const END_KEY: Record<string, ThemeKey> = { running: 'permission', done: 'success', failed: 'error', stuck: 'warning' }

function termTimeline(ui: Ui, tl: Timeline, layout: Layout) {
  const { Box } = ui
  const width = Math.max(TERM_NAME, layout.cols - TERM_NAME - TERM_CLOCK - 1)
  return (
    <Box key="timeline" flexDirection="column">
      {tl.lanes.map(lane => {
        const end = lane.isStuck ? 'stuck' : lane.status
        return termLane(ui, runsOf(laneCells(lane, tl, width)), { name: lane.name, end: END_GLYPH[end] ?? '●', key: END_KEY[end] ?? 'subtle' })
      })}
    </Box>
  )
}

/** The crew over time, once two or more agents share it; folds under its head. */
export function timelineTree(ui: Ui, view: PaneView) {
  const { Box, Svg } = ui
  const { d, layout, on } = view
  const tl = d.list.length >= TIMELINE_MIN_AGENTS ? timelineOf(d.list, d.at) : null
  if (!tl) return null
  const isOpen = d.panel.isTimelineHidden !== true
  const head = sectionHead(ui, layout, { label: t().timeline, dot: tl.isLive ? 'run' : 'idle', toggle: { key: 'timeline', isOpen, onPress: on.onTimeline } })
  const drawing = isOpen && layout.isDesktop ? timelineSvg(layout.W, tl) : null
  return (
    <Box key="timeline-section" flexDirection="column" rowGap={layout.isDesktop ? 1 : 0}>
      {head}
      {drawing && <Svg key="timeline" source={drawing.source} alt={drawing.alt} width={layout.W} height={drawing.height} />}
      {isOpen && !layout.isDesktop && termTimeline(ui, tl, layout)}
    </Box>
  )
}

const glyphKeyOf = (a: AgentRun): ThemeKey => {
  if (a.status === 'failed') return 'error'
  return a.status === 'done' ? 'success' : keyOf(tierOf(a))
}

const iconsOf = (d: PaneData) => [
  ...[...d.running, ...d.finished].map(a => ({ costume: costumeOf(a), look: lookOf(a), color: colorOf(tierOf(a)), isRunning: a.status === 'running' && !stuckOf(a, d.at), isDim: false })),
  ...d.planned.map((p, i) => ({ costume: plannedTierOf(p.tier), look: lookAt(i), color: colorOf(p.tier), isRunning: false, isDim: true })),
]

/** The whole crew as one strip of crabs (desktop) or glyphs (terminal). */
export function compactTree(ui: Ui, d: PaneData, layout: Layout) {
  const { Svg, Text } = ui
  if (layout.isDesktop) {
    return <Svg key="compact-icons" source={compactSvg(layout.W, iconsOf(d))} alt={`${d.list.length} ${t().agentsCount}, ${summaryOf(d.sum)}`} width={layout.W} height={COMPACT_H} />
  }
  const glyphs = [...d.running, ...d.finished].map(a => <Text key={a.id} color={glyphKeyOf(a)}>{`${a.status === 'done' ? '✓' : '●'} `}</Text>)
  return (
    <Text wrap="truncate-end">
      {glyphs}
      {d.planned.length ? <Text dimColor>{'○ '.repeat(d.planned.length)}</Text> : null}
    </Text>
  )
}

/** Nothing launched yet: a resting crab, an eyebrow, one sentence and one action (DESIGN.md §4). */
export function emptyTree(ui: Ui, layout: Layout, on: PaneHandlers) {
  const { Box, Button, Svg, Text } = ui
  const s = t()
  const crab = layout.isDesktop && <Svg key="crab" source={heroCrabSvg()} alt={lookAt(0).name} width={HERO_CRAB.w} height={HERO_CRAB.h} />
  return (
    <Box key="empty" flexDirection="row" columnGap={2} alignItems="center">
      {crab}
      <Box flexDirection="column" rowGap={1} flexShrink={1}>
        <Text bold color="permission">{`● ${s.emptyTitle.toLocaleUpperCase('tr')}`}</Text>
        <Text dimColor>{s.empty}</Text>
        <Box flexDirection="row"><Button key="new-task" variant="primary" label={`＋ ${s.newTask}`} onPress={on.onNewTask} /></Box>
      </Box>
    </Box>
  )
}
