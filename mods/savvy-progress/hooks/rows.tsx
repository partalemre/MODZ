import type { ThemeKey } from 'claude-code'

import type { AgentRun, LimitTrack } from '../types'
import { HEAD_H, cardHeadSvg } from './card-svg'
import type { CardHead, Pill } from './card-svg'
import { detailTree } from './detail'
import { agentProgress } from './estimate'
import type { Progress } from './estimate'
import type { Planned } from './flow'
import { clip, fitText, fmtCost, textWidth } from './format'
import { t } from './i18n'
import { lookOf } from './identity'
import { stuckOf } from './insight'
import type { Stuck } from './insight'
import { progressLabel } from './metrics'
import { BAR_H, progressBarSvg } from './metrics-svg'
import { PressCover } from './kit/press'
import { picture } from './pane-motion'
import { CARD_CRAB, CRAB, activityOf, cardCrabSvg, clockOf, crabSvg, modelLine, plannedLine } from './pane-svg'
import { costumeOf, plannedTierOf, tierWordOf } from './tiers'

// One agent as a row. The desktop draws who it is and its task as the row's head beside its crab, the bar
// under them and one native line of what it does now; the whole row is the press that opens it (a plain
// button spread over it, kit/press.tsx), its head drawing the chevron and the hover wash. No frame: the rows
// rest on spacing. The terminal keeps native text, its title the button that opens it. Either way the button
// is a real one: the focus ring and Enter reach it.

export type Ui = Record<string, any>

export type RowContext = {
  at: number
  isDesktop: boolean
  /** Room inside a card's frame: px on the desktop, cells on the terminal. */
  inner: number
  limit: LimitTrack | null
  selected?: string
  /** The agent whose task text is shown whole. */
  briefOpen?: string
  onToggle: (id: string) => void
  onBrief: (id: string) => void
  onSend: (id: string, text: string) => void
  onStop: (id: string) => void
}

// A card's frame (the new-task form's): two cells of padding and a border on each side (DESIGN.md §4).
export const FRAME_PX = 34
export const FRAME_COLS = 4
// The gap between the row's parts.
const GAP_PX = 8
// Narrower than this beside the meta, the now line takes a row of its own rather than shrink to "ba…".
const LINE_MIN_PX = 120
const TERM_BAR_MAX = 24
// Room the percent and the cost beside the bar take on the terminal: "~%100" and "≈$12.34".
const PCT_COLS = 6
const COST_COLS = 8
const ANSWER_LINE = 120
// The desktop's body text, for cutting a native line to its room.
const BODY_PX = 14

const GLYPH: Record<string, string> = { running: '●', done: '✓', failed: '✗' }
// Claude's accent while running, quiet once done, red after a failure (DESIGN.md §0), as the bar beside it.
const STATUS_KEY: Record<string, ThemeKey> = { running: 'claude', done: 'subtle', failed: 'error' }

const statusWord = (a: AgentRun): string => {
  const s = t()
  if (a.status === 'running') return s.isRunning
  if (a.status === 'done') return s.isFinished
  return a.endReason === 'aborted' ? s.aborted : s.failed
}

// A quiet agent's pill turns Amber and says why; one pill, one emphasis.
const pillOf = (a: AgentRun, stuck: Stuck | null): Pill => {
  if (stuck) return { text: stuck.reason, role: 'warn' }
  if (a.status === 'running') return { text: statusWord(a), role: 'run' }
  if (a.status === 'done') return { text: statusWord(a), role: 'ok' }
  return { text: statusWord(a), role: a.endReason === 'aborted' ? 'warn' : 'danger' }
}

const headOf = (a: AgentRun, stuck: Stuck | null): CardHead => ({
  name: lookOf(a).name,
  tierWord: tierWordOf(a),
  model: modelLine(a),
  title: a.description || a.type,
  pill: pillOf(a, stuck),
})

// What it does now while it runs; once done, the first line of its answer (the open card shows
// it whole); after a failure, the call it was on, since the pill already says how it ended.
const nowLine = (a: AgentRun, isOpen: boolean): string => {
  const answer = a.status === 'done' && !isOpen ? a.answer?.split('\n').find(line => line.trim()) : undefined
  if (answer) return clip(answer.trim(), ANSWER_LINE)
  if (a.status === 'failed' && a.lastTool) return `› ${a.lastTool}${a.lastTarget ? ' ' + a.lastTarget : ''}`
  return activityOf(a)
}

