import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeKey } from 'claude-code'

import type { AgentRun, LimitTrack, Panel } from '../types'
import { isRunning, totals } from './agents'
import type { Totals } from './agents'
import type { Planned } from './flow'
import { plannedOf } from './flow'
import { fmtCost, fmtTime, fmtTokens } from './format'
import { t } from './i18n'
import { deriveJob } from './job'
import { shareNumber, shareOf } from './limit'
import { COMPACT_H, CRAB, HEADER_H, compactSvg, headerSvg } from './pane-svg'
import { agentRow, plannedRow } from './rows'
import type { RowContext, Ui } from './rows'
import { PANE } from './state'
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
// The open row's round frame: a cell of padding and a border on each side.
const FRAME_PX = 2 * PX_PER_COL + 2
const FRAME_COLS = 4

export type PaneData = {
  list: AgentRun[]
  running: AgentRun[]
  finished: AgentRun[]
  planned: Planned[]
  sum: Totals
  title: string
  at: number
  panel: Panel
  limit: LimitTrack | null
}

async function paneData($: EngineInterface): Promise<PaneData> {
  const list = await read($, agents)
  const f = await read($, flow)
  const at = Math.max(await read($, now), ...list.map(a => a.startedAt), 0)
  const view = deriveJob({ flow: f, agents: list, job: await read($, job), tasks: await read($, tasks) })
  const ended = (a: AgentRun) => a.endedAt ?? a.startedAt
  return {
    list,
    running: list.filter(isRunning).reverse(),
    finished: list.filter(a => !isRunning(a)).sort((a, b) => ended(b) - ended(a)),
    planned: plannedOf(f, list),
    sum: totals(list, at),
    title: view && !view.isFinished ? view.title : '',
    at,
    panel: await read($, panel),
    limit: await read($, limit),
  }
}

type Layout = { isDesktop: boolean; width: number; W: number }

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
  ...[...d.running, ...d.finished].map(a => ({ costume: costumeOf(a), color: colorOf(tierOf(a)), isRunning: isRunning(a), isDim: false })),
  ...d.planned.map(p => ({ costume: plannedTierOf(p.tier), color: colorOf(p.tier), isRunning: false, isDim: true })),
]

const summaryOf = (sum: Totals): string => `≈${fmtCost(sum.cost)} · ${fmtTokens(sum.tokens)} ${t().tokensWord} · ${fmtTime(sum.time)}`

function headTree(ui: Ui, d: PaneData, ctx: { compact: unknown; layout: Layout }) {
  const { Box, Text, Svg } = ui
  const s = t()
  const share = shareOf(d.sum.cost, d.limit)
  const shareText = share === null ? null : shareNumber(share)
  const counts = { running: d.running.length, total: d.list.length, share: shareText }
  const limitPart = shareText === null ? '' : ` · ${s.limitTile} ≈${s.pct(shareText)}`
  const totalsLine = `${s.cost} ≈${fmtCost(d.sum.cost)} · ${s.tokens} ${fmtTokens(d.sum.tokens)} · ${s.time} ${fmtTime(d.sum.time)}${limitPart}`
  return (
    <Box flexDirection="column" rowGap={1}>
      <Box flexDirection="row" justifyContent="space-between" columnGap={2}>
        <Text bold wrap="truncate-end">{d.title}</Text>
        {ctx.compact}
      </Box>
      {ctx.layout.isDesktop
        ? <Svg key="head" source={headerSvg(ctx.layout.W, d.sum, counts)} alt={[d.title, summaryOf(d.sum) + limitPart].filter(Boolean).join(': ')} width={ctx.layout.W} height={HEADER_H} />
        : <Text dimColor>{totalsLine}</Text>}
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
    frameWidth: layout.isDesktop ? FRAME_PX : FRAME_COLS,
    isDesktop: layout.isDesktop,
    limit: d.limit,
    selected: d.panel.selected,
    onToggle,
  }
  const section = (label: string) => <Text key={`h-${label}`} bold>{label}</Text>
  return (
    <Box flexDirection="column" rowGap={1}>
      {d.list.length === 0 && d.planned.length === 0 && <Text dimColor>{s.empty}</Text>}
      {d.running.length > 0 && section(`${s.running} · ${d.running.length}`)}
      {d.running.map(a => agentRow(ui, a, ctx))}
      {d.finished.length > 0 && <Box key="h-done" flexDirection="row">{done}</Box>}
      {!d.panel.isDoneCollapsed && d.finished.map(a => agentRow(ui, a, ctx))}
      {d.planned.length > 0 && section(`${s.planned} · ${d.planned.length}`)}
      {d.planned.map(p => plannedRow(ui, p, ctx))}
    </Box>
  )
}

function paneTree(ui: Ui, $: EngineInterface, d: PaneData, layout: Layout) {
  const { Box } = ui
  const { compact } = toggles(ui, $, d)
  return (
    <Box flexDirection="column" rowGap={1}>
      {headTree(ui, d, { compact, layout })}
      {d.panel.isCompact ? compactTree(ui, d, layout) : listTree(ui, $, d, layout)}
    </Box>
  )
}

const layoutOf = (isDesktop: boolean, columns: number): Layout => {
  if (!isDesktop) return { isDesktop, W: 0, width: columns }
  const W = Math.max(MIN_W, Math.min(MAX_W, columns * PX_PER_COL - PX_PER_COL))
  return { isDesktop, W, width: W - CRAB.w - PX_PER_COL }
}

export function onPane(on: On): void {
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e) as Ui
    const isDesktop = e.surface === 'desktop' && 'Svg' in ui
    return paneTree(ui, $, await paneData($), layoutOf(isDesktop, Math.max(24, e.props.bodyColumns || 40)))
  })
}
