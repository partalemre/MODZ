import type { ThemeKey } from 'claude-code'

import type { AgentRun, ToolEvent } from '../types'
import { clip, fmtTime } from './format'
import { KIND_GLYPH, KIND_KEY, kindOf } from './history'
import type { Kind } from './history'
import { t } from './i18n'
import { chipsOf, metricsLine } from './metrics'
import { MIX_H, chipsSvg, mixSvg } from './metrics-svg'
import type { MixPart } from './metrics-svg'
import { PULSE, pulseSvg } from './pane-svg'
import type { RowContext, Ui } from './rows'

// The open row: what it used (context, tokens, ≈$, its 5h share), the task it was handed in a soft card, its work as a colored mix and a timed
// history, and its answer in a card that says how it went.

const HISTORY_SHOWN = 14
const BRIEF_SHOWN = 360
const ANSWER_SHOWN = 900
const SECOND = 1000
const MINUTE = 60 * SECOND
const LIVE_COLOR = '#B19CF3'
const INDENT = 2
const KIND_ORDER: Kind[] = ['read', 'edit', 'run', 'agent', 'other']

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

type EventContext = RowContext & { start: number; isLive: boolean; index: number }

function eventTree(ui: Ui, e: ToolEvent, ctx: EventContext) {
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

export const mixOf = (history: ToolEvent[]): MixPart[] =>
  KIND_ORDER.map(kind => ({ kind, count: history.filter(e => kindOf(e.tool) === kind).length })).filter(p => p.count > 0)

function mixTree(ui: Ui, parts: MixPart[], ctx: RowContext) {
  const { Box, Text, Svg } = ui
  if (!parts.length) return null
  const s = t()
  const words = parts.map(p => `${s.kinds[p.kind]} ${p.count}`).join(' · ')
  const legend = parts.map((p, i) => (
    <Text key={`k-${p.kind}`}>
      <Text color={KIND_KEY[p.kind]}>{`${KIND_GLYPH[p.kind]} `}</Text>
      <Text dimColor>{`${s.kinds[p.kind]} ${p.count}${i < parts.length - 1 ? '   ' : ''}`}</Text>
    </Text>
  ))
  const width = ctx.detailWidth
  return (
    <Box flexDirection="column" rowGap={ctx.isDesktop ? 1 : 0}>
      {ctx.isDesktop && <Svg key="mix" source={mixSvg(width, parts)} alt={words} width={width} height={MIX_H} />}
      <Text wrap="truncate-end">{legend}</Text>
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
    <Box flexDirection="column" rowGap={1}>
      <Text bold>{`${s.history} · ${s.tools(list.length)}`}</Text>
      {mixTree(ui, mixOf(list), ctx)}
      <Box flexDirection="column">
        {list.length === 0 && <Text dimColor>{s.noCalls}</Text>}
        {hidden > 0 && <Text dimColor>{s.earlier(hidden)}</Text>}
        {shown.map((e, i) => eventTree(ui, e, { ...ctx, start: a.startedAt, isLive, index: hidden + i }))}
      </Box>
    </Box>
  )
}

function briefTree(ui: Ui, brief: string | undefined) {
  const { Box, Text } = ui
  if (!brief) return null
  return (
    <Box flexDirection="column">
      <Text bold>{t().brief}</Text>
      <Box borderStyle="round" borderDimColor paddingX={1}>
        <Text dimColor>{clip(brief, BRIEF_SHOWN)}</Text>
      </Box>
    </Box>
  )
}

function resultTree(ui: Ui, a: AgentRun) {
  const { Box, Text } = ui
  if (a.status === 'running') return null
  const s = t()
  const isDone = a.status === 'done'
  const key: ThemeKey = isDone ? 'success' : 'error'
  return (
    <Box flexDirection="column">
      <Text bold>{s.result}</Text>
      <Box flexDirection="column" borderStyle="round" borderColor={key} paddingX={1}>
        <Text bold color={key}>{isDone ? s.cheerDone : s.cheerFailed}</Text>
        {a.answer ? <Text>{clip(a.answer, ANSWER_SHOWN)}</Text> : null}
      </Box>
    </Box>
  )
}

function metricsTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Svg, Text } = ui
  const line = metricsLine(a, ctx.limit)
  if (!ctx.isDesktop) return <Text dimColor wrap="truncate-end">{line}</Text>
  const width = ctx.detailWidth
  const chips = chipsSvg(width, chipsOf(a, ctx.limit))
  return <Svg key="chips" source={chips.source} alt={line} width={width} height={chips.height} />
}

// Only a running agent can be spoken to or stopped; the field is left out where a surface has none.
function actionsTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box, Button, Input } = ui
  if (a.status !== 'running') return null
  const s = t()
  return (
    <Box key={`actions-${a.id}`} flexDirection="column" rowGap={1}>
      {Input && <Input key={`send-${a.id}`} label={s.message} placeholder={s.messageHint} value="" submitLabel={s.send} onSubmit={(text: string) => ctx.onSend(a.id, text)} />}
      <Box flexDirection="row">
        <Button key={`stop-${a.id}`} plain label={s.stop} onPress={() => ctx.onStop(a.id)} />
      </Box>
    </Box>
  )
}

export function detailTree(ui: Ui, a: AgentRun, ctx: RowContext) {
  const { Box } = ui
  return (
    <Box key={`detail-${a.id}`} flexDirection="column" rowGap={1} marginTop={1} paddingLeft={INDENT}>
      {metricsTree(ui, a, ctx)}
      {briefTree(ui, a.brief)}
      {historyTree(ui, a, ctx)}
      {resultTree(ui, a)}
      {actionsTree(ui, a, ctx)}
    </Box>
  )
}