// A failed run's bar ends in a cross, not in a percent that would read as "done"; a guess made
// before its first tool call would be no more than the starting sliver, so it says nothing yet.
const barLabel = (a: AgentRun, progress: Progress): string => {
  if (a.status === 'failed') return '✗'
  return progress.isEstimate && !a.toolCount ? '' : progressLabel(progress)
}

// An estimate fills with a lighter rule, so it never reads as a measured one.
const termBar = (p: Progress, width: number): string => {
  const filled = Math.round(width * p.value)
  return (p.isEstimate ? '╍' : '━').repeat(filled) + '─'.repeat(Math.max(0, width - filled))
}

function termBarTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Text } = ui
  const progress = agentProgress(a)
  const width = Math.max(6, Math.min(TERM_BAR_MAX, ctx.inner - PCT_COLS - COST_COLS))
  const key = STATUS_KEY[a.status] ?? 'claude'
  return (
    <Box flexDirection="row" columnGap={1}>
      <Text color={key} dimColor={progress.isEstimate}>{termBar(progress, width)}</Text>
      <Text bold color={key}>{barLabel(a, progress)}</Text>
      <Text>{`≈${fmtCost(a.costUsd)}`}</Text>
    </Box>
  )
}

function termStatus(ui: Ui, a: AgentRun, stuck: Stuck | null) {
  const { Text } = ui
  if (stuck) return <Text color="warning">{`! ${stuck.reason}`}</Text>
  return <Text color={STATUS_KEY[a.status] ?? 'subtle'}>{`${GLYPH[a.status] ?? '●'} ${statusWord(a)}`}</Text>
}

// Name and status first, then the bar with its percent and ≈$; the crab's name, tier, model and
// clock stay one quiet line, and what it is doing now only while it runs or after it failed.
function termSummary(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Text, Button } = ui
  const isOpen = ctx.selected === a.id
  return (
    <Box flexDirection="column" flexGrow={1} flexShrink={1}>
      <Box flexDirection="row" justifyContent="space-between" columnGap={1}>
        <Button key={`open-${a.id}`} plain label={`${isOpen ? '▾' : '▸'} ${a.description || a.type}`} hover={{ color: 'claude' }} onPress={() => ctx.onToggle(a.id)} />
        {termStatus(ui, a, stuckOf(a, ctx.at))}
      </Box>
      {termBarTree(ui, a, ctx)}
      <Box flexDirection="row" justifyContent="space-between" columnGap={1}>
        <Text wrap="truncate-end">
          <Text bold>{lookOf(a).name}</Text>
          <Text dimColor>{` · ${tierWordOf(a)}`}</Text>
          <Text dimColor>{` · ${[modelLine(a), t().tools(a.toolCount || 0)].filter(Boolean).join(' · ')}`}</Text>
        </Text>
        <Text dimColor>{clockOf(a, ctx.at)}</Text>
      </Box>
      {a.status !== 'done' && <Text wrap="truncate-end" dimColor={a.status !== 'running'}>{activityOf(a)}</Text>}
    </Box>
  )
}

function termCard(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box } = ui
  const isOpen = ctx.selected === a.id
  // Only the open card takes a frame on the terminal; the rest stay plain rows.
  const frame = isOpen ? { borderStyle: 'round', paddingX: 1 } : {}
  return (
    <Box key={a.id} flexDirection="column" {...frame}>
      {termSummary(ui, a, isOpen ? { ...ctx, inner: ctx.inner - FRAME_COLS } : ctx)}
      {isOpen && detailTree(ui, a, { ...ctx, inner: ctx.inner - FRAME_COLS })}
    </Box>
  )
}

// The head answers the pointer and says, in its alt, what pressing the row does; opening the row changes only
// that alt, so the drawing keeps its frame.
function deskHead(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box } = ui
  const look = lookOf(a)
  const stuck = stuckOf(a, ctx.at)
  const isOpen = ctx.selected === a.id
  const head = headOf(a, stuck)
  const headW = ctx.inner - CARD_CRAB.w - GAP_PX
  // A stuck crab stands still: the calm row says it before the pill does.
  const crab = cardCrabSvg({ costume: costumeOf(a), look, isWalking: a.status === 'running' && !stuck })
  const alt = `${head.title}: ${head.name} · ${head.tierWord} · ${head.model} · ${head.pill.text} (${isOpen ? t().hide : t().details})`
  return (
    <Box flexDirection="row" alignItems="center" columnGap={1}>
      {picture(ui, { key: 'crab', at: `crab-${a.id}`, pic: { source: crab, alt: `${look.name}, ${tierWordOf(a)}`, width: CARD_CRAB.w, height: CARD_CRAB.h } })}
      {picture(ui, { key: 'head', at: `head-${a.id}`, pic: { source: cardHeadSvg(headW, head), alt, width: headW, height: HEAD_H }, opts: { isRow: true } })}
    </Box>
  )
}

