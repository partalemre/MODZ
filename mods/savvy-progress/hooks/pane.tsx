import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeKey } from 'claude-code'

import type { AgentRun, LimitTrack, Panel } from '../types'
import { isRunning, totals } from './agents'
import type { Totals } from './agents'
import type { Planned } from './flow'
import { plannedOf } from './flow'
import { fmtCost, fmtTime, fmtTokens } from './format'
import { headerSvg } from './header-svg'
import type { HeaderData, Tone } from './header-svg'
import { t } from './i18n'
import { lookAt, lookOf } from './identity'
import { deriveJob, percentText } from './job'
import type { JobView } from './job'
import { shareNumber, shareOf } from './limit'
import { COMPACT_H, CARD_CRAB, compactSvg } from './pane-svg'
import { FRAME_COLS, FRAME_PX, agentRow, plannedRow } from './rows'
import type { RowContext, Ui } from './rows'
import { PANE } from './state'
import { deliveryText } from './steer'
import type { StopNoun } from './steer'
import { colorOf, costumeOf, keyOf, plannedTierOf, tierOf } from './tiers'

// State refs live in each file that reads them: the scan follows literals, not imports.
const agents = atom({ plugin: 'savvy-progress', key: 'agents' } as const, [])
const flow = atom({ plugin: 'savvy-progress', key: 'flow' } as const, null)
const job = atom({ plugin: 'savvy-progress', key: 'job' } as const, null)
const now = atom({ plugin: 'savvy-progress', key: 'now' } as const, 0)
const panel = atom({ plugin: 'savvy-progress', key: 'panel' } as const, { isCompact: false, isDoneCollapsed: false })
const tasks = atom({ plugin: 'savvy-progress', key: 'tasks' } as const, [])
const limit = atom({ plugin: 'savvy-progress', key: 'limit' } as const, null)

type On = Parameters<Register>[0]

const MIN_W = 240
const MAX_W = 900
const PX_PER_COL = 8
// The open card's inner rows sit one indent in from its frame, two cells.
const DETAIL_INDENT_PX = 16

export type PaneData = {
  list: AgentRun[]
  running: AgentRun[]
  finished: AgentRun[]
  planned: Planned[]
  sum: Totals
  view: JobView | null
  at: number
  panel: Panel
  limit: LimitTrack | null
}

// With no job of its own (none yet, or dismissed), the header describes the crew as a whole.
const crewView = (list: AgentRun[]): JobView | null =>
  deriveJob({ flow: null, agents: list, job: { agentIds: list.map(a => a.id), startedAt: 0, isSealed: true, isHidden: false }, tasks: [] })

async function paneData($: EngineInterface): Promise<PaneData> {
  const list = await read($, agents)
  const f = await read($, flow)
  const at = Math.max(await read($, now), ...list.map(a => a.startedAt), 0)
  const view = deriveJob({ flow: f, agents: list, job: await read($, job), tasks: await read($, tasks) }) ?? crewView(list)
  const ended = (a: AgentRun) => a.endedAt ?? a.startedAt
  return {
    list,
    running: list.filter(isRunning).reverse(),
    finished: list.filter(a => !isRunning(a)).sort((a, b) => ended(b) - ended(a)),
    planned: plannedOf(f, list),
    sum: totals(list, at),
    view,
    at,
    panel: await read($, panel),
    limit: await read($, limit),
  }
}

// Talking to a running agent, and stopping it through the engine's own TaskStop tool (the normal
// permission chain applies).
async function sendTo($: EngineInterface, agentId: string, text: string): Promise<void> {
  const message = text.trim()
  if (!message) return
  $.ui.toast(deliveryText(await $.session.send({ to: { agentId }, text: message })))
}

async function requestStop($: StopNoun, agentId: string): Promise<boolean> {
  const ran = await $.tool.call({ tool: 'TaskStop', task_id: agentId })
  return ran.deny === undefined
}

async function stopAgent($: EngineInterface, agentId: string): Promise<void> {
  try {
    const isStopped = await requestStop($ as unknown as StopNoun, agentId)
    $.ui.toast(isStopped ? t().stopAsked : t().stopRefused)
  } catch (error) {
    $.ui.log(`savvy-progress: stop failed (${String(error)})`, { to: 'debug' })
    $.ui.toast(t().stopFailed)
  }
}

