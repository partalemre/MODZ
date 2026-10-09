import type { ThemeKey } from 'claude-code'

import type { AgentRun, LimitTrack } from '../types'
import { detailTree } from './detail'
import { agentProgress } from './estimate'
import type { Progress } from './estimate'
import type { Planned } from './flow'
import { t } from './i18n'
import { fmtCost } from './format'
import { lookOf } from './identity'
import { progressLabel } from './metrics'
import { BAR_H, progressBarSvg } from './metrics-svg'
import { CARD_CRAB, CRAB, activityOf, cardCrabSvg, clockOf, crabSvg, modelLine, pillSvg, plannedLine } from './pane-svg'
import { costumeOf, keyOf, plannedTierOf, tierOf, tierWordOf } from './tiers'

// One agent as a card, the same on both surfaces: its name opens the detail beneath. The desktop
// adds the crab, the status pill and the bar as small drawings; the terminal keeps native text.

export type Ui = Record<string, any>

// `width` is the room beside the crab, in px on the desktop and in cells on the terminal;
// `detailWidth` is the open card's full inner width, desktop only.
export type RowContext = {
  at: number
  width: number
  detailWidth: number
  isDesktop: boolean
  limit: LimitTrack | null
  selected?: string
  onToggle: (id: string) => void
  onSend: (id: string, text: string) => void
  onStop: (id: string) => void
}

// The card's round frame: a cell of padding and a border on each side.
export const FRAME_PX = 18
export const FRAME_COLS = 4
const TERM_BAR_MAX = 24
// Room the percent and the cost beside the bar take on the terminal: "~%100" and "≈$12.34".
const PCT_COLS = 6
const COST_COLS = 8

const GLYPH: Record<string, string> = { running: '●', done: '✓', failed: '✗' }
// Iris running, Moss done, Flare failed (DESIGN.md §2), as the bar beside it.
const STATUS_KEY: Record<string, ThemeKey> = { running: 'permission', done: 'success', failed: 'error' }

const statusWord = (a: AgentRun): string => {
  const s = t()
  if (a.status === 'running') return s.isRunning
  if (a.status === 'done') return s.isFinished
  return a.endReason === 'aborted' ? s.aborted : s.failed
}

const pillRole = (a: AgentRun): 'run' | 'ok' | 'warn' | 'danger' => {
  if (a.status === 'running') return 'run'
  if (a.status === 'done') return 'ok'
  return a.endReason === 'aborted' ? 'warn' : 'danger'
}

// An estimate fills with a lighter rule, so it never reads as a measured one.
const termBar = (p: Progress, width: number): string => {
  const filled = Math.round(width * p.value)
  return (p.isEstimate ? '╍' : '━').repeat(filled) + '─'.repeat(Math.max(0, width - filled))
}

function statusTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Svg, Text } = ui
  if (ctx.isDesktop) {
    const pill = pillSvg(statusWord(a), pillRole(a), a.status === 'running')
    return <Svg key="status" source={pill.source} alt={statusWord(a)} width={pill.width} height={pill.height} />
  }
  return <Text color={STATUS_KEY[a.status] ?? 'subtle'}>{`${GLYPH[a.status] ?? '●'} ${statusWord(a)}`}</Text>
}

// The bar and its percent: progress reads in one glance. The desktop draws both as one piece.
function barTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Svg, Text } = ui
  const progress = agentProgress(a)
  const label = progressLabel(progress)
  if (ctx.isDesktop) {
    return <Svg key="bar" source={progressBarSvg(ctx.width, a, { progress, label })} alt={label} width={ctx.width} height={BAR_H} />
  }
  const width = Math.max(6, Math.min(TERM_BAR_MAX, ctx.width - PCT_COLS - COST_COLS))
  const key = STATUS_KEY[a.status] ?? 'permission'
  return (
    <Box flexDirection="row" columnGap={1}>
      <Text color={key} dimColor={progress.isEstimate}>{termBar(progress, width)}</Text>
      <Text bold color={key}>{label}</Text>
      <Text>{`≈${fmtCost(a.costUsd)}`}</Text>
    </Box>
  )
}

// Name and status first, then the bar with its percent; the agent's own name, tier, model and
// clock stay one quiet line, and what it is doing now only while it runs or after it failed.
function summaryTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Text, Button } = ui
  const isOpen = ctx.selected === a.id
  const tier = tierOf(a)
  const money = ctx.isDesktop ? ` · ≈${fmtCost(a.costUsd)}` : ''
  return (
    <Box flexDirection="column" flexGrow={1} flexShrink={1}>
      <Box flexDirection="row" justifyContent="space-between" alignItems="center" columnGap={1}>
        <Button key={`open-${a.id}`} plain label={`${isOpen ? '▾' : '▸'} ${a.description || a.type}`} onPress={() => ctx.onToggle(a.id)} />
        {statusTree(ui, a, ctx)}
      </Box>
      {barTree(ui, a, ctx)}
      <Box flexDirection="row" justifyContent="space-between" columnGap={1}>
        <Text wrap="truncate-end">
          <Text bold>{lookOf(a).name}</Text>
          <Text dimColor>{' · '}</Text>
          <Text color={keyOf(tier)}>{tierWordOf(a)}</Text>
          <Text dimColor>{` · ${modelLine(a)} · ${t().tools(a.toolCount || 0)}`}</Text>
        </Text>
        <Text dimColor>{`${clockOf(a, ctx.at)}${money}`}</Text>
      </Box>
      {a.status !== 'done' && <Text wrap="truncate-end" dimColor={a.status !== 'running'}>{activityOf(a)}</Text>}
    </Box>
  )
}

export function agentRow(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Svg } = ui
  const isOpen = ctx.selected === a.id
  const look = lookOf(a)
  const crab = ctx.isDesktop && (
    <Svg
      key="crab"
      source={cardCrabSvg({ costume: costumeOf(a), look, isWalking: a.status === 'running' })}
      alt={`${look.name}, ${tierWordOf(a)}`}
      width={CARD_CRAB.w}
      height={CARD_CRAB.h}
    />
  )
  // On the desktop every agent is a card; on the terminal only the open one takes a frame.
  const frame = ctx.isDesktop || isOpen ? { borderStyle: 'round', borderDimColor: !isOpen, paddingX: 1 } : {}
  const inner = isOpen && !ctx.isDesktop ? { ...ctx, width: ctx.width - FRAME_COLS } : ctx
  return (
    <Box key={a.id} flexDirection="column" {...frame}>
      <Box flexDirection="row" columnGap={1}>
        {crab}
        {summaryTree(ui, a, inner)}
      </Box>
      {isOpen && detailTree(ui, a, ctx)}
    </Box>
  )
}

export function plannedRow(ui: Ui, p: Planned, ctx: Pick<RowContext, 'isDesktop'>) {
  const { Box, Text, Svg } = ui
  const tier = plannedTierOf(p.tier)
  return (
    <Box key={`plan-${p.n}`} flexDirection="row" columnGap={1}>
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
