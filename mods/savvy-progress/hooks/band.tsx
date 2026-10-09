import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeKey } from 'claude-code'

import { bandSvg, BAND_H } from './band-svg'
import { isOwnOpen } from './hub'
import { t } from './i18n'
import type { JobView } from './job'
import { deriveJob, percentText } from './job'
import { PANE } from './state'

// State refs live in each file that reads them: the scan follows literals, not imports.
const agents = atom({ plugin: 'savvy-progress', key: 'agents' } as const, [])
const flow = atom({ plugin: 'savvy-progress', key: 'flow' } as const, null)
const job = atom({ plugin: 'savvy-progress', key: 'job' } as const, null)
const tasks = atom({ plugin: 'savvy-progress', key: 'tasks' } as const, [])
const now = atom({ plugin: 'savvy-progress', key: 'now' } as const, 0)

type On = Parameters<Register>[0]
type Ui = Record<string, any>

// About 8 CSS px per reported column; the crew count, the dismiss and their gaps sit beside the Svg.
const PX_PER_COL = 8
const BUTTONS_PX = 96
const DEFAULT_COLS = 100
// Terminal cells: the dot and its space, the two buttons, the gaps between the row's parts.
const TERM = { dot: 2, buttons: 12, gaps: 5, titleMin: 8, meterMin: 8, meterMax: 40, segMin: 3 } as const

// The meter's unit colours on the terminal (DESIGN.md §2: ok→success, danger→error, run→permission).
type Cell = { key: ThemeKey | null; glyph: string }
const CELL: Record<string, Cell> = {
  ok: { key: 'success', glyph: '━' },
  danger: { key: 'error', glyph: '━' },
  run: { key: 'permission', glyph: '━' },
  wait: { key: null, glyph: '─' },
}

const unitKind = (view: JobView, i: number): string => {
  if (i < view.done - view.failed) return 'ok'
  if (i < view.done) return 'danger'
  return i < view.done + view.active ? 'run' : 'wait'
}

const pillKey = (view: JobView): ThemeKey => {
  if (!view.isFinished) return 'permission'
  return view.failed ? 'warning' : 'success'
}

// Opens the İlerleme pane, or brings it forward when it is up already; never closes it.
async function openPane($: EngineInterface): Promise<void> {
  const at = await $.clock.now()
  await update($, now, () => at)
  await $.ui.open({ id: PANE, title: t().pane, focus: true })
}

// /agents-info and the crew button: open the pane, or close it when it is up; true when it ends up open.
async function togglePane($: EngineInterface): Promise<boolean> {
  const isOpen = (await $.ui.panes()).some(p => p.id === PANE)
  if (isOpen) {
    await $.ui.close({ id: PANE })
    return false
  }
  await openPane($)
  return true
}

// Hides the band until the next request launches agents or reports progress.
async function dismiss($: EngineInterface): Promise<void> {
  await update($, flow, () => null)
  await update($, job, prev => (prev ? { ...prev, isSealed: true, isHidden: true } : prev))
}

function buttons(ui: Ui, $: EngineInterface, view: JobView) {
  const { Button } = ui
  return [
    <Button key="savvy-agents" label={`×${view.crew}`} plain onPress={() => void togglePane($)} />,
    <Button key="savvy-dismiss" label="✕" plain role="dismiss" onPress={() => dismiss($)} />,
  ]
}

function desktopBand(ui: Ui, $: EngineInterface, view: JobView, cols: number) {
  const { Box, Svg } = ui
  const drawing = bandSvg(view, (cols || DEFAULT_COLS) * PX_PER_COL - BUTTONS_PX)
  return (
    <Box key="savvy-band" flexDirection="row" alignItems="center" columnGap={1}>
      <Svg source={drawing.source} alt={`${view.title}: ${view.label}, ${percentText(view)}`} width={drawing.width} height={BAND_H} />
      {buttons(ui, $, view)}
    </Box>
  )
}