type Layout = { isDesktop: boolean; width: number; detailWidth: number; W: number }

function toggles(ui: Ui, $: EngineInterface, d: PaneData) {
  const { Button } = ui
  const s = t()
  const compact = (
    <Button key="compact" label={d.panel.isCompact ? s.expand : s.collapse} plain dimColor onPress={() => update($, panel, prev => ({ ...prev, isCompact: !prev.isCompact }))} />
  )
  const done = (
    <Button
      key="done"
      label={`${d.panel.isDoneCollapsed ? '▸' : '▾'} ${s.finished} · ${d.finished.length}`}
      plain
      onPress={() => update($, panel, prev => ({ ...prev, isDoneCollapsed: !prev.isDoneCollapsed }))}
    />
  )
  return { compact, done }
}

const iconsOf = (d: PaneData) => [
  ...[...d.running, ...d.finished].map(a => ({ costume: costumeOf(a), look: lookOf(a), color: colorOf(tierOf(a)), isRunning: isRunning(a), isDim: false })),
  ...d.planned.map((p, i) => ({ costume: plannedTierOf(p.tier), look: lookAt(i), color: colorOf(p.tier), isRunning: false, isDim: true })),
]

const summaryOf = (sum: Totals): string => `≈${fmtCost(sum.cost)} · ${fmtTokens(sum.tokens)} ${t().tokensWord} · ${fmtTime(sum.time)}`

const toneOf = (d: PaneData): Tone => {
  if (d.running.length) return 'run'
  if (!d.list.length) return 'idle'
  return d.view && d.view.failed > 0 ? 'warn' : 'ok'
}

// "2 çalışıyor · 3 bitti · 1 planlı": only the parts that are not zero.
const countsOf = (d: PaneData): string => {
  const s = t()
  const ended = d.list.length - d.running.length
  return [d.running.length && s.liveCount(d.running.length), ended && s.endedCount(ended), d.planned.length && s.plannedCount(d.planned.length)]
    .filter(Boolean)
    .join(' · ')
}

function headerOf(d: PaneData): HeaderData {
  const s = t()
  const share = shareOf(d.sum.cost, d.limit)
  const view = d.view
  return {
    eyebrow: s.pane.toLocaleUpperCase('tr'),
    counts: countsOf(d),
    headline: view?.title || s.crew(d.list.length),
    percent: view ? percentText(view) : '—',
    tone: toneOf(d),
    isLive: d.running.length > 0,
    meter: view,
    stats: [
      { label: s.cost, value: `≈${fmtCost(d.sum.cost)}` },
      { label: s.tokens, value: fmtTokens(d.sum.tokens) },
      { label: s.time, value: fmtTime(d.sum.time) },
      { label: s.limitTile, value: share === null ? '—' : `≈${s.pct(shareNumber(share))}` },
    ],
  }
}

const totalsLineOf = (data: HeaderData): string => data.stats.map(stat => `${stat.label} ${stat.value}`).join(' · ')

function headTree(ui: Ui, d: PaneData, ctx: { compact: unknown; layout: Layout }) {
  const { Box, Text, Svg } = ui
  const data = headerOf(d)
  const line = totalsLineOf(data)
  if (ctx.layout.isDesktop) {
    const head = headerSvg(ctx.layout.W, data)
    return (
      <Box flexDirection="column" rowGap={1}>
        <Box flexDirection="row" justifyContent="flex-end">{ctx.compact}</Box>
        <Svg key="head" source={head.source} alt={[data.headline, data.percent, data.counts, line].filter(Boolean).join(', ')} width={ctx.layout.W} height={head.height} />
      </Box>
    )
  }
  return (
    <Box flexDirection="column">
      <Box flexDirection="row" justifyContent="space-between" columnGap={2}>
        <Text wrap="truncate-end"><Text bold>{data.headline}</Text><Text bold dimColor={data.tone === 'idle'}>{`  ${data.percent}`}</Text></Text>
        {ctx.compact}
      </Box>
      {data.counts !== '' && <Text dimColor>{data.counts}</Text>}
      <Text dimColor>{line}</Text>
    </Box>
  )
}

