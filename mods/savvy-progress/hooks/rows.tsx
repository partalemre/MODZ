import type { ThemeKey } from 'claude-code'

import type { AgentRun, LimitTrack } from '../types'
import { detailTree } from './detail'
import { agentProgress } from './estimate'
import type { Progress } from './estimate'
import type { Planned } from './flow'
import { t } from './i18n'
import { chipsOf, metricsLine, progressLabel } from './metrics'
import { BAR_H, CHIPS_H, chipsSvg, progressBarSvg } from './metrics-svg'
import { CRAB, PULSE, activityOf, clockOf, crabSvg, modelLine, plannedLine, pulseSvg } from './pane-svg'
import { colorOf, costumeOf, keyOf, plannedTierOf, tierOf, tierWordOf } from './tiers'

// One agent as native rows, the same on both surfaces: its name opens the detail beneath.
// The desktop adds the crab, the live bar, the metric chips and the pulse as small drawings.

export type Ui = Record<string, any>

// `width` is the room beside the crab, in px on the desktop and in cells on the terminal;
// `frameWidth` is what the open row's frame takes from it.
export type RowContext = {
  at: number
  width: number
  frameWidth: number
  isDesktop: boolean
  limit: LimitTrack | null
  selected?: string
  onToggle: (id: string) => void
}

const TERM_BAR_MAX = 24
// Room the percent beside the bar takes: "~%100" in px on the desktop, in cells on the terminal.
const PCT_PX = 46
const PCT_COLS = 6

const GLYPH: Record<string, string> = { running: '●', done: '✓', failed: '✗' }
const PCT_KEY: Record<string, ThemeKey> = { done: 'success', failed: 'error' }
const STATUS_KEY: Record<string, ThemeKey> = { running: 'suggestion', done: 'success', failed: 'error' }

const statusWord = (a: AgentRun): string => {
  const s = t()
  if (a.status === 'running') return s.isRunning
  if (a.status === 'done') return s.isFinished
  return a.endReason === 'aborted' ? s.aborted : s.failed
}

// An estimate fills with a lighter rule, so it never reads as a measured one.
const termBar = (p: Progress, width: number): string => {
  const filled = Math.round(width * p.value)
  return (p.isEstimate ? '╍' : '━').repeat(filled) + '─'.repeat(Math.max(0, width - filled))
}

function statusTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Text, Svg } = ui
  const key = STATUS_KEY[a.status] ?? 'subtle'
  const mark = ctx.isDesktop && a.status === 'running'
    ? <Svg key="pulse" source={pulseSvg(colorOf(tierOf(a)))} alt={statusWord(a)} width={PULSE} height={PULSE} />
    : <Text color={key}>{GLYPH[a.status] ?? '●'}</Text>
  return (
    <Box flexDirection="row" alignItems="center" columnGap={1}>
      {mark}
      <Text color={key}>{statusWord(a)}</Text>
    </Box>
  )
}

function barTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Svg, Text } = ui
  const progress = agentProgress(a)
  const label = progressLabel(progress)
  const tier = tierOf(a)
  const pct = <Text bold color={PCT_KEY[a.status] ?? keyOf(tier)}>{label}</Text>
  if (ctx.isDesktop) {
    const width = Math.max(PCT_PX, ctx.width - PCT_PX)
    const source = progressBarSvg(width, a, { progress, color: colorOf(tier) })
    return (
      <Box flexDirection="row" alignItems="center" columnGap={1}>
        <Svg key="bar" source={source} alt={label} width={width} height={BAR_H} />
        {pct}
      </Box>
    )
  }
  const width = Math.max(6, Math.min(TERM_BAR_MAX, ctx.width - PCT_COLS))
  return (
    <Box flexDirection="row" columnGap={1}>
      <Text color={keyOf(tier)} dimColor={progress.isEstimate}>{termBar(progress, width)}</Text>
      {pct}
    </Box>
  )
}

function metricsTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Svg, Text } = ui
  const line = metricsLine(a, ctx.limit)
  if (!ctx.isDesktop) return <Text dimColor wrap="truncate-end">{line}</Text>
  return <Svg key="chips" source={chipsSvg(ctx.width, chipsOf(a, ctx.limit))} alt={line} width={ctx.width} height={CHIPS_H} />
}

function summaryTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Text, Button } = ui
  const isOpen = ctx.selected === a.id
  const tier = tierOf(a)
  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box flexDirection="row" justifyContent="space-between" columnGap={1}>
        <Button key={`open-${a.id}`} plain label={`${isOpen ? '▾' : '▸'} ${a.description || a.type}`} onPress={() => ctx.onToggle(a.id)} />
        {statusTree(ui, a, ctx)}
      </Box>
      <Box flexDirection="row" justifyContent="space-between" columnGap={1}>
        <Text wrap="truncate-end">
          <Text color={keyOf(tier)}>{tierWordOf(a)}</Text>
          <Text dimColor>{` · ${modelLine(a)} · ${t().tools(a.toolCount || 0)}`}</Text>
        </Text>
        <Text dimColor>{clockOf(a, ctx.at)}</Text>
      </Box>
      <Text wrap="truncate-end" dimColor={a.status !== 'running'}>{activityOf(a)}</Text>
      <Box flexDirection="column" rowGap={ctx.isDesktop ? 1 : 0} marginTop={ctx.isDesktop ? 1 : 0}>
        {barTree(ui, a, ctx)}
        {metricsTree(ui, a, ctx)}
      </Box>
    </Box>
  )
}

export function agentRow(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Svg } = ui
  const isOpen = ctx.selected === a.id
  const crab = ctx.isDesktop && (
    <Svg key="crab" source={crabSvg({ costume: costumeOf(a), isWalking: a.status === 'running' })} alt={tierWordOf(a)} width={CRAB.w} height={CRAB.h} />
  )
  const frame = isOpen ? { borderStyle: 'round', borderColor: keyOf(tierOf(a)), paddingX: 1 } : {}
  const inner = isOpen ? { ...ctx, width: ctx.width - ctx.frameWidth } : ctx
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