// One run of cells per unit, a space between units while each gets a few cells; else one solid run.
const termCells = (view: JobView, width: number): Cell[] => {
  const units = Math.max(1, view.units)
  const per = Math.floor((width - (units - 1)) / units)
  const gap: Cell = { key: null, glyph: ' ' }
  if (view.units > 0 && per >= TERM.segMin) {
    return Array.from({ length: units }, (_, i) => [...(i ? [gap] : []), ...Array<Cell>(per).fill(CELL[unitKind(view, i)] ?? gap)]).flat()
  }
  if (view.units < 1) return Array<Cell>(width).fill(CELL.wait ?? gap)
  return Array.from({ length: width }, (_, i) => CELL[unitKind(view, Math.floor((i * units) / width))] ?? gap)
}

function meterText(ui: Ui, cells: Cell[]) {
  const { Text } = ui
  const runs: { key: ThemeKey | null; text: string }[] = []
  for (const cell of cells) {
    const last = runs.at(-1)
    if (last && last.key === cell.key) last.text += cell.glyph
    else runs.push({ key: cell.key, text: cell.glyph })
  }
  return <Text>{runs.map((run, i) => (run.key ? <Text key={`m${i}`} color={run.key}>{run.text}</Text> : <Text key={`m${i}`} dimColor>{run.text}</Text>))}</Text>
}

// Widths in cells: the meter gives way to its minimum first, then the title, then the meter goes.
const termPlan = (view: JobView, cols: number): { titleW: number; meterW: number } => {
  const avail = cols - TERM.dot - view.label.length - percentText(view).length - TERM.buttons - TERM.gaps
  const natural = view.title.length
  if (avail - natural >= TERM.meterMin) return { titleW: natural, meterW: Math.min(TERM.meterMax, avail - natural) }
  const titleW = Math.max(TERM.titleMin, avail - TERM.meterMin)
  const meterW = avail - titleW
  return meterW >= TERM.meterMin ? { titleW, meterW } : { titleW: Math.max(TERM.titleMin, avail + 1), meterW: 0 }
}

function terminalBand(ui: Ui, $: EngineInterface, view: JobView, cols: number) {
  const { Box, Text } = ui
  const plan = termPlan(view, cols || DEFAULT_COLS)
  return (
    <Box key="savvy-band" flexDirection="row" columnGap={1}>
      <Box width={plan.titleW + TERM.dot} flexShrink={0}>
        <Text color={pillKey(view)}>● </Text>
        <Text bold wrap="truncate-end">{view.title}</Text>
      </Box>
      <Text color={pillKey(view)}>{view.label}</Text>
      {plan.meterW > 0 && meterText(ui, termCells(view, plan.meterW))}
      <Text bold>{percentText(view)}</Text>
      {buttons(ui, $, view)}
    </Box>
  )
}

async function viewOf($: EngineInterface): Promise<JobView | null> {
  return deriveJob({ flow: await read($, flow), agents: await read($, agents), job: await read($, job), tasks: await read($, tasks) })
}

// The ways in to the pane: the command, and the MODZ hub's open request (DESIGN.md §9).
function onOpen(on: On): void {
  on('command.run', { command: 'agents-info' }, async $ => {
    const isOpen = await togglePane($)
    return { text: isOpen ? t().opened : t().closed }
  })

  on('state.set', { plugin: 'modz', key: 'open' }, async ($, e, next) => {
    const done = await next(e)
    if (isOwnOpen(e.value)) await openPane($)
    return done
  }).catch(($, e, next) => next(e))
}

// The band contract: the engine's and other plugins' rows are drawn first and kept;
// progress stacks above them, and a survey gets the band to itself.
export function onBand(on: On): void {
  onOpen(on)

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const theirs = await next(e)
    const view = await viewOf($)
    if (!view) return theirs
    const ui = $.ui.resolve(e) as Ui
    const { Box } = ui
    const mine = e.surface !== 'terminal' && 'Svg' in ui ? desktopBand(ui, $, view, e.props.bodyColumns) : terminalBand(ui, $, view, e.props.bodyColumns)
    return (
      <Box flexDirection="column">
        {mine}
        {theirs}
      </Box>
    )
  })
}
