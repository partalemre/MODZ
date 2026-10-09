import type { ThemeKey } from 'claude-code'

import type { AgentRun, ToolEvent } from '../types'
import type { Planned } from './flow'
import { clip, fmtTime } from './format'
import { KIND_GLYPH, KIND_KEY, kindOf } from './history'
import { t } from './i18n'
import { BAR_H, CRAB, PULSE, activityOf, barSvg, clockOf, crabSvg, modelLine, plannedLine, progressOf, pulseSvg, usageOf } from './pane-svg'
import { colorOf, costumeOf, keyOf, plannedTierOf, tierOf, tierWordOf } from './tiers'

// One agent as native rows, the same on both surfaces: its name opens the work history beneath.
// The desktop adds the crab, the live bar and the pulse as small drawings beside the words.

export type Ui = Record<string, any>

// `width` is the room beside the crab, in px on the desktop and in cells on the terminal;
// `frameWidth` is what the open row's frame takes from it.
export type RowContext = { at: number; width: number; frameWidth: number; isDesktop: boolean; selected?: string; onToggle: (id: string) => void }

const HISTORY_SHOWN = 14
const BRIEF_SHOWN = 360
const ANSWER_SHOWN = 900
const TERM_BAR_MAX = 24
const SECOND = 1000
const MINUTE = 60 * SECOND
const LIVE_COLOR = '#B19CF3'
const INDENT = 2

const GLYPH: Record<string, string> = { running: '●', done: '✓', failed: '✗' }
const STATUS_KEY: Record<string, ThemeKey> = { running: 'suggestion', done: 'success', failed: 'error' }

const statusWord = (a: AgentRun): string => {
  const s = t()
  if (a.status === 'running') return s.isRunning
  if (a.status === 'done') return s.isFinished
  return a.endReason === 'aborted' ? s.aborted : s.failed
}

const termBar = (progress: number | null, width: number): string => {
  if (progress === null) return '┈'.repeat(width)
  const filled = Math.round(width * progress)
  return '━'.repeat(filled) + '─'.repeat(Math.max(0, width - filled))
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
  const { Svg, Text } = ui
  const progress = progressOf(a)
  if (ctx.isDesktop) {
    const alt = progress === null ? statusWord(a) : t().pct(Math.round(progress * 100))
    return <Svg key="bar" source={barSvg(ctx.width, a, colorOf(tierOf(a)))} alt={alt} width={ctx.width} height={BAR_H} />
  }
  const width = Math.max(6, Math.min(TERM_BAR_MAX, ctx.width))
  return progress === null ? <Text dimColor>{termBar(null, width)}</Text> : <Text color={keyOf(tierOf(a))}>{termBar(progress, width)}</Text>
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
      <Box flexDirection="row" justifyContent="space-between" columnGap={1}>
        <Box flexShrink={1}>
          <Text wrap="truncate-end" dimColor={a.status !== 'running'}>{activityOf(a)}</Text>
        </Box>
        <Text dimColor>{usageOf(a)}</Text>
      </Box>
      {barTree(ui, a, ctx)}
    </Box>
  )
}

const durationOf = (e: ToolEvent): string => {
  if (e.endAt === undefined) return ''
  const ms = e.endAt - e.at
  if (ms < SECOND) return `${ms}ms`
  return ms < MINUTE ? `${(ms / SECOND).toFixed(1)}s` : fmtTime(ms)
}

// How a call came back: ✓ or ✗, … while its agent still runs, — when it never answered.
const outcomeOf = (e: ToolEvent, isLive: boolean): { glyph: string; key: ThemeKey } => {
  if (e.endAt !== undefined) return e.isError ? { glyph: '✗', key: 'error' } : { glyph: '✓', key: 'success' }
  return { glyph: isLive ? '…' : '—', key: 'subtle' }
}

function eventTree(ui: Ui, e: ToolEvent, ctx: RowContext & { start: number; isLive: boolean; index: number }) {
  const { Box, Text, Svg } = ui
  const kind = kindOf(e.tool)
  const outcome = outcomeOf(e, ctx.isLive)
  const end = e.endAt === undefined && ctx.isLive && ctx.isDesktop
    ? <Svg key="live" source={pulseSvg(LIVE_COLOR)} alt={t().isRunning} width={PULSE} height={PULSE} />
    : <Text color={outcome.key}>{outcome.glyph}</Text>
  return (
    <Box key={`ev-${ctx.index}`} flexDirection="row" alignItems="center" columnGap={1}>
      <Text dimColor>{`+${fmtTime(e.at - ctx.start)}`}</Text>
      <Text color={KIND_KEY[kind]}>{KIND_GLYPH[kind]}</Text>
      <Box flexGrow={1} flexShrink={1}>
        <Text wrap="truncate-end">
          <Text bold>{e.tool}</Text>
          {e.target ? <Text dimColor>{` ${e.target}`}</Text> : null}
        </Text>
      </Box>
      <Text dimColor>{durationOf(e)}</Text>
      {end}
    </Box>
  )
}

function historyTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Text } = ui
  const s = t()
  const list = a.history ?? []
  const shown = list.slice(-HISTORY_SHOWN)
  const hidden = list.length - shown.length
  const isLive = a.status === 'running'
  return (
    <Box flexDirection="column">
      <Text bold>{`${s.history} · ${s.tools(list.length)}`}</Text>
      {list.length === 0 && <Text dimColor>{s.noCalls}</Text>}
      {hidden > 0 && <Text dimColor>{s.earlier(hidden)}</Text>}
      {shown.map((e, i) => eventTree(ui, e, { ...ctx, start: a.startedAt, isLive, index: hidden + i }))}
    </Box>
  )
}

function noteTree(ui: Ui, title: string, body: string | undefined) {
  const { Box, Text } = ui
  if (!body) return null
  return (
    <Box flexDirection="column">
      <Text bold>{title}</Text>
      <Text>{body}</Text>
    </Box>
  )
}

function detailTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box } = ui
  const s = t()
  return (
    <Box key={`detail-${a.id}`} flexDirection="column" rowGap={1} marginTop={1} paddingLeft={INDENT}>
      {noteTree(ui, s.brief, a.brief && clip(a.brief, BRIEF_SHOWN))}
      {historyTree(ui, a, ctx)}
      {noteTree(ui, s.result, a.answer && clip(a.answer, ANSWER_SHOWN))}
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