// The now line and the meta in one row; the line gives way. A row too narrow for a readable line sets it above
// the meta instead.
function deskFoot(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Text } = ui
  const isOpen = ctx.selected === a.id
  const meta = `${t().tools(a.toolCount || 0)} · ${clockOf(a, ctx.at)} · ≈${fmtCost(a.costUsd)}`
  const room = ctx.inner - textWidth(meta, BODY_PX) - GAP_PX * 2
  const isStacked = room < LINE_MIN_PX
  const line = (
    <Box flexShrink={1} flexGrow={1}>
      <Text wrap="truncate-end" dimColor={a.status !== 'running'}>{fitText(nowLine(a, isOpen), BODY_PX, isStacked ? ctx.inner : room)}</Text>
    </Box>
  )
  const tail = <Box key="meta" flexShrink={0}><Text dimColor>{meta}</Text></Box>
  if (isStacked) {
    return (
      <Box flexDirection="column">
        {line}
        <Box flexDirection="row" justifyContent="flex-end" alignItems="center" columnGap={1}>{tail}</Box>
      </Box>
    )
  }
  return (
    <Box flexDirection="row" justifyContent="space-between" alignItems="center" columnGap={1}>
      {line}
      {tail}
    </Box>
  )
}

// The bar fills with the work; only its run ending, or a measure taking over from the estimate, marks a change.
function deskBar(ui: Ui, a: AgentRun, ctx: RowContext) {
  const progress = agentProgress(a)
  const label = barLabel(a, progress)
  const pic = { source: progressBarSvg(ctx.inner, a, { progress, label }), alt: label || t().starting, width: ctx.inner, height: BAR_H }
  return picture(ui, { key: 'bar', at: `bar-${a.id}`, pic, opts: { shows: { status: a.status, isEstimate: progress.isEstimate } } })
}

// Taller than any row, so the cover's stack of buttons reaches its foot; the cover clips the rest.
const ROW_COVER_PX = 160

// The row (head, bar, now line) is one press that opens or closes it; what opens sits under it, outside the press,
// since it holds its own field and buttons.
function deskCard(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box } = ui
  const isOpen = ctx.selected === a.id
  return (
    <Box key={a.id} flexDirection="column">
      <Box key="row" flexDirection="column" alignSelf="flex-start">
        {deskHead(ui, a, ctx)}
        {deskBar(ui, a, ctx)}
        {deskFoot(ui, a, ctx)}
        {PressCover(ui, { key: `open-${a.id}`, width: ctx.inner, height: ROW_COVER_PX, onPress: () => ctx.onToggle(a.id) })}
      </Box>
      {isOpen && detailTree(ui, a, ctx)}
    </Box>
  )
}

export const agentRow = (ui: Ui, a: AgentRun, ctx: RowContext) => (ctx.isDesktop ? deskCard(ui, a, ctx) : termCard(ui, a, ctx))

export function plannedRow(ui: Ui, p: Planned, ctx: Pick<RowContext, 'isDesktop'>) {
  const { Box, Text } = ui
  const tier = plannedTierOf(p.tier)
  const crab = { source: crabSvg({ costume: tier, isDim: true }), alt: tier, width: CRAB.w, height: CRAB.h }
  return (
    <Box key={`plan-${p.n}`} flexDirection="row" columnGap={1} alignItems="center">
      {ctx.isDesktop ? picture(ui, { key: 'crab', at: `plan-crab-${p.n}`, pic: crab }) : <Text dimColor>○</Text>}
      <Box flexDirection="column" flexGrow={1}>
        <Text dimColor wrap="truncate-end">{`${p.n}. ${p.title}`}</Text>
        <Text wrap="truncate-end">
          <Text dimColor>{[tier, plannedLine(p)].filter(Boolean).join(' · ')}</Text>
        </Text>
      </Box>
    </Box>
  )
}