const glyphKeyOf = (a: AgentRun): ThemeKey => {
  if (a.status === 'failed') return 'error'
  return a.status === 'done' ? 'success' : keyOf(tierOf(a))
}

function compactTree(ui: Ui, d: PaneData, layout: Layout) {
  const { Svg, Text } = ui
  if (layout.isDesktop) {
    return <Svg key="compact-icons" source={compactSvg(layout.W, iconsOf(d), d.sum)} alt={`${d.list.length} ${t().agentsCount}, ${summaryOf(d.sum)}`} width={layout.W} height={COMPACT_H} />
  }
  const glyphs = [...d.running, ...d.finished].map(a => (
    <Text key={a.id} color={glyphKeyOf(a)}>{`${a.status === 'done' ? '✓' : '●'} `}</Text>
  ))
  return (
    <Text wrap="truncate-end">
      {glyphs}
      {d.planned.length ? <Text dimColor>{'○ '.repeat(d.planned.length)}</Text> : null}
    </Text>
  )
}

function listTree(ui: Ui, $: EngineInterface, d: PaneData, layout: Layout) {
  const { Box, Text } = ui
  const s = t()
  const { done } = toggles(ui, $, d)
  const onToggle = (id: string) => update($, panel, prev => ({ ...prev, selected: prev.selected === id ? undefined : id }))
  const ctx: RowContext = {
    at: d.at,
    width: layout.width,
    detailWidth: layout.detailWidth,
    isDesktop: layout.isDesktop,
    limit: d.limit,
    selected: d.panel.selected,
    onToggle,
    onSend: (id, text) => void sendTo($, id, text),
    onStop: id => void stopAgent($, id),
  }
  const section = (label: string) => <Text key={`h-${label}`} bold>{label}</Text>
  return (
    <Box flexDirection="column" rowGap={1}>
      {d.running.length > 0 && section(`${s.running} · ${d.running.length}`)}
      {d.running.map(a => agentRow(ui, a, ctx))}
      {d.finished.length > 0 && <Box key="h-done" flexDirection="row">{done}</Box>}
      {!d.panel.isDoneCollapsed && d.finished.map(a => agentRow(ui, a, ctx))}
      {d.planned.length > 0 && section(`${s.planned} · ${d.planned.length}`)}
      {d.planned.map(p => plannedRow(ui, p, ctx))}
    </Box>
  )
}

// Nothing launched yet: an eyebrow and one sentence, no empty tiles.
function emptyTree(ui: Ui) {
  const { Box, Text } = ui
  const s = t()
  return (
    <Box flexDirection="column" rowGap={1}>
      <Text bold color="permission">{`● ${s.emptyTitle.toLocaleUpperCase('tr')}`}</Text>
      <Text dimColor>{s.empty}</Text>
    </Box>
  )
}

function paneTree(ui: Ui, $: EngineInterface, d: PaneData, layout: Layout) {
  const { Box } = ui
  if (d.list.length === 0 && d.planned.length === 0) return emptyTree(ui)
  const { compact } = toggles(ui, $, d)
  return (
    <Box flexDirection="column" rowGap={1}>
      {headTree(ui, d, { compact, layout })}
      {d.panel.isCompact ? compactTree(ui, d, layout) : listTree(ui, $, d, layout)}
    </Box>
  )
}

const layoutOf = (isDesktop: boolean, columns: number): Layout => {
  if (!isDesktop) return { isDesktop, W: 0, width: columns, detailWidth: columns - FRAME_COLS }
  const W = Math.max(MIN_W, Math.min(MAX_W, columns * PX_PER_COL - PX_PER_COL))
  return { isDesktop, W, width: W - CARD_CRAB.w - PX_PER_COL - FRAME_PX, detailWidth: W - FRAME_PX - DETAIL_INDENT_PX }
}

export function onPane(on: On): void {
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e) as Ui
    const isDesktop = e.surface === 'desktop' && 'Svg' in ui
    return paneTree(ui, $, await paneData($), layoutOf(isDesktop, Math.max(24, e.props.bodyColumns || 40)))
  })
}
