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
import { CARD_CRAB, CRAB, activityOf, cardCrabSvg, clockOf, crabSvg, modelLine, plannedLine } from './pane-svg'
import { costumeOf, keyOf, plannedTierOf, tierOf, tierWordOf } from './tiers'

// One agent as a card. The desktop draws who it is and its task as the card's head beside its
// crab, the bar under them and one native line of what it does now, ended by a "Detay" button that
// lights while the pointer is anywhere on the card. The terminal keeps native text, its title the
// button that opens it. Either way the button is a real one: the focus ring and Enter reach it.

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

// The desktop card's frame: two cells of padding and a border on each side (DESIGN.md §4).
export const CARD_PAD_X = 2
export const FRAME_PX = 34
export const FRAME_COLS = 4
// The gap between the card's parts, and a native button's padding around its label.
const GAP_PX = 8
// Narrower than this beside the meta, the now line takes a row of its own rather than shrink to "ba…".
const LINE_MIN_PX = 120
const BUTTON_PAD_PX = 28
const TERM_BAR_MAX = 24
// Room the percent and the cost beside the bar take on the terminal: "~%100" and "≈$12.34".
const PCT_COLS = 6
const COST_COLS = 8
const ANSWER_LINE = 120
// The desktop's body text, for cutting a native line to its room.
const BODY_PX = 14

const GLYPH: Record<string, string> = { running: '●', done: '✓', failed: '✗' }
// Iris running, Moss done, Flare failed (DESIGN.md §2), as the bar beside it.
const STATUS_KEY: Record<string, ThemeKey> = { running: 'permission', done: 'success', failed: 'error' }

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
  tier: tierOf(a),
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
  const key = STATUS_KEY[a.status] ?? 'permission'
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
        <Button key={`open-${a.id}`} plain label={`${isOpen ? '▾' : '▸'} ${a.description || a.type}`} hover={{ color: 'permission' }} onPress={() => ctx.onToggle(a.id)} />
        {termStatus(ui, a, stuckOf(a, ctx.at))}
      </Box>
      {termBarTree(ui, a, ctx)}
      <Box flexDirection="row" justifyContent="space-between" columnGap={1}>
        <Text wrap="truncate-end">
          <Text bold>{lookOf(a).name}</Text>
          <Text dimColor>{' · '}</Text>
          <Text color={keyOf(tierOf(a))}>{tierWordOf(a)}</Text>
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

function deskHead(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Svg } = ui
  const look = lookOf(a)
  const stuck = stuckOf(a, ctx.at)
  const head = headOf(a, stuck)
  const headW = ctx.inner - CARD_CRAB.w - GAP_PX
  // A stuck crab stands still: the calm card says it before the pill does.
  const crab = cardCrabSvg({ costume: costumeOf(a), look, isWalking: a.status === 'running' && !stuck })
  return (
    <Box flexDirection="row" alignItems="center" columnGap={1}>
      <Svg key="crab" source={crab} alt={`${look.name}, ${tierWordOf(a)}`} width={CARD_CRAB.w} height={CARD_CRAB.h} />
      <Svg key="head" source={cardHeadSvg(headW, head)} alt={`${head.title}: ${head.name} · ${head.tierWord} · ${head.model} · ${head.pill.text}`} width={headW} height={HEAD_H} />
    </Box>
  )
}

/** The card's disclosure: "Detay ▾" opens it, "Gizle ▴" closes it. */
export const toggleLabel = (isOpen: boolean): string => (isOpen ? `${t().hide} ▴` : `${t().details} ▾`)

// The now line, the meta and the disclosure in one row; the line gives way, never the button. A
// card too narrow for a readable line sets it above the meta instead.
function deskFoot(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Button, Text } = ui
  const isOpen = ctx.selected === a.id
  const meta = `${t().tools(a.toolCount || 0)} · ${clockOf(a, ctx.at)} · ≈${fmtCost(a.costUsd)}`
  const toggle = toggleLabel(isOpen)
  const room = ctx.inner - textWidth(meta, BODY_PX) - textWidth(toggle, BODY_PX) - BUTTON_PAD_PX - GAP_PX * 2
  const isStacked = room < LINE_MIN_PX
  const line = (
    <Box flexShrink={1} flexGrow={1}>
      <Text wrap="truncate-end" dimColor={a.status !== 'running'}>{fitText(nowLine(a, isOpen), BODY_PX, isStacked ? ctx.inner : room)}</Text>
    </Box>
  )
  const tail = [
    <Box key="meta" flexShrink={0}><Text dimColor>{meta}</Text></Box>,
    <Button key={`open-${a.id}`} plain dimColor={!isOpen} label={toggle} hover={{ color: 'permission' }} onPress={() => ctx.onToggle(a.id)} />,
  ]
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

function deskCard(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Svg } = ui
  const isOpen = ctx.selected === a.id
  const progress = agentProgress(a)
  const label = barLabel(a, progress)
  // Keyed, so the pointer anywhere on the card lights its edge and its "Detay" button.
  return (
    <Box key={a.id} flexDirection="column" borderStyle="round" borderDimColor={!isOpen} hover={{ borderDimColor: false }} paddingX={CARD_PAD_X} paddingY={1}>
      {deskHead(ui, a, ctx)}
      <Svg key="bar" source={progressBarSvg(ctx.inner, a, { progress, label })} alt={label || t().starting} width={ctx.inner} height={BAR_H} />
      {deskFoot(ui, a, ctx)}
      {isOpen && detailTree(ui, a, ctx)}
    </Box>
  )
}

export const agentRow = (ui: Ui, a: AgentRun, ctx: RowContext) => (ctx.isDesktop ? deskCard(ui, a, ctx) : termCard(ui, a, ctx))

export function plannedRow(ui: Ui, p: Planned, ctx: Pick<RowContext, 'isDesktop'>) {
  const { Box, Text, Svg } = ui
  const tier = plannedTierOf(p.tier)
  return (
    <Box key={`plan-${p.n}`} flexDirection="row" columnGap={1} alignItems="center">
      {ctx.isDesktop ? <Svg key="crab" source={crabSvg({ costume: tier, isDim: true })} alt={tier} width={CRAB.w} height={CRAB.h} /> : <Text dimColor>○</Text>}
      <Box flexDirection="column" flexGrow={1}>
        <Text dimColor wrap="truncate-end">{`${p.n}. ${p.title}`}</Text>
        <Text wrap="truncate-end">
          <Text color={keyOf(tier)}>{tier}</Text>
          <Text dimColor>{` · ${plannedLine(p)}`}</Text>
        </Text>
      </Box>
    </Box>
  )
}
